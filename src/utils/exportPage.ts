/**
 * Exportação da folha aberta: Imprimir, PDF e Imagem (PNG).
 *
 * Os três formatos partem da MESMA imagem, montada num <canvas> a partir do
 * que está na tela: fundo do papel (pautada / branca / quadriculada),
 * cabeçalho (matéria, tópico, data) e o desenho do Excalidraw. Assim o
 * resultado é idêntico ao que o usuário vê, sem depender de nenhuma
 * biblioteca extra (o PDF é escrito à mão, ver `buildPdf`).
 *
 * O que fica de fora de propósito: elementos de interface (estrela de
 * favorito, "Salvo", barra de ferramentas, seleção/alças do desenho).
 */

export type ExportKind = 'print' | 'pdf' | 'png';

/** Fator de nitidez: 2x a largura da folha na tela (≈ 2160px numa folha de 1080px). */
const SCALE = 2;

// A4 em pontos (1pt = 1/72"), usado só no PDF.
const A4_W = 595.28;
const A4_H = 841.89;
const PDF_MARGIN = 24;

export async function exportPage(kind: ExportKind, filenameBase: string): Promise<void> {
  const canvas = await renderSheetToCanvas();

  if (kind === 'png') {
    const blob = await canvasToBlob(canvas, 'image/png');
    download(blob, `${filenameBase}.png`);
    return;
  }

  if (kind === 'pdf') {
    const jpeg = await canvasToBlob(canvas, 'image/jpeg', 0.95);
    const bytes = new Uint8Array(await jpeg.arrayBuffer());
    const pdf = buildPdf(bytes, canvas.width, canvas.height);
    download(pdf, `${filenameBase}.pdf`);
    return;
  }

  const png = await canvasToBlob(canvas, 'image/png');
  await printImage(png);
}

// ---------------------------------------------------------------------------
// Composição da folha
// ---------------------------------------------------------------------------

async function renderSheetToCanvas(): Promise<HTMLCanvasElement> {
  const sheet = document.querySelector<HTMLElement>('.notebook-page__sheet');
  if (!sheet) throw new Error('Abra uma página para poder salvá-la.');

  // As fontes manuscritas do cabeçalho precisam estar carregadas antes de
  // desenhar o texto no canvas, senão sai a fonte padrão.
  try {
    await document.fonts.ready;
    await Promise.all([document.fonts.load('600 24px Caveat'), document.fonts.load('600 11px Inter')]);
  } catch {
    /* segue com o que houver */
  }

  const sheetRect = sheet.getBoundingClientRect();
  const out = document.createElement('canvas');
  out.width = Math.round(sheetRect.width * SCALE);
  out.height = Math.round(sheetRect.height * SCALE);
  const ctx = out.getContext('2d');
  if (!ctx) throw new Error('Não foi possível preparar a imagem.');
  ctx.scale(SCALE, SCALE);

  const root = getComputedStyle(document.documentElement);
  const cssVar = (name: string, fallback: string) => root.getPropertyValue(name).trim() || fallback;

  // Papel.
  ctx.fillStyle = cssVar('--notebook', '#fafaf8');
  ctx.fillRect(0, 0, sheetRect.width, sheetRect.height);

  const rel = (el: Element) => {
    const r = el.getBoundingClientRect();
    return { x: r.left - sheetRect.left, y: r.top - sheetRect.top, w: r.width, h: r.height };
  };

  // Pauta / quadriculado + desenho.
  const canvasEl = sheet.querySelector<HTMLElement>('.notebook-page__canvas');
  if (canvasEl) {
    const area = rel(canvasEl);
    drawPaperPattern(ctx, canvasEl, area, cssVar);

    // Camada de elementos do Excalidraw (sem alças de seleção, que ficam
    // no canvas "interactive").
    const drawing =
      canvasEl.querySelector<HTMLCanvasElement>('canvas.excalidraw__canvas.static') ??
      Array.from(canvasEl.querySelectorAll<HTMLCanvasElement>('canvas')).find(
        (c) => !c.classList.contains('interactive'),
      );
    if (drawing) {
      const d = rel(drawing);
      ctx.save();
      ctx.beginPath();
      ctx.rect(area.x, area.y, area.w, area.h);
      ctx.clip();
      ctx.drawImage(drawing, d.x, d.y, d.w, d.h);
      ctx.restore();
    }
  }

  // Cabeçalho: rótulos, valores e a linha divisória.
  const header = sheet.querySelector<HTMLElement>('.page-header');
  if (header) {
    const h = rel(header);
    const cs = getComputedStyle(header);
    ctx.fillStyle = cs.borderBottomColor || cssVar('--notebook-lines', '#d9dde5');
    ctx.fillRect(h.x, h.y + h.h - 1, h.w, 1);
  }
  sheet
    .querySelectorAll<HTMLElement>('.page-header__label, .page-header__value')
    .forEach((el) => drawHeaderText(ctx, el, rel(el)));

  return out;
}

function drawPaperPattern(
  ctx: CanvasRenderingContext2D,
  el: HTMLElement,
  area: { x: number; y: number; w: number; h: number },
  cssVar: (name: string, fallback: string) => string,
) {
  const style = getComputedStyle(el);
  const num = (name: string, fallback: number) => parseFloat(style.getPropertyValue(name)) || fallback;

  ctx.save();
  ctx.beginPath();
  ctx.rect(area.x, area.y, area.w, area.h);
  ctx.clip();

  if (el.classList.contains('paper--ruled')) {
    const gap = num('--paper-gap', 36);
    ctx.fillStyle = cssVar('--notebook-lines', '#d9dde5');
    for (let y = gap; y <= area.h + 1; y += gap) {
      ctx.fillRect(area.x, area.y + y - 1, area.w, 1);
    }
  } else if (el.classList.contains('paper--grid')) {
    const size = num('--paper-grid', 28);
    ctx.fillStyle = cssVar('--notebook-grid', '#dde1e8');
    for (let x = 0; x <= area.w; x += size) ctx.fillRect(area.x + x, area.y, 1, area.h);
    for (let y = 0; y <= area.h; y += size) ctx.fillRect(area.x, area.y + y, area.w, 1);
  }

  ctx.restore();
}

function drawHeaderText(
  ctx: CanvasRenderingContext2D,
  el: HTMLElement,
  r: { x: number; y: number; w: number; h: number },
) {
  const raw = el instanceof HTMLInputElement ? el.value : el.textContent ?? '';
  if (!raw) return;
  // Campo escondido por CSS (ex.: Matéria e Data no celular): não sai na imagem.
  if (r.w === 0 || r.h === 0) return;

  const cs = getComputedStyle(el);
  const text = cs.textTransform === 'uppercase' ? raw.toUpperCase() : raw;
  const padL = parseFloat(cs.paddingLeft) || 0;
  const padR = parseFloat(cs.paddingRight) || 0;
  const padT = parseFloat(cs.paddingTop) || 0;
  const padB = parseFloat(cs.paddingBottom) || 0;

  ctx.save();
  ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${parseFloat(cs.fontSize)}px ${cs.fontFamily}`;
  ctx.fillStyle = cs.color;
  ctx.textBaseline = 'middle';
  if (cs.letterSpacing && cs.letterSpacing !== 'normal' && 'letterSpacing' in ctx) {
    (ctx as any).letterSpacing = cs.letterSpacing;
  }

  const maxWidth = Math.max(1, r.w - padL - padR);
  let x = r.x + padL;
  let align: CanvasTextAlign = 'left';
  if (cs.textAlign === 'center') {
    align = 'center';
    x = r.x + r.w / 2;
  } else if (cs.textAlign === 'right' || cs.textAlign === 'end') {
    align = 'right';
    x = r.x + r.w - padR;
  }
  ctx.textAlign = align;
  ctx.fillText(text, x, r.y + padT + (r.h - padT - padB) / 2, maxWidth);
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Saídas
// ---------------------------------------------------------------------------

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Não foi possível gerar a imagem.'))),
      type,
      quality,
    );
  });
}

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/** Imprime a imagem numa página A4, via <iframe> invisível (não mexe no layout do app). */
function printImage(png: Blob): Promise<void> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(png);
    const iframe = document.createElement('iframe');
    iframe.setAttribute('aria-hidden', 'true');
    iframe.style.cssText =
      'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;';

    let cleaned = false;
    const cleanup = () => {
      if (cleaned) return;
      cleaned = true;
      iframe.remove();
      URL.revokeObjectURL(url);
    };

    iframe.onload = () => {
      const win = iframe.contentWindow;
      if (!win) {
        cleanup();
        reject(new Error('Não foi possível abrir a impressão.'));
        return;
      }
      win.onafterprint = cleanup;
      setTimeout(cleanup, 5 * 60 * 1000); // garantia caso o navegador não dispare afterprint
      win.focus();
      win.print();
      resolve();
    };

    iframe.srcdoc = `<!doctype html><html><head><meta charset="utf-8"><title>Caderno Digital</title>
<style>
  @page { size: A4; margin: 10mm; }
  html, body { margin: 0; padding: 0; background: #fff; }
  img { display: block; margin: 0 auto; max-width: 100%; max-height: 275mm; width: auto; height: auto;
        -webkit-print-color-adjust: exact; print-color-adjust: exact; }
</style></head><body><img src="${url}" alt="Página do caderno"></body></html>`;
    document.body.appendChild(iframe);
  });
}

/**
 * PDF mínimo de 1 página A4 com a imagem (JPEG) centralizada e ajustada às
 * margens. Escrito à mão para não adicionar dependência: um PDF é só uma
 * lista de objetos + uma tabela de posições (xref).
 */
function buildPdf(jpeg: Uint8Array, imgW: number, imgH: number): Blob {
  const scale = Math.min((A4_W - 2 * PDF_MARGIN) / imgW, (A4_H - 2 * PDF_MARGIN) / imgH);
  const w = imgW * scale;
  const h = imgH * scale;
  const x = (A4_W - w) / 2;
  const y = (A4_H - h) / 2;
  const f = (n: number) => n.toFixed(2);

  const enc = new TextEncoder();
  const chunks: Uint8Array[] = [];
  const offsets: number[] = [];
  let length = 0;
  const push = (data: string | Uint8Array) => {
    const bytes = typeof data === 'string' ? enc.encode(data) : data;
    chunks.push(bytes);
    length += bytes.length;
  };
  const startObject = (n: number) => {
    offsets[n] = length;
    push(`${n} 0 obj\n`);
  };

  push('%PDF-1.4\n');

  startObject(1);
  push('<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');

  startObject(2);
  push('<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');

  startObject(3);
  push(
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${f(A4_W)} ${f(A4_H)}] ` +
      '/Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>\nendobj\n',
  );

  startObject(4);
  push(
    `<< /Type /XObject /Subtype /Image /Width ${imgW} /Height ${imgH} ` +
      `/ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`,
  );
  push(jpeg);
  push('\nendstream\nendobj\n');

  const content = `q ${f(w)} 0 0 ${f(h)} ${f(x)} ${f(y)} cm /Im0 Do Q`;
  startObject(5);
  push(`<< /Length ${content.length} >>\nstream\n${content}\nendstream\nendobj\n`);

  const xrefStart = length;
  push('xref\n0 6\n0000000000 65535 f \n');
  for (let n = 1; n <= 5; n++) {
    push(`${String(offsets[n]).padStart(10, '0')} 00000 n \n`);
  }
  push(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`);

  return new Blob(chunks as BlobPart[], { type: 'application/pdf' });
}
