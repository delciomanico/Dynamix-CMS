export const MAX_LIMIT = 100;

/** Lê `page` e `limit` da query string com valores seguros (page ≥ 1, 1 ≤ limit ≤ 100). */
export function parsePage(page?: unknown, limit?: unknown, defaultLimit = 20) {
  const p = Math.max(1, parseInt(String(page)) || 1);
  const l = Math.min(MAX_LIMIT, Math.max(1, parseInt(String(limit)) || defaultLimit));
  return { page: p, limit: l, skip: (p - 1) * l, take: l };
}

export function pageMeta(total: number, page: number, limit: number) {
  return { total, page, limit, pages: Math.ceil(total / limit) };
}
