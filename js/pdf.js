/* OsteoStudio – generatore PDF minimale, senza librerie esterne.
   A4, font Helvetica standard (WinAnsi, lettere accentate italiane incluse),
   testo con a capo automatico, linee e immagini JPEG. */
'use strict';
const PDF = (() => {
  // Larghezze Helvetica / Helvetica-Bold (unità /1000) per i caratteri ASCII 32–126.
  const REG = [278,278,355,556,556,889,667,191,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,278,278,584,584,584,556,1015,667,667,722,722,667,611,778,722,278,500,667,556,833,722,778,667,778,722,667,611,722,667,944,667,667,611,278,278,278,469,556,333,556,556,500,556,556,278,556,556,222,222,500,222,833,556,556,556,556,333,500,278,556,500,722,500,500,500,334,260,334,584];
  const BOLD = [278,333,474,556,556,889,722,238,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,333,333,584,584,584,611,975,722,722,722,722,667,611,778,722,278,556,722,611,833,722,778,667,778,722,667,611,722,667,944,667,667,611,333,278,333,584,556,333,556,611,556,611,556,333,611,611,278,278,556,278,889,611,611,611,611,389,556,333,611,556,778,556,556,500,389,280,389,584];
  // Caratteri Unicode fuori da Latin-1 → codici WinAnsi.
  const SPECIAL = { '€':0x80, '‚':0x82, '„':0x84, '…':0x85, '‘':0x91, '’':0x92, '“':0x93, '”':0x94, '•':0x95, '–':0x96, '—':0x97 };
  // Lettere accentate: larghezza come la lettera base.
  const BASE = { 'à':'a','á':'a','â':'a','ä':'a','è':'e','é':'e','ê':'e','ë':'e','ì':'i','í':'i','î':'i','ï':'i','ò':'o','ó':'o','ô':'o','ö':'o','ù':'u','ú':'u','û':'u','ü':'u','ç':'c','ñ':'n',
    'À':'A','Á':'A','È':'E','É':'E','Ì':'I','Í':'I','Ò':'O','Ó':'O','Ù':'U','Ú':'U','Ç':'C','Ñ':'N' };

  function encode(str) {
    let out = '';
    for (const ch of String(str).normalize('NFC')) {
      const c = ch.codePointAt(0);
      if (c === 9) out += ' ';
      else if (c >= 32 && c < 127) out += ch;
      else if (SPECIAL[ch]) out += String.fromCharCode(SPECIAL[ch]);
      else if (c >= 160 && c < 256) out += ch;
      else out += '?';
    }
    return out;
  }
  function charWidth(ch, bold) {
    const t = bold ? BOLD : REG;
    const c = ch.charCodeAt(0);
    if (c >= 32 && c < 127) return t[c - 32];
    const dec = String.fromCharCode(c);
    const base = BASE[dec];
    if (base) return t[base.charCodeAt(0) - 32];
    if (c === 0x92 || c === 0x91) return bold ? 278 : 222;
    if (c === 0x93 || c === 0x94) return bold ? 500 : 333;
    if (c === 0x95) return 350;
    if (c === 0x96) return 556;
    if (c === 0x97) return 1000;
    if (c === 0xB0) return 400;
    if (c === 0xB7) return 278;
    return 556;
  }
  function width(encoded, size, bold) {
    let w = 0;
    for (let i = 0; i < encoded.length; i++) w += charWidth(encoded[i], bold);
    return (w / 1000) * size;
  }
  const esc = (s) => s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
  const n = (v) => (Math.round(v * 100) / 100).toString();
  const rgb = (c) => c.map((v) => n(v)).join(' ');

  class Doc {
    constructor(opts = {}) {
      this.pw = 595.28; this.ph = 841.89;
      this.m = { l: 56, r: 56, t: 54, b: 62 };
      this.pages = []; this.images = [];
      this.footer = opts.footer || '';
      this.newPage();
    }
    get w() { return this.pw - this.m.l - this.m.r; }
    newPage() { this.cur = { ops: [], xobj: new Set() }; this.pages.push(this.cur); this.y = this.ph - this.m.t; }
    ensure(h) { if (this.y - h < this.m.b) { this.newPage(); return true; } return false; }
    space(h) { this.y -= h; }
    raw(x, y, encoded, size, bold, color) {
      this.cur.ops.push(`BT /${bold ? 'F2' : 'F1'} ${n(size)} Tf ${rgb(color)} rg ${n(x)} ${n(y)} Td (${esc(encoded)}) Tj ET`);
    }
    wrap(encoded, size, bold, maxW) {
      const words = encoded.split(' ');
      const lines = []; let line = '';
      for (let word of words) {
        while (width(word, size, bold) > maxW) { // parola più lunga della riga
          let cut = word.length;
          while (cut > 1 && width(word.slice(0, cut), size, bold) > maxW) cut--;
          if (line) { lines.push(line); line = ''; }
          lines.push(word.slice(0, cut)); word = word.slice(cut);
        }
        const test = line ? line + ' ' + word : word;
        if (width(test, size, bold) <= maxW) line = test;
        else { lines.push(line); line = word; }
      }
      lines.push(line);
      return lines;
    }
    /* Paragrafo con a capo automatico. */
    text(str, o = {}) {
      const size = o.size || 10.5, bold = !!o.bold, color = o.color || [0.1, 0.13, 0.12];
      const lead = size * (o.lead || 1.42), indent = o.indent || 0;
      const maxW = (o.width || this.w) - indent;
      const paras = String(str ?? '').replace(/\r/g, '').split('\n');
      paras.forEach((p) => {
        const lines = this.wrap(encode(p), size, bold, maxW);
        lines.forEach((ln, i) => {
          this.ensure(lead);
          this.y -= lead;
          let x = this.m.l + indent + (o.x || 0);
          if (o.align === 'right') x = this.m.l + this.w - width(ln, size, bold);
          if (o.bullet && i === 0) this.raw(x - 11, this.y + size * 0.28, encode('•'), size, false, color);
          this.raw(x, this.y + size * 0.28, ln, size, bold, color);
        });
      });
      if (o.after) this.y -= o.after;
    }
    rule(color = [0.8, 0.84, 0.82], t = 0.7, gapBefore = 6, gapAfter = 10) {
      this.y -= gapBefore;
      this.cur.ops.push(`${rgb(color)} RG ${n(t)} w ${n(this.m.l)} ${n(this.y)} m ${n(this.m.l + this.w)} ${n(this.y)} l S`);
      this.y -= gapAfter;
    }
    /* JPEG da dataURL. Restituisce l'indice dell'immagine registrata. */
    addJPEG(dataUrl, pxW, pxH) {
      const bin = atob(dataUrl.split(',')[1]);
      this.images.push({ bin, w: pxW, h: pxH });
      return this.images.length - 1;
    }
    imageAt(idx, x, yTop, dw, dh) {
      this.cur.xobj.add(idx);
      this.cur.ops.push(`q ${n(dw)} 0 0 ${n(dh)} ${n(x)} ${n(yTop - dh)} cm /Im${idx} Do Q`);
    }
    image(idx, dw, dh, x) {
      this.ensure(dh);
      this.imageAt(idx, x ?? this.m.l, this.y, dw, dh);
      this.y -= dh;
    }
    strokeRect(x, yTop, w, h, color = [0.8, 0.84, 0.82]) {
      this.cur.ops.push(`${rgb(color)} RG 0.7 w ${n(x)} ${n(yTop - h)} ${n(w)} ${n(h)} re S`);
    }
    output() {
      const total = this.pages.length;
      this.pages.forEach((p, i) => {
        const size = 8, col = [0.5, 0.55, 0.53];
        const pg = encode(`Pagina ${i + 1} di ${total}`);
        p.ops.push(`BT /F1 ${size} Tf ${rgb(col)} rg ${n(this.pw - this.m.r - width(pg, size, false))} 30 Td (${esc(pg)}) Tj ET`);
        if (this.footer) {
          const f = encode(this.footer);
          p.ops.push(`BT /F1 ${size} Tf ${rgb(col)} rg ${n(this.m.l)} 30 Td (${esc(f)}) Tj ET`);
        }
      });
      const objs = [];
      const imgBase = 5, pageBase = imgBase + this.images.length;
      const kids = this.pages.map((_, i) => `${pageBase + i * 2 + 1} 0 R`).join(' ');
      objs[1] = '<< /Type /Catalog /Pages 2 0 R >>';
      objs[2] = `<< /Type /Pages /Kids [${kids}] /Count ${total} >>`;
      objs[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>';
      objs[4] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>';
      this.images.forEach((im, i) => {
        objs[imgBase + i] = `<< /Type /XObject /Subtype /Image /Width ${im.w} /Height ${im.h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${im.bin.length} >>\nstream\n${im.bin}\nendstream`;
      });
      this.pages.forEach((p, i) => {
        const content = p.ops.join('\n');
        const cNum = pageBase + i * 2, pNum = cNum + 1;
        const xo = [...p.xobj].map((k) => `/Im${k} ${imgBase + k} 0 R`).join(' ');
        objs[cNum] = `<< /Length ${content.length} >>\nstream\n${content}\nendstream`;
        objs[pNum] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${n(this.pw)} ${n(this.ph)}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >>${xo ? ` /XObject << ${xo} >>` : ''} >> /Contents ${cNum} 0 R >>`;
      });
      let out = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';
      const offs = [];
      for (let i = 1; i < objs.length; i++) { offs[i] = out.length; out += `${i} 0 obj\n${objs[i]}\nendobj\n`; }
      const xref = out.length;
      out += `xref\n0 ${objs.length}\n0000000000 65535 f \n`;
      for (let i = 1; i < objs.length; i++) out += String(offs[i]).padStart(10, '0') + ' 00000 n \n';
      out += `trailer\n<< /Size ${objs.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
      const bytes = new Uint8Array(out.length);
      for (let i = 0; i < out.length; i++) bytes[i] = out.charCodeAt(i) & 0xff;
      return new Blob([bytes], { type: 'application/pdf' });
    }
  }
  return { Doc, encode, width };
})();
