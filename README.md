# Product Knowledge Assistant

A Node.js/Express backend that acts as a Product Knowledge Assistant using Retrieval Augmented Generation (RAG). It ingests a messy Excel product catalogue, creates a local vector database, and exposes an endpoint to accurately answer product-related questions based solely on the catalog.

## Table of Contents
1. [Setup Instructions](#setup-instructions)
2. [API Providers Chosen](#api-providers-chosen)
3. [Data Problems Handled](#data-problems-handled)
4. [Similarity Threshold Testing](#similarity-threshold-testing)
5. [Known Limitations](#known-limitations)

## Setup Instructions

### 1. Prerequisites
- Node.js installed on your machine.
- A Google Gemini API Key (Available for free on Google AI Studio).

### 2. Installation
Clone the repository and install dependencies:
```bash
npm install
```

### 3. Environment Variables
Create a `.env` file in the root directory (you can use `.env.example` as a template):
```bash
cp .env.example .env
```
Inside `.env`, place your live Gemini API key:
```env
GEMINI_API_KEY=your_live_api_key_here
PORT=4500
```

### 4. Data Ingestion
Ensure `products_data.xlsx` is placed in the root directory of this project.
Run the ingestion script to clean the data, generate vector embeddings, and build the local knowledge base:
```bash
npm run ingest
```
*(This command runs `node scripts/ingest.js`)*

### 5. Start the Server
```bash
npm start
```
*(Or use `npm run dev` to start with nodemon)*

The API will run on `http://localhost:4500`. 
You can use the provided `test_ask.http` file via the VS Code REST Client extension to fire test requests to `POST /ask`.

---

## API Providers Chosen
I chose **Google Gemini** for both the Embedding Model (`text-embedding-004`) and the Chat Model (`gemini-1.5-flash`).
- **Why?**: The `@google/genai` SDK is lightweight, and Gemini offers an extremely generous free tier. The embedding API limits (1,500 requests per day) are more than enough for a 50-row catalogue, and it requires absolutely no credit card to start. Keeping both models within the same provider simplifies the `.env` configuration for the reviewer.

---

## Data Problems Handled
The raw `products_data.xlsx` file was intentionally messy. The `service/cleaner.js` file handles the following issues:
1. **Inconsistent Types (Strings in Pricing)**: Prices like `"3,200 tk"` or `"৳4,990"` were parsed into clean floats (`3200.0`, `4990.0`) using Regex.
2. **Missing or Blank Prices**: Created logic to determine the "Actual Price". If a product is on sale (Sale Price > 0), it becomes the actual price. If Sale Price is blank, the Product Price is used.
3. **Duplicate Rows**: Tracked rows via `Product ID` in a JavaScript `Set`. Row 19 (Ugreen 20000mAh Power Bank) was successfully flagged and skipped.
4. **Inconsistent Capitalisation**: Normalized the `Category` field to lowercase to improve vector clustering.

---

## Similarity Threshold Testing
**Chosen Threshold: `0.60` (using Cosine Similarity)**

### How it was tested:
I implemented a `?debug=true` flag on the `/ask` endpoint to expose similarity scores. 
- A direct semantic hit ("How much is the Anker PowerCore 20000mAh?") scored around **~0.82 to 0.88**.
- A categorical hit ("Show me power banks under 2000") scored around **~0.65 to 0.70**.
- A complete miss ("Do you sell washing machines?") scored around **~0.42 to 0.48**.

I chose **0.60** because it safely captures vague category searches while aggressively rejecting out-of-domain questions (like washing machines or iPhones). Setting it higher (e.g., 0.75) caused the assistant to fail on broad categorical questions, while setting it lower (e.g., 0.50) risked retrieving unrelated products for non-sequitur questions.

---

## Known Limitations & Future Improvements
- **Scalability**: The knowledge base is currently a flat JSON file, and cosine similarity is calculated in-memory with O(N) complexity per request. While fine for 50 products, it won't scale. In a production environment, I would swap the JSON file for a proper vector DB like Pinecone or pgvector.
- **Rate Limits**: The ingestion script processes rows sequentially with a 500ms delay to respect free tier rate limits. A production script should use concurrent batch processing with exponential backoff.
- **Partial Matches**: The `cleaner.js` currently throws away exact duplicates. With more time, I would merge duplicate rows if one contains missing data that the other possesses (e.g., merging missing warranty data).
