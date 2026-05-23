import { NextRequest, NextResponse } from 'next/server';
import { retrieveTopChunks } from '@/lib/embeddings';
import { answerWithContext } from '@/lib/groq';

export async function POST(req: NextRequest) {
  try {
    const { question, chunks } = await req.json();

    if (!question || !chunks?.length) {
      return NextResponse.json({ error: 'Missing question or document chunks' }, { status: 400 });
    }

    const topChunks = retrieveTopChunks(question, chunks, 5);

    if (!topChunks.length) {
      return NextResponse.json({
        answer: 'No relevant sections found in the document for your question.',
        sources: [],
      });
    }

    const answer = await answerWithContext(question, topChunks);

    return NextResponse.json({ answer, sources: topChunks });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Query failed' }, { status: 500 });
  }
}
