const DIMENSIONES = 256;
const MAX_CACHE = 5000;
const cache = new Map<string, number[]>();

export type EmbeddingVector = number[];

function hashear(texto: string): number {
  let hash = 0x811c9dc5;
  for (let indice = 0; indice < texto.length; indice++) {
    hash ^= texto.charCodeAt(indice);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenizar(texto: string): string[] {
  if (!texto) {
    return [];
  }
  return texto.split(' ').filter((token) => token.length >= 2);
}

function extraerCaracteristicas(texto: string): Array<[string, number]> {
  const tokens = tokenizar(normalizar(texto));
  const caracteristicas: Array<[string, number]> = [];

  for (const token of tokens) {
    caracteristicas.push([`t:${token}`, 1]);

    if (token.length >= 4) {
      for (let inicio = 0; inicio <= token.length - 3; inicio++) {
        caracteristicas.push([`g:${token.slice(inicio, inicio + 3)}`, 0.5]);
      }
    }
  }

  for (let indice = 0; indice < tokens.length - 1; indice++) {
    const primero = tokens[indice] ?? '';
    const segundo = tokens[indice + 1] ?? '';
    caracteristicas.push([`b:${primero}_${segundo}`, 0.75]);
  }

  return caracteristicas;
}

function vectorizar(texto: string): number[] {
  const vector = new Array<number>(DIMENSIONES).fill(0);

  for (const [caracteristica, peso] of extraerCaracteristicas(texto)) {
    const indice = hashear(caracteristica) % DIMENSIONES;
    const signo = hashear(`s:${caracteristica}`) % 2 === 0 ? 1 : -1;
    vector[indice] = (vector[indice] ?? 0) + peso * signo;
  }

  let norma = 0;
  for (const valor of vector) {
    norma += valor * valor;
  }
  norma = Math.sqrt(norma);
  if (norma === 0) {
    return vector;
  }
  return vector.map((valor) => valor / norma);
}

export async function generarEmbedding(texto: string): Promise<EmbeddingVector> {
  const clave = texto.trim();
  const cacheado = cache.get(clave);
  if (cacheado) {
    return cacheado;
  }

  const vector = vectorizar(clave);

  if (cache.size >= MAX_CACHE) {
    cache.clear();
  }
  cache.set(clave, vector);
  return vector;
}
