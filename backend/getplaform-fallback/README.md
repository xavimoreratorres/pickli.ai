# Platform Fallback LLM Function

This Google Cloud Function, based on Express, uses Google Generative AI (Gemini) to analyze a list of movie or series overviews and select the one that most accurately matches the specified title. The function is designed to assist with fallback matching in scenarios where multiple descriptions are available for a title, identifying the best match based on AI analysis.

## Functionality

The `platformfallbackllm` function:
- Accepts a POST request with JSON data containing `results` (an array of movie or series overviews) and `original_title`.
- Filters out results with empty or placeholder overviews (e.g., "No overview available").
- Constructs a prompt with the filtered overviews, asking Gemini to identify the best match for the specified title.
- Utilizes Google Generative AI (Gemini) with custom safety settings to analyze the overviews.
- Returns the ID and text of the best-matching overview, along with the title, as JSON.

## Requirements

- Node.js
- Google Cloud Functions
- Google Generative AI SDK
- Environment variable for the Gemini API key (`gemini-api`)

## Setup

1. **Google Generative AI (Gemini) API Key**:
   - Obtain an API key from [Google Cloud Platform](https://cloud.google.com/generative-ai).
   - Set the key as an environment variable `gemini-api` in your Google Cloud environment.

2. **Safety Settings**:
   - The function includes safety settings for Gemini, blocking harassment, hate speech, sexually explicit content, and dangerous content.
   - Modify the `safetySettings` array in the code to adjust safety thresholds if needed.

## Usage

### Request

**Endpoint**: `POST /`

**Headers**:
- `Content-Type`: `application/json`

**Body**:
```json
{
  "results": [
    {
      "id": "1",
      "overview": "A thrilling mystery about...",
      "title": "Title of the Show"
    },
    ...
  ],
  "original_title": "The Expected Title"
}
Response
Success (200 OK):

Returns a JSON object containing the best-matching overview with fields id, title, and overview.
json

{
  "bestMatch": {
    "id": "MATCH_ID",
    "title": "MATCH_TITLE",
    "overview": "MATCH_OVERVIEW"
  }
}
Bad Request (400):

Occurs if results or original_title is missing from the request body or if there are no valid overviews.
Response: { "error": "No results or original title provided" }
No Match Found (404):

Occurs if Gemini does not return a valid match or if the match cannot be found in the original data.
Response: { "error": "No matching result found in the original data." }
Service Unavailable (503):

Occurs if there is an issue with the Gemini API or another error in processing.
Response: { "error": "getplatforms-fallback failed" }
Example Request
bash

curl -X POST https://<YOUR_CLOUD_FUNCTION_URL>/ \
     -H "Content-Type: application/json" \
     -d '{
           "results": [
             { "id": "1", "overview": "An action-packed journey...", "title": "Movie Title 1" },
             { "id": "2", "overview": "A deep dive into drama...", "title": "Movie Title 2" }
           ],
           "original_title": "Movie Title 1"
         }'
Example Response
json

{
  "bestMatch": {
    "id": "1",
    "title": "Movie Title 1",
    "overview": "An action-packed journey..."
  }
}
Error Handling
The function includes error handling for:

Missing or invalid results or original_title.
API failures, such as if Gemini does not return expected fields.
General server or network issues when processing data.
Deployment
To deploy this function:

Configure your Google Cloud project.
Set the Gemini API key as an environment variable gemini-api in Google Cloud.
Deploy with the following command:
bash

gcloud functions deploy platformfallbackllm \
    --runtime nodejs18 \
    --trigger-http \
    --allow-unauthenticated \
    --set-env-vars gemini-api=YOUR_API_KEY
Replace YOUR_API_KEY with your actual Gemini API key in the deployment command.

javascript


Save this as `README.md` in your GitHub repository. This document will serve as the main documentation for the repository on GitHub.