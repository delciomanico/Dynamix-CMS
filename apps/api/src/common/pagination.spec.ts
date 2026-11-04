import { pageMeta, parsePage } from './pagination';

describe('parsePage', () => {
  it('usa defeitos', () => {
    expect(parsePage()).toEqual({ page: 1, limit: 20, skip: 0, take: 20 });
    expect(parsePage(undefined, undefined, 10).limit).toBe(10);
  });
  it('calcula skip/take', () => {
    expect(parsePage('3', '5')).toEqual({ page: 3, limit: 5, skip: 10, take: 5 });
  });
  it('limita page e limit a valores seguros', () => {
    expect(parsePage('0', '0').page).toBe(1);
    expect(parsePage('-4', '-1').page).toBe(1);
    expect(parsePage('abc', 'xyz')).toMatchObject({ page: 1, limit: 20 });
    expect(parsePage('1', '9999').limit).toBe(100);
  });
});

describe('pageMeta', () => {
  it('calcula páginas', () => {
    expect(pageMeta(42, 2, 20)).toEqual({ total: 42, page: 2, limit: 20, pages: 3 });
    expect(pageMeta(0, 1, 20).pages).toBe(0);
    expect(pageMeta(20, 1, 20).pages).toBe(1);
  });
});
