const functions = require('@google-cloud/functions-framework');
const axios = require('axios');
const { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory, SchemaType } = require('@google/generative-ai');

functions.http('recommendMovies', async (req, res) => {
    // Define allowed origins
    const allowedOrigins = ['https://pickli.ai', 'http://127.0.0.1:8080'];
    const origin = req.get('Origin');

    // Set CORS headers dynamically based on the origin
    if (allowedOrigins.includes(origin)) {
        res.set('Access-Control-Allow-Origin', origin);
    }
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight OPTIONS request for CORS
    if (req.method === 'OPTIONS') {
        return res.status(204).send(''); // Respond with no content for preflight
    }

    // Safety Settings for Gemini
    const safetySettings = [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE }
    ];

    // Log the entire request body, including nested data
    console.log('Logging all request data:');
    console.log(JSON.stringify(req.body, null, 2)); // Logs nested data clearly

    try {
        const userInput = req.body;
        
        // Define userInputText early to ensure it is available wherever needed
        const userInputText = JSON.stringify(userInput, null, 2); // Convert userInput to a readable JSON string

        // Define temperature settings (only 0.2 and 2)
        const temperatures = [0.2, 2];
        
        // Create promises for each request with the specified temperature settings
        const promises = temperatures.map(temp => {
            // Define the payload with only the fields expected by `getrecs`
            const payload = {
                prompt: userInput.prompt,
                platforms: userInput.platforms || [],
                country: userInput.country,
                showType: userInput.showType,
                temperature: temp // Set the temperature here
            };

            return axios.post('https://europe-west3-double-voice-439307-j8.cloudfunctions.net/getrecs', payload)
                        .then(response => ({ ...response.data, temperature: temp }))
                        .catch(error => {
                            console.error(`Failed for temperature ${temp}:`, error);
                            return null; // Return null for failed requests
                        });
        });

        // Await all promises to complete
        const allResults = await Promise.all(promises);
        
        // Filter out null results from failed requests
        const validResults = allResults.filter(result => result !== null);
        
        // Prepare listofrecommendations field
        const listofrecommendations = validResults.flatMap(result => {
            return result.recommendations.map(rec => ({
                id: rec.id,
                title: rec.title,
                year: rec.year,
                show_type: rec.show_type,
                temperature: result.temperature // Include the temperature used in this result
            }));
        });

        // Convert listofrecommendations to a structured prompt for Gemini
        const recommendationsText = listofrecommendations.map(rec => 
            `id: ${rec.id}, Title: ${rec.title}, Year: ${rec.year}, Type: ${rec.show_type}, Temperature: ${rec.temperature}`
        ).join('\n');

        const userPrompt = `These are some recommendations given to me, Recommendations:\n${recommendationsText} . Score them, sort them on a descending order based on my preferences: \n${userInputText}\n\n and explain me in "reason" how these can be perfect based on my preferences: \n${userInputText}\n\n `;

        // Initialize Google Generative AI client with a structured JSON response schema
        const cardSchema = {
            description: "Cards for movie or series recommendations",
            type: SchemaType.ARRAY,
            minItems: listofrecommendations.length,
            maxItems: listofrecommendations.length,
            items: {
                type: SchemaType.OBJECT,
                properties: {
                    id: { type: SchemaType.STRING, description: "unique ID associated to each recommendation title", nullable: false },
                    title: { type: SchemaType.STRING, description: "Movie or series title", nullable: false },
                    reason: { type: SchemaType.STRING, description: "The reason why it's a good recommendation based on the user's preferences", nullable: false },
                    score: { type: SchemaType.STRING, description: "Score according to how well it fits the user's preferences", nullable: false }
                },
                required: ["id", "title", "reason", "score"],
            },
        };

        const client = new GoogleGenerativeAI(process.env['gemini-api']);
        
        const generativeModel = client.getGenerativeModel({
            model: 'gemini-1.5-pro',
            generationConfig: {
                temperature: 1,
                maxOutputTokens: 8192,
                responseMimeType: "application/json",
                responseSchema: cardSchema,
                
            }, 
            safetySettings: safetySettings,
            systemInstruction: `Your role is to evaluate and rate a set of movie or TV show recommendations provided based on a structured user prompt. Each user prompt specifies mood, themes, personal context, and exclusions. Your task is to ensure each recommendation is aligned with the user's preferences and rank the best matches in descending order by score. Follow these steps for each recommendation:
1. Scoring Criteria (0-10 Scale): Assign a score from 0 to 10 based on how closely the recommendation matches the user's specified mood, themes, personal context, and exclusions: Mood Matching: Does it align with the user's selected mood (e.g., relax, immerse, captivate)? Theme Relevance: Does it fit the specified themes (e.g., love, kindness, laugh), with a strong focus where applicable?
Personal Context: Does it connect with the user's specific context or request (e.g., a personal scenario or preference)? Exclusion Compliance: Does it avoid all topics/genres the user wants to skip? Non-compliance should lead to a significantly lower score.
Diversity and Inclusion: Does it offer a diverse representation of cast, storylines, and genres, balancing popular and lesser-known content? Note: Recommendations that have little to no alignment should score between 0-2, while strong matches should be between 8-10. 2. Generate a High-Quality, Tailored Reason for Recommendation: Craft a reason that clearly explains why the recommendation is relevant to the user's preferences and context. Make it engaging, relatable, and personalized. Use catchy and creative language that resonates with the user. Avoid generic, vague, or repetitive phrasing. Ensure each reason feels distinct and specifically tied to the user's input. Emphasize how the recommendation meets the user's mood, themes, and personal context in a meaningful way. Highlight specific aspects, such as character arcs, humor style, emotional impact, unique storylines, or cultural elements, to make the reason truly stand out. Example: Instead of generic phrasing like "a feel-good choice," use a more engaging description: "This story of a mismatched family coming together will have you laughing and tearing up—perfect for a night where you want warmth and humor wrapped into one." 3. Output Structure: Title: Name of the movie or TV show, Score: Numerical rating (0-10), Reason: A personalized, engaging explanation for why the recommendation fits the user's preferences. Clearly state why it is relevant, using creative, empathetic, and context-specific language. 4. Important Considerations: Avoid generic reasons; make each explanation tailored to the user's specific prompt, ensuring it feels meaningful and relevant. Emphasize creativity and empathy, showing a deep understanding of the user's needs, mood, and context. Sort recommendations by score in descending order, with the highest scores listed first. Always include the score with each recommendation.
.`,
        });

        const chat = generativeModel.startChat({
            system: `Your role is to evaluate and rate a set of movie or TV show recommendations provided based on a structured user prompt. Each user prompt specifies mood, themes, personal context, and exclusions. Your task is to ensure each recommendation is aligned with the user's preferences and rank the best matches in descending order by score. Follow these steps for each recommendation:
1. Scoring Criteria (0-10 Scale): Assign a score from 0 to 10 based on how closely the recommendation matches the user's specified mood, themes, personal context, and exclusions: Mood Matching: Does it align with the user's selected mood (e.g., relax, immerse, captivate)? Theme Relevance: Does it fit the specified themes (e.g., love, kindness, laugh), with a strong focus where applicable?
Personal Context: Does it connect with the user's specific context or request (e.g., a personal scenario or preference)? Exclusion Compliance: Does it avoid all topics/genres the user wants to skip? Non-compliance should lead to a significantly lower score.
Diversity and Inclusion: Does it offer a diverse representation of cast, storylines, and genres, balancing popular and lesser-known content? Note: Recommendations that have little to no alignment should score between 0-2, while strong matches should be between 8-10. 2. Generate a High-Quality, Tailored Reason for Recommendation: Craft a reason that clearly explains why the recommendation is relevant to the user's preferences and context. Make it engaging, relatable, and personalized. Use catchy and creative language that resonates with the user. Avoid generic, vague, or repetitive phrasing. Ensure each reason feels distinct and specifically tied to the user's input. Emphasize how the recommendation meets the user's mood, themes, and personal context in a meaningful way. Highlight specific aspects, such as character arcs, humor style, emotional impact, unique storylines, or cultural elements, to make the reason truly stand out. Example: Instead of generic phrasing like "a feel-good choice," use a more engaging description: "This story of a mismatched family coming together will have you laughing and tearing up—perfect for a night where you want warmth and humor wrapped into one." 3. Output Structure: Title: Name of the movie or TV show, Score: Numerical rating (0-10), Reason: A personalized, engaging explanation for why the recommendation fits the user's preferences. Clearly state why it is relevant, using creative, empathetic, and context-specific language. 4. Important Considerations: Avoid generic reasons; make each explanation tailored to the user's specific prompt, ensuring it feels meaningful and relevant. Emphasize creativity and empathy, showing a deep understanding of the user's needs, mood, and context. Sort recommendations by score in descending order, with the highest scores listed first. Always include the score with each recommendation.
`,
        });

        const geminiResponse = await chat.sendMessage(userPrompt);

        // Check if response structure is as expected before accessing
        if (
            geminiResponse &&
            geminiResponse.response &&
            geminiResponse.response.candidates &&
            geminiResponse.response.candidates[0] &&
            geminiResponse.response.candidates[0].content &&
            geminiResponse.response.candidates[0].content.parts &&
            geminiResponse.response.candidates[0].content.parts[0]
        ) {
            const pickliResponse = JSON.parse(geminiResponse.response.candidates[0].content.parts[0].text);
            
            // Deduplicate pickliResponse by `id` before mapping with validResults
            const uniquePickliResponse = [];
            const seenIds = new Set();
            for (const response of pickliResponse) {
                if (!seenIds.has(response.id)) {
                    uniquePickliResponse.push(response);
                    seenIds.add(response.id);
                }
            }

            // Prepare cardcontent field by matching ids from uniquePickliResponse with allresults
            const cardcontent = uniquePickliResponse.map(response => {
                const matchingRecommendation = validResults.flatMap(result => result.recommendations)
                    .find(rec => rec.id.toString() === response.id.toString());

                if (matchingRecommendation) {
                    return {
                        id: matchingRecommendation.id,
                        title: matchingRecommendation.title,
                        serviceIds: matchingRecommendation.platforms.map(platform => platform.serviceId),
                        links: matchingRecommendation.platforms.map(platform => platform.link),
                        trailerLink: matchingRecommendation.trailerLink,
                        showType: matchingRecommendation.show_type,
                        imageUrl: matchingRecommendation.imageUrl,
                        score: response.score,
                        reason: response.reason // Include the reason from uniquePickliResponse
                    };
                }
                return null;
            }).filter(item => item !== null) // Filter out nulls in case of unmatched items
            .sort((a, b) => b.score - a.score); // Sort by score in descending order

            // Send response
            res.status(200).json(cardcontent);

        } else {
            // Log and handle unexpected response structure
            console.error("Unexpected response structure from Gemini:", JSON.stringify(geminiResponse, null, 2));
            res.status(500).json({ success: false, message: "Unexpected response structure from Gemini" });
        }

    } catch (error) {
        console.error("Error in function:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});