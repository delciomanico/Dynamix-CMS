import { BadRequestException } from '@nestjs/common';
import { FieldDef, validateEntryData } from './field-types';

const f = (type: string, extra: Partial<FieldDef> = {}): FieldDef => ({ key: 'k', label: 'K', type, required: false, options: [], ...extra });
const ok = (def: FieldDef, v: unknown) => validateEntryData([def], { k: v });
const bad = (def: FieldDef, v: unknown) => expect(() => ok(def, v)).toThrow(BadRequestException);

describe('validateEntryData', () => {
  it('campo obrigatório em falta falha', () => bad(f('text', { required: true }), ''));
  it('campo opcional vazio é omitido', () => expect(ok(f('text'), '')).toEqual({}));
  it('boolean vazio vira false', () => expect(ok(f('boolean'), undefined)).toEqual({ k: false }));
  it('boolean aceita "true"', () => expect(ok(f('boolean'), 'true')).toEqual({ k: true }));
  it('number converte strings', () => expect(ok(f('number'), '3.5')).toEqual({ k: 3.5 }));
  it('number rejeita texto', () => bad(f('number'), 'abc'));
  it('text rejeita não-string', () => bad(f('text'), 5));
  it('url', () => { expect(ok(f('url'), 'https://a.pt')).toEqual({ k: 'https://a.pt' }); bad(f('url'), 'nope'); });
  it('email', () => { expect(ok(f('email'), 'a@b.co')).toEqual({ k: 'a@b.co' }); bad(f('email'), 'a@b'); });
  it('date', () => { expect(ok(f('date'), '2026-10-21')).toEqual({ k: '2026-10-21' }); bad(f('date'), 'ontem'); });
  it('select', () => { const d = f('select', { options: ['a', 'b'] }); expect(ok(d, 'a')).toEqual({ k: 'a' }); bad(d, 'c'); });
  it('multiselect', () => { const d = f('multiselect', { options: ['a', 'b'] }); expect(ok(d, ['a', 'b'])).toEqual({ k: ['a', 'b'] }); bad(d, ['a', 'z']); bad(d, 'a'); });
  it('tipo desconhecido falha', () => bad(f('xyz'), 'v'));
  it('ignora chaves não definidas no componente', () => expect(validateEntryData([f('text')], { k: 'x', extra: 1 })).toEqual({ k: 'x' }));
  it('agrega vários erros', () => {
    try { validateEntryData([f('text', { required: true, key: 'a' }), f('number', { key: 'b' })], { b: 'x' }); fail('devia falhar'); }
    catch (e) { expect((e as BadRequestException).getResponse()).toMatchObject({ errors: expect.arrayContaining([expect.any(String), expect.any(String)]) }); }
  });
});
