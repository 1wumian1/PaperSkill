// 复查脚本（不进正式构建）：4.1 角度×长度组合、6.1 复现步骤与筛选切换、全部卡片的状态扫描。结果写到 window.__recheck。
(async () => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  await sleep(1200);
  const R = { vw: innerWidth, vh: innerHeight };
  const setR = (el, v) => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, String(v)); el.dispatchEvent(new Event('input', { bubbles: true })); };

  // ---- 4.1：每条线的端点、每段文字都在画布内；读数卡不越界不裁切；读数与公式一致 ----
  const m41 = document.querySelector('#m-4\\.1');
  const cv41 = m41.querySelector('canvas');
  const C2 = CanvasRenderingContext2D.prototype;
  let pts = [], txt = [];
  for (const fn of ['moveTo', 'lineTo']) { const o = C2[fn]; C2[fn] = function (x, y) { if (this.canvas === cv41) pts.push([x, y]); return o.call(this, x, y); }; }
  const ft = C2.fillText;
  C2.fillText = function (t, x, y, mw) {
    if (this.canvas === cv41) { const w = this.measureText(String(t)).width, al = this.textAlign; const l = al === 'center' ? x - w / 2 : (al === 'right' || al === 'end') ? x - w : x; txt.push([String(t), l, l + w, y]); }
    return ft.call(this, t, x, y, mw);
  };
  const [sDeg, sLen] = m41.querySelectorAll('input[type=range]');
  const res41 = [];
  for (const deg of [0, 90, 180]) for (const len of [0.3, 1, 1.6]) {
    pts = []; txt = [];
    setR(sDeg, deg); await sleep(30); setR(sLen, len); await sleep(60);
    const vals = [...m41.querySelectorAll('.dp-readouts2 b')].map((b) => +b.textContent);
    const th = (deg * Math.PI) / 180, dc = 1 - Math.cos(th), l2 = Math.hypot(1 - len * Math.cos(th), -len * Math.sin(th));
    const cr = m41.getBoundingClientRect();
    let out = 0, clip = 0;
    m41.querySelectorAll('.dp-readouts2 *').forEach((el) => { if (el.getBoundingClientRect().right > cr.right + 1) out++; });
    m41.querySelectorAll('.dp-readouts2, .dp-readouts2 *').forEach((el) => { if (el.clientWidth && el.scrollWidth > el.clientWidth + 2) clip++; });
    const labels = txt.map((t) => t[0]);
    res41.push({ deg, len, badPts: pts.filter(([x, y]) => x < 0 || x > 760 || y < 0 || y > 546).length, badTxt: txt.filter(([, l, r, y]) => l < 0 || r > 760 || y < 20 || y > 546).map((t) => t[0]), hasLabels: ['γ 队', 'ω 队', '营地'].every((k) => labels.includes(k)) && labels.some((k) => k.startsWith('罗盘 θ')), cos: vals[0], l2: vals[1], ok: Math.abs(vals[0] - dc) < 1e-3 && Math.abs(vals[1] - l2) < 1e-3, out, clip });
  }
  const cosConst = [0, 90, 180].every((d) => new Set(res41.filter((r) => r.deg === d).map((r) => r.cos)).size === 1);
  const cards = [...m41.querySelectorAll('.dp-readouts2 > div')].map((d) => Math.round(d.getBoundingClientRect().top));
  R.m41 = { allOk: cosConst && res41.every((r) => !r.badPts && !r.badTxt.length && r.hasLabels && r.ok && !r.out && !r.clip), cosUnchangedWithLength: cosConst, readoutsStacked: cards[0] !== cards[1], fails: res41.filter((r) => r.badPts || r.badTxt.length || !r.hasLabels || !r.ok || r.out || r.clip) };
  setR(sDeg, 50); await sleep(20); setR(sLen, 1); await sleep(20);

  // ---- 6.1：复现步骤 + 五种筛选 + 上下交替选择，每一步核对上下两处是否同一条 ----
  const ch = document.querySelector('#chap-6'), m61 = document.querySelector('#m-6\\.1');
  const strip = (t) => t.replace(/^[✓≠?✗]/, '').trim();
  const snap = (label) => {
    const ovTitle = strip(ch.querySelector('.dp-check-grid button.is-on').textContent);
    const ovNote = ch.querySelector('.dp-check-note').textContent;
    const ovStatus = ch.querySelector('.dp-check-note b').textContent;
    const filt = m61.querySelector('[role=radio][aria-checked=true]').textContent.replace(/\s*\d+$/, '');
    const listTitle = m61.querySelector('.dp-cm-list button.is-on')?.textContent.trim();
    const pTitle = m61.querySelector('.dp-cm-panel .dp-h').textContent;
    const pStatus = m61.querySelector('.dp-cm-panel .dp-st-pill').textContent;
    const pNote = m61.querySelector('.dp-cm-panel .dp-fb').textContent;
    return { label, filt, title: pTitle, ok: ovTitle === pTitle && listTitle === pTitle && ovStatus === pStatus && ovNote.includes(pNote) && (filt === '全部' || filt === pStatus) };
  };
  const filter = async (n) => { [...m61.querySelectorAll('[role=radio]')].find((b) => b.textContent.startsWith(n)).click(); await sleep(50); };
  const over = async (t) => { [...ch.querySelectorAll('.dp-check-grid button')].find((b) => strip(b.textContent) === t).click(); await sleep(50); };
  const list = async (t) => { [...m61.querySelectorAll('.dp-cm-list button')].find((b) => b.textContent.trim() === t).click(); await sleep(50); };
  const log = [];
  await filter('一致'); log.push(snap('6.1 选一致'));
  await over('保留多少个'); log.push(snap('上方点保留多少个'));
  for (const f of ['全部', '一致', '有差异', '论文未说明', '公开代码缺失', '全部']) { await filter(f); log.push(snap('筛选 ' + f)); }
  await filter('有差异'); await list('TFLOPs 公式'); log.push(snap('6.1 点 TFLOPs 公式'));
  await over('批大小'); log.push(snap('上方点批大小'));
  await filter('一致'); log.push(snap('切一致'));
  await over('视频模型与效率脚本'); log.push(snap('上方点视频模型'));
  await list('索引与偏移'); log.push(snap('6.1 点索引与偏移'));
  R.m61 = { allOk: log.every((x) => x.ok), steps: log.length, fails: log.filter((x) => !x.ok) };

  // ---- 全部卡片状态扫描 ----
  const cardCheck = (card) => {
    const cr = card.getBoundingClientRect(); const bad = [];
    card.querySelectorAll('*').forEach((el) => { const r = el.getBoundingClientRect(); if (!r.width) return; if (r.right > cr.right + 1 || r.left < cr.left - 1) bad.push('out ' + String(el.className).split(' ')[0]); });
    card.querySelectorAll('*').forEach((el) => { if (el.tagName === 'CANVAS' || el.tagName === 'INPUT' || el.tagName === 'SELECT' || el.closest('details:not([open])')) return; if (el.clientWidth && (el.scrollWidth > el.clientWidth + 2 || el.scrollHeight > el.clientHeight + 2)) bad.push('clip ' + String(el.className).split(' ')[0] + ' ' + (el.textContent || '').slice(0, 12)); });
    return [...new Set(bad)];
  };
  const bad = []; let checks = 0;
  const cardsAll = [...document.querySelectorAll('.module, .analogy-card, .hero, .dl-related-section')];
  for (const card of cardsAll) {
    const name = card.id || ((card.closest('.chap') || {}).id + ' ' + card.className.split(' ')[0]);
    const audit = (label) => { checks++; const r = cardCheck(card); if (r.length) bad.push([name, label, r.slice(0, 3)]); };
    audit('default');
    for (const g of [...card.querySelectorAll('[role=radiogroup]')]) { const radios = [...g.querySelectorAll('[role=radio]')]; for (const r of radios) { r.click(); await sleep(50); audit(g.getAttribute('aria-label') + '=' + r.textContent); } radios[0]?.click(); await sleep(20); }
    for (const el of [...card.querySelectorAll('input[type=range]')]) { const v0 = el.value; for (const f of [0, 1]) { setR(el, f ? el.max : el.min); await sleep(40); audit('range ' + f); } setR(el, v0); await sleep(20); }
    for (const c of card.querySelectorAll('input[type=checkbox]')) { c.click(); await sleep(50); audit('check'); c.click(); await sleep(20); }
    for (const b of [...card.querySelectorAll('button[aria-pressed]')]) { b.click(); await sleep(30); audit('pressed ' + b.textContent.slice(0, 8)); }
    const det = card.querySelector('details'); if (det) { det.open = true; await sleep(20); audit('notes'); det.open = false; }
  }
  R.sweep = { cards: cardsAll.length, checks, bad: bad.slice(0, 8), nbad: bad.length };
  R.pageScrollX = document.documentElement.scrollWidth > innerWidth + 1;
  window.__recheck = R;
})();
