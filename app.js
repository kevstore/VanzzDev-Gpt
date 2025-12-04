// app.js - client-side logic for WORM GPT (Vercel-ready)
// uses localStorage for user DB (seeded from admin.json / user.json)

(function(){
  const S = window.globalSettings || {};
  // DOM
  const $ = id => document.getElementById(id);
  const startScreen = $('startScreen'), loginScreen = $('loginScreen'), app = $('app'), manageModal = $('manageModal');
  const startLogo = $('startLogo'), glitchTextEl = $('glitchText'), heroSource = $('heroSource'), heroVideo = $('heroVideo');
  const loginUser = $('loginUser'), loginPass = $('loginPass'), loginBtn = $('loginBtn'), cancelLogin = $('cancelLogin');
  const manageBtn = $('manageBtn'), addUserBtn = $('addUserBtn'), closeManageBtn = $('closeManageBtn');
  const chatOutput = $('chatOutput'), chatInput = $('chatInput'), sendBtn = $('sendBtn');
  const wormAlertBox = $('wormAlert'), userList = $('userList');
  const userAvatar = $('userAvatar'), appTitle = $('appTitle'), statusLabel = $('statusLabel');

  // sounds
  const soundClick = new Audio(S.sound?.click || '');
  const soundSuccess = new Audio(S.sound?.success || '');
  const soundError = new Audio(S.sound?.error || '');
  function playClick(){ try{ soundClick.currentTime=0; soundClick.play(); }catch(e){} }
  function playSuccess(){ try{ soundSuccess.currentTime=0; soundSuccess.play(); }catch(e){} }
  function playError(){ try{ soundError.currentTime=0; soundError.play(); }catch(e){} }

  // helpers
  function wormAlert(msg){ wormAlertBox.textContent = msg; wormAlertBox.classList.add('show'); setTimeout(()=>wormAlertBox.classList.remove('show'),2400); }
  function escapeHtml(s){ return String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function sanitizeResp(t){ return String(t||'').replace(/https?:\/\/raw\.github(?:usercontent)?\.com[^\s'"]*/gi,'[removed]'); }

  // DB (localStorage)
  function loadSeed(){
    if(!localStorage.getItem('worm_users_storage')){
      fetch('/user.json').then(r=>r.json()).then(d=>{
        const obj={};
        (d.users||[]).forEach(u=> obj[u.username]=u);
        // ensure default admin
        const def = S.defaultAdmin || {username:'Vanzdev88', password:'#adminVanz**'};
        if(!obj[def.username]) obj[def.username] = { username:def.username, password:def.password, role:'admin', active:true, expire:0, created:Date.now() };
        localStorage.setItem('worm_users_storage', JSON.stringify(obj));
      }).catch(e=>{
        const def = S.defaultAdmin || {username:'Vanzdev88', password:'#adminVanz**'};
        const obj={}; obj[def.username]={ username:def.username, password:def.password, role:'admin', active:true, expire:0, created:Date.now() };
        localStorage.setItem('worm_users_storage', JSON.stringify(obj));
      });
    }
  }
  function getUsers(){ return JSON.parse(localStorage.getItem('worm_users_storage')||'{}'); }
  function saveUsers(u){ localStorage.setItem('worm_users_storage', JSON.stringify(u)); }
  function getLogged(){ return localStorage.getItem('worm_logged')||null; }
  function setLogged(u){ if(u) localStorage.setItem('worm_logged',u); else localStorage.removeItem('worm_logged'); }

  // init UI from settings
  startLogo.src = S.logo || '';
  glitchTextEl.dataset.text = S.glitchText || 'WORM GPT';
  glitchTextEl.textContent = S.glitchText || 'WORM GPT';
  heroSource.src = S.videoHeader || '';
  try{ heroVideo.load(); }catch(e){}
  appTitle.textContent = S.siteTitle || 'VanzzDev GPT';

  loadSeed();

  // start button
  $('startBtn').addEventListener('click', ()=>{ playClick(); startScreen.classList.add('hidden'); loginScreen.classList.remove('hidden'); });

  // cancel login
  cancelLogin.addEventListener('click', ()=>{ playClick(); loginScreen.classList.add('hidden'); startScreen.classList.remove('hidden'); });

  // lock on load
  window.addEventListener('load', ()=>{
    const lg = getLogged();
    const users = getUsers();
    if(!lg || !users[lg]){ app.classList.add('hidden'); return; }
    const u = users[lg];
    if(!u.active){ wormAlert('Akun belum aktif'); setLogged(null); return; }
    if(u.expire>0 && Date.now()>u.expire){ wormAlert('Masa aktif berakhir'); setLogged(null); return; }
    openAppFor(lg);
  });

  // login
  loginBtn.addEventListener('click', doLogin);
  loginPass.addEventListener('keydown', e=>{ if(e.key==='Enter') doLogin(); });

  function doLogin(){
    playClick();
    const u = (loginUser.value||'').trim();
    const p = (loginPass.value||'').trim();
    if(!u||!p){ wormAlert('Isi username & password'); playError(); return; }
    const users = getUsers();
    const prof = users[u];
    if(!prof || prof.password !== p){ wormAlert('Username atau password salah'); playError(); return; }
    if(!prof.active){ wormAlert('Akun belum aktif'); playError(); return; }
    if(prof.expire>0 && Date.now()>prof.expire){ wormAlert('Masa aktif berakhir'); playError(); return; }
    setLogged(u);
    playSuccess();
    loginScreen.classList.add('hidden');
    openAppFor(u);
  }

  function openAppFor(user){
    const users = getUsers();
    const prof = users[user];
    app.classList.remove('hidden');
    userAvatar.textContent = user.charAt(0).toUpperCase();
    if(prof.role === 'admin') manageBtn.style.display = 'inline-block'; else manageBtn.style.display = 'none';
    statusLabel && (statusLabel.textContent = prof.active ? (prof.expire===0 ? 'Selamanya' : new Date(prof.expire).toLocaleString()) : 'Tidak aktif');
    append('SYSTEM','WORM GPT siap. Selamat datang '+user);
  }

  // chat append
  function append(who, text){
    const el = document.createElement('div');
    if(who==='You') el.innerHTML = '<div class="bubble you">'+escapeHtml(text)+'</div>';
    else if(who==='AI') el.innerHTML = '<div class="bubble ai">'+escapeHtml(text)+'</div>';
    else el.innerHTML = '<div style="color:#9a9a9a;font-size:13px">'+escapeHtml(text)+'</div>';
    chatOutput.appendChild(el); chatOutput.scrollTop = chatOutput.scrollHeight;
  }

  // send
  sendBtn.addEventListener('click', sendMessage);
  chatInput.addEventListener('keydown', e=>{ if(e.key==='Enter'){ e.preventDefault(); sendMessage(); } });

  async function sendMessage(){
    const user = getLogged();
    if(!user){ wormAlert('Kamu belum login'); playError(); return; }
    const users = getUsers();
    const prof = users[user];
    if(!prof.active){ wormAlert('Akun belum aktif'); playError(); return; }
    if(prof.expire>0 && Date.now()>prof.expire){ wormAlert('Masa aktif berakhir'); playError(); return; }
    const txt = (chatInput.value||'').trim();
    if(!txt){ wormAlert('Isi pesan dulu'); playError(); return; }
    append('You', txt);
    chatInput.value = '';
    append('SYSTEM','WORM GPT memproses...');
    // call serverless
    try{
      const res = await fetch('/api/gemini', {
        method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ message: txt })
      });
      const j = await res.json();
      const reply = sanitizeResp(j.text || j.error || 'Tidak ada respons');
      // remove last SYSTEM
      const last = chatOutput.lastChild;
      if(last && last.textContent && last.textContent.includes('WORM GPT memproses')) last.remove();
      append('AI', reply);
      playSuccess();
    }catch(e){
      wormAlert('Gagal koneksi ke server');
      playError();
    }
  }

  // ADMIN: manage users
  manageBtn.addEventListener('click', ()=>{ openManager(); });

  const manageModalEl = $('manageModal');
  const closeManage = $('closeManageBtn');

  function openManager(){
    const cur = getLogged();
    const users = getUsers();
    if(!cur || users[cur].role !== 'admin'){ wormAlert('Akses ditolak'); playError(); return; }
    renderUserList();
    manageModalEl.classList.remove('hidden');
  }
  closeManage && closeManage.addEventListener('click', ()=> manageModalEl.classList.add('hidden'));

  function renderUserList(){
    const box = $('userList'); box.innerHTML = '';
    const users = getUsers();
    Object.keys(users).forEach(k=>{
      const u = users[k];
      const item = document.createElement('div'); item.className='user-list-item';
      const left = document.createElement('div');
      const expText = (u.expire===0 ? 'Selamanya' : new Date(u.expire).toLocaleString());
      left.innerHTML = '<strong>'+escapeHtml(u.username)+'</strong><div style="font-size:12px;color:#9a9a9a">Role: '+escapeHtml(u.role)+'<br>Aktif: '+(u.active?'Ya':'Tidak')+'<br>Exp: '+escapeHtml(expText)+'</div>';
      const right = document.createElement('div');
      const sel = document.createElement('select');
      sel.innerHTML = '<option value="">Sewa...</option><option value="1">1 Bulan</option><option value="2">2 Bulan</option><option value="3">3 Bulan</option><option value="4">4 Bulan</option><option value="5">5 Bulan</option><option value="999">Selamanya</option>';
      sel.style.marginRight='8px';
      sel.onchange = function(){
        if(u.username==='Vanzdev88'){ wormAlert('Admin utama tidak bisa diubah'); sel.value=''; return; }
        const val = parseInt(sel.value);
        if(val===999){ u.active=true; u.expire=0; }
        else { const ms = val*30*24*60*60*1000; u.active=true; u.expire = Date.now()+ms; }
        users[u.username]=u; saveUsers(users); renderUserList(); wormAlert('Durasi diperbarui'); playSuccess();
      };
      const roleSel = document.createElement('select');
      roleSel.innerHTML = '<option value="user">user</option><option value="admin">admin</option>';
      roleSel.value = u.role; roleSel.style.marginRight='8px';
      roleSel.onchange = function(){
        if(u.username==='Vanzdev88'){ wormAlert('Admin utama tidak bisa diubah'); roleSel.value='admin'; return; }
        u.role = roleSel.value; users[u.username]=u; saveUsers(users); renderUserList(); wormAlert('Role diubah'); playSuccess();
      };
      const del = document.createElement('button'); del.textContent='Hapus'; del.style.background='#b53131'; del.style.color='#fff'; del.style.border='none'; del.style.padding='8px'; del.style.borderRadius='8px';
      del.onclick = function(){
        if(u.username==='Vanzdev88'){ wormAlert('Admin utama tidak bisa dihapus'); return; }
        if(!confirm('Hapus user '+u.username+'?')) return;
        delete users[u.username]; saveUsers(users); renderUserList(); wormAlert('User dihapus'); playSuccess();
      };
      right.appendChild(sel); right.appendChild(roleSel); right.appendChild(del);
      item.appendChild(left); item.appendChild(right);
      box.appendChild(item);
    });
  }

  addUserBtn.addEventListener('click', ()=>{ addUser(); });

  function addUser(){
    playClick();
    const name = (document.getElementById('newUsername').value||'').trim();
    const pass = (document.getElementById('newPassword').value||'').trim();
    const role = (document.getElementById('newRole').value||'user');
    if(!name||!pass){ wormAlert('Isi username & password'); playError(); return; }
    const users = getUsers();
    if(users[name]){ wormAlert('User sudah ada'); playError(); return; }
    users[name] = { username:name, password:pass, role:role, active:false, expire:0, created:Date.now() };
    saveUsers(users); document.getElementById('newUsername').value=''; document.getElementById('newPassword').value=''; renderUserList(); wormAlert('User ditambahkan (belum aktif)'); playSuccess();
  }

  // logout
  userAvatar.addEventListener('dblclick', ()=>{ if(confirm('Logout?')){ setLogged(null); location.reload(); } });

})();
