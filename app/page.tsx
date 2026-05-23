'use client';
import { useState } from 'react';
import { Upload, Send, FileText, Loader2, BookOpen } from 'lucide-react';

interface Chunk { id: number; text: string; score?: number; }
interface Message {
  role: 'user' | 'assistant';
  content: string;
  sources?: Chunk[];
}

export default function Home() {
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [querying, setQuerying] = useState(false);
  const [fileName, setFileName] = useState('');
  const [expandedSource, setExpandedSource] = useState<number | null>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setMessages([]);
    setFileName(file.name);
    setChunks([]);

    const fd = new FormData();
    fd.append('file', file);

    try {
      const res = await fetch('/api/embed', { method: 'POST', body: fd });
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error('Server error: ' + text.slice(0, 200));
      }
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      setChunks(data.chunks);
      setMessages([{
        role: 'assistant',
        content: `Document loaded: ${file.name} — ${data.totalChunks} sections indexed. Ask me anything about it.`
      }]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setMessages([{ role: 'assistant', content: 'Upload failed: ' + msg }]);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  async function handleAsk() {
    if (!input.trim() || !chunks.length || querying) return;
    const question = input.trim();
    setInput('');
    setMessages(m => [...m, { role: 'user', content: question }]);
    setQuerying(true);

    try {
      const res = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, chunks }),
      });
      const data = await res.json();
      setMessages(m => [...m, {
        role: 'assistant',
        content: data.answer || data.error || 'No response.',
        sources: data.sources
      }]);
    } catch {
      setMessages(m => [...m, {
        role: 'assistant',
        content: 'Something went wrong. Please try again.'
      }]);
    } finally {
      setQuerying(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">

      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <BookOpen size={16} />
          </div>
          <h1 className="text-lg font-semibold tracking-tight">DocMind</h1>
          <span className="text-xs bg-blue-900/40 text-blue-400 px-2 py-0.5 rounded-full border border-blue-800">
            RAG-powered
          </span>
        </div>

        {/* ✅ FIX: label wraps input directly — no ref needed */}
        <label
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors
            ${uploading
              ? 'bg-gray-700 opacity-60 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-500'}`}
        >
          {uploading
            ? <><Loader2 size={14} className="animate-spin" /> Processing...</>
            : <><Upload size={14} /> {fileName ? 'Replace Document' : 'Upload Document'}</>
          }
          <input
            type="file"
            accept=".pdf,.txt,.md"
            className="hidden"
            onChange={handleUpload}
            disabled={uploading}
          />
        </label>
      </header>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 max-w-4xl mx-auto w-full">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500 gap-4">
            <FileText size={48} className="opacity-30" />
            <p className="text-center text-sm">
              Upload a PDF or text document to begin.<br />
              Ask questions and get cited answers.
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold
              ${msg.role === 'user' ? 'bg-gray-700' : 'bg-blue-600'}`}>
              {msg.role === 'user' ? 'U' : 'AI'}
            </div>
            <div className={`max-w-2xl space-y-3 ${msg.role === 'user' ? 'items-end flex flex-col' : ''}`}>
              <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap
                ${msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-tr-sm'
                  : 'bg-gray-800 text-gray-100 rounded-tl-sm'}`}>
                {msg.content}
              </div>

              {msg.sources && msg.sources.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-gray-500 px-1">Sources used:</p>
                  {msg.sources.map((src, j) => (
                    <div key={j} className="bg-gray-900 border border-gray-700 rounded-xl overflow-hidden">
                      <button
                        onClick={() => setExpandedSource(expandedSource === src.id ? null : src.id)}
                        className="w-full px-3 py-2 flex items-center justify-between text-xs text-gray-400 hover:text-gray-200 transition-colors"
                      >
                        <span>Source {j + 1} · Chunk #{src.id}</span>
                        <span>{expandedSource === src.id ? '▲' : '▼'}</span>
                      </button>
                      {expandedSource === src.id && (
                        <div className="px-3 pb-3 text-xs text-gray-400 leading-relaxed border-t border-gray-700 pt-2">
                          {src.text}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {querying && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold">AI</div>
            <div className="bg-gray-800 px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-2">
              <Loader2 size={14} className="animate-spin text-blue-400" />
              <span className="text-sm text-gray-400">Searching document...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input bar */}
      <div className="border-t border-gray-800 px-6 py-4">
        <div className="max-w-4xl mx-auto flex gap-3">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleAsk()}
            placeholder={chunks.length ? 'Ask a question about your document...' : 'Upload a document first'}
            disabled={!chunks.length || querying}
            className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm
              placeholder-gray-500 focus:outline-none focus:border-blue-500 disabled:opacity-40 transition-colors"
          />
          <button
            onClick={handleAsk}
            disabled={!input.trim() || !chunks.length || querying}
            className="px-4 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 rounded-xl transition-colors"
          >
            <Send size={16} />
          </button>
        </div>
        {chunks.length > 0 && (
          <p className="text-xs text-gray-600 text-center mt-2">
            {fileName} · {chunks.length} chunks indexed
          </p>
        )}
      </div>
    </main>
  );
}