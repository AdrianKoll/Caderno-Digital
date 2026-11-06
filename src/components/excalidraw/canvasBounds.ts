/**
 * Limites da folha para o modo "Travar tela".
 *
 * Com a tela travada, a área visível do canvas vira uma "caixa": elementos
 * que o usuário mover, criar, colar ou editar não podem sair dela. A checagem
 * roda a cada `onChange` do Excalidraw (ver ExcalidrawLayer.tsx) e, quando
 * algo passa da borda, devolve a lista de elementos já deslocada para dentro.
 *
 * Só mexe em elementos que MUDARAM desde a última checagem — o que já
 * estava fora da área antes de travar (ou que o usuário nem tocou) é deixado
 * como está.
 */

type El = any;

/** Área visível, em coordenadas de "cena" (as mesmas de x/y dos elementos). */
export interface Viewport {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/**
 * Folga (em pixels de TELA) entre o limite e a borda do canvas. Sem ela, um
 * objeto encostado na borda fica com as alças de redimensionamento cortadas
 * (metade delas cai fora do canvas), o que impede de redimensioná-lo depois.
 */
export const LOCK_MARGIN_PX = 8;

/** Tolerância (unidades da folha): diferenças menores que isso não contam como "passou da borda". */
const TOL = 0.5;

/** Converte câmera + tamanho do canvas na área visível em coordenadas de cena (já com a folga). */
export function viewportFromAppState(appState: Record<string, any>): Viewport | null {
  const width = appState?.width;
  const height = appState?.height;
  if (!width || !height) return null;
  const zoom = appState?.zoom?.value ?? 1;
  const m = LOCK_MARGIN_PX / zoom;
  const minX = -(appState?.scrollX ?? 0);
  const minY = -(appState?.scrollY ?? 0);
  return { minX: minX + m, minY: minY + m, maxX: minX + width / zoom - m, maxY: minY + height / zoom - m };
}

/** Caixa que envolve o elemento (considera pontos de linhas/setas e rotação). */
export function elementBounds(el: El): [number, number, number, number] {
  let x1 = el.x;
  let y1 = el.y;
  let x2 = el.x + el.width;
  let y2 = el.y + el.height;

  if (Array.isArray(el.points) && el.points.length > 0) {
    x1 = Infinity;
    y1 = Infinity;
    x2 = -Infinity;
    y2 = -Infinity;
    for (const p of el.points as number[][]) {
      const px = el.x + p[0];
      const py = el.y + p[1];
      if (px < x1) x1 = px;
      if (px > x2) x2 = px;
      if (py < y1) y1 = py;
      if (py > y2) y2 = py;
    }
  } else if (x2 < x1) {
    [x1, x2] = [x2, x1];
  }

  if (el.angle) {
    const cx = (x1 + x2) / 2;
    const cy = (y1 + y2) / 2;
    const cos = Math.cos(el.angle);
    const sin = Math.sin(el.angle);
    let rx1 = Infinity;
    let ry1 = Infinity;
    let rx2 = -Infinity;
    let ry2 = -Infinity;
    for (const [x, y] of [
      [x1, y1],
      [x2, y1],
      [x2, y2],
      [x1, y2],
    ]) {
      const rx = cx + (x - cx) * cos - (y - cy) * sin;
      const ry = cy + (x - cx) * sin + (y - cy) * cos;
      if (rx < rx1) rx1 = rx;
      if (rx > rx2) rx2 = rx;
      if (ry < ry1) ry1 = ry;
      if (ry > ry2) ry2 = ry;
    }
    return [rx1, ry1, rx2, ry2];
  }

  return [x1, y1, x2, y2];
}

/** Quanto deslocar uma caixa [a1, a2] para caber em [min, max] (0 se já couber, com tolerância). */
function shiftFor(a1: number, a2: number, min: number, max: number): number {
  const size = a2 - a1;
  // Maior que a área: não dá para caber, então alinha à borda de cima/esquerda
  // (e depois disso o deslocamento vira 0, o que evita repetir para sempre).
  if (size > max - min + TOL) return Math.abs(min - a1) < TOL ? 0 : min - a1;
  if (a1 < min - TOL) return min - a1;
  if (a2 > max + TOL) return max - a2;
  return 0;
}

/**
 * Empurra para dentro de `vp` os elementos alterados. Devolve a lista nova de
 * elementos, ou `null` se nada precisou mudar.
 *
 * Elementos que se movem juntos são tratados como UMA peça, para não se
 * deformarem ao encostar na borda:
 *  - a seleção atual (arrastar vários de uma vez);
 *  - texto dentro de uma forma (fica junto do seu contêiner);
 *  - elementos do mesmo grupo.
 */
export function clampChangedElements(
  elements: readonly El[],
  changedIds: Set<string>,
  selectedIds: Set<string>,
  vp: Viewport,
): El[] | null {
  const byId = new Map<string, El>();
  for (const el of elements) byId.set(el.id, el);

  const unitKey = (el: El): string => {
    const baseId = el.containerId && byId.has(el.containerId) ? el.containerId : el.id;
    if (selectedIds.has(el.id) || selectedIds.has(baseId)) return '__selection__';
    const base = byId.get(baseId) ?? el;
    const groups: string[] | undefined = base.groupIds;
    if (groups && groups.length > 0) return `g:${groups[groups.length - 1]}`;
    return `e:${baseId}`;
  };

  const units = new Map<string, El[]>();
  const touched = new Set<string>();
  for (const el of elements) {
    if (el.isDeleted) continue;
    const key = unitKey(el);
    const list = units.get(key);
    if (list) list.push(el);
    else units.set(key, [el]);
    if (changedIds.has(el.id)) touched.add(key);
  }

  const shifts = new Map<string, { dx: number; dy: number }>();
  for (const key of touched) {
    const members = units.get(key)!;
    let x1 = Infinity;
    let y1 = Infinity;
    let x2 = -Infinity;
    let y2 = -Infinity;
    for (const el of members) {
      const [a1, b1, a2, b2] = elementBounds(el);
      if (a1 < x1) x1 = a1;
      if (b1 < y1) y1 = b1;
      if (a2 > x2) x2 = a2;
      if (b2 > y2) y2 = b2;
    }
    const dx = shiftFor(x1, x2, vp.minX, vp.maxX);
    const dy = shiftFor(y1, y2, vp.minY, vp.maxY);
    if (Math.abs(dx) < 0.01 && Math.abs(dy) < 0.01) continue;
    for (const el of members) shifts.set(el.id, { dx, dy });
  }

  if (shifts.size === 0) return null;

  return elements.map((el) => {
    const s = shifts.get(el.id);
    if (!s) return el;
    return {
      ...el,
      x: el.x + s.dx,
      y: el.y + s.dy,
      version: (el.version ?? 1) + 1,
      versionNonce: Math.floor(Math.random() * 2 ** 31),
      updated: Date.now(),
    };
  });
}

/**
 * Limite durante o REDIMENSIONAMENTO com a tela travada.
 *
 * Empurrar a peça para dentro (como em `clampChangedElements`) não serve
 * enquanto o usuário arrasta uma alça: a peça "escorregaria" sob o ponteiro.
 * Aqui a caixa da seleção é ENCOLHIDA até caber na área visível, então a borda
 * funciona como um "batente": arrastar além dela não aumenta mais o objeto.
 *
 *  - Formas, linhas, setas, imagens e texto formatado: cada elemento é
 *    escalado junto, eixo por eixo (as proporções internas da seleção se mantêm).
 *  - Texto solto e elementos girados: escala uniforme (fonte/tamanho juntos),
 *    ancorada no lado que NÃO passou da borda.
 *
 * Devolve a lista nova de elementos, ou `null` se nada precisou mudar.
 */
export function clampResizedSelection(
  elements: readonly El[],
  changedIds: Set<string>,
  selectedIds: Set<string>,
  vp: Viewport,
): El[] | null {
  const byId = new Map<string, El>();
  for (const el of elements) byId.set(el.id, el);

  const members = elements.filter((el) => !el.isDeleted && selectedIds.has(el.id) && !el.containerId);
  if (members.length === 0) return null;
  if (!members.some((el) => changedIds.has(el.id))) return null;

  let x1 = Infinity;
  let y1 = Infinity;
  let x2 = -Infinity;
  let y2 = -Infinity;
  for (const el of members) {
    const [a1, b1, a2, b2] = elementBounds(el);
    if (a1 < x1) x1 = a1;
    if (b1 < y1) y1 = b1;
    if (a2 > x2) x2 = a2;
    if (b2 > y2) y2 = b2;
  }

  const overL = vp.minX - x1;
  const overT = vp.minY - y1;
  const overR = x2 - vp.maxX;
  const overB = y2 - vp.maxY;
  if (overL <= TOL && overT <= TOL && overR <= TOL && overB <= TOL) return null;

  const w = x2 - x1;
  const h = y2 - y1;
  const now = Date.now();
  const bumped = (el: El, patch: Record<string, unknown>): El => ({
    ...el,
    ...patch,
    version: (el.version ?? 1) + 1,
    versionNonce: Math.floor(Math.random() * 2 ** 31),
    updated: now,
  });

  const patches = new Map<string, Record<string, unknown>>();
  const uniform = members.some((el) => el.angle || (el.type === 'text' && !el.containerId));

  // Textos vinculados às formas selecionadas acompanham o contêiner.
  const boundTexts = (el: El): El[] =>
    (el.boundElements ?? [])
      .filter((b: any) => b.type === 'text')
      .map((b: any) => byId.get(b.id))
      .filter((t: El | undefined): t is El => !!t && !t.isDeleted);

  if (uniform) {
    if (w < 1 || h < 1) return null;
    // Âncora: o lado que não passou da borda fica parado.
    const ax = overL > TOL && overR <= TOL ? x2 : x1;
    const ay = overT > TOL && overB <= TOL ? y2 : y1;
    const capW =
      overL > TOL && overR <= TOL ? (x2 - vp.minX) / w : overR > TOL && overL <= TOL ? (vp.maxX - x1) / w : (vp.maxX - vp.minX) / w;
    const capH =
      overT > TOL && overB <= TOL ? (y2 - vp.minY) / h : overB > TOL && overT <= TOL ? (vp.maxY - y1) / h : (vp.maxY - vp.minY) / h;
    const s = Math.min(1, capW, capH);
    if (!(s > 0.05) || s >= 1) return null;
    // Estourou dos dois lados: depois de escalar, encosta na borda de cima/esquerda.
    const tx = overL > TOL && overR > TOL ? vp.minX - x1 : 0;
    const ty = overT > TOL && overB > TOL ? vp.minY - y1 : 0;

    const scaleBox = (el: El) => {
      const cx = el.x + el.width / 2;
      const cy = el.y + el.height / 2;
      const nw = el.width * s;
      const nh = el.height * s;
      const ncx = ax + (cx - ax) * s + tx;
      const ncy = ay + (cy - ay) * s + ty;
      const patch: Record<string, unknown> = { x: ncx - nw / 2, y: ncy - nh / 2, width: nw, height: nh };
      if (el.type === 'text' && typeof el.fontSize === 'number') patch.fontSize = el.fontSize * s;
      return patch;
    };

    for (const el of members) {
      if (Array.isArray(el.points) && el.points.length > 0) {
        const abs = (el.points as number[][]).map((p) => [ax + (el.x + p[0] - ax) * s + tx, ay + (el.y + p[1] - ay) * s + ty]);
        const ox = abs[0][0];
        const oy = abs[0][1];
        const points = abs.map(([px, py]) => [px - ox, py - oy]);
        const xs = points.map((p) => p[0]);
        const ys = points.map((p) => p[1]);
        patches.set(el.id, {
          x: ox,
          y: oy,
          points,
          width: Math.max(...xs) - Math.min(...xs),
          height: Math.max(...ys) - Math.min(...ys),
        });
      } else {
        patches.set(el.id, scaleBox(el));
        for (const t of boundTexts(el)) patches.set(t.id, scaleBox(t));
      }
    }
  } else {
    const nx1 = Math.max(x1, vp.minX);
    const ny1 = Math.max(y1, vp.minY);
    const nx2 = Math.min(x2, vp.maxX);
    const ny2 = Math.min(y2, vp.maxY);
    // Inteiramente fora da área: não há como "encolher" para dentro; a
    // checagem final (ao soltar) empurra a peça para dentro.
    if (nx2 < nx1 || ny2 < ny1) return null;

    const sx = w > 0.01 ? (nx2 - nx1) / w : 1;
    const sy = h > 0.01 ? (ny2 - ny1) / h : 1;
    const mapX = (x: number) => nx1 + (x - x1) * sx;
    const mapY = (y: number) => ny1 + (y - y1) * sy;

    for (const el of members) {
      if (Array.isArray(el.points) && el.points.length > 0) {
        const abs = (el.points as number[][]).map((p) => [mapX(el.x + p[0]), mapY(el.y + p[1])]);
        const ox = abs[0][0];
        const oy = abs[0][1];
        const points = abs.map(([px, py]) => [px - ox, py - oy]);
        const xs = points.map((p) => p[0]);
        const ys = points.map((p) => p[1]);
        patches.set(el.id, {
          x: ox,
          y: oy,
          points,
          width: Math.max(...xs) - Math.min(...xs),
          height: Math.max(...ys) - Math.min(...ys),
        });
      } else {
        const nx = mapX(el.x);
        const ny = mapY(el.y);
        patches.set(el.id, { x: nx, y: ny, width: el.width * sx, height: el.height * sy });
        // O texto (label) do contêiner acompanha o centro dele.
        const dx = nx + (el.width * sx) / 2 - (el.x + el.width / 2);
        const dy = ny + (el.height * sy) / 2 - (el.y + el.height / 2);
        for (const t of boundTexts(el)) patches.set(t.id, { x: t.x + dx, y: t.y + dy });
      }
    }
  }

  return elements.map((el) => {
    const patch = patches.get(el.id);
    return patch ? bumped(el, patch) : el;
  });
}
