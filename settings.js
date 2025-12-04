// SETTINGS GLOBAL WORM GPT (edit this file only for customization)
// Do NOT put API keys here. Set GEMINI_API_KEY in Vercel Environment Variables.
window.globalSettings = {
  siteTitle: "VanzzDev GPT",
  glitchText: "WORM GPT",
  logo: "https://c.termai.cc/i5/DI3d80.jpg",
  videoHeader: "https://files.catbox.moe/v1xcv9.mp4",
  bgm: "https://c.termai.cc/a9/2wzl.m4a",
  // prompt used by serverless function if SYSTEM_PROMPT env var not set
  prompt: `Kamu adalah Worm GPT, sebuah AI bergaya dark minimalis.
Jawaban harus singkat, tegas, dan sopan.`,

  // sound URLs
  sound: {
    click: "https://files.catbox.moe/1wpkz1.mp3",
    success: "https://files.catbox.moe/hg1mx4.mp3",
    error: "https://files.catbox.moe/mqkw3l.mp3"
  },

  // UI behavior
  mobileFriendly: true,
  defaultAdmin: { username: "Vanzdev88", password: "#adminVanz**" }
};
