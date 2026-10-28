'use strict';

const { spawnSync } = require('node:child_process');

function validGithubLogin(value) {
  return typeof value === 'string'
    && /^[a-z0-9](?:[a-z0-9-]{0,37}[a-z0-9])?$/i.test(value)
    && !value.includes('--');
}

function normalizeGithubLogin(value) {
  const login = typeof value === 'string' ? value.trim().replace(/^@/, '') : '';
  if (!validGithubLogin(login)) throw new Error('GitHub 用户名不能为空，且应填写用户名本身，不是展示名、邮箱或个人主页链接');
  return login;
}

function resolveGithubLogin(explicit, { run = spawnSync, env = process.env } = {}) {
  // Explicit attribution always wins, including when a maintainer imports someone else's work.
  if (explicit !== undefined) return normalizeGithubLogin(explicit);
  if (env.GITHUB_ACTIONS === 'true') throw new Error('CI 中必须通过 --github 明确指定贡献者，不能使用机器人或合并者账号代填');
  const result = run('gh', ['api', '--hostname', 'github.com', 'user', '--jq', '.login'], {
    encoding: 'utf8', windowsHide: true, timeout: 15000,
    env: { ...env, GH_PROMPT_DISABLED: '1' },
  });
  if (result.error || result.status !== 0) {
    throw new Error('未能读取 GitHub 登录账号。请完成 gh auth login，或用 --github 指定贡献者用户名；尚未创建版本目录');
  }
  return normalizeGithubLogin(result.stdout.trim());
}

function githubParticipantErrors(meta) {
  if (!Array.isArray(meta?.participants) || meta.participants.length === 0) return ['participants 至少包含一位贡献者'];
  return meta.participants.flatMap((participant, index) => validGithubLogin(participant?.github)
    ? [] : [`participants[${index}].github 必须填写有效的 GitHub 用户名`]);
}

module.exports = { validGithubLogin, normalizeGithubLogin, resolveGithubLogin, githubParticipantErrors };
