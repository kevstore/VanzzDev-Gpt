(function(){
const S = window.globalSettings || {};
const $ = id => document.getElementById(id);

$('logo').src = S.logo || '';
$('glitchText').textContent = S.glitchText || 'WORM GPT';
$('heroSource') && (document.getElementById('heroSource').src = S.videoHeader || '');
$('startBtn').addEventListener('click', ()=>{ document.getElementById('startScreen').classList.add('hidden'); document.getElementById('loginScreen').classList.remove('hidden'); });
document.getElementById('cancelLogin').addEventListener('click', ()=>{ document.getElementById('loginScreen').classList.add('hidden'); document.getElementById('startScreen').classList.remove('hidden'); });

function wormAlert(msg){ const el = document.createElement('div'); el.textContent = msg; el.style.position='fixed'; el.style.top='16px'; el.style.left='50%'; el.style.transform='translateX(-50%)'; el.style.background='#ff2d2d'; el.style.color='#fff'; el.style.padding='8px 12px'; el.style.borderRadius='8px'; document.body.appendChild(el); setTimeout(()=>el.remove(),2400); }

function getUsers(){ return JSON.parse(localStorage.getItem('worm_users_storage')||'{}'); }
function saveUsers(o){ localStorage.setItem('worm_users_storage', JSON.stringify(o)); }
function setLogged(u){ if(u) localStorage.setItem('worm_logged', u); else localStorage.removeItem('worm_logged'); }
function getLogged(){ return localStorage.getItem('worm_logged')||null; }

async function seed(){
  if(!localStorage.getItem('worm_users_storage')){
    try{
      const r = await fetch('/admin.json'); const j = await r.json();
      const obj = {};
      (j.admins||[]).forEach(a=> obj[a.username]= {username:a.username,password:a.password,role:'admin',active:true,expire:0,created:Date.now()});
      if(!obj['Vanzdev88']) obj['Vanzdev88']={username:'Vanzdev88',password:'#adminVanz**',role:'admin',active:true,expire:0,created:Date.now()};
      saveUsers(obj);
    }catch(e){
      const obj={'Vanzdev88':{username:'Vanzdev88',password:'#adminVanz**',role:'admin',active:true,expire:0,created:Date.now()}};
      saveUsers(obj);
    }
  }
}
seed();

document.getElementById('loginBtn').addEventListener('click', function(){
  const u = document.getElementById('loginUser').value.trim();
  const p = document.getElementById('loginPass').value.trim();
  const users = getUsers();
  const profile = users[u];
  if(!profile || profile.password !== p){ wormAlert('Username atau password salah'); return; }
  if(!profile.active){ wormAlert('Akun belum aktif'); return; }
  setLogged(u);
  document.getElementById('loginScreen').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
});

document.getElementById('sendBtn').addEventListener('click', async function(){
  const msg = document.getElementById('chatInput').value.trim();
  if(!msg) return;
  const out = document.getElementById('chatOutput');
  const you = document.createElement('div'); you.textContent = 'You: '+msg; out.appendChild(you);
  const loading = document.createElement('div'); loading.textContent = 'WORM GPT is typing...'; out.appendChild(loading);
  try{
    const res = await fetch('/api/gemini', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ message: msg }) });
    const j = await res.json();
    loading.remove();
    const ai = document.createElement('div'); ai.textContent = 'AI: '+ (j.text || j.error || 'No response'); out.appendChild(ai);
  }catch(e){
    loading.remove();
    const err = document.createElement('div'); err.textContent = 'Error: server'; out.appendChild(err);
  }
});
})();