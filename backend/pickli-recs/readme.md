# Pickli-recs Function

This Google Cloud Function, `recommendMovies`, provides customized movie or series recommendations based on user preferences, platform availability, and other specified parameters. It integrates with an external recommendation API and Google Generative AI (Gemini) to analyze, score, and explain recommendations based on the user's input criteria.

## Functionality

The `recommendMovies` function:
- Accepts a POST request with JSON data that includes `prompt`, `platforms`, `country`, and `showType`.
- Uses two temperature settings (0.2 and 2) to get a range of recommendations from an external API.
- Generates a structured prompt for Gemini, which scores and ranks recommendations based on user preferences.
- Returns recommendations with detailed explanations and scores.

## Requirements

- Node.js
- Google Cloud Functions
- Axios for API requests
- Google Generative AI SDK
- Environment variable for the Gemini API key (`gemini-api`)

## Setup

1. **Google Generative AI (Gemini) API Key**:
   - Obtain an API key from [Google Cloud Platform](https://cloud.google.com/generative-ai).
   - Set the key as an environment variable `gemini-api` in your Google Cloud environment.

2. **Allowed Origins**:
   - The function allows CORS requests from `https://pickli.ai` and `http://127.0.0.1:8080`.
   - Modify the `allowedOrigins` array in the code to add or remove origins as needed.

## Usage

### Request

**Endpoint**: `POST /recommendMovies`

**Headers**:
- `Content-Type`: `application/json`

**Body**:
```json
{
  "prompt": "Recommend some family-friendly movies.",
  "platforms": ["netflix", "disney"],
  "country": "US",
  "showType": "movie"
}
Response
Success (200 OK):

Returns a JSON array with recommendations that match the user’s preferences, scored and ranked by relevance, along with an explanation.
json

[
  {
    "id": "movie1",
    "title": "Family Movie",
    "serviceIds": ["netflix", "disney"],
    "links": ["https://example.com/watch"],
    "trailerLink": "https://www.youtube.com/results?search_query=Family+Movie+trailer",
    "showType": "movie",
    "imageUrl": "https://example.com/image1.jpg",
    "score": "9",
    "reason": "Perfect family movie for a cozy evening, filled with humor and heartwarming moments."
  }
]
CORS Preflight (204):

If the request is a preflight OPTIONS request for CORS, responds with a 204 status and no content.
Service Unavailable (500):

Occurs if there is an issue with Gemini or the external API.
Response: { "success": false, "message": "Internal Server Error" }
Example Request
bash

curl -X POST https://<YOUR_CLOUD_FUNCTION_URL>/recommendMovies \
     -H "Content-Type: application/json" \
     -d '{
           "prompt": "Looking for sci-fi movies to watch on Netflix.",
           "platforms": ["netflix"],
           "country": "US",
           "showType": "movie"
         }'
Example Response
json

[
  {
    "id": "movie1",
    "title": "Sci-Fi Adventure",
    "serviceIds": ["netflix"],
    "links": ["https://example.com/watch"],
    "trailerLink": "https://www.youtube.com/results?search_query=Sci-Fi+Adventure+trailer",
    "showType": "movie",
    "imageUrl": "https://example.com/image1.jpg",
    "score": "8",
    "reason": "An imaginative sci-fi experience with thrilling plot twists and stunning visuals, perfect for a night of adventure."
  }
]
Error Handling
The function includes error handling for:

Missing or invalid parameters (e.g., country).
API failures, with retries for the recommendation API.
Fallbacks in case of an unexpected response structure from Gemini.
Deployment
To deploy this function:

Configure your Google Cloud project.
Set the Gemini API key as an environment variable gemini-api in Google Cloud.
Deploy with the following command:
bash

gcloud functions deploy recommendMovies \
    --runtime nodejs18 \
    --trigger-http \
    --allow-unauthenticated \
    --set-env-vars gemini-api=YOUR_GEMINI_API_KEY
Replace YOUR_GEMINI_API_KEY with your actual Gemini API key in the deployment command.

javascript


Save this as `README.md` in your GitHub repository. This will serve as the main documentation for the repository.



