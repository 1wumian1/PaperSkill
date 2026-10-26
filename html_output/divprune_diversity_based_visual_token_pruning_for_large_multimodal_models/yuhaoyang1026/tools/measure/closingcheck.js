// 收束页手机检查（不进正式构建）：结论分级每个分类、每个条目，术语表每个词条——
// 先滚到可见处，用 elementFromPoint 取按钮中心点上的元素（确认没被别的元素盖住），对该元素点击，再核对选中项与详情。结果写到 window.__closing。
window.__closingCheck = async () => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const tap = async (btn) => {
    btn.scrollIntoView({ block: 'center', behavior: 'instant' }); await sleep(30);
    const r = btn.getBoundingClientRect();
    const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    const ok = !!hit && (hit === btn || btn.contains(hit));
    (hit || btn).click(); await sleep(40);
    return { ok, w: Math.round(r.width), h: Math.round(r.height) };
  };
  const R = { vw: innerWidth, vh: innerHeight, verdict: [], glossary: [] };
  // 结论分级
  const v = document.getElementById('verdict');
  const cats = [...v.querySelectorAll('[role=radio]')];
  for (const c of cats) {
    const ct = await tap(c);
    const list = [...v.querySelectorAll('.dp-end-list button')];
    const items = [];
    for (const b of list) {
      const t = await tap(b);
      const claim = b.querySelector('span:last-child').textContent.trim();
      const on = [...v.querySelectorAll('.dp-end-list button.is-on')];
      const title = v.querySelector('.dp-end-panel .dp-h').textContent.trim();
      items.push({ hitOk: t.ok, synced: on.length === 1 && on[0] === b && title === claim && b.getAttribute('aria-pressed') === 'true' });
    }
    const lr = v.querySelector('.dp-end-list').getBoundingClientRect(), pr = v.querySelector('.dp-end-panel').getBoundingClientRect();
    R.verdict.push({ cat: c.textContent.trim(), catHitOk: ct.ok, catOn: c.getAttribute('aria-checked') === 'true', n: items.length,
      allHit: items.every((x) => x.hitOk), allSynced: items.every((x) => x.synced),
      stacked: pr.top >= lr.bottom - 1, listW: Math.round(lr.width), panelW: Math.round(pr.width) });
  }
  cats[0].click(); await sleep(30);
  // 术语表
  const g = document.getElementById('glossary');
  const btns = [...g.querySelectorAll('.dp-gl-grid button')];
  for (const b of btns) {
    const t = await tap(b);
    const on = [...g.querySelectorAll('.dp-gl-grid button.is-on')];
    const title = g.querySelector('.dp-end-panel .dp-h').textContent.trim();
    const fullyVisible = b.scrollWidth <= b.clientWidth + 1 && b.scrollHeight <= b.clientHeight + 1;
    R.glossary.push({ label: b.textContent.trim(), hitOk: t.ok, synced: on.length === 1 && on[0] === b && b.getAttribute('aria-pressed') === 'true', title, fullyVisible, size: t.w + '×' + t.h });
  }
  const gr = g.querySelector('.dp-gl-grid').getBoundingClientRect(), gp = g.querySelector('.dp-end-panel').getBoundingClientRect();
  R.glossaryLayout = { stacked: gp.top >= gr.bottom - 1, gridW: Math.round(gr.width), panelW: Math.round(gp.width), cols: getComputedStyle(g.querySelector('.dp-gl-grid')).gridTemplateColumns.split(' ').length };
  R.pageScrollX = document.documentElement.scrollWidth > innerWidth + 1;
  return R;
};
