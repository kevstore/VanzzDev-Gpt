const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const crypto = require('crypto');

function decryptPayload(encBase64, passphrase) {
  const raw = JSON.parse(Buffer.from(encBase64, 'base64').toString('utf8'));
  if (raw.method === 'AES-GCM') {
    const salt = Buffer.from(raw.salt, 'base64');
    const iv = Buffer.from(raw.iv, 'base64');
    const tag = Buffer.from(raw.tag, 'base64');
    const ct = raw.ct;
    const key = crypto.pbkdf2Sync(passphrase, salt, 200000, 32, 'sha256');
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    let decrypted = decipher.update(ct, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } else if (raw.method === 'XOR') {
    const ct = Buffer.from(raw.ct, 'base64');
    const pb = Buffer.from(passphrase, 'utf8');
    const out = Buffer.alloc(ct.length);
    for (let i = 0; i < ct.length; i++) out[i] = ct[i] ^ pb[i % pb.length];
    return out.toString('utf8');
  }
  throw new Error('Unknown encryption method');
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Only POST' });
  const { message } = req.body || {};
  if (!message) return res.status(400).json({ error: 'Missing message' });

  // Encrypted payload & passphrase (for demo). For production, move passphrase to Vercel env.
  const ENC = "eyJtZXRob2QiOiAiQUVTLUdDTSIsICJjdCI6ICI0QVhWTTZNRHRjNVJ1c2loa1N4ek1LRnMzd0FDRDIzdW45SmVNWktrRi82Q2dVekQxekFlIiwgIml2IjogIlFNYTdnOFduYVN1amlvcVEiLCAidGFnIjogImFYSnJqekVRQURNbnpFaGVIYUJxdnc9PSIsICJzYWx0IjogIktxSG5rM2pxdFo5MFB4cy9IOCtZM1E9PSJ9";
  const PASS = "WGPT_LOCK";

  let API_KEY = '';
  try {
    API_KEY = decryptPayload(ENC, PASS);
  } catch (e) {
    console.error('decrypt failed', e);
    return res.status(500).json({ error: 'decrypt failed' });
  }

  const systemPrompt = process.env.SYSTEM_PROMPT || require('fs').readFileSync('prompt.txt','utf8') || 'Kamu adalah Worm GPT.';

  const payload = {
    contents: [
      { parts: [ { text: systemPrompt + "\nUser: " + message } ] }
    ]
  };

  try {
    const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=' + encodeURIComponent(API_KEY), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!r.ok) {
      const t = await r.text();
      return res.status(r.status).json({ error: 'Gemini error', detail: t });
    }
    const j = await r.json();
    const candidate = j && j.candidates && j.candidates[0];
    const parts = candidate && candidate.content && candidate.content.parts;
    const text = parts && parts.length ? parts.map(p => p.text || '').join('\n') : (candidate && candidate.output && candidate.output[0] && candidate.output[0].content && candidate.output[0].content[0] && candidate.output[0].content[0].text) || '';
    return res.status(200).json({ text });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Request failed' });
  }
};
