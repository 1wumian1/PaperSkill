// 同一组操作分别在修改前 / 修改后的 measure.html?all=1 上运行（1440×900，减少动态效果关闭）。
// 结果写到 window.__result。
(async () => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const R = {};
  document.documentElement.style.scrollBehavior = 'auto';
  const io = () => (window.__io ? window.__io() : null);
  const go = async (sel) => { document.querySelector(sel).scrollIntoView({ behavior: 'instant', block: 'start' }); await sleep(80); io(); await sleep(20); };
  const cv = (sel) => document.querySelector(sel + ' canvas');
  const setRange = (el, v) => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, String(v)); el.dispatchEvent(new Event('input', { bubbles: true })); };
  await sleep(800);
  io();

  // S1 停在封面 2 秒（120 帧），全部章节已展开
  window.scrollTo(0, 0); await sleep(80); io();
  await __pump(10);
  R.S1_cover_idle = __summary(await __pump(120));

  // S2 停在 §5.1 2 秒
  await go('#m-5\\.1');
  await __pump(10);
  R.S2_at_5_1_idle = __summary(await __pump(120));

  // S3 拖动 §3.1 保留比例滑块：每帧改一次值，共 10 帧；松手后画面多少帧才静止
  await go('#m-3\\.1');
  const s3 = document.querySelector('#m-3\\.1 input[type=range]');
  for (let i = 1; i <= 10; i += 1) { setRange(s3, 9.8 + i * 3); await __pump(1); }
  R.S3_slider_settle_frames = await __settle(cv('#m-3\\.1'));

  // S4 §2.1 点“场景 B”：画面多少帧后静止
  await go('#m-2\\.1');
  [...document.querySelectorAll('#m-2\\.1 [role=radio]')].find((b) => b.textContent.includes('B')).click();
  await sleep(30);
  R.S4_click_settle_frames = await __settle(cv('#m-2\\.1'));

  // S5 §5.1 连点 5 次“下一步”（中间不给帧），再反向点 2 次“上一步”
  await go('#m-5\\.1');
  const btn = (t) => [...document.querySelectorAll('#m-5\\.1 button')].find((b) => b.textContent.trim() === t);
  for (let i = 0; i < 5; i += 1) btn('下一步').click();
  btn('上一步').click(); btn('上一步').click();
  await sleep(30);
  R.S5_rapid_clicks_settle_frames = await __settle(cv('#m-5\\.1'));
  R.S5_step_label = (document.querySelector('#m-5\\.1 .dp-stepper-count') || {}).textContent;

  // S6 §9.2 点“开跑”：跑动期间每帧 React 是否改写 DOM（数跑道样式变更次数）
  await go('#m-9\\.2');
  let mutations = 0;
  const mo = new MutationObserver((list) => { mutations += list.length; });
  mo.observe(document.querySelector('#m-9\\.2'), { attributes: true, subtree: true, attributeFilter: ['style'] });
  [...document.querySelectorAll('#m-9\\.2 button')].find((b) => b.textContent.includes('开跑')).click();
  const s6 = await __pump(200);
  mo.disconnect();
  R.S6_race = { ...__summary(s6), styleMutations: mutations };

  // S7 停在 §9.2 之后 2 秒：此时全部画布都在屏外或静止
  R.S7_at_9_2_idle = __summary(await __pump(120));

  // S8 §2.1 点“场景 C”后第 5 帧滚走：屏外期间是否还在画；回来时画面是否直接是最终状态（学习进度不丢）
  await go('#m-2\\.1');
  [...document.querySelectorAll('#m-2\\.1 [role=radio]')].find((b) => b.textContent.includes('C')).click();
  await sleep(30);
  await __pump(5);
  await go('#m-9\\.2');
  R.S8_offscreen_mid_animation = __summary(await __pump(60));
  await go('#m-2\\.1');
  await __pump(1);
  const back = __hash(cv('#m-2\\.1'));
  await __pump(120);
  R.S8_back_is_final = back === __hash(cv('#m-2\\.1'));
  R.S8_label = [...document.querySelectorAll('#m-2\\.1 [role=radio]')].find((b) => b.getAttribute('aria-checked') === 'true').textContent;

  // S9 回到封面再停 7 秒（420 帧）：封面播放结束后是否停止
  window.scrollTo(0, 0); await sleep(80); io();
  await __pump(420);
  R.S9_cover_after_7s = __summary(await __pump(60));
  R.pendingLoops = __pending();
  window.__result = R;
})();
'started';
