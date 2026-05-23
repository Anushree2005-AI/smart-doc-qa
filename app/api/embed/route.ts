import { NextRequest, NextResponse } from 'next/server';
import { chunkText } from '@/lib/chunker';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const fileName = file.name || 'document';
    const buffer = Buffer.from(await file.arrayBuffer());
    
    let text = '';
    try {
      text = buffer.toString('utf-8');
    } catch (e) {
      text = buffer.toString('latin1');
    }

    if (!text || !text.trim()) {
      return NextResponse.json({ error: 'Uploaded document is empty or not readable' }, { status: 400 });
    }

    const chunks = chunkText(text.trim());

    if (!chunks.length) {
      return NextResponse.json({ error: 'No content chunks could be extracted' }, { status: 400 });
    }

    return NextResponse.json({
      chunks: chunks.map(({ id, text }) => ({ id, text })),
      totalChunks: chunks.length,
      fileName,
    });
  } catch (err) {
    console.error('Upload error:', err);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}