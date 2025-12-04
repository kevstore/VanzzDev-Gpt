const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Only POST' });
  const { message } = req.body || {};
  if (!message) return res.status(400).json({ error: 'Missing message' });

  const KEY = process.env.GEMINI_API_KEY;
  if (!KEY) return res.status(500).json({ error: 'GEMINI_API_KEY not set on server' });

  const systemPrompt = process.env.SYSTEM_PROMPT || `Kamu adalah Worm GPT, sebuah AI bergaya dark minimalis. Jawaban harus singkat, tegas, dan sopan.`;

  const payload = {
    contents: [
      { parts: [ { text: systemPrompt + "\nUser: " + message } ] }
    ]
  };

  try {
    const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=' + encodeURIComponent(KEY), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!r.ok) {
      const t = await r.text();
      return res.status(r.status).json({ error: 'Gemini error', detail: t });
    }
    const j = await r.json();
    const candidate = j?.candidates?.[0];
    const parts = candidate?.content?.parts;
    const text = parts && parts.length ? parts.map(p=>p.text||'').join('\n') : (candidate?.output?.[0]?.content?.[0]?.text || '');
    return res.status(200).json({ text });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Request failed' });
  }
};
