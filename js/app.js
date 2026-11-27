/* OsteoStudio 3 – gestionale osteopatico offline per iPad.
   Tutti i dati restano nel database locale (IndexedDB) del dispositivo. */
'use strict';
const APP = { name: 'OsteoStudio', version: '3.2.0', db: 'osteostudio3', dbVersion: 1 };
const STORES = ['patients', 'cycles', 'sessions', 'consents'];

/* =====================================================================
   Utilità
   ===================================================================== */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const pad = (n) => String(n).padStart(2, '0');
const todayISO = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
const fmtDate = (iso) => { if (!iso) return ''; const [y, m, d] = iso.slice(0, 10).split('-'); return `${d}/${m}/${y}`; };
const fmtDateLong = (iso) => iso ? new Date(iso.slice(0, 10) + 'T12:00').toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
const fmtDow = (iso) => iso ? new Date(iso.slice(0, 10) + 'T12:00').toLocaleDateString('it-IT', { weekday: 'short' }) : '';
const MONTHS = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
const eur = (v) => (Number(v) || 0).toLocaleString('it-IT', { style: 'currency', currency: 'EUR', minimumFractionDigits: (Number(v) % 1 ? 2 : 0), maximumFractionDigits: 2 });
const parseAmount = (s) => { if (s === '' || s == null) return null; const v = parseFloat(String(s).replace(',', '.')); return isFinite(v) && v >= 0 ? Math.round(v * 100) / 100 : null; };
function ageOf(iso) {
  if (!iso) return null;
  const b = new Date(iso + 'T12:00'), t = new Date();
  let a = t.getFullYear() - b.getFullYear();
  if (t.getMonth() < b.getMonth() || (t.getMonth() === b.getMonth() && t.getDate() < b.getDate())) a--;
  return a >= 0 && a < 130 ? a : null;
}
const nSed = (n) => `${n} ${n === 1 ? 'seduta' : 'sedute'}`;
const fullName = (p) => `${p.cognome || ''} ${p.nome || ''}`.trim() || 'Senza nome';
const displayName = (p) => `${p.nome || ''} ${p.cognome || ''}`.trim() || 'Senza nome';
const initials = (p) => ((p.cognome || '?')[0] + (p.nome || '')[0] || '').toUpperCase();
function vasColor(v) {
  if (v == null) return 'var(--faint)';
  const hue = 130 - (v / 10) * 125;
  return `hsl(${hue} 58% 42%)`;
}
const METHODS = { pos: 'POS / carta', bonifico: 'Bonifico', altro: 'Altro' };
const methodLabel = (k) => METHODS[k] || (k === 'contanti' ? 'Contanti' : '—'); // 'contanti' solo per sedute già registrate
function debounce(fn, ms) {
  let t = null;
  const d = () => { clearTimeout(t); pending.add(d); t = setTimeout(() => { t = null; pending.delete(d); fn(); }, ms); };
  d.flush = () => { clearTimeout(t); t = null; pending.delete(d); fn(); };
  d.cancel = () => { clearTimeout(t); t = null; pending.delete(d); };
  return d;
}
const pending = new Set(); // salvataggi in attesa
function flushPending() { [...pending].forEach((fn) => fn.flush()); }
const b64 = { enc: (buf) => { const u = new Uint8Array(buf); let s = ''; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(s); },
  dec: (str) => { const s = atob(str); const u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u; } };

const ICONS = {
  search: '<path d="M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14Zm9 16-4.3-4.3"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  back: '<path d="m15 18-6-6 6-6"/>',
  doc: '<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5M10 13h6M10 17h6"/>',
  share: '<path d="M12 3v12M8 7l4-4 4 4"/><path d="M5 12v8h14v-8"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>',
  warn: '<path d="M12 3 2 20h20L12 3Z"/><path d="M12 10v4M12 17.5v.5"/>',
  pen: '<path d="m4 20 4-1 11-11-3-3L5 16l-1 4Z"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
  check: '<path d="m5 12 5 5 9-10"/>',
};
const ic = (name, size = 20) => `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;

function toast(msg, ms = 2200) {
  const t = $('#toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), ms);
}

/* =====================================================================
   Database locale
   ===================================================================== */
const DB = {
  db: null,
  open() {
    return new Promise((res, rej) => {
      if (!window.indexedDB) return rej(new Error('Questo browser non supporta il database locale.'));
      const r = indexedDB.open(APP.db, APP.dbVersion);
      r.onupgradeneeded = () => {
        const d = r.result;
        STORES.forEach((s) => { if (!d.objectStoreNames.contains(s)) d.createObjectStore(s, { keyPath: 'id' }); });
        if (!d.objectStoreNames.contains('kv')) d.createObjectStore('kv', { keyPath: 'k' });
      };
      r.onsuccess = () => { this.db = r.result; res(); };
      r.onerror = () => rej(r.error);
    });
  },
  tx(store, mode, fn) {
    return new Promise((res, rej) => {
      const t = this.db.transaction(store, mode);
      const out = fn(t.objectStore(store));
      t.oncomplete = () => res(out && 'result' in out ? out.result : undefined);
      t.onerror = () => rej(t.error);
      t.onabort = () => rej(t.error || new Error('Operazione annullata'));
    });
  },
  all(store) { return this.tx(store, 'readonly', (s) => s.getAll()); },
  put(store, obj) { return this.tx(store, 'readwrite', (s) => s.put(obj)); },
  del(store, id) { return this.tx(store, 'readwrite', (s) => s.delete(id)); },
  async getKV(k) { const r = await this.tx('kv', 'readonly', (s) => s.get(k)); return r ? r.v : undefined; },
  setKV(k, v) { return this.tx('kv', 'readwrite', (s) => s.put({ k, v })); },
  replaceAll(data) {
    return new Promise((res, rej) => {
      const names = [...STORES, 'kv'];
      const t = this.db.transaction(names, 'readwrite');
      names.forEach((n) => t.objectStore(n).clear());
      STORES.forEach((n) => (data[n] || []).forEach((o) => t.objectStore(n).put(o)));
      Object.entries(data.kv || {}).forEach(([k, v]) => t.objectStore('kv').put({ k, v }));
      t.oncomplete = res; t.onerror = () => rej(t.error);
    });
  },
};

/* =====================================================================
   Stato
   ===================================================================== */
const DEFAULT_SETTINGS = {
  studioNome: '', studioTitolo: 'Osteopata', studioPiva: '',
  defaultFee: '', defaultMethod: 'pos',
  consentText: null, proSignature: null,
  autoLockMin: 5, backupDays: 7, lastBackup: null,
};
const S = {
  settings: { ...DEFAULT_SETTINGS }, pin: null,
  patients: [], cycles: [], sessions: [], consents: [],
  ui: { view: 'patients', patientId: null, tab: 'sedute', q: '', sort: 'az', payMonth: null },
  locked: true,
};
const consentText = () => S.settings.consentText || DEFAULT_CONSENT;
async function saveSettings() { await DB.setKV('settings', S.settings); }
async function save(store, obj) {
  obj.updatedAt = new Date().toISOString();
  const list = S[store], i = list.findIndex((x) => x.id === obj.id);
  if (i < 0) list.push(obj); else list[i] = obj;
  await DB.put(store, obj);
}
async function remove(store, id) { S[store] = S[store].filter((x) => x.id !== id); await DB.del(store, id); }

const patient = (id) => S.patients.find((p) => p.id === id);
const byDateDesc = (a, b) => (b.date || '').localeCompare(a.date || '') || (b.createdAt || '').localeCompare(a.createdAt || '');
const sessionsOf = (pid) => S.sessions.filter((s) => s.patientId === pid).sort(byDateDesc);
const cycleLast = (c) => S.sessions.reduce((m, s) => (s.cycleId === c.id && s.date > m ? s.date : m), c.start || '');
// Cicli dal più recente (in base all'ultima seduta), così in cima c'è quello su cui si sta lavorando
const cyclesOf = (pid) => S.cycles.filter((c) => c.patientId === pid).sort((a, b) => cycleLast(b).localeCompare(cycleLast(a)) || (b.createdAt || '').localeCompare(a.createdAt || ''));
const sessionsOfCycle = (cid) => S.sessions.filter((s) => s.cycleId === cid).sort(byDateDesc);
const consentsOf = (pid) => S.consents.filter((c) => c.patientId === pid).sort((a, b) => b.date.localeCompare(a.date));
const unpaidOf = (pid) => S.sessions.filter((s) => s.patientId === pid && s.fee > 0 && !s.paid);
const sum = (arr) => arr.reduce((t, s) => t + (Number(s.fee) || 0), 0);
function sessionNumber(s) {
  const list = sessionsOfCycle(s.cycleId).slice().reverse();
  return list.findIndex((x) => x.id === s.id) + 1;
}

function newPatient(data) {
  return {
    id: uid(), createdAt: new Date().toISOString(),
    nome: '', cognome: '', dataNascita: '', luogoNascita: '', sesso: '', cf: '',
    telefono: '', email: '', indirizzo: '', professione: '', medico: '', inviatoDa: '', note: '',
    anamnesi: { remota: '', prossima: '', stileVita: '', interventi: '', traumi: '', terapie: '', redFlags: '' },
    ...data,
  };
}

/* =====================================================================
   PIN e blocco
   ===================================================================== */
async function hashPin(pin, saltB64, iter = 150000) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(pin), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: b64.dec(saltB64), iterations: iter }, key, 256);
  return b64.enc(bits);
}
async function setPin(pin) {
  const salt = b64.enc(crypto.getRandomValues(new Uint8Array(16)));
  S.pin = { salt, iter: 150000, hash: await hashPin(pin, salt, 150000) };
  await DB.setKV('pin', S.pin);
}
async function checkPin(pin) { return S.pin && (await hashPin(pin, S.pin.salt, S.pin.iter)) === S.pin.hash; }

const Lock = {
  lastActive: Date.now(), hiddenAt: null, fails: 0, until: 0,
  touch() { this.lastActive = Date.now(); },
  expired() { return Date.now() - this.lastActive > (S.settings.autoLockMin || 5) * 60000; },
  lock() {
    if (S.locked) return;
    flushPending();
    S.locked = true;
    closeAllOverlays();
    $('#app').innerHTML = '';
    showLock(S.pin ? 'unlock' : 'setup');
  },
};

function showLock(mode, opts = {}) {
  // mode: 'unlock' | 'setup' | 'change'
  const root = document.createElement('div');
  root.className = 'lock';
  let step = 0, first = '', entry = '';
  const LEN = 6;
  const titles = {
    unlock: ['Inserisci il PIN', 'OsteoStudio è bloccato'],
    setup: ['Crea un PIN di 6 cifre', 'Ti verrà chiesto a ogni apertura e dopo un periodo di inattività.'],
    change: ['Nuovo PIN di 6 cifre', 'Scegli il nuovo PIN.'],
  };
  function paint(msg = '', err = false) {
    const [t, sub] = step === 1 ? ['Conferma il PIN', 'Inseriscilo di nuovo.'] : titles[mode];
    root.innerHTML = `
      <div class="lock-box">
        <div class="brand"><i>O</i>OsteoStudio</div>
        <h2>${t}</h2><div class="muted small">${sub}</div>
        <div class="pins${err ? ' err' : ''}">${Array.from({ length: LEN }, (_, i) => `<i class="${i < entry.length ? 'f' : ''}"></i>`).join('')}</div>
        <div class="lock-msg">${esc(msg)}</div>
        <div class="keypad">
          ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => `<button data-d="${d}">${d}</button>`).join('')}
          ${mode === 'unlock' ? '<button class="txt" data-forgot>PIN dimenticato</button>' : mode === 'change' ? '<button class="txt" data-cancel>Annulla</button>' : '<span></span>'}
          <button data-d="0">0</button>
          <button class="txt" data-del>Cancella</button>
        </div>
      </div>`;
  }
  async function complete() {
    if (mode === 'unlock') {
      if (Date.now() < Lock.until) { entry = ''; paint(`Troppi tentativi. Riprova tra ${Math.ceil((Lock.until - Date.now()) / 1000)} secondi.`, true); return; }
      if (await checkPin(entry)) {
        Lock.fails = 0; done(); return;
      }
      Lock.fails++;
      if (Lock.fails >= 5) Lock.until = Date.now() + 30000 * Math.pow(2, Lock.fails - 5);
      entry = ''; paint('PIN errato', true); return;
    }
    if (step === 0) { first = entry; entry = ''; step = 1; paint(); return; }
    if (entry !== first) { entry = ''; first = ''; step = 0; paint('I due PIN non coincidono, riprova.', true); return; }
    await setPin(entry);
    if (mode === 'change') toast('PIN aggiornato');
    done();
  }
  function done() {
    document.removeEventListener('keydown', onKey, true);
    root.remove();
    if (mode === 'change') return;
    S.locked = false; Lock.touch();
    render();
  }
  function press(d) {
    if (entry.length >= LEN) return;
    entry += d; paint();
    if (entry.length === LEN) setTimeout(complete, 120);
  }
  function onKey(e) {
    if (!root.isConnected) return;
    if (/^\d$/.test(e.key)) { e.preventDefault(); e.stopPropagation(); press(e.key); }
    else if (e.key === 'Backspace') { e.preventDefault(); e.stopPropagation(); entry = entry.slice(0, -1); paint(); }
    else if (e.key === 'Escape' && mode === 'change') { e.preventDefault(); e.stopPropagation(); done(); }
  }
  root.addEventListener('click', async (e) => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.d !== undefined) press(b.dataset.d);
    else if (b.hasAttribute('data-del')) { entry = entry.slice(0, -1); paint(); }
    else if (b.hasAttribute('data-cancel')) done();
    else if (b.hasAttribute('data-forgot')) {
      const ok = await confirmDialog({
        title: 'PIN dimenticato',
        html: '<p>Il PIN non si può recuperare. L\'unica strada è <b>cancellare tutti i dati</b> da questo iPad e poi ripristinarli dall\'ultimo backup (ti servirà la password del backup).</p>',
        ok: 'Cancella tutti i dati', danger: true,
      });
      if (ok && await confirmDialog({ title: 'Ultima conferma', html: '<p>Pazienti, sedute, consensi e pagamenti presenti su questo iPad verranno eliminati.</p>', ok: 'Elimina tutto', danger: true })) {
        await DB.replaceAll({});
        location.reload();
      }
    }
  });
  document.addEventListener('keydown', onKey, true);
  paint();
  document.body.appendChild(root);
}

/* =====================================================================
   Finestre modali
   ===================================================================== */
function modal({ title, html = '', foot, wide = false, onMount }) {
  return new Promise((resolve) => {
    const bg = document.createElement('div');
    bg.className = 'modal-bg';
    bg.innerHTML = `<div class="modal${wide ? ' wide' : ''}" role="dialog" aria-modal="true"><h2>${esc(title)}</h2><div class="body">${html}</div><div class="foot">${foot}</div></div>`;
    const close = (v) => { document.removeEventListener('keydown', onKey, true); bg.remove(); resolve(v); };
    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(null); }
      else if (e.key === 'Enter' && !e.shiftKey && e.target.tagName !== 'TEXTAREA') {
        const ok = bg.querySelector('[data-ok]'); if (ok) { e.preventDefault(); e.stopPropagation(); ok.click(); }
      }
    };
    bg.addEventListener('pointerdown', (e) => { if (e.target === bg) close(null); });
    document.addEventListener('keydown', onKey, true);
    document.body.appendChild(bg);
    const api = { el: bg, close };
    bg.querySelector('.foot').addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.hasAttribute('data-cancel')) close(null);
    });
    onMount && onMount(api);
    const f = bg.querySelector('[autofocus]'); if (f) setTimeout(() => f.focus(), 60);
  });
}
function confirmDialog({ title, html, ok = 'Conferma', danger = false }) {
  return modal({
    title, html,
    foot: `<button class="btn" data-cancel>Annulla</button><button class="btn ${danger ? 'danger' : 'primary'}" data-ok>${esc(ok)}</button>`,
    onMount: ({ el, close }) => el.querySelector('[data-ok]').addEventListener('click', () => close(true)),
  }).then((v) => v === true);
}
/* Modale con campi: fields = [{k,label,type,value,required,placeholder,span}] */
function formDialog({ title, intro = '', fields, ok = 'Salva', validate }) {
  const html = `${intro}<div class="grid2">${fields.map((f) => `
    <label class="field ${f.span === 2 ? 'span2' : ''}"><span>${esc(f.label)}${f.required ? ' *' : ''}</span>
    ${f.type === 'textarea'
      ? `<textarea class="textarea" data-k="${f.k}" placeholder="${esc(f.placeholder || '')}" ${f.autofocus ? 'autofocus' : ''}>${esc(f.value || '')}</textarea>`
      : `<input class="input" data-k="${f.k}" type="${f.type || 'text'}" value="${esc(f.value || '')}" placeholder="${esc(f.placeholder || '')}" ${f.autofocus ? 'autofocus' : ''} ${f.type === 'password' ? 'autocomplete="new-password"' : ''} ${f.inputmode ? `inputmode="${f.inputmode}"` : ''}>`}
    </label>`).join('')}</div><div class="lock-msg" data-err style="margin:0"></div>`;
  return modal({
    title, html,
    foot: `<button class="btn" data-cancel>Annulla</button><button class="btn primary" data-ok>${esc(ok)}</button>`,
    onMount: ({ el, close }) => el.querySelector('[data-ok]').addEventListener('click', () => {
      const v = {};
      $$('[data-k]', el).forEach((i) => (v[i.dataset.k] = i.value.trim()));
      const miss = fields.find((f) => f.required && !v[f.k]);
      const err = miss ? `Compila: ${miss.label}` : validate ? validate(v) : '';
      if (err) { el.querySelector('[data-err]').textContent = err; return; }
      close(v);
    }),
  });
}

/* =====================================================================
   Render principale
   ===================================================================== */
function render() {
  if (S.locked) return;
  const u = S.ui;
  const due = backupDue();
  $('#app').innerHTML = `
    <div class="shell">
      <header class="topbar">
        <div class="brand"><i>O</i>OsteoStudio</div>
        <nav class="seg" aria-label="Sezioni">
          <button data-nav="patients" class="${u.view === 'patients' ? 'on' : ''}">Pazienti</button>
          <button data-nav="payments" class="${u.view === 'payments' ? 'on' : ''}">Pagamenti</button>
          <button data-nav="settings" class="${u.view === 'settings' ? 'on' : ''}">Impostazioni</button>
        </nav>
        <span class="spacer"></span>
        <span class="small faint kbd-hint"><kbd>⌘K</kbd> cerca · <kbd>⌥N</kbd> paziente · <kbd>⌥S</kbd> seduta</span>
        <button class="btn icon" data-act="lock" title="Blocca (⌥L)" aria-label="Blocca">${ic('lock')}</button>
      </header>
      ${due ? `<div class="banner">${ic('warn')}<span>${due}</span><button class="btn sm" data-act="backup">Fai il backup ora</button></div>` : ''}
      <div class="main" id="main"></div>
    </div>`;
  const main = $('#main');
  if (u.view === 'patients') renderPatients(main);
  else if (u.view === 'payments') renderPayments(main);
  else renderSettings(main);
}
function backupDue() {
  if (!S.patients.length) return '';
  const days = S.settings.backupDays || 7;
  if (!S.settings.lastBackup) return 'Non hai ancora fatto un backup dei dati. Salvalo sul tuo SSD esterno.';
  const age = Math.floor((Date.now() - new Date(S.settings.lastBackup)) / 86400000);
  return age >= days ? `L'ultimo backup è di ${age} giorni fa (${fmtDate(S.settings.lastBackup)}).` : '';
}

/* ---------- Pazienti ---------- */
function filteredPatients() {
  const q = S.ui.q.trim().toLowerCase();
  let list = S.patients.slice();
  if (q) {
    const words = q.split(/\s+/);
    list = list.filter((p) => {
      const hay = `${p.nome} ${p.cognome} ${p.telefono} ${p.cf} ${p.email}`.toLowerCase();
      return words.every((w) => hay.includes(w));
    });
  }
  const last = {};
  S.sessions.forEach((s) => { if (!last[s.patientId] || s.date > last[s.patientId]) last[s.patientId] = s.date; });
  if (S.ui.sort === 'recent') list.sort((a, b) => (last[b.id] || b.createdAt || '').localeCompare(last[a.id] || a.createdAt || ''));
  else list.sort((a, b) => fullName(a).localeCompare(fullName(b), 'it'));
  return { list, last };
}
function patientListHTML() {
  const { list, last } = filteredPatients();
  if (!S.patients.length) return '<div class="plist-empty">Nessun paziente.<br>Premi <b>Nuovo</b> per iniziare.</div>';
  if (!list.length) return '<div class="plist-empty">Nessun risultato.</div>';
  let letter = '';
  return list.map((p) => {
    let head = '';
    if (S.ui.sort === 'az' && !S.ui.q) {
      const l = (p.cognome || p.nome || '#')[0].toUpperCase();
      if (l !== letter) { letter = l; head = `<div class="letter">${esc(l)}</div>`; }
    }
    const age = ageOf(p.dataNascita);
    const sub = [age != null ? `${age} anni` : '', last[p.id] ? `ultima ${fmtDate(last[p.id])}` : 'nessuna seduta'].filter(Boolean).join(' · ');
    const flag = p.anamnesi?.redFlags?.trim();
    const due = unpaidOf(p.id).length;
    return `${head}<button class="pitem${p.id === S.ui.patientId ? ' on' : ''}" data-pid="${p.id}">
      <span class="av">${esc(initials(p))}</span>
      <span class="grow"><span class="nm ellipsis" style="display:block">${esc(fullName(p))}</span><span class="sub ellipsis" style="display:block">${esc(sub)}</span></span>
      ${due ? '<span class="chip warn" title="Da saldare">€</span>' : ''}
      ${flag ? '<span class="dot" title="Red flags"></span>' : ''}
    </button>`;
  }).join('');
}
function renderPatients(main) {
  main.innerHTML = `
    <aside class="plist">
      <div class="plist-head">
        <div class="row"><h2 class="grow">Pazienti <span class="faint small">${S.patients.length}</span></h2>
          <button class="btn primary sm" data-act="new-patient">${ic('plus', 18)} Nuovo</button></div>
        <label class="search">${ic('search')}<input class="input" id="q" type="search" placeholder="Cerca nome, telefono, CF" value="${esc(S.ui.q)}" autocomplete="off" autocorrect="off" spellcheck="false"><kbd>⌘K</kbd></label>
        <div class="seg" style="align-self:flex-start"><button data-sort="az" class="${S.ui.sort === 'az' ? 'on' : ''}">A–Z</button><button data-sort="recent" class="${S.ui.sort === 'recent' ? 'on' : ''}">Recenti</button></div>
      </div>
      <div class="plist-items" id="plist">${patientListHTML()}</div>
    </aside>
    <section class="content" id="detail"></section>`;
  $('#q').addEventListener('input', (e) => { S.ui.q = e.target.value; $('#plist').innerHTML = patientListHTML(); });
  $('#q').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { const first = $('#plist .pitem'); if (first) { first.click(); e.target.blur(); } }
    if (e.key === 'Escape') { e.target.value = ''; S.ui.q = ''; $('#plist').innerHTML = patientListHTML(); e.target.blur(); }
  });
  renderDetail();
}
function refreshList() { const l = $('#plist'); if (l) l.innerHTML = patientListHTML(); }

function renderDetail() {
  const box = $('#detail'); if (!box) return;
  const p = patient(S.ui.patientId);
  if (!p) {
    box.classList.add('center');
    box.innerHTML = `<div class="empty"><div class="big">${ic('user', 32)}</div><h2>Seleziona un paziente</h2>
      <p>Scegli un paziente dall'elenco oppure creane uno nuovo.</p><button class="btn primary" data-act="new-patient">${ic('plus', 18)} Nuovo paziente</button></div>`;
    return;
  }
  box.classList.remove('center');
  box.innerHTML = '<div id="dhead"></div><div id="tab"></div>';
  renderDetailHead();
  const tab = $('#tab');
  if (S.ui.tab === 'sedute') tabSessions(tab, p);
  else if (S.ui.tab === 'anagrafica') tabAnagrafica(tab, p);
  else if (S.ui.tab === 'anamnesi') tabAnamnesi(tab, p);
  else tabConsent(tab, p);
}
/* Intestazione della scheda: si aggiorna da sola senza toccare i campi in modifica. */
function renderDetailHead() {
  const box = $('#dhead'), p = patient(S.ui.patientId); if (!box || !p) return;
  const age = ageOf(p.dataNascita);
  const cons = consentsOf(p.id)[0];
  const due = unpaidOf(p.id);
  const nSess = sessionsOf(p.id).length;
  const flags = p.anamnesi?.redFlags?.trim();
  box.innerHTML = `
    <div class="phead">
      <div class="grow">
        <h1>${esc(displayName(p))}</h1>
        <div class="meta">
          ${age != null ? `<span>${age} anni${p.dataNascita ? ` · ${fmtDate(p.dataNascita)}` : ''}</span>` : ''}
          ${p.telefono ? `<a href="tel:${esc(p.telefono.replace(/\s/g, ''))}">${esc(p.telefono)}</a>` : ''}
          ${p.professione ? `<span>${esc(p.professione)}</span>` : ''}
          ${cons ? `<span class="chip ok">${ic('check', 14)} Consenso ${fmtDate(cons.date)}</span>` : '<button class="chip warn" data-act="consent">Consenso da firmare</button>'}
          ${due.length ? `<span class="chip warn">Da saldare ${eur(sum(due))}</span>` : ''}
        </div>
      </div>
      <div class="acts">
        <button class="btn" data-act="export-patient" title="Esporta cartella in PDF">${ic('doc')} PDF</button>
        <button class="btn primary" data-act="new-session">${ic('plus', 18)} Nuova seduta</button>
      </div>
    </div>
    ${flags ? `<div class="pflags"><div class="alert danger">${ic('warn')}<div><b>Controindicazioni / red flags:</b> <span class="pre">${esc(flags)}</span></div></div></div>` : ''}
    <div class="tabs" role="tablist">
      ${[['sedute', 'Sedute', nSess], ['anagrafica', 'Anagrafica'], ['anamnesi', 'Anamnesi'], ['consenso', 'Consenso', consentsOf(p.id).length]].map(([k, l, c]) =>
        `<button data-tab="${k}" class="${S.ui.tab === k ? 'on' : ''}">${l}${c ? `<span class="cnt">${c}</span>` : ''}</button>`).join('')}
    </div>`;
}

function vasChart(list) {
  const pts = list.filter((s) => s.vas != null).slice().reverse();
  if (pts.length < 2) return '';
  const W = 800, H = 150, L = 28, R = 12, T = 12, B = 26;
  const x = (i) => L + (i * (W - L - R)) / (pts.length - 1);
  const y = (v) => T + ((10 - v) * (H - T - B)) / 10;
  const grid = [0, 5, 10].map((v) => `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" stroke="var(--border)" stroke-width="1"/><text x="${L - 8}" y="${y(v) + 4}" text-anchor="end" font-size="11" fill="var(--faint)">${v}</text>`).join('');
  const path = pts.map((s, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(s.vas).toFixed(1)}`).join(' ');
  const every = Math.ceil(pts.length / 8);
  const dots = pts.map((s, i) => `<circle cx="${x(i)}" cy="${y(s.vas)}" r="4.5" fill="${vasColor(s.vas)}" stroke="var(--surface)" stroke-width="2"/>${i % every === 0 || i === pts.length - 1 ? `<text x="${x(i)}" y="${H - 6}" text-anchor="middle" font-size="11" fill="var(--faint)">${fmtDate(s.date).slice(0, 5)}</text>` : ''}`).join('');
  return `<div class="card formcard"><div class="row" style="margin-bottom:6px"><h3 class="grow">Andamento VAS</h3><span class="small muted">${pts.length} rilevazioni</span></div>
    <svg class="chart" viewBox="0 0 ${W} ${H}" >${grid}<path d="${path}" fill="none" stroke="var(--accent)" stroke-width="2.5" vector-effect="non-scaling-stroke"/>${dots}</svg></div>`;
}
function vasBadge(v) { return v == null ? '<span class="vas none">—</span>' : `<span class="vas" style="background:${vasColor(v)}">${v}</span>`; }
function payChip(s) {
  if (!(s.fee > 0)) return '';
  return s.paid ? `<span class="chip ok">${eur(s.fee)}</span>` : `<span class="chip warn">${eur(s.fee)} da saldare</span>`;
}
function tabSessions(tab, p) {
  const cycles = cyclesOf(p.id);
  if (!cycles.length) {
    tab.innerHTML = `<div class="empty" style="margin-top:40px"><div class="big">${ic('pen', 32)}</div><h2>Nessuna seduta</h2><p>Premi <b>Nuova seduta</b>: ti chiederò il motivo della consulenza e aprirò la scheda.</p></div>`;
    return;
  }
  tab.innerHTML = vasChart(sessionsOf(p.id)) + cycles.map((c) => {
    const ss = sessionsOfCycle(c.id);
    const trend = ss.filter((s) => s.vas != null).slice().reverse().map((s) => s.vas);
    return `<div class="card cycle">
      <div class="cycle-head">
        <div class="grow">
          <div class="lbl">Ciclo dal ${fmtDate(c.start)} · ${nSed(ss.length)}${ss.length ? ` · ultima ${fmtDate(ss[0].date)}` : ''}${trend.length > 1 ? ` · VAS ${trend.join(' → ')}` : ''}</div>
          <div class="mot">${esc(c.motivo || 'Motivo non indicato')}</div>
          ${c.sintomi ? `<div class="sym pre">${esc(c.sintomi)}</div>` : ''}
        </div>
        <button class="btn sm" data-act="edit-cycle" data-id="${c.id}">Modifica</button>
        <button class="btn sm danger" data-act="delete-cycle" data-id="${c.id}">${ic('trash', 16)} Elimina</button>
      </div>
      ${ss.map((s) => `<button class="sess" data-sid="${s.id}">
        <span class="when"><b>${fmtDate(s.date)}</b><span>${fmtDow(s.date)} · n° ${sessionNumber(s)}</span></span>
        ${vasBadge(s.vas)}
        <span class="txt">${s.text ? esc(s.text) : '<i class="faint">Nessuna nota</i>'}</span>
        ${s.strokes?.length ? `<canvas data-thumb="${s.id}"></canvas>` : ''}
        ${payChip(s)}
      </button>`).join('') || '<div class="sess muted small">Nessuna seduta in questo ciclo.</div>'}
    </div>`;
  }).join('') + `<button class="btn ghost" data-act="new-cycle">${ic('plus', 18)} Nuovo ciclo di trattamento</button>`;
  $$('canvas[data-thumb]', tab).forEach((cv) => {
    const s = S.sessions.find((x) => x.id === cv.dataset.thumb);
    BodyMap.render(cv, s.strokes, 64);
  });
}

const ANAGRAFICA = [
  ['nome', 'Nome'], ['cognome', 'Cognome'], ['dataNascita', 'Data di nascita', 'date'], ['luogoNascita', 'Luogo di nascita'],
  ['sesso', 'Sesso', 'select', ['', 'F', 'M', 'Altro']], ['cf', 'Codice fiscale'], ['telefono', 'Telefono', 'tel'], ['email', 'Email', 'email'],
  ['indirizzo', 'Indirizzo', 'text', null, 2], ['professione', 'Professione'], ['medico', 'Medico curante'], ['inviatoDa', 'Inviato da'],
  ['note', 'Note', 'textarea', null, 3],
];
const ANAMNESI = [
  ['redFlags', 'Controindicazioni e red flags', 'Sempre in evidenza nella scheda e nella seduta'],
  ['prossima', 'Anamnesi prossima', ''], ['remota', 'Anamnesi remota', ''],
  ['interventi', 'Interventi chirurgici', ''], ['traumi', 'Traumi e incidenti', ''],
  ['terapie', 'Terapie in corso', ''], ['stileVita', 'Stile di vita', 'Lavoro, sport, sonno, alimentazione…'],
];
function fieldHTML(path, label, type, value, opts, span) {
  const cls = span === 3 ? 'span3' : span === 2 ? 'span2' : '';
  let input;
  if (type === 'textarea') input = `<textarea class="textarea" data-bind="${path}">${esc(value)}</textarea>`;
  else if (type === 'select') input = `<select class="input" data-bind="${path}">${opts.map((o) => `<option value="${o}" ${o === value ? 'selected' : ''}>${o || '—'}</option>`).join('')}</select>`;
  else input = `<input class="input" data-bind="${path}" type="${type || 'text'}" value="${esc(value)}" ${path.endsWith('cf') ? 'autocapitalize="characters" spellcheck="false"' : ''}>`;
  return `<label class="field ${cls}"><span>${esc(label)}</span>${input}</label>`;
}
function bindPatientFields(container, p) {
  const head = debounce(renderDetailHead, 500);
  const saver = debounce(async () => { await save('patients', p); refreshList(); head(); }, 400);
  container.addEventListener('input', (e) => {
    const el = e.target.closest('[data-bind]'); if (!el) return;
    const path = el.dataset.bind.split('.');
    let o = p; for (let i = 0; i < path.length - 1; i++) o = o[path[i]] = o[path[i]] || {};
    o[path[path.length - 1]] = path[path.length - 1] === 'cf' ? el.value.toUpperCase() : el.value;
    saver();
  });
}
function tabAnagrafica(tab, p) {
  tab.innerHTML = `<div class="card formcard"><div class="grid3">${ANAGRAFICA.map(([k, l, t, o, sp]) => fieldHTML(k, l, t, p[k] || '', o, sp)).join('')}</div></div>
    <div class="row"><span class="small faint grow">Le modifiche si salvano da sole. Creato il ${fmtDate(p.createdAt)}.</span>
    <button class="btn danger sm" data-act="delete-patient">${ic('trash', 18)} Elimina paziente</button></div>`;
  bindPatientFields(tab, p);
}
function tabAnamnesi(tab, p) {
  tab.innerHTML = `<div class="card formcard"><div class="stack">${ANAMNESI.map(([k, l, ph]) =>
    `<label class="field"><span>${esc(l)}</span><textarea class="textarea" data-bind="anamnesi.${k}" placeholder="${esc(ph)}" ${k === 'redFlags' ? 'style="border-color:var(--danger-soft)"' : ''}>${esc(p.anamnesi?.[k] || '')}</textarea></label>`).join('')}</div></div>
    <div class="small faint">Le modifiche si salvano da sole.</div>`;
  bindPatientFields(tab, p);
}
function tabConsent(tab, p) {
  const list = consentsOf(p.id);
  tab.innerHTML = `
    <div class="row" style="margin-bottom:14px"><p class="muted grow" style="margin:0">Il paziente legge il consenso e firma con Apple Pencil: l'app genera il PDF e lo conserva qui.</p>
    <button class="btn primary" data-act="consent">${ic('pen')} Raccogli consenso</button></div>
    ${list.length ? `<div class="card" style="padding:6px 18px"><table class="t"><thead><tr><th>Data</th><th>Firmato da</th><th></th></tr></thead><tbody>
      ${list.map((c) => `<tr><td>${fmtDate(c.date)} <span class="faint small">${c.date.slice(11, 16)}</span></td><td>${esc(c.signer)}${c.role && c.role !== 'paziente' ? ` <span class="faint small">(${esc(c.role)})</span>` : ''}</td>
      <td class="num"><button class="btn sm" data-act="consent-pdf" data-id="${c.id}">${ic('share', 18)} PDF</button> <button class="btn sm danger" data-act="consent-del" data-id="${c.id}" aria-label="Elimina">${ic('trash', 18)}</button></td></tr>`).join('')}
    </tbody></table></div>` : '<div class="alert warn">' + ic('warn') + '<div>Nessun consenso firmato per questo paziente.</div></div>'}`;
}

/* ---------- Azioni paziente ---------- */
async function newPatientFlow() {
  const v = await formDialog({
    title: 'Nuovo paziente',
    fields: [
      { k: 'nome', label: 'Nome', required: true, autofocus: true }, { k: 'cognome', label: 'Cognome', required: true },
      { k: 'dataNascita', label: 'Data di nascita', type: 'date' }, { k: 'telefono', label: 'Telefono', type: 'tel' },
    ],
    ok: 'Crea',
  });
  if (!v) return;
  const p = newPatient(v);
  await save('patients', p);
  S.ui = { ...S.ui, view: 'patients', patientId: p.id, tab: 'sedute', q: '' };
  render();
  toast('Paziente creato');
}
async function cycleDialog(c) {
  return formDialog({
    title: c ? 'Modifica ciclo di trattamento' : 'Nuovo ciclo di trattamento',
    intro: c ? '' : '<p class="muted" style="margin:0">Motivo e sintomi restano visibili in ogni seduta del ciclo.</p>',
    fields: [
      { k: 'motivo', label: 'Motivo della consulenza', value: c?.motivo, required: true, autofocus: true, span: 2, placeholder: 'Es. lombalgia dopo sforzo' },
      { k: 'sintomi', label: 'Sintomi', type: 'textarea', value: c?.sintomi, span: 2, placeholder: 'Sede, caratteristiche, insorgenza, fattori che peggiorano o alleviano…' },
      { k: 'start', label: 'Inizio', type: 'date', value: c?.start || todayISO() },
    ],
  });
}
async function newCycle(pid) {
  const v = await cycleDialog(null);
  if (!v) return null;
  const c = { id: uid(), patientId: pid, createdAt: new Date().toISOString(), motivo: v.motivo, sintomi: v.sintomi, start: v.start || todayISO() };
  await save('cycles', c);
  return c;
}
/* Chiede a quale ciclo appartiene la seduta: il più recente è già selezionato (Invio),
   oppure si apre un nuovo ciclo. Se il paziente non ha cicli si passa subito al nuovo ciclo. */
async function chooseCycle(p, { title = 'Nuova seduta', currentId = null } = {}) {
  const cycles = cyclesOf(p.id);
  if (!cycles.length) return newCycle(p.id);
  const pick = await modal({
    title,
    html: `<p class="muted" style="margin:0">A quale ciclo di trattamento appartiene la seduta?</p>
      <div class="choices">
        ${cycles.map((c, i) => {
          const n = sessionsOfCycle(c.id).length;
          return `<button class="choice${c.id === currentId ? ' cur' : ''}" data-c="${c.id}" ${(currentId ? c.id === currentId : i === 0) ? 'autofocus' : ''}>
            <span class="grow"><b>${esc(c.motivo || 'Motivo non indicato')}</b>
            <span class="small muted" style="display:block">dal ${fmtDate(c.start)} · ${nSed(n)}${n ? ` · ultima ${fmtDate(cycleLast(c))}` : ''}</span></span>
            ${c.id === currentId ? '<span class="chip">attuale</span>' : i === 0 ? '<span class="chip accent">più recente</span>' : ''}</button>`;
        }).join('')}
        <button class="choice new" data-c="new">${ic('plus', 18)}<span class="grow"><b>Nuovo ciclo</b><span class="small muted" style="display:block">Nuovo motivo di consulenza</span></span></button>
      </div>`,
    foot: '<button class="btn" data-cancel>Annulla</button>',
    onMount: ({ el, close }) => el.querySelector('.choices').addEventListener('click', (e) => { const b = e.target.closest('[data-c]'); if (b) close(b.dataset.c); }),
  });
  if (!pick) return null;
  if (pick === 'new') return newCycle(p.id);
  return S.cycles.find((c) => c.id === pick) || null;
}
async function newSessionFlow() {
  const p = patient(S.ui.patientId); if (!p) return;
  const c = await chooseCycle(p);
  if (!c) return;
  const s = {
    id: uid(), patientId: p.id, cycleId: c.id, createdAt: new Date().toISOString(),
    date: todayISO(), vas: null, text: '', strokes: [],
    fee: parseAmount(S.settings.defaultFee), method: METHODS[S.settings.defaultMethod] ? S.settings.defaultMethod : 'pos', paid: false,
  };
  await save('sessions', s);
  S.ui.tab = 'sedute';
  openSession(s.id, true);
}

/* =====================================================================
   Editor seduta (schermo intero)
   ===================================================================== */
let current = null; // overlay corrente {el, close}
function closeAllOverlays() { if (current) current.close(true); $$('.modal-bg').forEach((m) => m.remove()); }

function openSession(sid, isNew = false) {
  const s = S.sessions.find((x) => x.id === sid); if (!s) return;
  const p = patient(s.patientId), c = S.cycles.find((x) => x.id === s.cycleId);
  const el = document.createElement('div');
  el.className = 'full';
  let pane = 'hist', mapEd = null;
  // Prezzo applicato a questo paziente nella seduta precedente (promemoria, i prezzi variano da paziente a paziente)
  const prevPaid = S.sessions.filter((x) => x.patientId === s.patientId && x.id !== s.id && x.fee > 0)
    .sort(byDateDesc).filter((x, _, a) => x.date <= s.date || a.every((y) => y.date > s.date));
  const last = prevPaid.length ? prevPaid[0].fee : null;
  const saver = debounce(() => save('sessions', s), 350);

  el.innerHTML = `
    <div class="full-bar">
      <button class="btn" data-x="close">${ic('back')} Fatto</button>
      <div class="ttl"><b>${esc(displayName(p))} · seduta n° ${sessionNumber(s)}</b><span>${esc(c?.motivo || '')}</span></div>
      <span class="small faint">Salvataggio automatico · <kbd>⌘↩</kbd> chiudi</span>
      <button class="btn danger" data-x="delete">${ic('trash')} Elimina seduta</button>
    </div>
    <div class="full-body">
      <div class="ed-left">
        <div class="row"><label class="field" style="width:190px"><span>Data</span><input class="input" type="date" data-f="date" value="${s.date}"></label>
          <span class="grow"></span>${p.anamnesi?.redFlags?.trim() ? `<span class="chip danger" title="${esc(p.anamnesi.redFlags)}">${ic('warn', 14)} Red flags</span>` : ''}</div>
        <div class="field"><span>VAS (dolore 0–10) <span class="faint" data-vaslbl>${s.vas == null ? 'non rilevato' : ''}</span></span>
          <div class="vasrow">${Array.from({ length: 11 }, (_, i) => `<button data-vas="${i}" style="color:${vasColor(i)}" class="${s.vas === i ? 'on' : ''}">${i}</button>`).join('')}</div></div>
        <label class="field grow" style="display:flex"><span>Note della seduta</span>
          <textarea class="textarea notes" data-f="text" placeholder="Valutazione, test, trattamento eseguito, risposta del paziente, indicazioni…">${esc(s.text)}</textarea></label>
        <div class="payrow">
          <label class="field"><span class="row" style="gap:8px">Importo €${last != null ? `<button type="button" class="lastfee" data-x="lastfee" title="Prezzo dell'ultima seduta: tocca per usarlo">${String(last).replace('.', ',')}</button>` : ''}</span><input class="input" data-f="fee" inputmode="decimal" value="${s.fee ?? ''}" placeholder="0"></label>
          <label class="field"><span>Metodo</span><div class="seg" data-method>${Object.entries(METHODS).map(([k, l]) => `<button data-m="${k}" class="${s.method === k ? 'on' : ''}">${l.split(' ')[0]}</button>`).join('')}</div></label>
          <button class="toggle${s.paid ? ' on' : ''}" data-x="paid"><span class="sw"></span>Pagata</button>
        </div>
      </div>
      <div class="ed-right">
        <div class="seg"><button data-pane="hist" class="on">Storico del ciclo</button><button data-pane="map">Mappa corporea${s.strokes?.length ? ' •' : ''}</button></div>
        <div class="ed-pane" id="edpane"></div>
      </div>
    </div>`;

  function histHTML() {
    const prev = sessionsOfCycle(s.cycleId).filter((x) => x.id !== s.id);
    const trend = sessionsOfCycle(s.cycleId).filter((x) => x.vas != null).slice().reverse();
    const others = cyclesOf(p.id).filter((x) => x.id !== s.cycleId);
    return `<div class="hist">
      <div class="box"><div class="h"><span class="lbl grow">Motivo della consulenza</span><button class="btn sm ghost" data-x="move-cycle">Cambia ciclo</button><button class="btn sm ghost" data-x="edit-cycle">Modifica</button></div>
        <div style="font-weight:650;font-size:16.5px">${esc(c?.motivo || '—')}</div>
        ${c?.sintomi ? `<div class="lbl" style="margin-top:10px">Sintomi</div><div class="pre">${esc(c.sintomi)}</div>` : ''}
        ${trend.length > 1 ? `<div class="lbl" style="margin-top:10px">VAS nel ciclo</div><div class="trend">${trend.map((x) => vasBadge(x.vas)).join('<span class="faint">→</span>')}</div>` : ''}
      </div>
      ${p.anamnesi?.redFlags?.trim() ? `<div class="alert danger">${ic('warn')}<div><b>Red flags:</b> <span class="pre">${esc(p.anamnesi.redFlags)}</span></div></div>` : ''}
      ${p.anamnesi?.terapie?.trim() ? `<div class="box"><div class="lbl">Terapie in corso</div><div class="pre">${esc(p.anamnesi.terapie)}</div></div>` : ''}
      ${prev.length ? prev.map((x) => `<div class="box"><div class="h"><b>${fmtDate(x.date)} · n° ${sessionNumber(x)}</b>${vasBadge(x.vas)}</div>
        <div class="pre muted">${x.text ? esc(x.text) : '<i>Nessuna nota</i>'}</div>
        ${x.strokes?.length ? `<canvas data-thumb="${x.id}" style="margin-top:8px;border-radius:8px"></canvas>` : ''}</div>`).join('')
        : '<div class="muted small" style="padding:6px 2px">Prima seduta di questo ciclo.</div>'}
      ${others.length ? `<div class="lbl" style="margin-top:8px">Cicli precedenti</div>${others.map((o) => `<div class="box small"><b>${fmtDate(o.start)}</b> · ${esc(o.motivo)} <span class="faint">(${nSed(sessionsOfCycle(o.id).length)})</span></div>`).join('')}` : ''}
    </div>`;
  }
  function showPane() {
    const box = $('#edpane', el);
    if (mapEd) { mapEd.destroy(); mapEd = null; }
    $$('[data-pane]', el).forEach((b) => b.classList.toggle('on', b.dataset.pane === pane));
    if (pane === 'hist') {
      box.style.display = '';
      box.innerHTML = histHTML();
      $$('canvas[data-thumb]', box).forEach((cv) => BodyMap.render(cv, S.sessions.find((x) => x.id === cv.dataset.thumb).strokes, 220));
    } else {
      box.style.display = 'flex';
      mapEd = BodyMap.editor(box, s.strokes, (strokes) => {
        s.strokes = strokes; saver.flush();
        $('[data-pane="map"]', el).textContent = 'Mappa corporea' + (strokes.length ? ' •' : '');
      });
    }
  }

  el.addEventListener('input', (e) => {
    const f = e.target.dataset.f; if (!f) return;
    if (f === 'fee') s.fee = parseAmount(e.target.value);
    else if (f === 'date') { if (e.target.value) s.date = e.target.value; }
    else s[f] = e.target.value;
    saver();
  });
  el.addEventListener('click', async (e) => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.vas !== undefined) {
      const v = +b.dataset.vas; s.vas = s.vas === v ? null : v;
      $$('[data-vas]', el).forEach((x) => x.classList.toggle('on', +x.dataset.vas === s.vas));
      $('[data-vaslbl]', el).textContent = s.vas == null ? 'non rilevato' : '';
      saver.flush();
      if (pane === 'hist') showPane();
    } else if (b.dataset.m) {
      s.method = b.dataset.m; $$('[data-m]', el).forEach((x) => x.classList.toggle('on', x === b)); saver.flush();
    } else if (b.dataset.pane) { pane = b.dataset.pane; showPane(); }
    else if (b.dataset.x === 'lastfee') {
      e.preventDefault();
      s.fee = last; $('[data-f="fee"]', el).value = String(last).replace('.', ','); saver.flush();
    }
    else if (b.dataset.x === 'paid') { s.paid = !s.paid; b.classList.toggle('on', s.paid); saver.flush(); }
    else if (b.dataset.x === 'close') close();
    else if (b.dataset.x === 'move-cycle') {
      const to = await chooseCycle(p, { title: 'Sposta la seduta', currentId: s.cycleId });
      if (!to || to.id === s.cycleId) return;
      s.cycleId = to.id; saver.flush();
      close(true); openSession(s.id);
      toast(`Seduta spostata in: ${to.motivo}`);
    }
    else if (b.dataset.x === 'edit-cycle' && c) {
      const v = await cycleDialog(c); if (!v) return;
      Object.assign(c, v); await save('cycles', c);
      $('.ttl span', el).textContent = c.motivo; showPane();
    } else if (b.dataset.x === 'delete') {
      if (await confirmDialog({ title: 'Elimina seduta', html: `<p>Eliminare la seduta del ${fmtDate(s.date)}? Note, VAS, mappa e pagamento andranno persi.</p>`, ok: 'Elimina', danger: true })) {
        saver.cancel();
        await remove('sessions', s.id);
        close(true, true);
        toast('Seduta eliminata');
      }
    }
  });
  function onKey(e) {
    if (document.querySelector('.modal-bg')) return;
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); close(); }
    else if (e.key === 'Escape' && !e.target.matches('textarea,input')) { e.preventDefault(); close(); }
    else if (e.key === 'Escape') e.target.blur();
  }
  function close(silent, deleted) {
    document.removeEventListener('keydown', onKey);
    if (!deleted) saver.flush();
    if (mapEd) mapEd.destroy();
    el.remove(); current = null;
    if (!S.locked) render();
    if (!silent && !deleted && isNew && !s.text && s.vas == null && !s.strokes.length) toast('Seduta salvata (vuota)');
  }
  document.addEventListener('keydown', onKey);
  $('#overlay-root').appendChild(el);
  current = { el, close };
  showPane();
  if (isNew) setTimeout(() => $('[data-f="text"]', el).focus(), 80);
}

/* =====================================================================
   Consenso informato con firma
   ===================================================================== */
function signaturePad(host) {
  host.innerHTML = '<canvas></canvas><button class="btn sm clear" type="button">Pulisci</button><span class="hint">Firma qui</span>';
  const cv = host.querySelector('canvas'), ctx = cv.getContext('2d');
  let drawing = false, has = false, last = null, penSeen = false;
  function size() {
    const r = host.getBoundingClientRect(); const d = 2;
    cv.width = Math.round(r.width * d); cv.height = Math.round(r.height * d);
    ctx.setTransform(d, 0, 0, d, 0, 0); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#10223a';
    has = false;
  }
  const pos = (e) => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  cv.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'pen') penSeen = true; else if (penSeen && e.pointerType === 'touch') return;
    e.preventDefault(); cv.setPointerCapture(e.pointerId); drawing = true; last = pos(e);
    ctx.beginPath(); ctx.arc(last[0], last[1], 1.2, 0, Math.PI * 2); ctx.fillStyle = '#10223a'; ctx.fill(); has = true;
    host.querySelector('.hint').style.display = 'none';
  });
  cv.addEventListener('pointermove', (e) => {
    if (!drawing) return;
    for (const ev of (e.getCoalescedEvents ? e.getCoalescedEvents() : [e])) {
      const p = pos(ev);
      ctx.lineWidth = 1.4 + 2.2 * (ev.pointerType === 'pen' ? (ev.pressure || 0.5) : 0.5);
      ctx.beginPath(); ctx.moveTo(last[0], last[1]); ctx.lineTo(p[0], p[1]); ctx.stroke();
      last = p;
    }
  });
  const end = () => { drawing = false; };
  cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
  host.querySelector('.clear').addEventListener('click', () => { ctx.clearRect(0, 0, cv.width, cv.height); has = false; host.querySelector('.hint').style.display = ''; });
  requestAnimationFrame(size);
  return {
    isEmpty: () => !has,
    toJPEG() {
      const out = document.createElement('canvas'); out.width = cv.width; out.height = cv.height;
      const o = out.getContext('2d'); o.fillStyle = '#fff'; o.fillRect(0, 0, out.width, out.height); o.drawImage(cv, 0, 0);
      return { url: out.toDataURL('image/jpeg', 0.9), w: out.width, h: out.height };
    },
  };
}
function consentVars(p, signer, role) {
  const st = S.settings;
  const pname = displayName(p);
  return {
    paziente: pname,
    dichiarante: role === 'paziente' || !role ? signer || pname : `${signer}, in qualità di ${role} di ${pname},`,
    professionista: st.studioNome, titolo: st.studioTitolo, data: fmtDate(todayISO()),
  };
}
function consentBodyHTML(text) {
  let html = '', inList = false;
  Consent.blocks(text).forEach((b) => {
    if (b.type === 'li' && !inList) { html += '<ul>'; inList = true; }
    if (b.type !== 'li' && inList) { html += '</ul>'; inList = false; }
    html += b.type === 'h' ? `<h3>${esc(b.text)}</h3>` : b.type === 'li' ? `<li>${esc(b.text)}</li>` : `<p>${esc(b.text)}</p>`;
  });
  return html + (inList ? '</ul>' : '');
}
function patientLine(p) {
  const bits = [`<b>${esc(displayName(p))}</b>`];
  if (p.dataNascita) bits.push(`nato/a${p.luogoNascita ? ' a ' + esc(p.luogoNascita) : ''} il ${fmtDate(p.dataNascita)}`);
  if (p.cf) bits.push(`C.F. ${esc(p.cf)}`);
  return bits.join(' · ');
}
async function openConsent(p) {
  if (!S.settings.studioNome) {
    if (await confirmDialog({ title: 'Mancano i dati dello studio', html: '<p>Per il consenso servono almeno il tuo nome e il titolo. Li inserisci ora nelle Impostazioni?</p>', ok: 'Vai alle Impostazioni' })) {
      S.ui.view = 'settings'; render();
    }
    return;
  }
  const minor = (ageOf(p.dataNascita) ?? 99) < 18;
  const el = document.createElement('div');
  el.className = 'full';
  let role = minor ? 'genitore' : 'paziente';
  let signer = minor ? '' : displayName(p);
  const st = S.settings;
  el.innerHTML = `
    <div class="full-bar">
      <button class="btn" data-x="close">${ic('back')} Annulla</button>
      <div class="ttl"><b>Consenso informato · ${esc(displayName(p))}</b><span>Fai leggere il testo al paziente, poi fallo firmare in fondo</span></div>
      <button class="btn primary" data-x="sign">${ic('check')} Firma e salva</button>
    </div>
    <div class="consent-body">
      <div class="doc">
        <div class="dh"><b>${esc(st.studioNome)}</b><div class="muted">${esc(st.studioTitolo)}${st.studioPiva ? ` · P.IVA ${esc(st.studioPiva)}` : ''}</div></div>
        <p>Paziente: ${patientLine(p)}</p>
        <div class="grid2" style="margin:14px 0 6px">
          <label class="field"><span>Chi firma</span><div class="seg" data-role>
            ${['paziente', 'genitore', 'tutore'].map((r) => `<button data-r="${r}" class="${r === role ? 'on' : ''}">${r[0].toUpperCase() + r.slice(1)}</button>`).join('')}</div></label>
          <label class="field"><span>Nome e cognome di chi firma</span><input class="input" data-signer value="${esc(signer)}" ${role === 'paziente' ? 'readonly' : ''}></label>
        </div>
        <div data-text></div>
        <p style="margin-top:18px">Data: <b>${fmtDate(todayISO())}</b></p>
        <div class="sigs">
          <div><div class="small muted" style="margin-bottom:6px">Firma di <span data-signame>${esc(signer || 'chi firma')}</span></div><div class="sigpad" data-pad></div></div>
          <div><div class="small muted" style="margin-bottom:6px">Firma del professionista</div>
            ${st.proSignature ? `<div class="sigimg"><img src="${st.proSignature.url}" alt="Firma del professionista"></div>` : '<div class="sigpad" data-pro></div>'}</div>
        </div>
      </div>
    </div>`;
  const textBox = $('[data-text]', el);
  const paint = () => { textBox.innerHTML = consentBodyHTML(Consent.fill(consentText(), consentVars(p, signer, role))); $('[data-signame]', el).textContent = signer || 'chi firma'; };
  paint();
  $('#overlay-root').appendChild(el);
  const pad = signaturePad($('[data-pad]', el));
  const proPad = st.proSignature ? null : signaturePad($('[data-pro]', el));
  const close = () => { document.removeEventListener('keydown', onKey); el.remove(); current = null; if (!S.locked) render(); };
  const onKey = (e) => { if (e.key === 'Escape' && !document.querySelector('.modal-bg')) close(); };
  document.addEventListener('keydown', onKey);
  current = { el, close };
  $('[data-signer]', el).addEventListener('input', (e) => { signer = e.target.value.trim(); paint(); });
  el.addEventListener('click', async (e) => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.r) {
      role = b.dataset.r;
      $$('[data-r]', el).forEach((x) => x.classList.toggle('on', x === b));
      const inp = $('[data-signer]', el);
      inp.readOnly = role === 'paziente';
      if (role === 'paziente') { signer = displayName(p); inp.value = signer; } else if (signer === displayName(p)) { signer = ''; inp.value = ''; inp.focus(); }
      paint();
    } else if (b.dataset.x === 'close') close();
    else if (b.dataset.x === 'sign') {
      if (!signer) { toast('Indica il nome di chi firma'); $('[data-signer]', el).focus(); return; }
      if (pad.isEmpty()) { toast('Manca la firma'); return; }
      const sig = pad.toJPEG();
      let pro = st.proSignature;
      if (!pro && proPad && !proPad.isEmpty()) pro = proPad.toJPEG();
      const c = {
        id: uid(), patientId: p.id, date: localDateTime(), createdAt: new Date().toISOString(),
        signer, role,
        header: { nome: st.studioNome, titolo: st.studioTitolo, piva: st.studioPiva },
        patientText: patientLine(p).replace(/<[^>]+>/g, ''),
        text: Consent.fill(consentText(), consentVars(p, signer, role)),
        sig, pro: pro || null,
      };
      await save('consents', c);
      close();
      toast('Consenso firmato e salvato');
      shareFile(consentPDF(c), `Consenso ${fullName(p)} ${c.date.slice(0, 10)}.pdf`, 'application/pdf');
    }
  });
}
function localDateTime() { const d = new Date(); return `${todayISO()}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`; }

function pdfHeader(doc, h) {
  doc.text(h.nome || '', { size: 15, bold: true, lead: 1.2 });
  const sub = [h.titolo, h.piva ? `P.IVA ${h.piva}` : ''].filter(Boolean).join(' · ');
  if (sub) doc.text(sub, { size: 10, color: [0.35, 0.4, 0.38] });
  doc.rule([0.17, 0.43, 0.39], 1, 6, 14);
}
function pdfBlocks(doc, text) {
  Consent.blocks(text).forEach((b) => {
    if (b.type === 'h') { doc.space(8); doc.text(b.text, { size: 12.5, bold: true, after: 4 }); }
    else if (b.type === 'li') doc.text(b.text, { indent: 14, bullet: true, after: 3 });
    else doc.text(b.text, { after: 5 });
  });
}
function consentPDF(c) {
  const doc = new PDF.Doc({ footer: `Consenso informato firmato il ${fmtDate(c.date)} alle ${c.date.slice(11, 16)}` });
  pdfHeader(doc, c.header);
  doc.text(`Paziente: ${c.patientText}`, { size: 10.5, bold: true, after: 8 });
  pdfBlocks(doc, c.text);
  doc.space(10);
  doc.text(`Data: ${fmtDate(c.date)}`, { after: 6 });
  const boxW = (doc.w - 24) / 2, boxH = 92;
  doc.ensure(boxH + 40);
  const top = doc.y;
  const lbl = (x, s) => doc.raw(x, top - 10, PDF.encode(s), 9, false, [0.35, 0.4, 0.38]);
  lbl(doc.m.l, `Firma di ${c.signer}${c.role && c.role !== 'paziente' ? ` (${c.role})` : ''}`);
  lbl(doc.m.l + boxW + 24, `Firma del professionista – ${c.header.nome}`);
  const place = (img, x) => {
    doc.strokeRect(x, top - 16, boxW, boxH);
    if (!img) return;
    const idx = doc.addJPEG(img.url, img.w, img.h);
    const r = Math.min((boxW - 10) / img.w, (boxH - 10) / img.h);
    const w = img.w * r, h = img.h * r;
    doc.imageAt(idx, x + (boxW - w) / 2, top - 16 - (boxH - h) / 2, w, h);
  };
  place(c.sig, doc.m.l);
  place(c.pro, doc.m.l + boxW + 24);
  doc.y = top - 16 - boxH - 10;
  return doc.output();
}

/* ---------- Cartella paziente in PDF ---------- */
function patientPDF(p) {
  const st = S.settings;
  const doc = new PDF.Doc({ footer: `Cartella di ${displayName(p)} · esportata il ${fmtDate(todayISO())}` });
  pdfHeader(doc, { nome: st.studioNome || 'OsteoStudio', titolo: st.studioTitolo, piva: st.studioPiva });
  doc.text(displayName(p), { size: 18, bold: true, lead: 1.3, after: 4 });
  const section = (t) => { doc.space(10); doc.text(t.toUpperCase(), { size: 9.5, bold: true, color: [0.17, 0.43, 0.39], after: 2 }); doc.rule(undefined, 0.5, 2, 6); };
  const kv = (k, v) => { if (v && String(v).trim()) { doc.text(k, { size: 9, color: [0.4, 0.45, 0.43], lead: 1.3 }); doc.text(String(v), { after: 4 }); } };
  section('Anagrafica');
  const age = ageOf(p.dataNascita);
  kv('Data e luogo di nascita', [p.dataNascita ? fmtDate(p.dataNascita) + (age != null ? ` (${age} anni)` : '') : '', p.luogoNascita].filter(Boolean).join(' – '));
  [['Sesso', p.sesso], ['Codice fiscale', p.cf], ['Telefono', p.telefono], ['Email', p.email], ['Indirizzo', p.indirizzo], ['Professione', p.professione], ['Medico curante', p.medico], ['Inviato da', p.inviatoDa], ['Note', p.note]].forEach(([k, v]) => kv(k, v));
  if (ANAMNESI.some(([k]) => p.anamnesi?.[k]?.trim())) { section('Anamnesi'); ANAMNESI.forEach(([k, l]) => kv(l, p.anamnesi?.[k])); }
  const cons = consentsOf(p.id);
  section('Consenso informato');
  doc.text(cons.length ? cons.map((c) => `Firmato il ${fmtDate(c.date)} da ${c.signer}${c.role !== 'paziente' ? ` (${c.role})` : ''}`).join('\n') : 'Nessun consenso firmato registrato.', { after: 4 });
  cyclesOf(p.id).slice().reverse().forEach((c) => {
    section(`Ciclo dal ${fmtDate(c.start)}`);
    kv('Motivo della consulenza', c.motivo);
    kv('Sintomi', c.sintomi);
    sessionsOfCycle(c.id).slice().reverse().forEach((s, i) => {
      doc.space(6);
      const mapW = 220, mapH = s.strokes?.length ? mapW * BodyMap.H / BodyMap.W + 16 : 0;
      doc.ensure(Math.min(60 + mapH, doc.ph - doc.m.t - doc.m.b)); // titolo e mappa sulla stessa pagina
      doc.text(`Seduta n° ${i + 1} – ${fmtDateLong(s.date)}${s.vas != null ? `   ·   VAS ${s.vas}/10` : ''}`, { bold: true, size: 11, after: 2 });
      if (s.text) doc.text(s.text, { after: 4 });
      if (s.strokes?.length) {
        const img = BodyMap.toJPEG(s.strokes, 600);
        const w = mapW, h = w * img.h / img.w;
        doc.space(4);
        doc.image(doc.addJPEG(img.url, img.w, img.h), w, h);
        doc.text('Rosso: dolore · Arancio: tensione · Blu: zona trattata', { size: 8, color: [0.45, 0.5, 0.48], after: 4 });
      }
    });
  });
  return doc.output();
}

/* =====================================================================
   Pagamenti
   ===================================================================== */
function renderPayments(main) {
  const now = todayISO().slice(0, 7);
  const m = S.ui.payMonth || now;
  const [Y, M] = m.split('-').map(Number);
  const inMonth = S.sessions.filter((s) => s.date.startsWith(m) && s.fee > 0).sort((a, b) => b.date.localeCompare(a.date));
  const paid = inMonth.filter((s) => s.paid), unpaid = inMonth.filter((s) => !s.paid);
  const year = S.sessions.filter((s) => s.date.startsWith(String(Y)) && s.fee > 0 && s.paid);
  const byMethod = {}; paid.forEach((s) => (byMethod[s.method] = (byMethod[s.method] || 0) + s.fee));
  const allUnpaid = S.sessions.filter((s) => s.fee > 0 && !s.paid);
  const groups = {}; allUnpaid.forEach((s) => (groups[s.patientId] = groups[s.patientId] || []).push(s));
  const pn = (id) => { const p = patient(id); return p ? fullName(p) : '—'; };
  main.innerHTML = `<section class="content"><div style="max-width:1000px;margin:0 auto">
    <div class="row" style="margin-bottom:16px">
      <h1 class="grow">Pagamenti</h1>
      <button class="btn icon" data-month="-1" aria-label="Mese precedente">‹</button>
      <h2 style="min-width:170px;text-align:center">${MONTHS[M - 1]} ${Y}</h2>
      <button class="btn icon" data-month="1" aria-label="Mese successivo">›</button>
      ${m !== now ? '<button class="btn sm" data-month="0">Oggi</button>' : ''}
      <button class="btn sm" data-act="csv">${ic('share', 18)} CSV</button>
    </div>
    <div class="stats">
      <div class="card stat"><div class="k">Incassato nel mese</div><div class="v">${eur(sum(paid))}</div><div class="s">${nSed(paid.length)} ${paid.length === 1 ? 'pagata' : 'pagate'}</div></div>
      <div class="card stat"><div class="k">Da incassare nel mese</div><div class="v" style="color:${unpaid.length ? 'var(--warn)' : 'inherit'}">${eur(sum(unpaid))}</div><div class="s">${nSed(unpaid.length)}</div></div>
      <div class="card stat"><div class="k">Per metodo</div><div class="s" style="font-size:14px;color:var(--text);margin-top:6px">${Object.keys(byMethod).length ? Object.entries(byMethod).map(([k, v]) => `${methodLabel(k)}: <b>${eur(v)}</b>`).join('<br>') : '—'}</div></div>
      <div class="card stat"><div class="k">Incassato nel ${Y}</div><div class="v">${eur(sum(year))}</div><div class="s">${nSed(year.length)}</div></div>
    </div>
    <div class="card formcard" style="padding:8px 18px">
      ${inMonth.length ? `<table class="t"><thead><tr><th>Data</th><th>Paziente</th><th>Metodo</th><th class="num">Importo</th><th class="num">Stato</th></tr></thead><tbody>
      ${inMonth.map((s) => `<tr><td>${fmtDate(s.date)}</td><td><button class="linkbtn" data-open-patient="${s.patientId}">${esc(pn(s.patientId))}</button></td>
        <td class="muted">${methodLabel(s.method)}</td><td class="num">${eur(s.fee)}</td>
        <td class="num"><button class="chip ${s.paid ? 'ok' : 'warn'}" data-pay="${s.id}">${s.paid ? 'Pagata' : 'Da saldare'}</button></td></tr>`).join('')}
      </tbody></table>` : '<div class="muted" style="padding:16px 0">Nessuna seduta con importo in questo mese.</div>'}
    </div>
    <h2 style="margin:22px 0 10px">Da saldare (tutti i mesi)</h2>
    ${Object.keys(groups).length ? `<div class="card" style="padding:8px 18px"><table class="t"><tbody>
      ${Object.entries(groups).sort((a, b) => pn(a[0]).localeCompare(pn(b[0]), 'it')).map(([pid, list]) => `<tr>
        <td><button class="linkbtn" data-open-patient="${pid}">${esc(pn(pid))}</button><div class="small faint">${list.map((s) => fmtDate(s.date)).join(', ')}</div></td>
        <td class="num"><b>${eur(sum(list))}</b></td>
        <td class="num"><button class="btn sm" data-payall="${pid}">${ic('check', 18)} Segna tutto pagato</button></td></tr>`).join('')}
    </tbody></table></div>` : '<div class="muted">Nessun pagamento in sospeso. 👍</div>'}
  </div></section>`;
}
async function togglePaid(sid) { const s = S.sessions.find((x) => x.id === sid); if (!s) return; s.paid = !s.paid; await save('sessions', s); render(); }
function exportCSV() {
  const m = S.ui.payMonth || todayISO().slice(0, 7);
  const rows = [['Data', 'Cognome', 'Nome', 'Codice fiscale', 'Importo', 'Metodo', 'Stato']];
  S.sessions.filter((s) => s.date.startsWith(m) && s.fee > 0).sort((a, b) => a.date.localeCompare(b.date)).forEach((s) => {
    const p = patient(s.patientId) || {};
    rows.push([fmtDate(s.date), p.cognome, p.nome, p.cf, String(s.fee).replace('.', ','), methodLabel(s.method), s.paid ? 'Pagata' : 'Da saldare']);
  });
  const csv = '﻿' + rows.map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(';')).join('\r\n');
  shareFile(new Blob([csv], { type: 'text/csv' }), `Incassi ${m}.csv`, 'text/csv');
}

/* =====================================================================
   Impostazioni e backup
   ===================================================================== */
function renderSettings(main) {
  const st = S.settings;
  main.innerHTML = `<section class="content"><div class="settings">
    <h1 style="margin-bottom:18px">Impostazioni</h1>

    <div class="card"><h2>Studio</h2><p class="muted">Compaiono nell'intestazione del consenso e della cartella PDF.</p>
      <div class="grid3">
        <label class="field"><span>Nome e cognome</span><input class="input" data-set="studioNome" value="${esc(st.studioNome)}"></label>
        <label class="field"><span>Titolo</span><input class="input" data-set="studioTitolo" value="${esc(st.studioTitolo)}"></label>
        <label class="field"><span>P.IVA</span><input class="input" data-set="studioPiva" value="${esc(st.studioPiva)}" inputmode="numeric"></label>
      </div>
      <div class="row" style="margin-top:16px"><div class="grow"><b>Firma del professionista</b><div class="small muted">Disegnala una volta: verrà aggiunta a ogni consenso.</div></div>
        ${st.proSignature ? `<img src="${st.proSignature.url}" alt="" style="height:50px;background:#fff;border-radius:8px;border:1px solid var(--border)">` : ''}
        <button class="btn sm" data-act="pro-sign">${st.proSignature ? 'Rifai' : 'Disegna firma'}</button>
        ${st.proSignature ? '<button class="btn sm danger" data-act="pro-sign-del">Rimuovi</button>' : ''}</div>
    </div>

    <div class="card"><h2>Sedute</h2><p class="muted">Valori proposti a ogni nuova seduta.</p>
      <div class="grid3">
        <label class="field"><span>Importo predefinito €</span><input class="input" data-set="defaultFee" value="${esc(st.defaultFee)}" inputmode="decimal" placeholder="Es. 60"></label>
        <label class="field span2"><span>Metodo predefinito</span><div class="seg" data-defmethod>${Object.entries(METHODS).map(([k, l]) => `<button data-dm="${k}" class="${st.defaultMethod === k ? 'on' : ''}">${l}</button>`).join('')}</div></label>
      </div>
    </div>

    <div class="card"><h2>Testo del consenso informato</h2>
      <p class="muted">Bozza impostata su L. 219/2017, L. 3/2018 e artt. 9 e 13 GDPR: <b>falla verificare</b> da un consulente o dalla tua associazione. Righe che iniziano con <code># </code> = titolo, con <code>- </code> = elenco. Segnaposto: <code>{{dichiarante}}</code> <code>{{paziente}}</code> <code>{{professionista}}</code> <code>{{titolo}}</code> <code>{{data}}</code>. I consensi già firmati non cambiano.</p>
      <textarea class="textarea consent-editor" id="consentText" spellcheck="true">${esc(consentText())}</textarea>
      <div class="row" style="margin-top:10px"><span class="small faint grow" id="consentSaved">${st.consentText ? 'Testo personalizzato' : 'Testo predefinito'}</span>
        <button class="btn sm" data-act="consent-preview">Anteprima PDF</button>
        <button class="btn sm" data-act="consent-reset">Ripristina predefinito</button></div>
    </div>

    <div class="card"><h2>Sicurezza</h2><p class="muted">Il PIN impedisce l'accesso all'app; la vera protezione dei dati è il codice/Face ID dell'iPad, che deve essere sempre attivo.</p>
      <div class="row wrap">
        <button class="btn" data-act="change-pin">${ic('lock')} Cambia PIN</button>
        <span class="grow"></span>
        <span class="muted">Blocco automatico dopo</span>
        <div class="seg" data-autolock>${[2, 5, 10, 15].map((v) => `<button data-al="${v}" class="${st.autoLockMin === v ? 'on' : ''}">${v} min</button>`).join('')}</div>
      </div>
    </div>

    <div class="card"><h2>Backup</h2>
      <p class="muted">Il backup è un file cifrato con una password (AES-256). Su iPad: <b>Esegui backup</b> → <b>Salva in File</b> → scegli l'SSD SanDisk collegato via USB-C. Conserva la password: senza di essa il file non si apre.</p>
      <dl class="kv" style="margin:0 0 14px"><dt>Ultimo backup</dt><dd>${st.lastBackup ? `${fmtDate(st.lastBackup)} alle ${new Date(st.lastBackup).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}` : 'mai'}</dd>
        <dt>Dati</dt><dd>${S.patients.length} pazienti · ${S.sessions.length} sedute · ${S.consents.length} consensi</dd>
        <dt>Spazio usato</dt><dd id="storageInfo">…</dd></dl>
      <div class="row wrap">
        <button class="btn primary" data-act="backup">${ic('share')} Esegui backup</button>
        <button class="btn" data-act="restore">Ripristina da backup</button>
        <span class="grow"></span>
        <span class="muted">Promemoria ogni</span>
        <div class="seg">${[3, 7, 14, 30].map((v) => `<button data-bd="${v}" class="${st.backupDays === v ? 'on' : ''}">${v} gg</button>`).join('')}</div>
      </div>
      <input type="file" id="restoreFile" accept=".json,.osteo,application/json" class="hidden">
    </div>

    <div class="card"><h2>Tastiera</h2>
      <dl class="kv"><dt><kbd>⌘K</kbd> oppure <kbd>/</kbd></dt><dd>Cerca paziente (Invio apre il primo)</dd>
        <dt><kbd>⌥N</kbd></dt><dd>Nuovo paziente</dd><dt><kbd>⌥S</kbd></dt><dd>Nuova seduta per il paziente aperto</dd>
        <dt><kbd>⌘↩</kbd> / <kbd>Esc</kbd></dt><dd>Chiudi la seduta (salva in automatico)</dd>
        <dt><kbd>⌥1</kbd> <kbd>⌥2</kbd> <kbd>⌥3</kbd></dt><dd>Pazienti, Pagamenti, Impostazioni</dd><dt><kbd>⌥L</kbd></dt><dd>Blocca l'app</dd></dl>
    </div>

    <div class="card"><h2>Zona pericolosa</h2>
      <div class="row"><span class="muted grow">Elimina tutti i dati da questo iPad. Fai prima un backup.</span><button class="btn danger" data-act="wipe">${ic('trash')} Cancella tutti i dati</button></div>
    </div>
    <p class="small faint" style="text-align:center">${APP.name} ${APP.version} · funziona offline · nessun dato lascia l'iPad</p>
  </div></section>`;
  const saver = debounce(saveSettings, 400);
  main.addEventListener('input', (e) => {
    const k = e.target.dataset.set;
    if (k) { st[k] = e.target.value.trim(); saver(); }
    if (e.target.id === 'consentText') {
      const v = e.target.value;
      st.consentText = v.trim() && v.trim() !== DEFAULT_CONSENT.trim() ? v : null;
      $('#consentSaved').textContent = st.consentText ? 'Testo personalizzato · salvato' : 'Testo predefinito';
      saver();
    }
  });
  fillStorageInfo();
}
async function fillStorageInfo() {
  const el = $('#storageInfo'); if (!el) return;
  try {
    const e = await navigator.storage.estimate();
    const persisted = navigator.storage.persisted ? await navigator.storage.persisted() : false;
    el.textContent = `${(e.usage / 1048576).toFixed(1)} MB${persisted ? ' · archivio persistente' : ''}`;
  } catch { el.textContent = 'n/d'; }
}
function proSignatureFlow() {
  let pad;
  return modal({
    title: 'Firma del professionista', wide: true,
    html: '<p class="muted" style="margin:0">Firma con Apple Pencil nel riquadro.</p><div class="sigpad" data-pad style="height:200px"></div>',
    foot: '<button class="btn" data-cancel>Annulla</button><button class="btn primary" data-ok>Salva firma</button>',
    onMount: ({ el, close }) => {
      pad = signaturePad($('[data-pad]', el));
      el.querySelector('[data-ok]').addEventListener('click', async () => {
        if (pad.isEmpty()) { toast('Manca la firma'); return; }
        S.settings.proSignature = pad.toJPEG(); await saveSettings(); close(true); render(); toast('Firma salvata');
      });
    },
  });
}

/* ---------- Condivisione file (Salva in File / AirDrop / stampa) ---------- */
async function shareFile(blob, name, type) {
  const file = new File([blob], name, { type });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], title: name }); return true; }
    catch (e) { if (e.name === 'AbortError') return false; }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
  return true;
}

/* ---------- Cifratura backup ---------- */
async function deriveKey(password, salt, iter) {
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: iter }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}
async function encryptBackup(obj, password) {
  const salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12)), iter = 310000;
  const key = await deriveKey(password, salt, iter);
  const data = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(JSON.stringify(obj)));
  return JSON.stringify({ format: 'osteostudio-backup', version: 3, cipher: 'AES-256-GCM', kdf: 'PBKDF2-SHA256', iter, salt: b64.enc(salt), iv: b64.enc(iv), createdAt: new Date().toISOString(), data: b64.enc(data) });
}
async function decryptBackup(env, password) {
  const key = await deriveKey(password, b64.dec(env.salt), env.iter);
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64.dec(env.iv) }, key, b64.dec(env.data));
  return JSON.parse(new TextDecoder().decode(plain));
}
async function backupFlow() {
  flushPending();
  const v = await formDialog({
    title: 'Backup cifrato',
    intro: '<p class="muted" style="margin:0">Scegli una password di almeno 8 caratteri e annotala in un posto sicuro: <b>senza password il backup non si può ripristinare</b>.</p>',
    fields: [{ k: 'pw', label: 'Password', type: 'password', required: true, autofocus: true }, { k: 'pw2', label: 'Ripeti password', type: 'password', required: true }],
    ok: 'Crea backup',
    validate: (v) => v.pw.length < 8 ? 'La password deve avere almeno 8 caratteri.' : v.pw !== v.pw2 ? 'Le password non coincidono.' : '',
  });
  if (!v) return;
  toast('Cifratura in corso…');
  const payload = {
    app: APP.name, version: APP.version, exportedAt: new Date().toISOString(),
    settings: { ...S.settings, lastBackup: null },
    patients: S.patients, cycles: S.cycles, sessions: S.sessions, consents: S.consents,
  };
  const text = await encryptBackup(payload, v.pw);
  const d = new Date();
  const name = `OsteoStudio-backup-${todayISO()}-${pad(d.getHours())}${pad(d.getMinutes())}.json`;
  const ok = await shareFile(new Blob([text], { type: 'application/json' }), name, 'application/json');
  if (ok) {
    S.settings.lastBackup = new Date().toISOString(); await saveSettings();
    render(); toast('Backup creato');
  }
}
async function restoreFlow(file) {
  let env;
  try { env = JSON.parse(await file.text()); } catch { toast('File non valido'); return; }
  if (env.format !== 'osteostudio-backup') { toast('Questo file non è un backup di OsteoStudio 3'); return; }
  let data = null;
  const v = await formDialog({
    title: 'Ripristina backup',
    intro: `<p class="muted" style="margin:0">Backup del ${fmtDate(env.createdAt)}. Inserisci la password usata per crearlo.</p>`,
    fields: [{ k: 'pw', label: 'Password del backup', type: 'password', required: true, autofocus: true }],
    ok: 'Continua',
  });
  if (!v) return;
  try { data = await decryptBackup(env, v.pw); } catch { toast('Password errata o file danneggiato', 3200); return; }
  const ok = await confirmDialog({
    title: 'Sostituire i dati?',
    html: `<p>Il backup contiene <b>${data.patients?.length || 0} pazienti</b>, ${data.sessions?.length || 0} sedute e ${data.consents?.length || 0} consensi.</p><p>Tutti i dati attuali su questo iPad verranno <b>sostituiti</b>. Il PIN resta quello attuale.</p>`,
    ok: 'Ripristina', danger: true,
  });
  if (!ok) return;
  const settings = { ...DEFAULT_SETTINGS, ...(data.settings || {}), lastBackup: env.createdAt };
  await DB.replaceAll({ patients: data.patients, cycles: data.cycles, sessions: data.sessions, consents: data.consents, kv: { settings, pin: S.pin } });
  await loadAll();
  S.ui = { ...S.ui, view: 'patients', patientId: null };
  render(); toast('Dati ripristinati');
}

/* =====================================================================
   Eventi globali
   ===================================================================== */
async function onClick(e) {
  const t = e.target.closest('button,[data-pid],[data-sid]'); if (!t || S.locked) return;
  const d = t.dataset;
  if (d.nav) { flushPending(); S.ui.view = d.nav; render(); return; }
  if (d.pid) { flushPending(); S.ui.patientId = d.pid; if (!['sedute', 'anagrafica', 'anamnesi', 'consenso'].includes(S.ui.tab)) S.ui.tab = 'sedute'; $$('.pitem').forEach((x) => x.classList.toggle('on', x.dataset.pid === d.pid)); renderDetail(); $('#detail').scrollTop = 0; return; }
  if (d.sid) { openSession(d.sid); return; }
  if (d.tab) { flushPending(); S.ui.tab = d.tab; renderDetail(); return; }
  if (d.sort) { S.ui.sort = d.sort; render(); return; }
  if (d.month !== undefined) {
    if (d.month === '0') S.ui.payMonth = null;
    else { const [y, m] = (S.ui.payMonth || todayISO().slice(0, 7)).split('-').map(Number); const dt = new Date(y, m - 1 + Number(d.month), 1); S.ui.payMonth = `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}`; }
    render(); return;
  }
  if (d.pay) { togglePaid(d.pay); return; }
  if (d.payall) {
    const list = unpaidOf(d.payall);
    if (await confirmDialog({ title: 'Segna come pagate', html: `<p>${nSed(list.length)} di ${esc(fullName(patient(d.payall)))} per un totale di <b>${eur(sum(list))}</b>.</p>`, ok: 'Segna pagate' })) {
      for (const s of list) { s.paid = true; await save('sessions', s); }
      render();
    }
    return;
  }
  if (d.openPatient) { S.ui = { ...S.ui, view: 'patients', patientId: d.openPatient, tab: 'sedute' }; render(); return; }
  if (d.dm) { S.settings.defaultMethod = d.dm; await saveSettings(); $$('[data-dm]').forEach((x) => x.classList.toggle('on', x === t)); return; }
  if (d.al) { S.settings.autoLockMin = +d.al; await saveSettings(); $$('[data-al]').forEach((x) => x.classList.toggle('on', x === t)); return; }
  if (d.bd) { S.settings.backupDays = +d.bd; await saveSettings(); render(); return; }
  const p = patient(S.ui.patientId);
  switch (d.act) {
    case 'lock': Lock.lock(); break;
    case 'new-patient': newPatientFlow(); break;
    case 'new-session': newSessionFlow(); break;
    case 'new-cycle': if (p && await newCycle(p.id)) renderDetail(); break;
    case 'edit-cycle': { const c = S.cycles.find((x) => x.id === d.id); const v = c && await cycleDialog(c); if (v) { Object.assign(c, v); await save('cycles', c); renderDetail(); } break; }
    case 'delete-cycle': {
      const c = S.cycles.find((x) => x.id === d.id); if (!c) break;
      const ss = sessionsOfCycle(c.id);
      if (await confirmDialog({ title: 'Elimina ciclo', html: `<p>Eliminare il ciclo <b>${esc(c.motivo || '')}</b> del ${fmtDate(c.start)}${ss.length ? ` insieme a ${ss.length === 1 ? '<b>1 seduta</b>' : `<b>${ss.length} sedute</b>`} (note, VAS, mappe e pagamenti)` : ''}? L'operazione non si può annullare.</p>`, ok: 'Elimina', danger: true })) {
        for (const s of ss) await remove('sessions', s.id);
        await remove('cycles', c.id);
        renderDetail(); refreshList(); toast('Ciclo eliminato');
      }
      break;
    }
    case 'delete-patient': {
      if (!p) break;
      const n = sessionsOf(p.id).length;
      if (await confirmDialog({ title: 'Elimina paziente', html: `<p>Eliminare <b>${esc(displayName(p))}</b> con ${n} sedute, cicli, consensi e pagamenti? L'operazione non si può annullare.</p>`, ok: 'Elimina definitivamente', danger: true })) {
        for (const s of S.sessions.filter((x) => x.patientId === p.id)) await remove('sessions', s.id);
        for (const c of S.cycles.filter((x) => x.patientId === p.id)) await remove('cycles', c.id);
        for (const c of S.consents.filter((x) => x.patientId === p.id)) await remove('consents', c.id);
        pending.clear();
        await remove('patients', p.id);
        S.ui.patientId = null; render(); toast('Paziente eliminato');
      }
      break;
    }
    case 'consent': if (p) openConsent(p); break;
    case 'consent-pdf': { const c = S.consents.find((x) => x.id === d.id); if (c) shareFile(consentPDF(c), `Consenso ${fullName(patient(c.patientId))} ${c.date.slice(0, 10)}.pdf`, 'application/pdf'); break; }
    case 'consent-del': {
      const c = S.consents.find((x) => x.id === d.id);
      if (c && await confirmDialog({ title: 'Elimina consenso', html: `<p>Eliminare il consenso firmato il ${fmtDate(c.date)}? Se ti serve, condividi prima il PDF.</p>`, ok: 'Elimina', danger: true })) { await remove('consents', c.id); renderDetail(); }
      break;
    }
    case 'export-patient': if (p) { flushPending(); shareFile(patientPDF(p), `Cartella ${fullName(p)} ${todayISO()}.pdf`, 'application/pdf'); } break;
    case 'csv': exportCSV(); break;
    case 'backup': backupFlow(); break;
    case 'restore': { const f = $('#restoreFile'); f.value = ''; f.onchange = () => f.files[0] && restoreFlow(f.files[0]); f.click(); break; }
    case 'change-pin': {
      const v = await formDialog({ title: 'Cambia PIN', fields: [{ k: 'old', label: 'PIN attuale', type: 'password', inputmode: 'numeric', required: true, autofocus: true }], ok: 'Avanti' });
      if (!v) break;
      if (!(await checkPin(v.old))) { toast('PIN errato'); break; }
      showLock('change');
      break;
    }
    case 'pro-sign': proSignatureFlow(); break;
    case 'pro-sign-del': S.settings.proSignature = null; await saveSettings(); render(); break;
    case 'consent-reset':
      if (await confirmDialog({ title: 'Ripristina testo', html: '<p>Il testo del consenso tornerà quello predefinito. I consensi già firmati non cambiano.</p>', ok: 'Ripristina' })) { S.settings.consentText = null; await saveSettings(); render(); }
      break;
    case 'consent-preview': {
      flushPending();
      const st = S.settings;
      const demo = { nome: 'Mario', cognome: 'Rossi', dataNascita: '1980-05-12', luogoNascita: 'Milano', cf: 'RSSMRA80E12F205X' };
      const c = { date: localDateTime(), signer: 'Mario Rossi', role: 'paziente', header: { nome: st.studioNome || 'Nome dello studio', titolo: st.studioTitolo, piva: st.studioPiva },
        patientText: patientLine(demo).replace(/<[^>]+>/g, '') + ' (esempio)', text: Consent.fill(consentText(), consentVars(demo, 'Mario Rossi', 'paziente')), sig: null, pro: st.proSignature };
      shareFile(consentPDF(c), 'Anteprima consenso.pdf', 'application/pdf');
      break;
    }
    case 'wipe':
      if (await confirmDialog({ title: 'Cancella tutti i dati', html: '<p>Verranno eliminati tutti i pazienti, le sedute, i consensi e le impostazioni da questo iPad.</p>', ok: 'Continua', danger: true })
        && await confirmDialog({ title: 'Ultima conferma', html: '<p>Hai un backup aggiornato? Dopo questa operazione i dati non saranno più recuperabili da qui.</p>', ok: 'Elimina tutto', danger: true })) {
        await DB.replaceAll({}); location.reload();
      }
      break;
  }
}
function onKeydown(e) {
  if (S.locked || document.querySelector('.modal-bg') || current) return;
  const inField = e.target.matches('input,textarea,select');
  const k = e.key.toLowerCase(), code = e.code;
  if ((e.metaKey || e.ctrlKey) && k === 'k' || (!inField && e.key === '/')) {
    e.preventDefault();
    if (S.ui.view !== 'patients') { S.ui.view = 'patients'; render(); }
    const q = $('#q'); q.focus(); q.select(); return;
  }
  if (e.altKey && !e.metaKey) {
    const map = { KeyN: () => newPatientFlow(), KeyS: () => S.ui.patientId && S.ui.view === 'patients' && newSessionFlow(), KeyL: () => Lock.lock(),
      Digit1: () => { S.ui.view = 'patients'; render(); }, Digit2: () => { S.ui.view = 'payments'; render(); }, Digit3: () => { S.ui.view = 'settings'; render(); } };
    if (map[code]) { e.preventDefault(); flushPending(); map[code](); }
    return;
  }
  if (!inField && S.ui.view === 'patients' && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
    const items = $$('#plist .pitem'); if (!items.length) return;
    e.preventDefault();
    let i = items.findIndex((x) => x.dataset.pid === S.ui.patientId);
    i = e.key === 'ArrowDown' ? Math.min(items.length - 1, i + 1) : Math.max(0, i - 1);
    items[i].click(); items[i].scrollIntoView({ block: 'nearest' });
  }
}

async function loadAll() {
  const [patients, cycles, sessions, consents, settings, pin] = await Promise.all([
    DB.all('patients'), DB.all('cycles'), DB.all('sessions'), DB.all('consents'), DB.getKV('settings'), DB.getKV('pin')]);
  Object.assign(S, { patients, cycles, sessions, consents, pin: pin || null });
  S.settings = { ...DEFAULT_SETTINGS, ...(settings || {}) };
  if (!METHODS[S.settings.defaultMethod]) S.settings.defaultMethod = 'pos';
}

async function init() {
  try {
    await DB.open();
    await loadAll();
  } catch (err) {
    $('#app').innerHTML = `<div class="content center"><div class="empty"><h2>Impossibile aprire il database</h2><p>${esc(err.message)}</p><p class="small">Se usi Safari in navigazione privata, aprila in una finestra normale o dalla schermata Home.</p></div></div>`;
    return;
  }
  if (navigator.storage?.persist) navigator.storage.persist().catch(() => {});
  document.addEventListener('click', onClick);
  document.addEventListener('keydown', onKeydown);
  ['pointerdown', 'keydown'].forEach((ev) => document.addEventListener(ev, () => Lock.touch(), { passive: true, capture: true }));
  setInterval(() => { if (!S.locked && Lock.expired()) Lock.lock(); }, 15000);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { flushPending(); document.body.classList.add('privacy'); Lock.hiddenAt = Date.now(); }
    else {
      document.body.classList.remove('privacy');
      if (!S.locked && Lock.expired()) Lock.lock();
    }
  });
  window.addEventListener('pagehide', flushPending);
  showLock(S.pin ? 'unlock' : 'setup');
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
}
init();
