// 状态检查（不进正式构建）：5.1 速度 / 暂停 / 上一步下一步、9.2 开跑 / 重新开跑 / 中途换指标、章节抽屉。
// 在 measure.html 上运行（harness.js 接管 IntersectionObserver）。只核对状态与数值，不代表动画观感。结果写到 window.__state。
(async () => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const io = () => (window.__io ? window.__io() : null);
  const go = async (sel) => { document.querySelector(sel).scrollIntoView({ behavior: 'instant', block: 'start' }); window.scrollBy(0, -60); await sleep(80); io(); await sleep(60); };
  const btn = (root, text) => [...root.querySelectorAll('button')].find((b) => b.textContent.trim() === text);
  const radio = (root, text) => [...root.querySelectorAll('[role=radio]')].find((b) => b.textContent.trim() === text);
  const R = { vw: innerWidth, vh: innerHeight };
  document.documentElement.style.scrollBehavior = 'auto';  // 后台窗格里平滑滚动不推进
  await sleep(1000); io();

  // ---- 5.1 ----
  const m = document.querySelector('[id="m-5.1"]');
  await go('[id="m-5.1"]');
  const stepNo = () => Number(/第\s*(\d+)\s*\//.exec(m.querySelector('.dp-stepper-count').textContent)[1]);
  const playLabel = () => (btn(m, '暂停') ? '暂停' : '自动播放');
  const s = {};
  btn(m, '下一步').click(); await sleep(30); btn(m, '下一步').click(); await sleep(30); btn(m, '下一步').click(); await sleep(60);
  s.after3Next = stepNo();
  btn(m, '上一步').click(); await sleep(60);
  s.afterPrev = stepNo();
  radio(m, '快').click(); await sleep(30);
  btn(m, '自动播放').click(); await sleep(60);
  s.playingLabel = playLabel();
  const t0 = stepNo(); await sleep(2100); s.fastAdvancedIn2s = stepNo() - t0;
  btn(m, '暂停').click(); await sleep(60);
  s.pausedLabel = playLabel();
  const t1 = stepNo(); await sleep(2000); s.advancedWhilePaused = stepNo() - t1;
  radio(m, '慢').click(); await sleep(30);
  btn(m, '自动播放').click(); await sleep(60);
  const t2 = stepNo(); await sleep(2100); s.slowAdvancedIn2s = stepNo() - t2;
  // 播放中点“上一步”：停止播放并退一步
  const t3 = stepNo(); btn(m, '上一步').click(); await sleep(60);
  s.prevDuringPlay = { from: t3, to: stepNo(), label: playLabel() };
  // 播放中滚出视口：计时暂停，回来后继续
  radio(m, '快').click(); await sleep(30); btn(m, '自动播放').click(); await sleep(60);
  window.scrollTo(0, 0); await sleep(80); io();
  const t4 = stepNo(); await sleep(2000); s.advancedOffscreen = stepNo() - t4;
  await go('[id="m-5.1"]'); await sleep(2100); s.resumedAfterReturn = stepNo() - t4;
  btn(m, '暂停') && btn(m, '暂停').click(); await sleep(30);
  btn(m, '重置') && btn(m, '重置').click(); await sleep(60);
  s.afterReset = stepNo();
  s.codeLineOn = !!m.querySelector('.is-on, .is-cur, [aria-current]');
  R.m51 = s; window.__statePart = R;

  // ---- 9.2 ----
  const r = document.querySelector('[id="m-9.2"]');
  await go('[id="m-9.2"]');
  const lanes = () => [...r.querySelectorAll('.dp-lane')].map((l) => ({ name: l.textContent.trim().slice(0, 8), ratio: !!l.querySelector('em') }));
  const arrivedN = () => lanes().filter((l) => l.ratio).length;
  // 只数跑道的 Web Animations（不含 CSS 过渡）
  const anims = () => r.getAnimations({ subtree: true }).filter((a) => !(a instanceof CSSTransition) && !(a instanceof CSSAnimation)).length;
  const main = () => btn(r, '开跑') ? '开跑' : (btn(r, '重新开跑') ? '重新开跑' : '无');
  const q = {};
  radio(r, '快').click(); await sleep(30);
  q.idle = { button: main(), ratios: arrivedN(), anims: anims() };
  btn(r, '开跑').click(); await sleep(80);
  q.started = { button: main(), ratios: arrivedN(), anims: anims() };
  await sleep(1450);
  q.at1530ms = { ratios: arrivedN(), lanes: lanes() };
  await sleep(500);
  q.at2030ms = { button: main(), ratios: arrivedN(), anims: anims() };
  // 中途重新开跑：到达标记清零，从头计时
  btn(r, '开跑').click(); await sleep(700);
  btn(r, '重新开跑').click(); await sleep(80);
  q.replayMid = { button: main(), ratios: arrivedN(), anims: anims() };
  await sleep(1000);
  q.replayAt1080ms = { ratios: arrivedN() };
  // 中途换指标：动画取消，停在新指标的静态终点
  btn(r, '重新开跑').click(); await sleep(600);
  radio(r, '预填充 s').click(); await sleep(80);
  q.switchMid = { button: main(), ratios: arrivedN(), anims: anims(), aria: (r.querySelector('.dp-race') || {}).getAttribute?.('aria-label')?.slice(0, 40) };
  await sleep(2000);
  q.switchAfter2s = { ratios: arrivedN(), anims: anims() };
  radio(r, '理论 TFLOPs').click(); await sleep(80);
  q.tflop = { button: main(), ratios: arrivedN() };
  radio(r, '端到端延迟 s').click(); await sleep(80); radio(r, '中')?.click(); await sleep(60);
  R.m92 = q;

  // ---- 章节抽屉 ----
  const side = document.querySelector('.slide-sidebar');
  // 后台窗格里 CSS 过渡不推进，所以看目标状态：类名 + 关掉过渡后的计算样式
  const open = () => { const t = side.style.transition; side.style.transition = 'none'; const v = getComputedStyle(side).transform === 'none'; side.style.transition = t; return v && side.classList.contains('is-open'); };
  const d = { topbar: getComputedStyle(document.querySelector('.v9-topbar')).display !== 'none', initiallyOpen: open() };
  if (d.topbar) {
    document.querySelector('.v9-menu').click(); await sleep(260);
    d.afterMenu = { open: open(), scrim: !!document.querySelector('.v9-scrim'), expanded: document.querySelector('.v9-menu').getAttribute('aria-expanded') };
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); await sleep(260);
    d.afterEsc = { open: open(), scrim: !!document.querySelector('.v9-scrim') };
    document.querySelector('.v9-menu').click(); await sleep(260);
    document.querySelector('.v9-scrim').click(); await sleep(260);
    d.afterScrim = { open: open() };
    document.querySelector('.v9-menu').click(); await sleep(260);
    [...side.querySelectorAll('.side-item')][7].click(); await sleep(600);
    d.afterChapterClick = { open: open(), hash: location.hash, nearChap8: Math.abs(document.getElementById('chap-8').getBoundingClientRect().top) < 200 };
  }
  R.drawer = d;
  window.__state = R;
})();
