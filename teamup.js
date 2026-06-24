// Vercel serverless function: /api/claude
// Proxies requests to OpenAI's API so the API key stays server-side
// and the browser doesn't hit CORS issues.
// Accepts the same { messages, max_tokens } shape used by the frontend
// and converts it to OpenAI's chat completions format.

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Server is missing OPENAI_API_KEY environment variable. Add it in Vercel → Settings → Environment Variables.' });
  }

  try {
    const { messages, max_tokens } = req.body;

    // Convert Anthropic-style message content (array of {type:'text'|'image', ...})
    // into OpenAI chat completions format (array of {type:'text'|'image_url', ...}).
    const openaiMessages = (messages || []).map(m => {
      if (typeof m.content === 'string') {
        return { role: m.role, content: m.content };
      }
      const parts = (m.content || []).map(part => {
        if (part.type === 'text') {
          return { type: 'text', text: part.text };
        }
        if (part.type === 'image') {
          const mediaType = part.source?.media_type || 'image/png';
          const data = part.source?.data || '';
          return { type: 'image_url', image_url: { url: `data:${mediaType};base64,${data}` } };
        }
        return null;
      }).filter(Boolean);
      return { role: m.role, content: parts };
    });

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        max_tokens: max_tokens || 1000,
        messages: openaiMessages,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || 'OpenAI API error' });
    }

    // Reshape OpenAI's response into the Anthropic-style shape the frontend expects:
    // { content: [{ type: 'text', text: '...' }] }
    const text = data.choices?.[0]?.message?.content || '';
    return res.status(200).json({ content: [{ type: 'text', text }] });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}


