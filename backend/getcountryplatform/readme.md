## Getcountryplatform Function

This Google Cloud Function retrieves streaming platform data for a specified country from a JSON file stored in a Google Cloud Storage bucket. It supports CORS for specific origins, allowing front-end clients to make requests for the data.

### Functionality

The `getcountryplatform` function performs the following tasks:

- **Accepts a POST Request**: Receives a JSON payload with the `countryName`.
- **Retrieves Data**: Fetches `countriesData.json` from a Google Cloud Storage bucket.
- **Searches and Returns Data**: Locates the specified country within the JSON file and returns the list of streaming services for that country.
- **CORS Handling**: Supports cross-origin requests for specified origins.
- **Response Codes**: Sends HTTP status codes based on the request outcome.

### Requirements

- **Node.js**
- **Google Cloud Functions**
- **Google Cloud Storage (GCS)**

### Setup

#### Google Cloud Storage Bucket and File

- **Bucket Name**: `streamplatformcountry`
- **File**: Ensure `countriesData.json` is stored in this bucket and follows a structured JSON format, containing fields like `countryName`, `countryCode`, and `services` for each country.

#### Allowed Origins

- The function allows requests from `https://pickli.ai` and `http://127.0.0.1:8080` by default.
- Update the `allowedOrigins` array in the code to customize origins.

### Usage

#### Request

- **Endpoint**: `POST /getcountryplatform`
- **Headers**:
  - `Content-Type`: `application/json`
  - `Origin`: Your domain (must match an allowed origin)
- **Body**:
  ```json
  {
    "countryName": "Country Name Here"
  }

Response
Success (200 OK):

Returns a JSON object with the country code and list of streaming services.

{
  "countryCode": "COUNTRY_CODE",
  "services": [
    {
      "id": "SERVICE_ID",
      "name": "SERVICE_NAME",
      "imageSet": "IMAGE_URL"
    }
  ]
}

Bad Request (400):

Returned if countryName is missing from the request body.
Response: "countryName is required."
Not Found (404):

Returned if the specified country is not found in countriesData.json.
Response: "Country not found."
Internal Server Error (500):

Occurs if there’s an issue accessing the data in GCS.
Response: "Internal Server Error"

curl -X POST https://<YOUR_CLOUD_FUNCTION_URL>/getcountryplatform \
     -H "Content-Type: application/json" \
     -H "Origin: https://pickli.ai" \
     -d '{"countryName": "United States"}'

{
  "countryCode": "US",
  "services": [
    {
      "id": "netflix",
      "name": "Netflix",
      "imageSet": "https://example.com/netflix.png"
    },
    {
      "id": "hulu",
      "name": "Hulu",
      "imageSet": "https://example.com/hulu.png"
    }
  ]
}

markdown
Copy code
## Get Country Platform Function

This Google Cloud Function retrieves streaming platform data for a specified country from a JSON file stored in a Google Cloud Storage bucket. It supports CORS for specific origins, allowing front-end clients to make requests for the data.

### Functionality

The `getcountryplatform` function performs the following tasks:

- **Accepts a POST Request**: Receives a JSON payload with the `countryName`.
- **Retrieves Data**: Fetches `countriesData.json` from a Google Cloud Storage bucket.
- **Searches and Returns Data**: Locates the specified country within the JSON file and returns the list of streaming services for that country.
- **CORS Handling**: Supports cross-origin requests for specified origins.
- **Response Codes**: Sends HTTP status codes based on the request outcome.

### Requirements

- **Node.js**
- **Google Cloud Functions**
- **Google Cloud Storage (GCS)**

### Setup

#### Google Cloud Storage Bucket and File

- **Bucket Name**: `streamplatformcountry`
- **File**: Ensure `countriesData.json` is stored in this bucket and follows a structured JSON format, containing fields like `countryName`, `countryCode`, and `services` for each country.

#### Allowed Origins

- The function allows requests from `https://pickli.ai` and `http://127.0.0.1:8080` by default.
- Update the `allowedOrigins` array in the code to customize origins.

### Usage

#### Request

- **Endpoint**: `POST /getcountryplatform`
- **Headers**:
  - `Content-Type`: `application/json`
  - `Origin`: Your domain (must match an allowed origin)
- **Body**:
  ```json
  {
    "countryName": "Country Name Here"
  }
Response
Success (200 OK):

Returns a JSON object with the country code and list of streaming services.
json
Copy code
{
  "countryCode": "COUNTRY_CODE",
  "services": [
    {
      "id": "SERVICE_ID",
      "name": "SERVICE_NAME",
      "imageSet": "IMAGE_URL"
    }
  ]
}
Bad Request (400):

Returned if countryName is missing from the request body.
Response: "countryName is required."
Not Found (404):

Returned if the specified country is not found in countriesData.json.
Response: "Country not found."
Internal Server Error (500):

Occurs if there’s an issue accessing the data in GCS.
Response: "Internal Server Error"
Example Request
bash
Copy code
curl -X POST https://<YOUR_CLOUD_FUNCTION_URL>/getcountryplatform \
     -H "Content-Type: application/json" \
     -H "Origin: https://pickli.ai" \
     -d '{"countryName": "United States"}'
Example Response
json
Copy code
{
  "countryCode": "US",
  "services": [
    {
      "id": "netflix",
      "name": "Netflix",
      "imageSet": "https://example.com/netflix.png"
    },
    {
      "id": "hulu",
      "name": "Hulu",
      "imageSet": "https://example.com/hulu.png"
    }
  ]
}

Error Handling
The function includes error handling for:

Missing or invalid countryName.
Missing country data in countriesData.json.
Server or network issues when retrieving data.
Deployment
To deploy this function:

Configure your Google Cloud project.
Deploy with the following command:

gcloud functions deploy getcountryplatform \
    --runtime nodejs18 \
    --trigger-http \
    --allow-unauthenticated
