import React, { useState } from 'react';

const llavaCover = 'https://i2.hdslb.com/bfs/archive/45255bbb4642d49acd87636b079bcbebfdc16f16.jpg@1200w_630h';
const sinksCover = 'https://i1.hdslb.com/bfs/archive/34c1d728b150015446c5786bb46ae0bc03709729.jpg@1200w_630h';
const fastvCover = 'https://i0.hdslb.com/bfs/archive/fce22259000879d1114b55ec0f422659b3c78ed0.jpg@1200w_630h';

// 标题、UP 主、时长与封面于 2026-11-01 核对 B 站原页面。
// 三段均为 VTW 的背景 / 对照材料，不作为 VTW 本篇的专题讲解或实验依据。
// 封面引用 B 站原图床；不打包第三方封面，也不请求动态接口或加载播放器。
const VIDEOS = [
  {
    bvid: 'BV12PznYuExg',
    title: 'LLaVA / LLaVA-1.5 / LLaVA-NeXT：多模态模型结构',
    sourceTitle: '看傻眼！LLaVA多模态模型最简单的模型，最强的效果！LLaVA LLaVA-1.5 LLaVA-NeXT',
    up: 'RethinkFun',
    duration: '15:14',
    label: '模型背景',
    cover: llavaCover,
    why: '§1 背景：了解视觉编码器、投影层与 LLM 的关系，再看输入序列里视觉 token 的计算账单。',
  },
  {
    bvid: 'BV1KSeFzUEJg',
    title: '从 StreamingLLM 到 GPT-OSS：注意力汇机制解析',
    sourceTitle: '【论文分享】从StreamingLLM到GPT-OSS：注意力汇机制解析',
    up: '机器之心官方',
    duration: '40:44',
    label: '注意力汇',
    cover: sinksCover,
    why: '§3 现象：补看 attention sink，再区分“注意力少”和“信息已经迁移”这两个判断。',
  },
  {
    bvid: 'BV16D1vYRE8b',
    title: 'FastV：An Image is Worth 1/2 Tokens After Layer 2',
    sourceTitle: 'ECCV2024 Oral - FastV: An Image is Worth 1/2 Tokens After Layer 2',
    up: 'modricwang',
    duration: '09:44',
    label: 'FastV 对照 · 英文',
    cover: fastvCover,
    why: '§2 / §9 对照：了解 FastV 的注意力剪枝，再比较 VTW 在某层整体撤出视觉 token 的做法。',
  },
] as const;

export function Videos() {
  const [badCovers, setBadCovers] = useState<Record<string, boolean>>({});

  return (
    <section className="dl-related-section vtw-videos" id="videos" aria-labelledby="videos-t">
      <h3 id="videos-t">延伸学习 · B 站讲解视频</h3>
      <p>想补基础看 LLaVA，想理解现象看注意力汇，想比较方法看 FastV。</p>
      <div className="dl-video-strip">
        {VIDEOS.map((video) => (
          <a
            key={video.bvid}
            className="dl-video-card"
            href={`https://www.bilibili.com/video/${video.bvid}/`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`在 B 站打开：${video.sourceTitle}（新标签页）`}
            data-bvid={video.bvid}
          >
            <div className={`dl-video-link-cover ${badCovers[video.bvid] ? '' : 'is-loaded'}`}>
              {!badCovers[video.bvid] ? (
                <img
                  className="dl-video-cover-img"
                  src={video.cover}
                  alt=""
                  referrerPolicy="no-referrer"
                  loading="lazy"
                  decoding="async"
                  width="640"
                  height="360"
                  onError={() => setBadCovers((previous) => ({ ...previous, [video.bvid]: true }))}
                />
              ) : null}
              <span className="dl-video-play" aria-hidden="true">▶</span>
              <span className="dl-video-link-tag">{video.label}</span>
              <span className="dl-video-duration">{video.duration}</span>
            </div>
            <strong title={video.sourceTitle}>{video.title}</strong>
            <div className="dl-video-meta"><span>{video.up}</span><span>B 站 ↗</span></div>
            <div className="dl-video-why">{video.why}</div>
          </a>
        ))}
      </div>
      <p className="vtw-video-note">这三段用于背景与方法对照；VTW 的撤出层、KL 校准和实验数字，以论文与官方代码为准。</p>
    </section>
  );
}
