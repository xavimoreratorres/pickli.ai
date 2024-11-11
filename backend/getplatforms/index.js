const axios = require('axios');
const axiosRetry = require('axios-retry').default; // Explicit import using .default

// Enable retry mechanism with exponential backoff
axiosRetry(axios, { retries: 3, retryDelay: axiosRetry.exponentialDelay });

exports.getplatforms = async (req, res) => {
  const { title, country, releaseYear, showType } = req.body;

  const options = {
    method: 'GET',
    url: 'https://streaming-availability.p.rapidapi.com/shows/search/title',
    params: {
      title: title,
      country: country, // Only fetch data for the specific country
      output_language: 'en',
      series_granularity: 'show',
      show_type: showType // Use "show_type" in the request payload
    },
    headers: {
      'x-rapidapi-key': process.env.RAPIDAPI_KEY,
      'x-rapidapi-host': 'streaming-availability.p.rapidapi.com'
    }
  };

  try {
    // Fetch data from Streaming Availability API
    const response = await axios.request(options);
    const results = response.data;

    if (!results || results.length === 0) {
      // Handle fallback in case no results were found
      const fallbackResults = [{ id: "1", overview: "No overview found", title: title || "Unknown" }];
      const fallbackResult = await triggerFallback(fallbackResults, title); // Use title for original_title
      return handleFallback(res, fallbackResult, fallbackResults, country, results, showType);
    }

    let matchingResult;

    // ---- New Exact Match Fallback ----
    // Check if there's exactly one result with an exact title match (case insensitive)
    const exactMatches = results.filter(result => result.title.toLowerCase() === title.toLowerCase());

    if (results.length > 1 && exactMatches.length === 1) {
      // Only one exact match found, so use this as the correct result
      matchingResult = exactMatches[0];
    } else if (results.length === 1) {
      // If only one result is returned, use it directly
      matchingResult = results[0];
    } else {
      // ---- Year-Based Filtering ----
      // Filter based on release year for movies or first air year for series
      const filteredResults = results.filter((item) => {
        const isMovie = showType === 'movie';
        const isSeries = showType === 'series';

        return (
          (isMovie && item.releaseYear == releaseYear) ||
          (isSeries && item.firstAirYear == releaseYear)
        );
      });

      if (filteredResults.length === 0 || filteredResults.length > 1) {
        // ---- Close Match Fallback (±1 Year) ----
        // Attempt to find close matches within a ±1 year range if exact match fails
        const closeMatches = results.filter(item => {
          const isMovie = showType === 'movie';
          const isSeries = showType === 'series';

          return (
            (isMovie && Math.abs(item.releaseYear - releaseYear) <= 1) ||
            (isSeries && Math.abs(item.firstAirYear - releaseYear) <= 1)
          );
        });

        if (closeMatches.length === 1) {
          matchingResult = closeMatches[0];
        } else {
          // ---- Final Fallback ----
          const fallbackResults = results.map(result => ({
            id: result.id,
            title: result.title || "Unknown", // Ensure title is included in fallback results
            overview: `${result.title || "Unknown"}: ${result.overview || "No overview available"}`,
          }));

          const fallbackResult = await triggerFallback(fallbackResults, title); // Use title for original_title
          return handleFallback(res, fallbackResult, fallbackResults, country, results, showType);
        }
      } else {
        matchingResult = filteredResults[0];
      }
    }

    // Extract data for the matched result
    const titleResult = matchingResult.title || "Unknown";
    const overview = matchingResult.overview || "No overview available";
    const releaseYearResult = matchingResult.releaseYear || matchingResult.firstAirYear || "Unknown";

    // Unique id from series or movie
    const id = matchingResult.id;

    // Extract the w360 image URL
    const imageUrl = matchingResult.imageSet?.horizontalPoster?.w360 || null; // Safely retrieve the image URL

    // Construct the trailer link
    const formattedTitle = titleResult.replace(/\s+/g, '+'); // Replace spaces with "+"
    const trailerLink = `https://www.youtube.com/results?search_query=${formattedTitle}+${releaseYearResult}+${showType}+trailer`;

    // Extract streaming options for the specified country
    const streamingOptions = matchingResult.streamingOptions?.[country.toLowerCase()] || [];
    const uniqueData = Array.from(new Set(streamingOptions.map(option => option.service.id)))
      .map(serviceId => streamingOptions.find(option => option.service.id === serviceId))
      .map(option => ({
        serviceId: option.service.id,
        platformName: option.service.name,
        type: option.type,
        link: option.videoLink || option.link
      }));

    // Return title, releaseYear, platforms as unique data, and move overview, show_type, imageUrl, and trailerLink to the same level
    return res.status(200).send({ 
      id: id,
      title: titleResult,
      releaseYear: releaseYearResult,
      platforms: uniqueData,
      overview: overview,
      show_type: showType,
      imageUrl: imageUrl,
      trailerLink: trailerLink
    });

  } catch (error) {
    return res.status(500).send({
      error: 'Unable to fetch movie recommendations at this time.',
      details: error.response ? error.response.data : error.message
    });
  }
};

// Function to handle fallback logic
async function triggerFallback(fallbackResults, original_title) {
  try {
    return await axios.post(
      'https://us-central1-double-voice-439307-j8.cloudfunctions.net/getplatform-fallback',
      { results: fallbackResults, original_title: original_title },
      { timeout: 5000 }
    );
  } catch (error) {
    throw new Error("Error triggering fallback: " + error.message);
  }
}

async function handleFallback(res, fallbackResult, fallbackResults, country, results, showType) {
  try {
    console.log('Fallback result received:', fallbackResult.data);

    if (!fallbackResult || Object.keys(fallbackResult.data).length === 0) {
      return res.status(404).send({
        error: 'No results found after fallback.',
        details: 'The fallback API returned no data.'
      });
    }

    let fallbackTitle = fallbackResult.data.bestMatch.title;
    const fallbackId = fallbackResult.data.bestMatch.id;

    if (fallbackTitle === 'Unknown') {
      fallbackTitle = fallbackResults.find(result => result.id === fallbackId)?.title || 'Unknown';
    }

    const matchingResult = results.find(result => {
      return result.id === fallbackId && 
            (fallbackTitle === 'Unknown' || result.title.toLowerCase() === fallbackTitle.toLowerCase());
    });

    if (!matchingResult) {
      return res.status(404).send({
        error: 'No results match the ID and title from the fallback.',
        details: `No match found for ID: ${fallbackId} and title: ${fallbackTitle}.`
      });
    }

    const titleResult = matchingResult.title || "Unknown";
    const overview = matchingResult.overview || "No overview available";
    const releaseYearResult = matchingResult.releaseYear || matchingResult.firstAirYear || "Unknown";

    const id = matchingResult.id;
    const imageUrl = matchingResult.imageSet?.horizontalPoster?.w360 || null;
    const formattedTitle = titleResult.replace(/\s+/g, '+');
    const trailerLink = `https://www.youtube.com/results?search_query=${formattedTitle}+${releaseYearResult}+${showType}+trailer`;

    const streamingOptions = matchingResult.streamingOptions?.[country.toLowerCase()] || [];
    const uniqueData = Array.from(new Set(streamingOptions.map(option => option.service.id)))
      .map(serviceId => streamingOptions.find(option => option.service.id === serviceId))
      .map(option => ({
        serviceId: option.service.id,
        platformName: option.service.name,
        type: option.type,
        link: option.videoLink || option.link
      }));

    return res.status(200).send({ 
      id: id,
      title: titleResult,
      releaseYear: releaseYearResult,
      platforms: uniqueData,
      overview: overview,
      show_type: showType,
      imageUrl: imageUrl,
      trailerLink: trailerLink
    });

  } catch (fallbackError) {
    console.error('Fallback Error:', fallbackError);
    return res.status(200).send({
      message: 'Fallback failed. Returning any previously retrieved results.',
      results: results
    });
  }
}
