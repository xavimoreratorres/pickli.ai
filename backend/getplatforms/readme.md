# Getplatforms Function

This Google Cloud Function uses the Streaming Availability API to fetch streaming platform availability for a specific movie or series title. The function incorporates exact and approximate matching to find the best result based on title, release year, and other filters. If no results are found, a fallback function is triggered to perform additional analysis.

## Functionality

The `getplatforms` function:
- Accepts a POST request with JSON data containing `title`, `country`, `releaseYear`, and `showType`.
- Queries the Streaming Availability API for matching content.
- Attempts to find an exact title match, then filters by release year or within a ±1 year range.
- If no matches are found, it triggers a fallback function to analyze the results.
- Returns the title, release year, available streaming platforms, overview, image, and a trailer link for the best-matching result.

## Requirements

- Node.js
- Google Cloud Functions
- Axios with exponential backoff for retry mechanism
- Environment variable for the RapidAPI key (`RAPIDAPI_KEY`)

## Setup

1. **Streaming Availability API Key**:
   - Obtain an API key from [RapidAPI](https://rapidapi.com) for the Streaming Availability API.
   - Set the key as an environment variable `RAPIDAPI_KEY` in your Google Cloud environment.

2. **Fallback Function**:
   - The function triggers a fallback API at `https://us-central1-double-voice-439307-j8.cloudfunctions.net/getplatform-fallback` if no suitable results are found.
   - Ensure that this fallback endpoint is functional and accepts the required payload structure.

## Usage

### Request

**Endpoint**: `POST /getplatforms`

**Headers**:
- `Content-Type`: `application/json`

**Body**:
```json
{
  "title": "The Movie Title",
  "country": "US",
  "releaseYear": 2021,
  "showType": "movie" // or "series"
}
Response
Success (200 OK):

Returns a JSON object containing details of the best-matching title, including streaming platform data and other metadata.
json

{
  "id": "MOVIE_ID",
  "title": "The Movie Title",
  "releaseYear": 2021,
  "platforms": [
    {
      "serviceId": "netflix",
      "platformName": "Netflix",
      "type": "subscription",
      "link": "https://example.com/watch"
    }
  ],
  "overview": "Movie description...",
  "show_type": "movie",
  "imageUrl": "https://example.com/image.jpg",
  "trailerLink": "https://www.youtube.com/results?search_query=The+Movie+Title+2021+movie+trailer"
}
No Results Found (404):

Occurs if no results match the specified criteria and the fallback also fails.
Response: { "error": "No results match the ID and title from the fallback." }
Service Unavailable (500):

Occurs if there is an issue with the Streaming Availability API or another error in processing.
Response: { "error": "Unable to fetch movie recommendations at this time." }
Fallback Failure:

If the fallback API is called but does not return data, a 200 response is sent with previously retrieved results (if any).
Example Request
bash

curl -X POST https://<YOUR_CLOUD_FUNCTION_URL>/getplatforms \
     -H "Content-Type: application/json" \
     -d '{
           "title": "Inception",
           "country": "US",
           "releaseYear": 2010,
           "showType": "movie"
         }'
Example Response
json

{
  "id": "inception",
  "title": "Inception",
  "releaseYear": 2010,
  "platforms": [
    {
      "serviceId": "netflix",
      "platformName": "Netflix",
      "type": "subscription",
      "link": "https://example.com/watch/inception"
    }
  ],
  "overview": "A mind-bending thriller about dreams within dreams.",
  "show_type": "movie",
  "imageUrl": "https://example.com/image.jpg",
  "trailerLink": "https://www.youtube.com/results?search_query=Inception+2010+movie+trailer"
}
Error Handling
The function includes error handling for:

Missing or invalid title, country, releaseYear, or showType.
API failures, including a retry mechanism for up to 3 attempts with exponential backoff.
Fallback to a separate endpoint if no results match the initial search criteria.
Deployment
To deploy this function:

Configure your Google Cloud project.
Set the RapidAPI key as an environment variable RAPIDAPI_KEY in Google Cloud.
Deploy with the following command:
bash

gcloud functions deploy getplatforms \
    --runtime nodejs18 \
    --trigger-http \
    --allow-unauthenticated \
    --set-env-vars RAPIDAPI_KEY=YOUR_API_KEY
Replace YOUR_API_KEY with your actual RapidAPI key in the deployment command.

javascript


Save this as `README.md` in your GitHub repository. This will serve as the main documentation for the repository.
