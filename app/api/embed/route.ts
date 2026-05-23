import { NextRequest, NextResponse } from 'next/server';
import { PDFParse } from 'pdf-parse';
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

    if (fileName.toLowerCase().endsWith('.pdf')) {
      const parser = new PDFParse({ data: buffer });
      const result = await parser.getText();
      text = result.text;
    } else {
      text = buffer.toString('utf-8');
    }

    if (!text.trim()) {
      return NextResponse.json({ error: 'Uploaded document is empty' }, { status: 400 });
    }

    const chunks = chunkText(text);

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