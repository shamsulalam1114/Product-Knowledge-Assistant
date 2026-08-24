const fs = require('fs');
const path = require('path');
const { generateEmbedding, generateChatResponse } = require('../service/embedder');
const { searchKnowledgeBase } = require('../service/search');

// Load knowledge base into memory on startup
const KB_PATH = path.join(__dirname, '../knowledge_base.json');
let knowledgeBase = [];

try {
  if (fs.existsSync(KB_PATH)) {
    knowledgeBase = JSON.parse(fs.readFileSync(KB_PATH, 'utf-8'));
    console.log(`Loaded ${knowledgeBase.length} products from knowledge base.`);
  } else {
    console.warn("Warning: knowledge_base.json not found. Did you run the ingestion script?");
  }
} catch (e) {
  console.error("Error loading knowledge base:", e.message);
}

// Ensure the structure matches the exact requirement in the task
const NOT_FOUND_RESPONSE = {
  found: false,
  answer: "Sorry, this product is not available in our catalogue."
};

async function handleAskQuestion(req, res) {
  try {
    const { question } = req.body;

    // 1. Validate request
    if (!question || typeof question !== "string" || question.trim() === "") {
      return res.status(400).json({ error: "A valid 'question' string is required in the body." });
    }

    if (knowledgeBase.length === 0) {
      return res.status(500).json({ error: "Knowledge base is empty. Please run ingestion." });
    }

    // 2. Embed the question
    const questionVector = await generateEmbedding(question);
    if (!questionVector) {
      return res.status(500).json({ error: "Failed to generate embedding for the question." });
    }

    // 3. Search Knowledge Base
    // 0.60 is an initial threshold that we'll test and justify in README
    const SIMILARITY_THRESHOLD = 0.60;
    const matches = searchKnowledgeBase(questionVector, knowledgeBase, SIMILARITY_THRESHOLD, 3);

    // 4. If no matches clear threshold, return exact required fail response without calling chat model
    if (matches.length === 0) {
      // Optional Bonus: append debug info if requested
      if (req.query.debug === 'true') {
        const bestMiss = searchKnowledgeBase(questionVector, knowledgeBase, 0, 1);
        return res.json({
          ...NOT_FOUND_RESPONSE,
          _debug: { bestMiss: bestMiss[0]?.similarity, product: bestMiss[0]?.product["Product Name"] }
        });
      }
      return res.json(NOT_FOUND_RESPONSE);
    }

    // Extract the raw data without the vector embeddings to pass to the chat model
    const contextData = matches.map(match => {
      const p = match.product;
      return {
        "Product Name": p["Product Name"],
        "Brand": p["Brand"],
        "Price": p["Actual Price"],
        "Currency": p["Currency"],
        "Warranty": p["Warranty"],
        "Color": p["Color"],
        "Stock Quantity": p["Stock Quantity"],
        "Link": p["Product Link"]
      };
    });

    // 5. Generate Answer via LLM
    const answerText = await generateChatResponse(question, contextData);

    const successResponse = {
      found: true,
      answer: answerText.trim()
    };

    // Bonus Points: Debug flag
    if (req.query.debug === 'true') {
      successResponse._debug = {
        matches: matches.map(m => ({ name: m.product["Product Name"], score: m.similarity }))
      };
    }

    return res.json(successResponse);

  } catch (error) {
    console.error("Error in POST /ask:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = {
  handleAskQuestion
};
