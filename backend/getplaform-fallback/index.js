const express = require('express');
const { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory, SchemaType } = require('@google/generative-ai');
const app = express();
app.use(express.json());

// Get API key from environment variables
const API_KEY = process.env['gemini-api'];

// Safety Settings for Gemini
const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE }
];

app.post('/', async (req, res) => {
  try {
    const { results, original_title } = req.body;

    // Check if results array is present
    if (!results || results.length === 0 || !original_title) {
      console.log('No results or original title found in request body');
      return res.status(400).send({ error: 'No results or original title provided' });
    }

    // Filter out results with empty overviews or "No overview available"
    const filteredResults = results.filter(result => 
      result.overview && result.overview.trim() !== '' && result.overview !== "No overview available"
    );

    console.log('Number of valid results after filtering:', filteredResults.length);

    if (filteredResults.length === 0) {
      console.log('No valid overviews found to process');
      return res.status(400).send({ error: 'No valid overviews to compare' });
    }

    // Prepare the prompt by including all IDs and their corresponding overviews
    const overviews = filteredResults.map((result) => {
      return `Overview ID: ${result.id}, Overview: ${result.overview}`;
    }).join('\n');

    const prompt = 
    `Based on your knowledge, identify the most accurate overview for the movie or series titled "${original_title}". 

    Overviews:
    ${overviews}
    `;

    // Initialize Google Generative AI with API Key
    const genAI = new GoogleGenerativeAI(API_KEY);

    const schema = {
      description: "Identify the best matching overview for the given movie or series title",
      type: SchemaType.OBJECT,
      properties: {
        id: {
          type: SchemaType.STRING,
          description: "ID of the matching overview",
          nullable: false,
        },
        overview: {
          type: SchemaType.STRING,
          description: "Matching overview of the movie or series",
          nullable: false,
        },
      },
      required: ["id", "overview"],
    };

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash-8b",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: schema,
      },
      safetySettings: safetySettings,
      systemInstruction: `You are an expert in movies and series. Based on your grounded knowledge, analyze the provided overviews and determine which one is most likely the actual overview of the movie or series titled "${original_title}" .`,
    });

    const result = await model.generateContent(prompt);
    const aiResponse = await result.response.text();
    console.log('Raw AI Response:', aiResponse); // Log the raw response to troubleshoot

    // Check if AI response contains expected fields
    if (!aiResponse || !aiResponse.includes('"id"') || !aiResponse.includes('"overview"')) {
      return res.status(404).send({
        error: 'AI response did not return a valid match.',
        details: 'The AI response is missing the expected fields.'
      });
    }

    const matchedOverview = JSON.parse(aiResponse);

    const originalResult = filteredResults.find(result => result.id === matchedOverview.id);
    if (!originalResult) {
      return res.status(404).send({
        error: 'No matching result found in the original data.',
        details: `No match found for ID: ${matchedOverview.id}.`
      });
    }

    // Prepare the response for getplatform with the best match
    const formattedResponse = {
      bestMatch: {
        id: matchedOverview.id,
        title: originalResult.title || 'Unknown',
        overview: matchedOverview.overview
      }
    };

    console.log('Gemini API Response:', formattedResponse);

    res.setHeader('Content-Type', 'application/json');
    return res.status(200).send(formattedResponse);

  } catch (error) {
    console.error('Error in getplatforms-fallback:', error.message);
    return res.status(503).send({ error: 'getplatforms-fallback failed', details: error.message });
  }
});

// Export the Express app as a Google Cloud Function
const platformfallbackllm = app;
module.exports = { platformfallbackllm };
