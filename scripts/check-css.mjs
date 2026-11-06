#!/usr/bin/env node
/**
 * Guarda-corpo do CSS (rode: npm run check:css).
 * Falha se:
 *  1) algum var(--token) não existir (nem no theme.css, nem como variável local do componente);
 *  2) um token do theme.css não for lido por ninguém (token "morto" = botão que não faz nada);
 *  3) um token for definido duas vezes no mesmo :root;
 *  4) voltar a existir um CSS global importado depois dos componentes (a causa do "o theme.css não muda nada").
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const walk = (d) => readdirSync(d).flatMap((n) => { const p = join(d, n); return statSync(p).isDirectory() ? walk(p) : [p]; });
const files = walk('src').filter((f) => /\.(css|tsx?)$/.test(f));
const theme = readFileSync('src/styles/theme.css', 'utf8');
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '');
const themeClean = strip(theme);

// Variáveis definidas em tempo de execução (React/JS) ou localmente de propósito.
const RUNTIME = /^--(mobile-toolbar-h|vv-top|vv-bottom|dock-pad-b|fs|lh|pad|i|mk|mc|mcol|indent|sym|tab|tab-fg|page-pad-[a-z]+|sheet-min-h|paper-gap|paper-grid|ecp-[a-z-]+|rte-(bg|text|border|hover|active-bg|accent|group-bg|btn)|locked|left|right|page|done|dock|icon|handle|subject|brand|chip-[a-z]+|dock-bg|accent-grad)$/;

const defined = [...themeClean.matchAll(/^\s+(--[a-z0-9-]+)\s*:/gm)].map((m) => m[1]);
const dupes = defined.filter((d, i) => defined.indexOf(d) !== i && !themeClean.includes('@media'));
const used = new Set();
const localDefs = new Set();
for (const f of files) {
  const src = strip(readFileSync(f, 'utf8'));
  for (const m of src.matchAll(/var\((--[a-z0-9-]+)/g)) used.add(m[1]);
  if (!f.endsWith('theme.css')) for (const m of src.matchAll(/(--[a-z0-9-]+)\s*:/g)) localDefs.add(m[1]);
}
for (const m of themeClean.matchAll(/var\((--[a-z0-9-]+)/g)) used.add(m[1]);

const errors = [];
const missing = [...used].filter((u) => !defined.includes(u) && !localDefs.has(u) && !RUNTIME.test(u));
if (missing.length) errors.push('Tokens usados mas NÃO definidos: ' + missing.join(', '));
const dead = defined.filter((d) => !used.has(d));
if (dead.length) errors.push('Tokens definidos no theme.css que ninguém lê (apague ou use): ' + dead.join(', '));
const reallyDupes = [...new Set(defined.filter((d, i) => defined.indexOf(d) !== i))].filter((d) => {
  const rootBase = themeClean.split(":root[data-theme='light']")[0];
  return (rootBase.match(new RegExp('^\\s+' + d + '\\s*:', 'gm')) || []).length > 1;
});
if (reallyDupes.length) errors.push('Tokens duplicados no :root base: ' + reallyDupes.join(', '));

const main = readFileSync('src/main.tsx', 'utf8');
const iCss = main.indexOf("./styles/global.css"), iApp = main.indexOf("from './App'");
if (iCss < 0 || iApp < 0 || iCss > iApp) errors.push("main.tsx: importe './styles/global.css' ANTES do App (ordem do CSS).");
if (/^import .*(mobile-ui|accessibility\.css)/m.test(main)) errors.push('main.tsx: não importe CSS global depois dos componentes.');

if (errors.length) { console.error('✖ check:css\n - ' + errors.join('\n - ')); process.exit(1); }
console.log(`✔ check:css — ${defined.length} tokens no theme.css, todos usados e definidos; ordem de import correta.`);
