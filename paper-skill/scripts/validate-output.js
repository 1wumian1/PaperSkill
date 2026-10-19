#!/usr/bin/env node
/*
 * validate-output.js — automated structural validator for the paper-skill React + TS output.
 *
 * Runs as a hard gate after the project folder is generated (see scripts/validation-checklist.md).
 * Checks:
 *   1. required framework files exist (index.html, package.json, src/main.tsx, App.tsx,
 *      types.ts, src/data/tutorial.ts, styles, src/modules/registry.tsx, configs).
 *   2. at least one chapter; report chapter and scene counts without a range gate.
 *   3. the tutorial declares active modules; evidence-only chapters are allowed.
 *   4. no leftover template placeholders (__XXX__, __METAPHOR_CSS__, TBD, TODO) in
 *      src/data/tutorial.ts, src/styles/paper.css, or src/modules/*.
 *   5. every Bilibili bvid (if any) is a real `BV...` (empty bvid tolerated as "omit").
 *   6. every componentId referenced in tutorial.ts is registered in src/modules/registry.tsx
 *      Every referenced widget must be registered by the paper-specific packet.
 *   7. shared PPT framework matches the copied template byte-for-byte.
 *   8. syntax parse of every project source file (src/** and vite config) with TypeScript or
 *      esbuild; catches truncated or unbalanced files before the repository CI build.
 *
 * Usage: node scripts/validate-output.js <path-to>/<paper-short-name>_output
 * Exits 0 on pass, 1 on any failure, 2 on usage error.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { checkProject } = require('./syntax-check.js');

function fail(msg) {
  console.error('  ✗ ' + msg);
  return false;
}
function ok(msg) {
  console.log('  ✓ ' + msg);
  return true;
}

function readSafe(p) {
  try {
    return fs.readFileSync(p, 'utf8');
  } catch (e) {
    return null;
  }
}

function findTemplateDir() {
  return [
    path.join(__dirname, 'assets', 'react-template'),
    path.join(__dirname, '..', 'assets', 'react-template'),
  ].find(candidate => fs.existsSync(path.join(candidate, 'src', 'App.tsx')));
}

function listFiles(dir, prefix = '') {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const relative = path.join(prefix, entry.name);
    if (entry.isDirectory()) return listFiles(path.join(dir, entry.name), relative);
    return entry.isFile() ? [relative] : [];
  });
}

function frameworkPaths(templateDir) {
  const fixed = [
    'vite.config.ts', 'tsconfig.json', 'src/vite-env.d.ts', 'src/main.tsx',
    'src/App.tsx', 'src/types.ts', 'src/styles/tokens.css',
    'src/styles/components.css', 'src/styles/presentation.css',
  ];
  return [
    ...fixed,
    ...listFiles(path.join(templateDir, 'src', 'components')).map(file => path.join('src', 'components', file)),
    ...listFiles(path.join(templateDir, 'src', 'lib')).map(file => path.join('src', 'lib', file)),
  ];
}

// Best-effort helpers below keep string/template content visible so URLs and copy survive when
// scanning for placeholders. Real syntax checking is delegated to syntax-check.js.
function stripComments(s) {
  let out = '';
  let inStr = null;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inStr) {
      if (c === '\\') { out += c; i++; continue; }
      if (c === inStr) inStr = null;
      out += c;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') { inStr = c; out += c; continue; }
    if (c === '/' && s[i + 1] === '/') { while (i < s.length && s[i] !== '\n') i++; out += '\n'; continue; }
    if (c === '/' && s[i + 1] === '*') {
      const j = s.indexOf('*/', i + 2);
      i = j < 0 ? s.length : j + 1;
      continue;
    }
    out += c;
  }
  return out;
}

/* Removed: the previous best-effort bracesBalanced() heuristic. syntax-check.js runs a real
 * TypeScript/esbuild parse over every source file instead of counting brackets. */

function main() {
  const dir = process.argv[2];
  if (!dir) {
    console.error('Usage: node scripts/validate-output.js <path-to>/<paper-short-name>_output');
    process.exit(2);
  }
  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
    console.error('Not a directory: ' + dir);
    process.exit(2);
  }

  console.log('Validating React + TS project folder: ' + dir);
  let allPass = true;

  // --- 1. required files exist ---
  const keyFiles = [
    'package.json',
    'index.html',
    'vite.config.ts',
    'tsconfig.json',
    'src/main.tsx',
    'src/App.tsx',
    'src/types.ts',
    'src/data/tutorial.ts',
    'src/styles/tokens.css',
    'src/styles/components.css',
    'src/styles/presentation.css',
    'src/styles/paper.css',
    'src/modules/registry.tsx',
  ];
  for (const f of keyFiles) {
    if (readSafe(path.join(dir, f)) === null) {
      allPass = fail('missing required file: ' + f);
    } else {
      ok('present: ' + f);
    }
  }

  // --- read the content files ---
  const tutPath = path.join(dir, 'src/data/tutorial.ts');
  const tutRaw = readSafe(tutPath);
  if (tutRaw === null) {
    // already reported as missing above
  } else {
    // tutClean strips documentation comments so hint text mentioning `kind:"chapter"`
    // or `__XXX__` is not mistaken for data. paper.css is scanned RAW because its
    // `__METAPHOR_CSS__` placeholder intentionally lives inside a comment marker.
    const tut = stripComments(tutRaw);
    if (/[,{]\s*['"]?focus['"]?\s*:/.test(tut)) {
      allPass = fail('legacy focus scene bodies are unsupported; give each scene a paper-specific componentId');
    }
    // --- 2 & 3. nonempty chapters and active modules across the tutorial ---
    // Quote-tolerant: tutorial.ts may be hand-written (`kind: "chapter"`) or
    // assembled from JSON packets via JSON.stringify (`"kind": "chapter"`).
    const chapterCount = (tut.match(/["']?kind["']?\s*:\s*["']chapter["']/g) || []).length;
    const moduleCount = (tut.match(/["']?kind["']?\s*:\s*["']module["']/g) || []).length;

    if (chapterCount === 0) {
      allPass = fail('tutorial has no chapters');
    } else {
      ok(`chapter count = ${chapterCount} (no numeric limit)`);
    }

    if (moduleCount === 0) {
      allPass = fail('tutorial has no active modules');
    } else {
      ok(`${moduleCount} declared active modules; method coverage requires visual review`);
    }

    // --- 4. leftover placeholders ---
    const phRe = /__[A-Za-z0-9_]+__|__METAPHOR_CSS__|PAPER_SKILL_DEMO_CONTENT|\bTBD\b|\bTODO\b/;
    const paperCss = readSafe(path.join(dir, 'src/styles/paper.css')) || '';
    let moduleConcat = '';
    const modulesDir = path.join(dir, 'src/modules');
    if (fs.existsSync(modulesDir) && fs.statSync(modulesDir).isDirectory()) {
      for (const f of fs.readdirSync(modulesDir)) {
        if (f.endsWith('.ts') || f.endsWith('.tsx')) {
          moduleConcat += '\n' + (readSafe(path.join(modulesDir, f)) || '');
        }
      }
    }
    const scanTargets = [
      ['src/data/tutorial.ts', tut],
      ['src/styles/paper.css', paperCss],
      ['src/modules/*', moduleConcat],
    ];
    for (const [label, content] of scanTargets) {
      if (phRe.test(content)) {
        allPass = fail(`leftover template placeholder in ${label} (e.g. __XXX__, __METAPHOR_CSS__, TBD, TODO)`);
      } else {
        ok(`no leftover placeholders in ${label}`);
      }
    }
    const genericSlideHeading = /论文机制\s*[\/／]\s*证据|论文原理\s*[\/／]\s*证据|论文出处|来源\s*[\/／]\s*证据|实验\s*[·•]\s*机制示意/;
    const sceneTitles = [...tut.matchAll(/"title"\s*:\s*"([^"]*)"/g)].map(match => match[1]).join('\n');
    if (genericSlideHeading.test(sceneTitles + '\n' + moduleConcat)) {
      allPass = fail('generic paper-evidence heading found in tutorial content; use a specific scientific heading or no subheading');
    } else {
      ok('no generic paper-evidence headings in tutorial content');
    }

    // --- 5. Bilibili bvid check ---
    const bvidRe = /["']?bvid["']?\s*:\s*["']([^"']*)["']/g;
    let bm;
    let total = 0;
    let empty = 0;
    let bad = 0;
    while ((bm = bvidRe.exec(tut)) !== null) {
      total += 1;
      const v = bm[1].trim();
      if (!v) empty += 1;
      else if (!/^BV[0-9A-Za-z]+$/.test(v)) bad += 1;
    }
    if (total === 0) {
      ok('no Bilibili entries (videos optional — OK)');
    } else if (bad > 0) {
      allPass = fail(`${bad} Bilibili entry has an invalid bvid (expected BV...)`);
    } else if (empty > 0) {
      ok(`${empty} empty bvid tolerated (omit the entry or the whole array for no video)`);
    } else {
      ok(`all ${total} Bilibili entries have a valid bvid`);
    }

    // --- 6. componentId registration ---
    const registry = readSafe(path.join(dir, 'src/modules/registry.tsx')) || '';
    const compIds = [...tut.matchAll(/["']?componentId["']?\s*:\s*["']([^"']+)["']/g)].map((m) => m[1]);
    const uniqueIds = [...new Set(compIds)];
    const unregistered = [];
    for (const id of uniqueIds) {
      const re = new RegExp(
        "widgetRegistry\\[['\"]" + id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "['\"]\\]"
      );
      if (!re.test(registry)) unregistered.push(id);
    }
    if (unregistered.length > 0) {
      allPass = fail(`componentId(s) not registered in registry.tsx: ${unregistered.join(', ')}`);
    } else {
      ok(`all ${uniqueIds.length} componentId(s) registered`);
    }

  }

  // Scene-format outputs carry a derived outline.
  if (fs.existsSync(path.join(dir, 'src/styles/presentation.css'))) {
    try {
      const outline = JSON.parse(fs.readFileSync(path.join(dir, 'outlines.json'), 'utf8'));
      if (!Array.isArray(outline.pages) || !outline.pages.length) throw new Error('outline has no pages');
      const ids = new Set(['cover', 'videos']);
      for (const page of outline.pages) {
        for (const field of ['id', 'chapterId', 'title', 'goal', 'summary', 'interaction', 'snippet']) {
          if (typeof page[field] !== 'string' || !page[field].trim()) throw new Error(`page missing ${field}`);
        }
        if (typeof page.next !== 'string') throw new Error(`${page.id}: missing next`);
        if (ids.has(page.id)) throw new Error(`duplicate page id ${page.id}`);
        ids.add(page.id);
      }
      ok(`scene outline contains ${outline.pages.length} unique teaching pages`);
    } catch (error) { allPass = fail(`scene outline: ${error.message}`); }
  }

  // The paper-specific widgets and data vary, but the PPT player and shared styles must
  // remain byte-for-byte identical to the bundled template used by the scaffolder.
  const templateDir = findTemplateDir();
  if (!templateDir) {
    allPass = fail('bundled assets/react-template is missing beside the validator');
  } else {
    const expected = frameworkPaths(templateDir);
    const expectedSet = new Set(expected.map(file => file.replace(/\\/g, '/')));
    for (const relative of expected) {
      const source = path.join(templateDir, relative);
      const target = path.join(dir, relative);
      if (!fs.existsSync(target) || !fs.readFileSync(source).equals(fs.readFileSync(target))) {
        allPass = fail(`framework differs from the PPT template: ${relative.replace(/\\/g, '/')}`);
      }
    }
    for (const part of ['components', 'lib']) {
      for (const file of listFiles(path.join(dir, 'src', part))) {
        const relative = path.join('src', part, file).replace(/\\/g, '/');
        if (!expectedSet.has(relative)) allPass = fail(`unexpected framework file: ${relative}`);
      }
    }
    if (allPass) ok(`PPT framework matches bundled template (${expected.length} files)`);
  }

  // --- 8. syntax parse of every project source file ---
  // The repository CI compiles each change with `tsc`/`vite`; this gate moves the same check into
  // the generation stage so a truncated widget is caught before a Pull Request. When dependencies
  // are not installed (the repository CI runs this before `npm ci`) the parser is unavailable and
  // the check is skipped here; CI's build:changed step still compiles the project.
  const syntaxReport = checkProject(dir);
  if (!syntaxReport.available) {
    console.log('  ! syntax check skipped: run `npm install` in the project to enable the parse gate');
  } else if (syntaxReport.errors.length > 0) {
    for (const error of syntaxReport.errors.slice(0, 20)) {
      allPass = fail(`${path.relative(dir, error.file).replace(/\\/g, '/')}:${error.line}:${error.column} ${error.message}`);
    }
    allPass = fail(`${syntaxReport.errors.length} syntax error(s) in project sources (checked with ${syntaxReport.parser})`);
  } else {
    ok(`all ${syntaxReport.files} source file(s) parse cleanly (${syntaxReport.parser})`);
  }

  console.log('');
  if (allPass) {
    console.log('RESULT: PASS');
    process.exit(0);
  } else {
    console.log('RESULT: FAIL');
    process.exit(1);
  }
}

main();
