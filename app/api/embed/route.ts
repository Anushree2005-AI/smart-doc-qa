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

    if (fileName.toLowerCase().endsWith('.pdf')) {
      try {
        const pdfParse = require('pdf-parse/lib/pdf-parse.js');
        const data = await pdfParse(buffer);
        text = data.text || '';
      } catch (pdfErr) {
        console.error('PDF extraction failed:', pdfErr);
        text = buffer.toString('latin1');
      }
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