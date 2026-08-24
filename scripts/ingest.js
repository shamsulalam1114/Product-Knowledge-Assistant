require('dotenv').config();
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');
const { cleanProductsData } = require('../service/cleaner');
const { generateEmbedding } = require('../service/embedder');

const EXCEL_FILE_PATH = path.join(__dirname, '../products_data.xlsx');
const KB_OUTPUT_PATH = path.join(__dirname, '../knowledge_base.json');

async function runIngestion() {
  console.log("Starting Data Ingestion...");

  // 1. Read Excel file
  if (!fs.existsSync(EXCEL_FILE_PATH)) {
    console.error(`Error: Cannot find Excel file at ${EXCEL_FILE_PATH}`);
    process.exit(1);
  }

  const workbook = xlsx.readFile(EXCEL_FILE_PATH);
  const sheetName = workbook.SheetNames[0];
  const rawData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
  
  console.log(`Read ${rawData.length} rows from Excel.`);

  // 2. Clean data
  const { cleaned, duplicateIds } = cleanProductsData(rawData);
  
  if (duplicateIds.length > 0) {
    console.log(`Skipped ${duplicateIds.length} duplicate rows. IDs:`, duplicateIds.join(", "));
  }

  // 3. Generate embeddings
  // Note: To avoid rate limits, we should ideally process in batches or with sleep,
  // but for 30 products, standard loops should be fine on the free tier.
  console.log(`Generating embeddings for ${cleaned.length} products... This may take a moment.`);
  
  const knowledgeBase = [];

  for (let i = 0; i < cleaned.length; i++) {
    const product = cleaned[i];
    console.log(`[${i + 1}/${cleaned.length}] Embedding: ${product["Product ID"]} - ${product["Product Name"]}`);
    
    // Call AI to get vector
    const vector = await generateEmbedding(product.textToEmbed);
    
    if (vector) {
      product.embedding = vector;
      knowledgeBase.push(product);
    } else {
      console.warn(`Failed to embed product ${product["Product ID"]}`);
    }

    // Small delay to prevent rate limit hit (Gemini free tier allows 15 RPM, meaning we should pause slightly if we had more items. 
    // For 30 items, the basic speed might be okay or slightly constrained. Let's add a small sleep).
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // 4. Save to JSON
  fs.writeFileSync(KB_OUTPUT_PATH, JSON.stringify(knowledgeBase, null, 2));
  console.log(`\nSuccess! Wrote ${knowledgeBase.length} products to knowledge_base.json`);
}

runIngestion().catch(console.error);
