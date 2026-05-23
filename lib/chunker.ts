export interface TextChunk {
  id: number;
  text: string;
  startChar: number;
  endChar: number;
}

export function chunkText(text: string, chunkSize = 400, overlap = 80): TextChunk[] {
  const chunks: TextChunk[] = [];
  let start = 0;
  let id = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    // Try to break at sentence boundary
    let breakPoint = end;
    if (end < text.length) {
      const lastPeriod = text.lastIndexOf('.', end);
      if (lastPeriod > start + chunkSize * 0.5) {
        breakPoint = lastPeriod + 1;
      }
    }

    chunks.push({
      id: id++,
      text: text.slice(start, breakPoint).trim(),
      startChar: start,
      endChar: breakPoint,
    });

    start = breakPoint - overlap;
    if (start >= text.length) break;
  }

  return chunks.filter(c => c.text.length > 20);
}