WORM GPT - Vercel Deploy Ready

Structure:
- index.html
- style.css
- settings.js - all config (do NOT put API keys here)
- app.js - client logic (calls /api/gemini)
- api/gemini.js - serverless function; set GEMINI_API_KEY in Vercel env vars
- user.json / admin.json - seeds (frontend copies into localStorage at first load)

Deployment:
1. Upload this folder to Vercel (drag & drop) or push to a Git repo and connect Vercel.
2. In Vercel Project Settings -> Environment Variables add:
   - GEMINI_API_KEY = your Gemini API key
   - (optional) SYSTEM_PROMPT = if you want to override prompt used by server
3. Deploy. The frontend will call /api/gemini which uses GEMINI_API_KEY securely.

Notes:
- This project stores users in browser localStorage. For persistence use external DB (Supabase, Firebase, Vercel KV).
- Do not place your API key in settings.js or client code.
