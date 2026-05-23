import Groq from 'groq-sdk';

function getGroqClient() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not set. Add it to your .env.local file.');
  }
  return new Groq({ apiKey });
}

export async function answerWithContext(
  question: string,
  contextChunks: Array<{ id: number; text: string }>
): Promise<string> {
  const context = contextChunks
    .map((c, i) => `[Source ${i + 1}]: ${c.text}`)
    .join('\n\n');

  const prompt = `You are a precise document assistant. Answer the question using ONLY the provided context.
If the answer is not in the context, say "I couldn't find this in the document."
Always cite which Source(s) you used at the end of your answer.

Context:
${context}

Question: ${question}

Answer:`;

  const groq = getGroqClient();
  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.1,
    max_tokens: 600,
  });

  return response.choices[0].message.content || 'No response generated.';
}