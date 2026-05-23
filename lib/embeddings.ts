export function tokenize(text: string): Map<string, number> {
  const words = text.toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2);

  const freq = new Map<string, number>();
  for (const word of words) {
    freq.set(word, (freq.get(word) || 0) + 1);
  }
  return freq;
}

export function cosineSimilarity(a: Map<string, number>, b: Map<string, number>): number {
  let dot = 0, normA = 0, normB = 0;
  for (const [word, countA] of a) {
    const countB = b.get(word) || 0;
    dot += countA * countB;
    normA += countA * countA;
  }
  for (const [, countB] of b) {
    normB += countB * countB;
  }
  return normA && normB ? dot / (Math.sqrt(normA) * Math.sqrt(normB)) : 0;
}

export function retrieveTopChunks(
  query: string,
  chunks: Array<{ id: number; text: string }>,
  topK = 5
) {
  const queryVec = tokenize(query);
  const scored = chunks.map(chunk => ({
    ...chunk,
    score: cosineSimilarity(queryVec, tokenize(chunk.text)),
  }));
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .filter(c => c.score > 0);
}