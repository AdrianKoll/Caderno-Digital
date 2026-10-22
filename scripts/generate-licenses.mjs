#!/usr/bin/env node
/**
 * Gera public/third-party-licenses.txt com o aviso de copyright e o texto da
 * licença de cada pacote de PRODUÇÃO (dependencies + subdependências).
 *
 * Roda sozinho antes do build (script "prebuild" do package.json), então o
 * arquivo publicado em dist/ nunca fica defasado em relação ao package-lock.
 *
 * O pacote @excalidraw/excalidraw não traz arquivo LICENSE no npm (só o campo
 * "license": "MIT" no package.json), por isso o texto MIT dele é incluído aqui.
 */
import { existsSync, readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));

const EXCALIDRAW_MIT = `MIT License

Copyright (c) 2020 Excalidraw

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`;

/** Textos que não vêm dentro do pacote publicado no npm. */
const FALLBACK_TEXT = { '@excalidraw/excalidraw': EXCALIDRAW_MIT };

function findPackageJson(name, from) {
  let dir = from;
  for (;;) {
    const candidate = join(dir, 'node_modules', name, 'package.json');
    if (existsSync(candidate)) return candidate;
    const parent = dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

const seen = new Map();
function walk(name, from) {
  const file = findPackageJson(name, from);
  if (!file || seen.has(file)) return;
  const json = JSON.parse(readFileSync(file, 'utf8'));
  seen.set(file, json);
  const dir = dirname(file);
  for (const dep of Object.keys(json.dependencies ?? {})) walk(dep, dir);
  for (const dep of Object.keys(json.optionalDependencies ?? {})) walk(dep, dir);
}
for (const dep of Object.keys(pkg.dependencies ?? {})) walk(dep, root);

function licenseId(json) {
  if (typeof json.license === 'string') return json.license;
  if (json.license?.type) return json.license.type;
  if (Array.isArray(json.licenses)) return json.licenses.map((l) => l.type).join(' OR ');
  return 'UNKNOWN';
}

function licenseText(file, json) {
  const dir = dirname(file);
  const names = readdirSync(dir).filter((n) => /^(licen[cs]e|copying|notice)(\..*)?$/i.test(n));
  const parts = names.map((n) => readFileSync(join(dir, n), 'utf8').trim()).filter(Boolean);
  if (parts.length) return parts.join('\n\n');
  return FALLBACK_TEXT[json.name] ?? null;
}

const entries = [...seen.entries()]
  .map(([file, json]) => ({ file, json }))
  .filter(({ json }) => json.name)
  .sort((a, b) => a.json.name.localeCompare(b.json.name) || a.json.version.localeCompare(b.json.version));

const header = `AVISOS DE SOFTWARE DE TERCEIROS — Caderno Digital
=================================================

O Caderno Digital é construído com os pacotes de código aberto abaixo.
Cada um é distribuído sob a licença indicada, cujo aviso de copyright e texto
estão reproduzidos aqui, como as licenças exigem.

DESTAQUE — Excalidraw
  A camada de desenho e as fontes de desenho vêm do Excalidraw
  (https://github.com/excalidraw/excalidraw, https://excalidraw.com),
  licenciado sob MIT, Copyright (c) 2020 Excalidraw.
  O Caderno Digital é um projeto independente: não é afiliado, patrocinado
  nem endossado pelo Excalidraw.

Gerado automaticamente por scripts/generate-licenses.mjs
Total de pacotes: ${entries.length}
`;

const missing = [];
const blocks = entries.map(({ file, json }) => {
  const text = licenseText(file, json);
  const repo = typeof json.repository === 'string' ? json.repository : json.repository?.url ?? json.homepage ?? '';
  if (!text) missing.push(`${json.name}@${json.version}`);
  return [
    '-'.repeat(78),
    `${json.name}@${json.version}`,
    `Licença: ${licenseId(json)}`,
    repo ? `Origem: ${repo.replace(/^git\+/, '').replace(/\.git$/, '')}` : null,
    '',
    text ?? `(O pacote não inclui o texto da licença; consulte a origem acima. Licença declarada: ${licenseId(json)}.)`,
    '',
  ]
    .filter((l) => l !== null)
    .join('\n');
});

mkdirSync(join(root, 'public'), { recursive: true });
const out = join(root, 'public', 'third-party-licenses.txt');
writeFileSync(out, `${header}\n${blocks.join('\n')}\n`, 'utf8');

console.log(`third-party-licenses.txt: ${entries.length} pacotes.`);
if (missing.length) console.log(`Sem texto de licença no pacote (só o identificador): ${missing.join(', ')}`);
