const { GoogleGenAI } = require('@google/genai');
require('dotenv').config();

// Initialize the Gemini client
// Note: You must provide your own API key in the .env file (GEMINI_API_KEY)
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

/**
 * Generate embedding for a single text string
 */
async function generateEmbedding(text) {
  try {
    const response = await ai.models.embedContent({
      model: 'text-embedding-004',
      contents: text
    });
    return response.embeddings[0].values;
  } catch (error) {
    console.error("Error generating embedding:", error.message);
    return null;
  }
}

/**
 * Chat with the model given a strict prompt
 */
async function generateChatResponse(question, contextData) {
  const prompt = `You are a helpful Product Knowledge Assistant. 
You must answer the user's question using ONLY the provided product data below.
Do not invent any prices, links, stock status, or features.
If the context data does not contain the answer, you must clearly state that you don't know or the information is not available.

Context Data:
${JSON.stringify(contextData, null, 2)}

User Question: ${question}
Answer:`;

  try {
    const response = await ai.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: prompt
    });
    return response.text;
  } catch (error) {
    console.error("Error generating chat response:", error.message);
    return "An error occurred while generating the response.";
  }
}

module.exports = {
  generateEmbedding,
  generateChatResponse
};
