import { slugify } from './slug';

describe('slugify', () => {
  it('remove acentos e normaliza', () => expect(slugify('  Olá, Mundo Ção!  ')).toBe('ola-mundo-cao'));
  it('remove hífens nas pontas', () => expect(slugify('--a--b--')).toBe('a-b'));
  it('limita a 60 caracteres', () => expect(slugify('a'.repeat(100))).toHaveLength(60));
  it('devolve vazio para só símbolos', () => expect(slugify('!!!')).toBe(''));
});
