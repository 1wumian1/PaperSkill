'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { test } = require('node:test');
const { resolveGithubLogin, githubParticipantErrors } = require('../lib/github-identity');

test('explicit contributor wins over logged-in maintainer and malformed identities never trigger fallback', () => {
  const run = () => assert.fail('must not query the maintainer account');
  assert.equal(resolveGithubLogin(' @original-author ', { run }), 'original-author');
  for (const value of ['', ' ', 'Display Name', 'https://github.com/person', 'a--b']) {
    assert.throws(() => resolveGithubLogin(value, { run }), /用户名/);
  }
});

test('missing identity reads authenticated GitHub login, while auth failures and CI stop', () => {
  const run = (command, args) => {
    assert.equal(command, 'gh');
    assert.deepEqual(args, ['api', '--hostname', 'github.com', 'user', '--jq', '.login']);
    return { status: 0, stdout: 'actual-contributor\n' };
  };
  assert.equal(resolveGithubLogin(undefined, { run, env: {} }), 'actual-contributor');
  assert.throws(() => resolveGithubLogin(undefined, { run: () => ({ status: 1 }), env: {} }), /gh auth login/);
  assert.throws(() => resolveGithubLogin(undefined, { run: () => ({ error: new Error('ENOENT') }), env: {} }), /--github/);
  assert.throws(() => resolveGithubLogin(undefined, { run: () => assert.fail('no CI attribution inference'), env: { GITHUB_ACTIONS: 'true' } }), /CI/);
  assert.deepEqual(githubParticipantErrors({ participants: [{ name: 'A', github: 'a' }, { name: 'B' }] }), ['participants[1].github 必须填写有效的 GitHub 用户名']);
});

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'paperskill-identity-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, 'scripts/lib'), { recursive: true });
  for (const file of ['import-paper.js', 'modify-version.js', 'validate-pr-scope.js', 'lib/repository.js', 'lib/github-identity.js']) {
    fs.copyFileSync(path.join(__dirname, '..', file), path.join(root, 'scripts', file));
  }
  fs.mkdirSync(path.join(root, 'paper-skill'));
  fs.writeFileSync(path.join(root, 'paper-skill/VERSION'), '1.0.0');
  fs.mkdirSync(path.join(root, 'source'));
  fs.writeFileSync(path.join(root, 'source/package.json'), '{"name":"fixture"}');
  const preload = path.join(root, 'preload.cjs');
  fs.writeFileSync(preload, `
    const cp = require('node:child_process');
    const original = cp.spawnSync;
    cp.spawnSync = function(command, args, options) {
      if (command === 'gh') return process.env.TEST_AUTH_FAIL === 'true'
        ? {status: 1, stdout: ''} : {status: 0, stdout: 'logged-in-author\\n'};
      if (command === 'git') return {status: 0, stdout: process.env.TEST_DIFF || ''};
      return original(command, args, options);
    };
  `);
  const event = path.join(root, 'event.json');
  fs.writeFileSync(event, JSON.stringify({ pull_request: { head: { repo: { full_name: 'owner/repo' } }, base: { repo: { full_name: 'owner/repo' } } } }));
  const run = (script, args, extra = {}) => spawnSync(process.execPath, ['--require', preload, path.join(root, 'scripts', script), ...args], {
    cwd: root, encoding: 'utf8', env: { ...process.env, GITHUB_ACTIONS: 'false', GITHUB_BASE_REF: '', GITHUB_EVENT_PATH: event, ...extra },
  });
  const read = (version) => JSON.parse(fs.readFileSync(path.join(root, 'html_output/test_paper', version, 'paper.json'), 'utf8'));
  return { root, run, read };
}

test('real import and modify CLIs write the authenticated contributor; missing login creates no version', (t) => {
  const { root, run, read } = fixture(t);
  const args = ['source', 'test_paper', '--title', 'Test paper', '--paper-url', 'https://arxiv.org/abs/1706.03762', '--participant', 'Alice', '--date', '2026-10-27', '--version', 'alice1027'];
  let result = run('import-paper.js', args);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.equal(read('alice1027').participants[0].github, 'logged-in-author');
  result = run('modify-version.js', ['test_paper/alice1027', '--participant', 'Bob', '--version', 'bob1027', '--date', '2026-10-27']);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.equal(read('bob1027').participants[0].github, 'logged-in-author');
  assert.deepEqual(read('bob1027').ancestors, [{ github: 'logged-in-author', version: 'alice1027' }]);
  result = run('import-paper.js', args.map((value) => value === 'alice1027' ? 'failed1027' : value), { TEST_AUTH_FAIL: 'true' });
  assert.notEqual(result.status, 0);
  assert.ok(!fs.existsSync(path.join(root, 'html_output/test_paper/failed1027')));
  result = run('modify-version.js', ['test_paper/alice1027', '--participant', 'Bob', '--version', 'failed1027'], { TEST_AUTH_FAIL: 'true' });
  assert.notEqual(result.status, 0);
  assert.ok(!fs.existsSync(path.join(root, 'html_output/test_paper/failed1027')));
});

test('PR validation blocks missing usernames in edited metadata, without blocking untouched legacy versions', (t) => {
  const { root, run } = fixture(t);
  const dir = path.join(root, 'html_output/test_paper/legacy1016');
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, 'paper.json');
  fs.writeFileSync(file, JSON.stringify({ participants: [{ name: 'Legacy' }] }));
  let result = run('validate-pr-scope.js', [], { GITHUB_BASE_REF: 'main', TEST_DIFF: 'M\tdocs/example.md\n' });
  assert.equal(result.status, 0, result.stdout + result.stderr);
  const env = { GITHUB_BASE_REF: 'main', TEST_DIFF: 'M\thtml_output/test_paper/legacy1016/paper.json\n' };
  result = run('validate-pr-scope.js', [], env);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /participants\[0\]\.github/);
  fs.writeFileSync(file, JSON.stringify({ participants: [{ name: 'Legacy', github: 'actual-author' }] }));
  result = run('validate-pr-scope.js', [], env);
  assert.equal(result.status, 0, result.stdout + result.stderr);
});
