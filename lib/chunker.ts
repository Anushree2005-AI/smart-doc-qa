export interface TextChunk {
  id: number;
  text: string;
}

export function chunkText(text: string, chunkSize = 400, overlap = 80): TextChunk[] {
  const chunks: TextChunk[] = [];
  let start = 0;
  let id = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    let breakPoint = end;

    if (end < text.length) {
      const lastPeriod = text.lastIndexOf('.', end);
      if (lastPeriod > start + chunkSize * 0.5) {
        breakPoint = lastPeriod + 1;
      }
    }

    const chunk = text.slice(start, breakPoint).trim();
    if (chunk.length > 20) {
      chunks.push({ id: id++, text: chunk });
    }

    start = breakPoint - overlap;
    if (start >= text.length) break;
  }

  return chunks;
}