/* OsteoStudio – mappa corporea (vista anteriore e posteriore) disegnabile con Apple Pencil.
   I tratti sono salvati come vettori nelle coordinate della scena (760 × 1000). */
'use strict';
const BodyMap = (() => {
  const W = 760, H = 1000, TOP = 12;
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
    if (forPrint) return { fill: '#eef2f0', stroke: '#82968e', detail: '#b3c1bb', text: '#7d8c86', bg: '#ffffff' };
    const cs = getComputedStyle(document.documentElement);
    const v = (k) => cs.getPropertyValue(k).trim();
    return { fill: v('--fig-fill'), stroke: v('--fig-stroke'), detail: v('--fig-detail'), text: v('--faint'), bg: v('--surface') };
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
  function drawStroke(ctx, s) {
    const tool = TOOLS[s.t] || TOOLS[0];
    const p = s.p;
    ctx.strokeStyle = tool.color; ctx.fillStyle = tool.color;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.globalAlpha = 0.78;
    if (p.length <= 3) { ctx.beginPath(); ctx.arc(p[0], p[1], s.w * 0.6, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; return; }
    for (let i = 3; i < p.length; i += 3) {
      ctx.beginPath();
      ctx.lineWidth = s.w * (0.55 + 0.9 * (p[i + 2] ?? 0.5));
      ctx.moveTo(p[i - 3], p[i - 2]); ctx.lineTo(p[i], p[i + 1]);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  /* Disegna la mappa su un canvas di dimensioni qualsiasi (miniature, PDF). */
  function render(canvas, strokes, cssW, forPrint = false) {
    const dpr = forPrint ? 1 : (window.devicePixelRatio || 1);
    const cssH = Math.round(cssW * H / W);
    canvas.width = Math.round(cssW * dpr); canvas.height = Math.round(cssH * dpr);
    if (!forPrint) { canvas.style.width = cssW + 'px'; canvas.style.height = cssH + 'px'; }
    const ctx = canvas.getContext('2d');
    const c = palette(forPrint);
    if (forPrint) { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height); }
    ctx.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0);
    drawScene(ctx, c, forPrint || cssW > 200);
    (strokes || []).forEach((s) => drawStroke(ctx, s));
    return canvas;
  }
  function toJPEG(strokes, pxW = 760) {
    const cv = render(document.createElement('canvas'), strokes, pxW, true);
    return { url: cv.toDataURL('image/jpeg', 0.88), w: cv.width, h: cv.height };
  }

  /* Editor interattivo. onChange(strokes) a ogni tratto completato. */
  function editor(host, strokes, onChange) {
    let tool = 0, erasing = false, size = 9;
    let penSeen = false, current = null;
    strokes = strokes || [];
    const undo = [];
    host.innerHTML = `
      <div class="map-wrap">
        <div class="map-tools">
          ${TOOLS.map((t) => `<button class="tool${t.id === 0 ? ' on' : ''}" data-tool="${t.id}"><i style="background:${t.color}"></i>${t.label}</button>`).join('')}
          <button class="tool" data-tool="erase">Gomma</button>
          <span class="grow"></span>
          <div class="seg" data-size><button data-s="5">Fine</button><button class="on" data-s="9">Medio</button><button data-s="16">Largo</button></div>
          <button class="btn sm" data-act="undo">Annulla</button>
          <button class="btn sm danger" data-act="clear">Cancella</button>
        </div>
        <div class="map-stage"><canvas></canvas></div>
      </div>`;
    const stage = host.querySelector('.map-stage');
    const canvas = stage.querySelector('canvas');
    const ctx = canvas.getContext('2d');
    let bg = null, scale = 1;

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
      redraw();
    }
    function redraw() {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (bg) ctx.drawImage(bg, 0, 0);
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
      strokes.forEach((s) => drawStroke(ctx, s));
      if (current) drawStroke(ctx, current);
    }
    const toScene = (e) => {
      const r = canvas.getBoundingClientRect();
      return [Math.round(((e.clientX - r.left) / r.width) * W * 10) / 10, Math.round(((e.clientY - r.top) / r.height) * H * 10) / 10];
    };
    const pressure = (e) => (e.pointerType === 'pen' ? Math.round((e.pressure || 0.5) * 100) / 100 : 0.5);
    function eraseAt(x, y) {
      const before = strokes.length;
      const keep = strokes.filter((s) => { for (let i = 0; i < s.p.length; i += 3) if (Math.hypot(s.p[i] - x, s.p[i + 1] - y) < 16 + s.w) return false; return true; });
      if (keep.length !== before) { undo.push(strokes); strokes = keep; redraw(); }
    }
    canvas.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'pen') penSeen = true;
      else if (penSeen && e.pointerType === 'touch') return; // il palmo non disegna se si usa la Pencil
      e.preventDefault();
      canvas.setPointerCapture(e.pointerId);
      const [x, y] = toScene(e);
      if (erasing) { current = { erase: true }; eraseAt(x, y); return; }
      current = { t: tool, w: size, p: [x, y, pressure(e)] };
      redraw();
    });
    canvas.addEventListener('pointermove', (e) => {
      if (!current) return;
      const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
      for (const ev of (evs.length ? evs : [e])) {
        const [x, y] = toScene(ev);
        if (current.erase) { eraseAt(x, y); continue; }
        const p = current.p, lx = p[p.length - 3], ly = p[p.length - 2];
        if (Math.hypot(x - lx, y - ly) >= 1.5) p.push(x, y, pressure(ev));
      }
      if (!current.erase) redraw();
    });
    const end = () => {
      if (!current) return;
      if (current.erase) { current = null; onChange(strokes); return; }
      undo.push(strokes);
      strokes = [...strokes, current];
      current = null;
      redraw();
      onChange(strokes);
    };
    canvas.addEventListener('pointerup', end);
    canvas.addEventListener('pointercancel', end);
    host.querySelector('.map-tools').addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.tool !== undefined) {
        host.querySelectorAll('[data-tool]').forEach((x) => x.classList.toggle('on', x === b));
        erasing = b.dataset.tool === 'erase';
        if (!erasing) tool = +b.dataset.tool;
      } else if (b.dataset.s) {
        size = +b.dataset.s;
        host.querySelectorAll('[data-s]').forEach((x) => x.classList.toggle('on', x === b));
      } else if (b.dataset.act === 'undo') {
        if (undo.length) { strokes = undo.pop(); redraw(); onChange(strokes); }
      } else if (b.dataset.act === 'clear') {
        if (strokes.length) { undo.push(strokes); strokes = []; redraw(); onChange(strokes); }
      }
    });
    const ro = new ResizeObserver(layout);
    ro.observe(stage);
    return { destroy: () => ro.disconnect() };
  }

  return { W, H, TOOLS, render, toJPEG, editor };
})();
