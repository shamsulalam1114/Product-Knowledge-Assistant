/**
 * Calculates the cosine similarity between two vectors.
 * Returns a value between -1 and 1, where 1 means perfectly identical.
 */
function cosineSimilarity(vecA, vecB) {
  if (vecA.length !== vecB.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Searches the knowledge base using Cosine Similarity.
 * Returns the top matches that clear the threshold.
 */
function searchKnowledgeBase(queryVector, knowledgeBase, threshold = 0.60, topK = 3) {
  const scoredProducts = knowledgeBase.map(product => {
    const similarity = cosineSimilarity(queryVector, product.embedding);
    return { product, similarity };
  });
  
  // Sort by highest similarity
  scoredProducts.sort((a, b) => b.similarity - a.similarity);
  
  // Filter by threshold and take Top K
  const matches = scoredProducts
    .filter(item => item.similarity >= threshold)
    .slice(0, topK);

  return matches;
}

module.exports = {
  cosineSimilarity,
  searchKnowledgeBase
};
