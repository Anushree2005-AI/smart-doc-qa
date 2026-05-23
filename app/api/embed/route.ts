import { NextRequest, NextResponse } from 'next/server';
import { chunkText } from '../../../lib/chunker';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    let text = '';
    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File;

      if (!file) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 });
      }

      const isPdf = file.type === 'application/pdf'
        || file.type === 'application/x-pdf'
        || file.name.toLowerCase().endsWith('.pdf');

      if (isPdf) {
        const buffer = Buffer.from(await file.arrayBuffer());
        try {
          const pdfParseModule = await import('pdf-parse');
          const pdfParseAny: any = (pdfParseModule as any).default ?? pdfParseModule;
          const PdfParseClass = pdfParseAny.PDFParse ?? (pdfParseModule as any).PDFParse;

          if (typeof pdfParseAny === 'function') {
            const data = await pdfParseAny(buffer);
            text = data?.text ?? '';
          } else if (PdfParseClass) {
            const data = await new PdfParseClass({ data: buffer }).getText();
            text = data?.text ?? '';
          } else {
            throw new Error('Unable to resolve pdf-parse parser implementation.');
          }
        } catch (pdfErr) {
          console.error('PDF parse error:', pdfErr);
          return NextResponse.json({ error: 'Failed to parse PDF. Try a .txt file instead.' }, { status: 400 });
        }
      } else {
        text = await file.text();
      }
    } else {
      return NextResponse.json({ error: 'Invalid request format' }, { status: 400 });
    }

    if (!text || !text.trim()) {
      return NextResponse.json({ error: 'No text could be extracted from the file' }, { status: 400 });
    }

    const chunks = chunkText(text, 400, 80);

    return NextResponse.json({
      chunks: chunks.map(c => ({ id: c.id, text: c.text })),
      totalChunks: chunks.length,
      preview: text.slice(0, 200)
    });

  } catch (err: unknown) {
    console.error('Embed route error:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: `Server error: ${message}` }, { status: 500 });
  }
}