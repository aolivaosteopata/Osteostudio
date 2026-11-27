/* OsteoStudio – mappa corporea (vista anteriore e posteriore) disegnabile con Apple Pencil.
   I tratti sono salvati come vettori nelle coordinate della scena (760 × 1000):
   { t: 0|1|2 (colore) oppure 'e' (gomma), b: 'pen'|'air', w: spessore, p: [x, y, pressione, …] }.
   L'inchiostro sta su un livello separato dalla sagoma: la gomma cancella solo dove passa,
   senza toccare il disegno del corpo. */
'use strict';
const BodyMap = (() => {
  const W = 760, H = 1000, TOP = 12, INK_ALPHA = 0.85;
  const FRONT_X = 190, BACK_X = 570;
  const TOOLS = [
    { id: 0, label: 'Dolore', color: '#d23c3c' },
    { id: 1, label: 'Tensione', color: '#e08a1e' },
    { id: 2, label: 'Trattato', color: '#2f6fd6' },
  ];
  const BODY_HALF = [
    [18,118],[22,148],[68,162],[104,178],[121,212],[127,280],[136,360],[150,440],
    [164,508],[176,540],[172,582],[150,578],[144,532],[127,452],[110,372],[97,292],
    [88,236],[84,300],[77,372],[87,440],[95,500],[88,620],[80,700],[78,780],
    [70,900],[86,948],[82,976],[30,976],[34,940],[40,850],[38,720],[30,640],
    [20,560],[6,522]
  ];
  let BODY = null;
  function bodyPath() {
    if (BODY) return BODY;
    const pts = [...BODY_HALF, ...BODY_HALF.slice().reverse().map(([x, y]) => [-x, y])];
    const p = new Path2D(), len = pts.length;
    const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    const s = mid(pts[len - 1], pts[0]);
    p.moveTo(s[0], s[1]);
    for (let i = 0; i < len; i++) { const m = mid(pts[i], pts[(i + 1) % len]); p.quadraticCurveTo(pts[i][0], pts[i][1], m[0], m[1]); }
    p.closePath();
    return (BODY = p);
  }
  function figure(ctx, cx, view, c) {
    ctx.save();
    ctx.translate(cx, TOP);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.fillStyle = c.fill; ctx.strokeStyle = c.stroke; ctx.lineWidth = 2.6;
    ctx.fill(bodyPath()); ctx.stroke(bodyPath());
    const head = new Path2D(); head.ellipse(0, 62, 40, 54, 0, 0, Math.PI * 2);
    ctx.fill(head); ctx.stroke(head);
    ctx.strokeStyle = c.detail; ctx.lineWidth = 2;
    const q = (x1, y1, cx1, cy1, x2, y2) => { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.quadraticCurveTo(cx1, cy1, x2, y2); ctx.stroke(); };
    const both = (fn) => { fn(1); fn(-1); };
    if (view === 'front') {
      both((k) => q(8 * k, 172, 40 * k, 184, 78 * k, 168));
      both((k) => q(14 * k, 262, 46 * k, 288, 80 * k, 252));
      both((k) => q(6 * k, 334, 40 * k, 352, 74 * k, 360));
      both((k) => q(84 * k, 462, 50 * k, 488, 12 * k, 516));
      both((k) => { ctx.beginPath(); ctx.ellipse(57 * k, 655, 13, 17, 0, 0, Math.PI * 2); ctx.stroke(); });
      ctx.setLineDash([5, 9]); q(0, 184, 0, 330, 0, 478); ctx.setLineDash([]);
      ctx.beginPath(); ctx.arc(0, 420, 5, 0, Math.PI * 2); ctx.stroke();
    } else {
      ctx.beginPath(); ctx.moveTo(0, 122); ctx.lineTo(0, 468); ctx.stroke();
      for (let y = 136; y <= 456; y += 20) { ctx.beginPath(); ctx.moveTo(-5, y); ctx.lineTo(5, y); ctx.stroke(); }
      both((k) => { ctx.beginPath(); ctx.moveTo(24 * k, 190); ctx.quadraticCurveTo(55 * k, 180, 80 * k, 196); ctx.quadraticCurveTo(70 * k, 250, 42 * k, 292); ctx.quadraticCurveTo(30 * k, 240, 24 * k, 190); ctx.stroke(); });
      q(-28, 96, 0, 110, 28, 96);
      both((k) => q(10 * k, 448, 50 * k, 428, 86 * k, 452));
      ctx.beginPath(); ctx.moveTo(-16, 462); ctx.lineTo(16, 462); ctx.lineTo(0, 502); ctx.closePath(); ctx.stroke();
      both((k) => q(8 * k, 560, 48 * k, 578, 88 * k, 556));
      both((k) => q(36 * k, 668, 56 * k, 676, 78 * k, 666));
    }
    ctx.restore();
  }
  function palette(forPrint) {
    if (forPrint) return { fill: '#eef2f0', stroke: '#82968e', detail: '#b3c1bb', text: '#7d8c86' };
    const cs = getComputedStyle(document.documentElement);
    const v = (k) => cs.getPropertyValue(k).trim();
    return { fill: v('--fig-fill'), stroke: v('--fig-stroke'), detail: v('--fig-detail'), text: v('--faint') };
  }
  function drawScene(ctx, c, labels = true) {
    figure(ctx, FRONT_X, 'front', c);
    figure(ctx, BACK_X, 'back', c);
    if (!labels) return;
    ctx.fillStyle = c.text;
    ctx.font = '600 22px -apple-system, Helvetica, Arial, sans-serif';
    ctx.textAlign = 'left'; ctx.fillText('Anteriore', 14, 34);
    ctx.textAlign = 'right'; ctx.fillText('Posteriore', W - 14, 34);
    ctx.font = '700 26px -apple-system, Helvetica, Arial, sans-serif';
    ctx.textAlign = 'center';
    // Lato del paziente: nella vista anteriore la sua destra è alla nostra sinistra.
    ctx.fillText('D', 22, 300); ctx.fillText('S', 358, 300);
    ctx.fillText('S', 402, 300); ctx.fillText('D', 738, 300);
  }

  /* ---------- Pennelli ---------- */
  const SPRITES = {};
  function sprite(color) { // macchia sfumata per l'aerografo
    if (SPRITES[color]) return SPRITES[color];
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const x = c.getContext('2d');
    const n = parseInt(color.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    const grd = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    grd.addColorStop(0, `rgba(${r},${g},${b},1)`);
    grd.addColorStop(0.45, `rgba(${r},${g},${b},0.55)`);
    grd.addColorStop(1, `rgba(${r},${g},${b},0)`);
    x.fillStyle = grd; x.fillRect(0, 0, 64, 64);
    return (SPRITES[color] = c);
  }
  const ERASE_K = 2.4; // la gomma è più larga del tratto
  const airRadius = (s) => s.w * 2.2;
  function dab(ctx, s, x, y, pr) {
    const r = airRadius(s);
    ctx.globalAlpha = 0.07 + 0.2 * pr;
    ctx.drawImage(sprite((TOOLS[s.t] || TOOLS[0]).color), x - r, y - r, r * 2, r * 2);
    ctx.globalAlpha = 1;
  }
  /* Disegna il tratto s dal punto di indice `from` in poi (indice di punto, non di array).
     st conserva lo stato dell'aerografo fra una chiamata e l'altra. */
  function paint(ctx, s, from = 0, st = {}) {
    const p = s.p, n = p.length / 3;
    const erase = s.t === 'e';
    ctx.save();
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (erase) { ctx.globalCompositeOperation = 'destination-out'; ctx.strokeStyle = ctx.fillStyle = '#000'; }
    else { const col = (TOOLS[s.t] || TOOLS[0]).color; ctx.strokeStyle = ctx.fillStyle = col; }
    const air = !erase && s.b === 'air';
    if (from === 0) {
      // punto iniziale
      if (air) { dab(ctx, s, p[0], p[1], p[2] ?? 0.5); st.rem = 0; }
      else { ctx.beginPath(); ctx.arc(p[0], p[1], (erase ? s.w * ERASE_K : s.w * (0.55 + 0.9 * (p[2] ?? 0.5))) / 2, 0, Math.PI * 2); ctx.fill(); }
      from = 1;
    }
    for (let i = Math.max(1, from); i < n; i++) {
      const x0 = p[i * 3 - 3], y0 = p[i * 3 - 2], x1 = p[i * 3], y1 = p[i * 3 + 1], pr = p[i * 3 + 2] ?? 0.5;
      if (air) {
        const step = Math.max(1.5, airRadius(s) * 0.28);
        const dist = Math.hypot(x1 - x0, y1 - y0);
        let d = step - (st.rem || 0);
        while (d <= dist) { const k = d / dist; dab(ctx, s, x0 + (x1 - x0) * k, y0 + (y1 - y0) * k, pr); d += step; }
        st.rem = dist - (d - step);
      } else {
        ctx.lineWidth = erase ? s.w * ERASE_K : s.w * (0.55 + 0.9 * pr);
        ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
      }
    }
    ctx.restore();
  }
  function paintAll(ctx, strokes) { (strokes || []).forEach((s) => paint(ctx, s)); }

  /* Disegna la mappa su un canvas di dimensioni qualsiasi (miniature, PDF). */
  function render(canvas, strokes, cssW, forPrint = false) {
    const dpr = forPrint ? 1 : (window.devicePixelRatio || 1);
    const cssH = Math.round(cssW * H / W);
    canvas.width = Math.round(cssW * dpr); canvas.height = Math.round(cssH * dpr);
    if (!forPrint) { canvas.style.width = cssW + 'px'; canvas.style.height = cssH + 'px'; }
    const ctx = canvas.getContext('2d');
    if (forPrint) { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height); }
    const sx = canvas.width / W, sy = canvas.height / H;
    ctx.setTransform(sx, 0, 0, sy, 0, 0);
    drawScene(ctx, palette(forPrint), forPrint || cssW > 200);
    if (strokes && strokes.length) {
      const ink = document.createElement('canvas'); ink.width = canvas.width; ink.height = canvas.height;
      const ic = ink.getContext('2d'); ic.setTransform(sx, 0, 0, sy, 0, 0);
      paintAll(ic, strokes);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = INK_ALPHA; ctx.drawImage(ink, 0, 0); ctx.globalAlpha = 1;
    }
    return canvas;
  }
  function toJPEG(strokes, pxW = 760) {
    const cv = render(document.createElement('canvas'), strokes, pxW, true);
    return { url: cv.toDataURL('image/jpeg', 0.88), w: cv.width, h: cv.height };
  }

  /* Editor interattivo. onChange(strokes) a ogni modifica completata. */
  function editor(host, strokes, onChange) {
    let color = 0, brush = 'pen', erasing = false, size = 9;
    let penSeen = false, current = null, curState = null;
    strokes = strokes || [];
    const undo = [], redo = [];
    host.innerHTML = `
      <div class="map-wrap">
        <div class="map-tools">
          <div class="seg" data-brush><button data-b="pen" class="on">Penna</button><button data-b="air">Aerografo</button><button data-b="erase">Gomma</button></div>
          <span class="grow"></span>
          <button class="btn sm" data-act="undo" title="Annulla l'ultima azione (⌘Z)">↶ Annulla</button>
          <button class="btn sm" data-act="redo" title="Ripeti (⇧⌘Z)">↷ Ripeti</button>
        </div>
        <div class="map-tools">
          ${TOOLS.map((t) => `<button class="tool${t.id === 0 ? ' on' : ''}" data-tool="${t.id}"><i style="background:${t.color}"></i>${t.label}</button>`).join('')}
          <div class="seg sizes" data-size title="Spessore">${[[5, 'Fine'], [9, 'Medio'], [16, 'Largo']].map(([v, l]) => `<button data-s="${v}" class="${v === 9 ? 'on' : ''}" aria-label="${l}"><i style="width:${4 + v * 0.7}px;height:${4 + v * 0.7}px"></i></button>`).join('')}</div>
          <span class="grow"></span>
          <button class="btn sm icon danger" data-act="clear" title="Cancella tutto" aria-label="Cancella tutto"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg></button>
        </div>
        <div class="map-stage"><canvas></canvas></div>
      </div>`;
    const stage = host.querySelector('.map-stage');
    const canvas = stage.querySelector('canvas');
    const ctx = canvas.getContext('2d');
    let bg = null, ink = null, ictx = null, scale = 1;

    function compose() {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (bg) ctx.drawImage(bg, 0, 0);
      if (ink) { ctx.globalAlpha = INK_ALPHA; ctx.drawImage(ink, 0, 0); ctx.globalAlpha = 1; }
    }
    function repaint() {
      if (!ink) return;
      ictx.setTransform(1, 0, 0, 1, 0, 0);
      ictx.clearRect(0, 0, ink.width, ink.height);
      ictx.setTransform(scale, 0, 0, scale, 0, 0);
      paintAll(ictx, strokes);
      compose();
      syncButtons();
    }
    function layout() {
      const r = stage.getBoundingClientRect();
      if (!r.width || !r.height) return;
      const cssW = Math.floor(Math.min(r.width - 16, (r.height - 16) * W / H));
      const cssH = Math.floor(cssW * H / W);
      const dpr = window.devicePixelRatio || 1;
      canvas.style.width = cssW + 'px'; canvas.style.height = cssH + 'px';
      canvas.width = Math.round(cssW * dpr); canvas.height = Math.round(cssH * dpr);
      scale = canvas.width / W;
      bg = document.createElement('canvas'); bg.width = canvas.width; bg.height = canvas.height;
      const b = bg.getContext('2d'); b.setTransform(scale, 0, 0, scale, 0, 0); drawScene(b, palette(false));
      ink = document.createElement('canvas'); ink.width = canvas.width; ink.height = canvas.height;
      ictx = ink.getContext('2d');
      repaint();
    }
    function syncButtons() {
      host.querySelector('[data-act="undo"]').disabled = !undo.length;
      host.querySelector('[data-act="redo"]').disabled = !redo.length;
      host.querySelector('[data-act="clear"]').disabled = !strokes.length;
    }
    function commit(next) { undo.push(strokes); redo.length = 0; strokes = next; repaint(); onChange(strokes); }

    const toScene = (e) => {
      const r = canvas.getBoundingClientRect();
      return [Math.round(((e.clientX - r.left) / r.width) * W * 10) / 10, Math.round(((e.clientY - r.top) / r.height) * H * 10) / 10];
    };
    const pressure = (e) => (e.pointerType === 'pen' ? Math.round((e.pressure || 0.5) * 100) / 100 : 0.5);
    canvas.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'pen') penSeen = true;
      else if (penSeen && e.pointerType === 'touch') return; // il palmo non disegna se si usa la Pencil
      if (!ink) return;
      e.preventDefault();
      canvas.setPointerCapture(e.pointerId);
      const [x, y] = toScene(e);
      current = erasing ? { t: 'e', w: size, p: [x, y, 0.5] } : { t: color, b: brush, w: size, p: [x, y, pressure(e)] };
      curState = {};
      ictx.setTransform(scale, 0, 0, scale, 0, 0);
      paint(ictx, current, 0, curState);
      compose();
    });
    canvas.addEventListener('pointermove', (e) => {
      if (!current) return;
      const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [];
      const n0 = current.p.length / 3;
      for (const ev of (evs.length ? evs : [e])) {
        const [x, y] = toScene(ev);
        const p = current.p, lx = p[p.length - 3], ly = p[p.length - 2];
        if (Math.hypot(x - lx, y - ly) >= 1.5) p.push(x, y, current.t === 'e' ? 0.5 : pressure(ev));
      }
      if (current.p.length / 3 > n0) {
        ictx.setTransform(scale, 0, 0, scale, 0, 0);
        paint(ictx, current, n0, curState);
        compose();
      }
    });
    const end = () => {
      if (!current) return;
      const s = current; current = null;
      commit([...strokes, s]);
    };
    canvas.addEventListener('pointerup', end);
    canvas.addEventListener('pointercancel', end);

    function doUndo() { if (!undo.length) return; redo.push(strokes); strokes = undo.pop(); repaint(); onChange(strokes); }
    function doRedo() { if (!redo.length) return; undo.push(strokes); strokes = redo.pop(); repaint(); onChange(strokes); }
    host.querySelector('.map-wrap').addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.b) {
        erasing = b.dataset.b === 'erase';
        if (!erasing) brush = b.dataset.b;
        host.querySelectorAll('[data-b]').forEach((x) => x.classList.toggle('on', x === b));
        host.querySelectorAll('[data-tool]').forEach((x) => (x.style.opacity = erasing ? 0.45 : ''));
      } else if (b.dataset.tool !== undefined) {
        color = +b.dataset.tool;
        host.querySelectorAll('[data-tool]').forEach((x) => { x.classList.toggle('on', x === b); x.style.opacity = ''; });
        if (erasing) { // scegliere un colore riporta al pennello
          erasing = false;
          host.querySelectorAll('[data-b]').forEach((x) => x.classList.toggle('on', x.dataset.b === brush));
        }
      } else if (b.dataset.s) {
        size = +b.dataset.s;
        host.querySelectorAll('[data-s]').forEach((x) => x.classList.toggle('on', x === b));
      } else if (b.dataset.act === 'undo') doUndo();
      else if (b.dataset.act === 'redo') doRedo();
      else if (b.dataset.act === 'clear') { if (strokes.length) commit([]); }
    });
    const onKey = (e) => {
      if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== 'z') return;
      if (e.target.matches('input,textarea') || document.querySelector('.modal-bg')) return;
      e.preventDefault();
      if (e.shiftKey) doRedo(); else doUndo();
    };
    document.addEventListener('keydown', onKey);
    const ro = new ResizeObserver(layout);
    ro.observe(stage);
    syncButtons();
    return { destroy: () => { ro.disconnect(); document.removeEventListener('keydown', onKey); } };
  }

  return { W, H, TOOLS, render, toJPEG, editor };
})();
