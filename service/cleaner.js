function cleanPrices(priceStr) {
  if (!priceStr) return null;
  if (typeof priceStr === "number") return priceStr;
  
  // Convert something like "3,200 tk" or "৳4,990" into a float
  const numericString = priceStr.toString().replace(/[^0-9.]/g, '');
  if (!numericString) return null;
  return parseFloat(numericString);
}

function cleanProductsData(rows) {
  const cleaned = [];
  const seenIds = new Set();
  const duplicateIds = [];

  rows.forEach((row) => {
    // 1. Check for duplicates by Product ID
    if (seenIds.has(row["Product ID"])) {
      duplicateIds.push(row["Product ID"]);
      return; // Skip duplicate
    }
    seenIds.add(row["Product ID"]);

    // 2. Normalise prices
    const productPrice = cleanPrices(row["Product Price"]);
    const salePrice = cleanPrices(row["Sale Price"]);

    // 3. Resolve actual price
    // "Resolve the difference between Product Price and Sale Price, so a question about “price” gets a sensible answer"
    const actualPrice = salePrice && salePrice > 0 ? salePrice : productPrice;

    // 4. Handle Categories (consistent casing)
    const category = row["Category"] ? row["Category"].trim().toLowerCase() : "unknown";

    // 5. Short text representation for embedding
    // "Build one short text representation per product to be embedded, combining the name, brand, category, and description"
    const textToEmbed = `Product Name: ${row["Product Name"] || ""}. Brand: ${row["Brand"] || ""}. Category: ${category}. Description: ${row["Short Description"] || ""}. Price: ${actualPrice} ${row["Currency"] || "BDT"}.`;

    cleaned.push({
      ...row,
      Category: category,
      "Product Price": productPrice,
      "Sale Price": salePrice,
      "Actual Price": actualPrice,
      textToEmbed
    });
  });

  return { cleaned, duplicateIds };
}

module.exports = {
  cleanProductsData
};
