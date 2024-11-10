const fetch = require('node-fetch'); // Import node-fetch for fetching from external API

// Hardcoded API key
const apiKey = process.env.IPGEOLOCATION_API_KEY;

// Google Cloud Function
exports.getCountry = async (req, res) => {
  // Set CORS headers
 const allowedOrigins = ['https://pickli.ai', 'http://127.0.0.1:8080'];
  const origin = req.get('Origin');

  if (allowedOrigins.includes(origin)) {
    res.set('Access-Control-Allow-Origin', origin);
  }
  res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight request for CORS (HTTP OPTIONS)
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  try {
    // Retrieve client IP from headers
    const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    console.log('Client IP:', clientIp); // Log the client IP for debugging

    // Fetch geolocation data for the client's IP
    const response = await fetch(`https://api.ipgeolocation.io/ipgeo?apiKey=${apiKey}&ip=${clientIp}`);
    if (!response.ok) {
      console.error(`Geolocation API request failed with status ${response.status}`);
      console.log(await response.text()); // Log the response text for more details if the request failed
      throw new Error(`Geolocation API request failed with status ${response.status}`);
    }

    const data = await response.json();

    // Log the data received for debugging
    console.log('Geolocation API response data:', data);

    // Extract the country name and respond
    res.status(200).json({ country: data.country_name });
  } catch (error) {
    console.error('Error fetching IP or country data:', error);
    res.status(500).json({ error: 'Failed to fetch country data' });
  }
};
