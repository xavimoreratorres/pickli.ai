# Getlocation Function

This Google Cloud Function determines the country of a client based on their IP address using the IPGeolocation API. The function provides CORS support for specific origins, allowing approved front-end clients to request data.

## Functionality

The `getCountry` function:
- Accepts a GET request from the client.
- Retrieves the client's IP address from request headers.
- Calls the IPGeolocation API to get location data based on the IP address.
- Responds with the client's country name.
- Handles CORS for specific origins to allow cross-origin requests.
- Responds with HTTP status codes based on the request's outcome.

## Requirements

- Node.js
- Google Cloud Functions
- IPGeolocation API key (stored as `IPGEOLOCATION_API_KEY` in environment variables)

## Setup

1. **IPGeolocation API Key**:
   - Obtain an API key from [IPGeolocation](https://ipgeolocation.io).
   - Set the key as an environment variable `IPGEOLOCATION_API_KEY` in your Google Cloud environment.

2. **Allowed Origins**:
   - The function allows requests only from `https://pickli.ai` and `http://127.0.0.1:8080`.
   - Modify the `allowedOrigins` array in the code to add or remove origins as needed.

## Usage

### Request

**Endpoint**: `GET /getCountry`

**Headers**:
- `Origin`: Your domain (must be in the allowed origins list)

### Response

1. **Success (200 OK)**:
   - Returns a JSON object containing the `country` name.

   ```json
   {
     "country": "Country Name Here"
   }

Internal Server Error (500):
Occurs if there is an error fetching data from the IPGeolocation API or if the IP address cannot be retrieved.
Response: { "error": "Failed to fetch country data" }

Example Request

curl -X GET https://<YOUR_CLOUD_FUNCTION_URL>/getCountry \
     -H "Origin: https://pickli.ai"


Example Response

{
  "country": "United States"
}

Error Handling
The function includes error handling for:

Issues with retrieving the client IP address.
API failures, such as if the IPGeolocation API is unreachable or returns a non-200 status.
General server or network issues when fetching data.
Deployment
To deploy this function:

Configure your Google Cloud project.
Set the IPGeolocation API key as an environment variable IPGEOLOCATION_API_KEY in Google Cloud.
Deploy with the following command:

gcloud functions deploy getCountry \
    --runtime nodejs18 \
    --trigger-http \
    --allow-unauthenticated \
    --set-env-vars IPGEOLOCATION_API_KEY=YOUR_API_KEY


Replace YOUR_API_KEY with your actual IPGeolocation API key in the deployment command.


Save this as `README.md` in your GitHub repository. This document will be displayed as the main documentation on the repository’s front page.

