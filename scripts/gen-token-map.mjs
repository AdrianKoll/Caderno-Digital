#!/usr/bin/env node
/** Gera docs/MAPA-DE-TOKENS.md a partir do theme.css (rode: npm run docs:tokens). */
import { readFileSync, writeFileSync } from 'node:fs';
const css = readFileSync('src/styles/theme.css', 'utf8');
const rootEnd = css.indexOf(":root[data-theme='light']");
const base = css.slice(0, rootEnd);
const rest = css.slice(rootEnd);
const grab = (block, re) => { const m = block.match(re); return m ? m[1] : ''; };
const mobile = grab(rest, /@media \(max-width: 900px\) \{\n\s+:root \{([\s\S]*?)\n  \}\n\n  :root\[data-theme/);
const tablet = grab(rest, /@media \(max-width: 1179px\) \{\n\s+:root \{([\s\S]*?)\n  \}\n\}/);
const wide = grab(rest, /@media \(min-width: 1280px\) \{\n\s+:root \{([\s\S]*?)\n  \}\n\}/);
const over = (txt) => Object.fromEntries([...txt.matchAll(/^\s+(--[a-z0-9-]+):\s*([^;]+);/gm)].map((m) => [m[1], m[2].trim()]));
const M = over(mobile), T = over(tablet), W = over(wide);
const sections = []; let cur = null;
for (const line of base.split('\n')) {
  const h = line.match(/^\s+\/\* ---- (\d+)\. ([^\-*]+?)[\s\-]*(?:\*\/)?$/) || line.match(/^\s+\/\* ---- (\d+)\. ([^*]+?)\s*[-]+/);
  if (h) { cur = { n: h[1], title: h[2].replace(/[-\s]+$/, ''), rows: [] }; sections.push(cur); continue; }
  const t = line.match(/^\s+(--[a-z0-9-]+):\s*([^;]+);(?:\s*\/\*\s*(.*?)\s*\*\/)?/);
  if (t && cur) cur.rows.push({ name: t[1], val: t[2].trim(), note: t[3] || '' });
}
let md = `# Mapa de tokens (gerado de \`src/styles/theme.css\`)\n\n> Não edite este arquivo à mão: rode \`npm run docs:tokens\`. Para mudar um tamanho, edite o token no **theme.css** — a coluna *Celular* mostra o valor usado em telas de até 900px; *Tablet* até 1179px; *≥1280* em telas largas. Célula vazia = mesmo valor do computador.\n\n`;
for (const s of sections) {
  md += `## ${s.n}. ${s.title}\n\n| Token | Computador | Tablet (≤1179) | ≥1280 | Celular (≤900) | O que controla |\n|---|---|---|---|---|---|\n`;
  for (const r of s.rows) md += `| \`${r.name}\` | \`${r.val}\` | ${T[r.name] ? '`' + T[r.name] + '`' : ''} | ${W[r.name] ? '`' + W[r.name] + '`' : ''} | ${M[r.name] ? '`' + M[r.name] + '`' : ''} | ${r.note.replace(/\|/g, '\\|')} |\n`;
  md += '\n';
}
writeFileSync('docs/MAPA-DE-TOKENS.md', md);
console.log('docs/MAPA-DE-TOKENS.md —', sections.reduce((a, s) => a + s.rows.length, 0), 'tokens em', sections.length, 'seções');
