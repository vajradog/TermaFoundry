const OCR_UPSTREAM = 'http://5.161.185.85:8080/ocr';
const REQUEST_TIMEOUT_MS = 90000;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const payload = typeof req.body === 'string' ? safeParse(req.body) : req.body;
  if (!payload || typeof payload !== 'object') {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const upstream = await fetch(OCR_UPSTREAM, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    const contentType = upstream.headers.get('content-type') || '';
    res.status(upstream.status);

    if (contentType.includes('application/json')) {
      const data = await upstream.json();
      return res.json(data);
    }

    const text = await upstream.text();
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    return res.send(text);
  } catch (err) {
    if (err && err.name === 'AbortError') {
      return res.status(504).json({ error: 'Upstream timeout' });
    }
    return res.status(502).json({ error: 'OCR upstream request failed' });
  } finally {
    clearTimeout(timeoutId);
  }
}

function safeParse(input) {
  try {
    return JSON.parse(input);
  } catch {
    return null;
  }
}
