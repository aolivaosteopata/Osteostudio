/* OsteoStudio – raccolta firma a schermo intero, pensata per Apple Pencil.
   - Nessun testo attorno: niente selezioni accidentali né Scribble.
   - Eventi touch bloccati (passive:false) e selezione disattivata durante la firma.
   - Palm rejection: dopo il primo tocco della Pencil, le dita/il palmo sono ignorati.
   - Tratto levigato (curve sui punti medi), spessore in base alla pressione della Pencil
     o alla velocità per dito/mouse; canvas ridimensionato senza perdere la firma.
   - Esporta un JPEG ritagliato attorno alla firma, su fondo bianco. */
'use strict';
const SignaturePad = (() => {
  const INK = '#10223a';

  function widthFor(pt, prev) {
    if (pt.pen) return 0.9 + 3.1 * Math.pow(pt.p, 0.8);          // pressione Pencil
    if (!prev) return 2.6;
    const dt = Math.max(1, pt.t - prev.t);
    const v = Math.hypot(pt.x - prev.x, pt.y - prev.y) / dt;     // px/ms
    return Math.max(1.1, Math.min(3.2, 3.4 - v * 1.1));          // più veloce = più sottile
  }
  /* Disegna il tratto dal punto `from`: curve quadratiche fra i punti medi. */
  function drawStroke(ctx, s, from = 0) {
    const pts = s;
    ctx.strokeStyle = INK; ctx.fillStyle = INK; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (pts.length === 1) { ctx.beginPath(); ctx.arc(pts[0].x, pts[0].y, pts[0].w / 2, 0, Math.PI * 2); ctx.fill(); return; }
    for (let i = Math.max(1, from); i < pts.length; i++) {
      const a = pts[i - 1], b = pts[i];
      const m0 = i === 1 ? a : { x: (pts[i - 2].x + a.x) / 2, y: (pts[i - 2].y + a.y) / 2 };
      const m1 = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      ctx.lineWidth = (a.w + b.w) / 2;
      ctx.beginPath(); ctx.moveTo(m0.x, m0.y); ctx.quadraticCurveTo(a.x, a.y, m1.x, m1.y); ctx.stroke();
    }
  }

  function open({ title = 'Firma', subtitle = '' } = {}) {
    return new Promise((resolve) => {
      const root = document.createElement('div');
      root.className = 'sigfull';
      root.innerHTML = `
        <div class="sigfull-bar">
          <button class="btn" data-a="cancel">Annulla</button>
          <div class="ttl"><b>${title}</b><span>${subtitle}</span></div>
          <button class="btn" data-a="undo" disabled>↶ Annulla tratto</button>
          <button class="btn danger" data-a="clear" disabled>Cancella</button>
          <button class="btn primary" data-a="ok" disabled>Conferma firma</button>
        </div>
        <div class="sigfull-stage"><div class="sigfull-paper"><canvas></canvas><div class="sigfull-line"><span>✕</span></div><div class="sigfull-hint">Firma sopra la linea</div></div></div>`;
      document.documentElement.classList.add('signing');
      document.body.appendChild(root);
      const paper = root.querySelector('.sigfull-paper');
      const cv = root.querySelector('canvas');
      const ctx = cv.getContext('2d');
      const strokes = [];
      let cur = null, penSeen = false, dpr = 1, cssW = 0, cssH = 0;

      function resize() {
        const r = paper.getBoundingClientRect();
        if (!r.width || !r.height) return;
        dpr = Math.max(2, window.devicePixelRatio || 1);
        cssW = r.width; cssH = r.height;
        cv.width = Math.round(cssW * dpr); cv.height = Math.round(cssH * dpr);
        cv.style.width = cssW + 'px'; cv.style.height = cssH + 'px';
        redraw();
      }
      function redraw() {
        ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        strokes.forEach((s) => drawStroke(ctx, s));
        if (cur) drawStroke(ctx, cur);
      }
      function sync() {
        const has = strokes.length > 0;
        root.querySelector('[data-a="ok"]').disabled = !has;
        root.querySelector('[data-a="undo"]').disabled = !has;
        root.querySelector('[data-a="clear"]').disabled = !has;
        root.querySelector('.sigfull-hint').style.opacity = has || cur ? 0 : 1;
      }
      const point = (e, prev) => {
        const r = cv.getBoundingClientRect();
        // coordinate normalizzate alla dimensione attuale: resistono a ridimensionamenti
        const pt = { x: e.clientX - r.left, y: e.clientY - r.top, p: e.pressure || 0.5, pen: e.pointerType === 'pen', t: e.timeStamp };
        pt.w = widthFor(pt, prev);
        if (prev && !pt.pen) pt.w = prev.w * 0.6 + pt.w * 0.4; // ammorbidisce le variazioni
        return pt;
      };
      let activeId = null;
      cv.addEventListener('pointerdown', (e) => {
        if (e.pointerType === 'pen') penSeen = true;
        else if (penSeen && e.pointerType === 'touch') return; // palm rejection
        if (activeId !== null) return;
        e.preventDefault();
        activeId = e.pointerId;
        cv.setPointerCapture(e.pointerId);
        cur = [point(e)];
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0); drawStroke(ctx, cur);
        sync();
      });
      cv.addEventListener('pointermove', (e) => {
        if (!cur || e.pointerId !== activeId) return;
        e.preventDefault();
        const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [];
        const n0 = cur.length;
        const r = cv.getBoundingClientRect();
        for (const ev of (evs.length ? evs : [e])) {
          const prev = cur[cur.length - 1];
          if (Math.hypot(ev.clientX - r.left - prev.x, ev.clientY - r.top - prev.y) < 0.6) continue;
          cur.push(point(ev, prev));
        }
        if (cur.length > n0) { ctx.setTransform(dpr, 0, 0, dpr, 0, 0); drawStroke(ctx, cur, Math.max(1, n0 - 1)); }
      });
      const end = (e) => {
        if (!cur || e.pointerId !== activeId) return;
        activeId = null;
        strokes.push(cur); cur = null;
        redraw(); sync();
      };
      cv.addEventListener('pointerup', end);
      cv.addEventListener('pointercancel', end);
      // iPad: impedisce selezione del testo, lente d'ingrandimento, scroll e Scribble durante la firma
      const block = (e) => { if (e.target === cv || root.contains(e.target) && !e.target.closest('button')) e.preventDefault(); };
      ['touchstart', 'touchmove', 'touchend'].forEach((t) => root.addEventListener(t, block, { passive: false }));
      root.addEventListener('selectstart', (e) => e.preventDefault());
      root.addEventListener('contextmenu', (e) => e.preventDefault());

      function exportJPEG() {
        // ritaglio attorno all'inchiostro
        let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
        strokes.flat().forEach((p) => { x0 = Math.min(x0, p.x - p.w); y0 = Math.min(y0, p.y - p.w); x1 = Math.max(x1, p.x + p.w); y1 = Math.max(y1, p.y + p.w); });
        const padPx = 14;
        x0 = Math.max(0, x0 - padPx); y0 = Math.max(0, y0 - padPx); x1 = Math.min(cssW, x1 + padPx); y1 = Math.min(cssH, y1 + padPx);
        const w = x1 - x0, h = y1 - y0;
        const scale = Math.min(3, 1400 / w); // risoluzione sufficiente per la stampa
        const out = document.createElement('canvas');
        out.width = Math.round(w * scale); out.height = Math.round(h * scale);
        const o = out.getContext('2d');
        o.fillStyle = '#fff'; o.fillRect(0, 0, out.width, out.height);
        o.setTransform(scale, 0, 0, scale, -x0 * scale, -y0 * scale);
        strokes.forEach((s) => drawStroke(o, s));
        return { url: out.toDataURL('image/jpeg', 0.92), w: out.width, h: out.height };
      }
      function close(v) {
        ro.disconnect();
        document.removeEventListener('keydown', onKey, true);
        document.documentElement.classList.remove('signing');
        root.remove();
        resolve(v);
      }
      const onKey = (e) => {
        if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(null); }
        else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); e.stopPropagation(); root.querySelector('[data-a="undo"]').click(); }
      };
      document.addEventListener('keydown', onKey, true);
      root.querySelector('.sigfull-bar').addEventListener('click', (e) => {
        const b = e.target.closest('[data-a]'); if (!b || b.disabled) return;
        const a = b.dataset.a;
        if (a === 'cancel') close(null);
        else if (a === 'undo') { strokes.pop(); redraw(); sync(); }
        else if (a === 'clear') { strokes.length = 0; redraw(); sync(); }
        else if (a === 'ok' && strokes.length) close(exportJPEG());
      });
      const ro = new ResizeObserver(() => {
        // al ridimensionamento la firma viene riscalata in proporzione
        const r = paper.getBoundingClientRect();
        if (cssW && r.width && (r.width !== cssW || r.height !== cssH)) {
          const kx = r.width / cssW, ky = r.height / cssH;
          strokes.forEach((s) => s.forEach((p) => { p.x *= kx; p.y *= ky; }));
        }
        resize();
      });
      ro.observe(paper);
      sync();
    });
  }
  return { open };
})();
