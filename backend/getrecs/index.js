const functions = require('@google-cloud/functions-framework');
const axios = require('axios');
const { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory, SchemaType } = require('@google/generative-ai');

// Constants
const MAX_RETRIES = 3;
const MOVIES_TO_RETURN = 3;

// Platform Mapping
const permittedPlatforms = {
  "netflix": "netflix",
  "prime": "prime",
  "disney": "disney",
  "hbo": "hbo",
  "apple": "apple",
  "paramount": "paramount",
  "mubi": "mubi",
  "curiosity": "curiosity",
  "plutotv": "plutotv",
  "zee5": "zee5",
  "stan": "stan",
  "britbox": "britbox",
  "tubi": "tubi",
  "discovery": "discovery",
  "blutv": "blutv",
  "crave": "crave",
  "hotstar": "hotstar",
  "sonyliv": "sonyliv",
  "now": "now",
  "all4": "all4",
  "iplayer": "iplayer",
  "itvx": "itvx",
  "peacock": "peacock",
  "starz": "starz",
  "hulu": "hulu",
  "wow": "wow"
};

// Safety Settings for Gemini
const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE }
];

// Movie Schema
const movieSchema = {
  description: "List of exactly 10 movie or series recommendations",
  type: SchemaType.ARRAY,
  minItems: 10,
  maxItems: 10,
  items: {
    type: SchemaType.OBJECT,
    properties: {
      title: { type: SchemaType.STRING, description: "Movie or Series title", nullable: false },
      year: { type: SchemaType.STRING, description: "Year of release", nullable: false }
    },
    required: ["title", "year"],
  },
};

// Helper function to normalize and validate platforms
function validateAndNormalizePlatforms(userPlatforms) {
  return userPlatforms
    ? userPlatforms
        .map(platform => platform.toLowerCase())
        .filter(platform => permittedPlatforms[platform])
        .map(platform => permittedPlatforms[platform])
    : [];
}

// Helper function to parse Gemini's response
function parseGeminiResponse(response) {
  try {
    return JSON.parse(response.response.candidates[0].content.parts[0].text);
  } catch (error) {
    console.error(`Error parsing JSON response from Gemini: ${error.message}`);
    return null;
  }
}

// Function to call the external platform recommendation API
async function getPlatformRecommendation(title, country, releaseYear, showType) {
  try {
    console.log(`Sending request to getplatform API with title: ${title}, year: ${releaseYear}, showType: ${showType}, country: ${country}`);
    const response = await axios.post('https://europe-west3-double-voice-439307-j8.cloudfunctions.net/getplatforms', {
      title: title.trim(),
      country: country,
      releaseYear: releaseYear,
      showType: showType
    });
    return response.data;
  } catch (error) {
    console.error(`Error calling external platform API: ${error.message}`);
    return null;
  }
}

async function getMultipleRecommendationsWithPlatformCheck(basePrompt, desiredPlatforms, country, excludedMovies = [], validMovies = [], fallbackMovies = [], processedMovies = [], tryCount = 0, temperature = 1) {
  console.log(`Starting retry #${tryCount + 1} with temperature ${temperature}`);

  const genAI = new GoogleGenerativeAI(process.env['gemini-api']);
  const generativeModel = genAI.getGenerativeModel({
    model: "gemini-1.5-pro-002",
    generationConfig: {
      temperature: temperature,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 8192,
      responseMimeType: "application/json",
      responseSchema: movieSchema
    },
    safetySettings: safetySettings,
    systemInstruction: `Interpret the user's preference as a request for tailored recommendations for a set of movies or TV shows based on their specified mood, themes, personal context, exclusions. Consider the following steps for generating the best picks: Mood Matching: Prioritize content that aligns with the mood the user selected (e.g., relax, captivate, or sleep) and matches the intended viewing experience tone. Theme Relevance: Filter content to ensure it fits the chosen themes (e.g., love, laugh, nature). Personal Touch Customization: Adjust recommendations to reflect the user's specified context or desires (e.g., seeking light-hearted relief after a tiring week). Consider this as a key input that might  fine-tune mood and theme selection. Exclusion Criteria: Avoid any content that matches the topics, genres, or themes the user has asked to skip. Ensure strict filtering to respect these restrictions.They must not appear. Diversity and Inclusion: Ensure that recommendations include diverse representation in terms of cast, creators, storylines, and genres. Provide a mix of both well-known and lesser-known content to ensure a blend of mainstream and non-mainstream options, offering a unique and inclusive viewing experience. Generate 10 personalized recommendations based on these criteria and return the name of the movie or TV show along with the year of release (e.g., 'The Pursuit of Happiness (2006)'. Prioritize titles that are likely to be available in popular streaming platforms.This user's preference: ${basePrompt}} . Exclude this specific ones: ${excludedMovies.join(", ")}.`
  });

  // Update the exclusion instruction for this retry
  const exclusionInstruction = excludedMovies.length > 0 
    ? ` without mentioning these titles: ${excludedMovies.join(", ")}`
    : "";

  const userPrompt = `${basePrompt}${exclusionInstruction}`;
  console.log(`Prompt sent to Gemini (Retry #${tryCount + 1}): ${userPrompt}`);

  const chat = generativeModel.startChat({
    system: `Interpret the user's preference as a request for tailored recommendations for a set of movies or TV shows based on their specified mood, themes, personal context, exclusions. Consider the following steps for generating the best picks: Mood Matching: Prioritize content that aligns with the mood the user selected (e.g., relax, captivate, or sleep) and matches the intended viewing experience tone. Theme Relevance: Filter content to ensure it fits the chosen themes (e.g., love, laugh, nature). Personal Touch Customization: Adjust recommendations to reflect the user's specified context or desires (e.g., seeking light-hearted relief after a tiring week). Consider this as a key input that might  fine-tune mood and theme selection. Exclusion Criteria: Avoid any content that matches the topics, genres, or themes the user has asked to skip. Ensure strict filtering to respect these restrictions.They must not appear. Diversity and Inclusion: Ensure that recommendations include diverse representation in terms of cast, creators, storylines, and genres. Provide a mix of both well-known and lesser-known content to ensure a blend of mainstream and non-mainstream options, offering a unique and inclusive viewing experience. Generate 10 personalized recommendations based on these criteria and return the name of the movie or TV show along with the year of release (e.g., 'The Pursuit of Happiness (2006)'. Prioritize titles that are likely to be available in popular streaming platforms.This user's preference: ${basePrompt}} . Exclude this specific ones: ${excludedMovies.join(", ")}.`,
  });

  const result = await chat.sendMessage(userPrompt);

  console.log(`Raw output from Gemini (Retry #${tryCount + 1}): ${JSON.stringify(result.response.candidates[0].content.parts[0].text)}`);
  
  let recommendedMovies = parseGeminiResponse(result);
  if (!recommendedMovies) {
    console.warn(`Gemini returned an invalid response. Retrying...`);
    return await getMultipleRecommendationsWithPlatformCheck(basePrompt, desiredPlatforms, country, excludedMovies, validMovies, fallbackMovies, processedMovies, tryCount + 1);
  }

  console.log(`Gemini provided ${recommendedMovies.length} recommendations.`);

  // Filter out any movies that are in excludedMovies to avoid duplicates
  const uniqueMovies = recommendedMovies.filter(movie => !excludedMovies.includes(movie.title));
  console.log(`Filtered to ${uniqueMovies.length} unique movies after removing duplicates: [${uniqueMovies.map(m => m.title).join(", ")}]`);

  const platformRequests = uniqueMovies.map(({ title, year }) => 
    getPlatformRecommendation(title, country, parseInt(year), 'movie').catch(error => {
      console.error(`Error with getPlatformRecommendation for movie '${title}': ${error.message}`);
      return null;
    })
  );

  const platformResults = await Promise.all(platformRequests);

  platformResults.forEach((platformAvailability, index) => {
    if (!platformAvailability) return;

    const { title, year } = uniqueMovies[index];
    const { show_type, imageUrl, trailerLink, id } = platformAvailability;

    const filteredPlatforms = platformAvailability.platforms?.filter(platform =>
      desiredPlatforms.includes(platform.serviceId)
    );

    const preferredPlatforms = filteredPlatforms?.filter(p => ["subscription", "free"].includes(p.type)) || [];
    const otherPlatforms = filteredPlatforms?.filter(p => !["subscription", "free"].includes(p.type)) || [];

    if (preferredPlatforms.length > 0) {
      validMovies.push({
        id,
        title,
        year,
        show_type,
        imageUrl,
        trailerLink,
        platforms: preferredPlatforms,
        message: `'${title} (${year})' is available on your preferred platforms.`
      });
    } else if (otherPlatforms.length > 0) {
      fallbackMovies.push({
        id,
        title,
        year,
        show_type,
        imageUrl,
        trailerLink,
        platforms: otherPlatforms,
        message: `'${title} (${year})' is available on other platforms (rent or buy).`
      });
    }

    // Add full result to processedMovies for potential fallback use
    processedMovies.push({
      id,
      title,
      year,
      show_type,
      imageUrl,
      trailerLink,
      platforms: platformAvailability.platforms || [{ serviceId: "unknown", type: "unknown" }]
    });

    // Add only the title to excludedMovies to prevent duplicates
    excludedMovies.push(title);
  });

  // Deduplicate excludedMovies to prevent redundant exclusions
  excludedMovies = [...new Set(excludedMovies)];
  console.log(`Exclusion list updated for retry #${tryCount + 1}: [${excludedMovies.join(", ")}]`);

  if (validMovies.length < MOVIES_TO_RETURN && tryCount + 1 < MAX_RETRIES) {
    console.log(`Proceeding to retry #${tryCount + 2} as not enough movies were found.`);
    return await getMultipleRecommendationsWithPlatformCheck(basePrompt, desiredPlatforms, country, excludedMovies, validMovies, fallbackMovies, processedMovies, tryCount + 1);
  }

  // Final check after all retries
  if (validMovies.length >= MOVIES_TO_RETURN) {
    return {
      success: true,
      message: `Found ${validMovies.length} movies or series on your preferred platforms after ${tryCount + 1} attempts.`,
      recommendations: validMovies,
      tries: tryCount + 1
    };
  } else {
    console.log("No valid movies or series found after maximum retries. Returning random movies or series from processed results as fallback.");

    const fallbackSelection = processedMovies
      .sort(() => 0.5 - Math.random())
      .slice(0, MOVIES_TO_RETURN)
      .map(movie => ({
        id: movie.id,
        title: movie.title || "Unknown title",
        year: movie.year || "Unknown year",
        show_type: movie.show_type || "Unknown type",
        imageUrl: movie.imageUrl || null,
        trailerLink: movie.trailerLink || null,
        platforms: movie.platforms || [{ serviceId: "unknown", type: "unknown" }],
        message: `'${movie.title || "Unknown title"} (${movie.year || "Unknown year"})' is available on fallback platforms.`
      }));

    return {
      success: false,
      message: "Could not find any movies on the preferred platforms. Providing random fallback movies.",
      recommendations: fallbackSelection,
      tries: tryCount + 1
    };
  }
}

// Main Cloud Function
functions.http('geminirecs', async (req, res) => {
  try {
    const basePrompt = req.body.prompt || "Recommend some action movies.";
    const userPlatforms = req.body.platforms;
    const country = req.body.country;
    const temperature = parseFloat(req.body.temperature) || 1;

    if (!country) return res.status(400).json({ error: "Missing required 'country' parameter." });

    const normalizedPlatforms = validateAndNormalizePlatforms(userPlatforms);
    const result = await getMultipleRecommendationsWithPlatformCheck(basePrompt, normalizedPlatforms, country, [], [], [], [], 0, temperature);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).send('API call failed');
  }
});
