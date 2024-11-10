const { Storage } = require('@google-cloud/storage');
const storage = new Storage();

const BUCKET_NAME = 'streamplatformcountry';
const FILE_NAME = 'countriesData.json';

// Define allowed origins
const allowedOrigins = ['https://pickli.ai', 'http://127.0.0.1:8080'];

exports.getcountryplatform = async (req, res) => {
  // Get the origin of the request
  const origin = req.get('Origin');

  // Set CORS headers if the origin is in the allowed list
  if (allowedOrigins.includes(origin)) {
    res.set('Access-Control-Allow-Origin', origin);
  }
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight request for CORS (HTTP OPTIONS)
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  try {
    const countryName = req.body.countryName;

    if (!countryName) {
      return res.status(400).send("countryName is required.");
    }

    const file = storage.bucket(BUCKET_NAME).file(FILE_NAME);
    const [data] = await file.download();
    const countriesData = JSON.parse(data.toString());

    const country = countriesData.find((c) => c.countryName === countryName);

    if (!country) {
      return res.status(404).send("Country not found.");
    }

    const result = {
      countryCode: country.countryCode,
      services: country.services.map((service) => ({
        id: service.id,
        name: service.name,
        imageSet: service.imageSet,
      })),
    };

    res.status(200).json(result);

  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).send("Internal Server Error");
  }
};
