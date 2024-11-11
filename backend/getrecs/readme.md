# Getrecs Function

This Google Cloud Function, named `geminirecs`, provides personalized movie or series recommendations based on user preferences, specified platforms, and country. The function uses Google Generative AI (Gemini) and an external platform availability API to find and validate recommendations on the user's preferred streaming platforms. If no valid results are found, the function retries with variations and eventually falls back to random recommendations.

## Functionality

The `geminirecs` function:
- Accepts a POST request with JSON data, including a `prompt`, `platforms`, `country`, and `temperature`.
- Uses Google Generative AI (Gemini) to generate a list of recommended titles based on the prompt.
- Checks each title’s availability on user-specified streaming platforms using the external platform API.
- Filters and validates recommendations based on the availability of preferred or fallback platforms.
- Retries up to 3 times with adjusted parameters if not enough valid recommendations are found.
- Returns a list of 3 recommendations, either based on user preferences or as a fallback.

## Requirements

- Node.js
- Google Cloud Functions
- Axios for API requests and retries
- Google Generative AI SDK
- Environment variable for the Gemini API key (`gemini-api`) and the RapidAPI key for the external platform API (`RAPIDAPI_KEY`)

## Setup

1. **Google Generative AI (Gemini) API Key**:
   - Obtain an API key from [Google Cloud Platform](https://cloud.google.com/generative-ai).
   - Set the key as an environment variable `gemini-api` in your Google Cloud environment.

2. **Streaming Availability API Key**:
   - Obtain an API key from [RapidAPI](https://rapidapi.com) for the Streaming Availability API.
   - Set the key as an environment variable `RAPIDAPI_KEY` in your Google Cloud environment.

3. **Platform Support**:
   - The function supports a predefined list of streaming platforms (e.g., Netflix, Prime, Disney, HBO, etc.). Ensure the `permittedPlatforms` constant reflects any additional platforms as needed.

## Usage

### Request

**Endpoint**: `POST /geminirecs`

**Headers**:
- `Content-Type`: `application/json`

**Body**:
```json
{
  "prompt": "Recommend some action movies.",
  "platforms": ["netflix", "hulu"],
  "country": "US",
  "temperature": 1
}
Response
Success (200 OK):

Returns a JSON object containing recommendations that match the user’s preferences, platform availability, and other criteria.
json

{
  "success": true,
  "message": "Found 3 movies or series on your preferred platforms after 2 attempts.",
  "recommendations": [
    {
      "id": "movie1",
      "title": "Action Movie 1",
      "year": "2021",
      "show_type": "movie",
      "imageUrl": "https://example.com/image1.jpg",
      "trailerLink": "https://www.youtube.com/results?search_query=Action+Movie+1+2021+movie+trailer",
      "platforms": [
        {
          "serviceId": "netflix",
          "platformName": "Netflix",
          "type": "subscription",
          "link": "https://example.com/watch"
        }
      ],
      "message": "'Action Movie 1 (2021)' is available on your preferred platforms."
    }
  ],
  "tries": 2
}
Missing Parameter (400):

Occurs if required parameters are missing.
Response: { "error": "Missing required 'country' parameter." }
Service Unavailable (500):

Occurs if there is an issue with Gemini or the external platform API.
Response: "API call failed"
Example Request
bash

curl -X POST https://<YOUR_CLOUD_FUNCTION_URL>/geminirecs \
     -H "Content-Type: application/json" \
     -d '{
           "prompt": "Recommend some sci-fi series.",
           "platforms": ["netflix", "prime"],
           "country": "US",
           "temperature": 0.8
         }'
Example Response
json

{
  "success": true,
  "message": "Found 3 movies or series on your preferred platforms after 2 attempts.",
  "recommendations": [
    {
      "id": "movie1",
      "title": "Sci-Fi Series 1",
      "year": "2022",
      "show_type": "series",
      "imageUrl": "https://example.com/image1.jpg",
      "trailerLink": "https://www.youtube.com/results?search_query=Sci-Fi+Series+1+2022+series+trailer",
      "platforms": [
        {
          "serviceId": "netflix",
          "platformName": "Netflix",
          "type": "subscription",
          "link": "https://example.com/watch"
        }
      ],
      "message": "'Sci-Fi Series 1 (2022)' is available on your preferred platforms."
    }
  ],
  "tries": 2
}
Error Handling
The function includes error handling for:

Missing or invalid parameters (e.g., country).
API failures, including retries for Gemini and the external platform API.
Fallback to random recommendations from processed results if no suitable options are found after maximum retries.
Deployment
To deploy this function:

Configure your Google Cloud project.
Set the Gemini API key as an environment variable gemini-api and the RapidAPI key as RAPIDAPI_KEY in Google Cloud.
Deploy with the following command:
bash

gcloud functions deploy geminirecs \
    --runtime nodejs18 \
    --trigger-http \
    --allow-unauthenticated \
    --set-env-vars gemini-api=YOUR_GEMINI_API_KEY,RAPIDAPI_KEY=YOUR_RAPIDAPI_KEY
Replace YOUR_GEMINI_API_KEY and YOUR_RAPIDAPI_KEY with your actual API keys in the deployment command.

javascript


Save this as `README.md` in your GitHub repository. This document provides the main documentation for the repository on GitHub.



You said:
