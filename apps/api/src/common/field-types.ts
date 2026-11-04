import { BadRequestException } from '@nestjs/common';

export const FIELD_TYPES = [
  'text', 'textarea', 'richtext', 'number', 'boolean', 'image', 'file',
  'url', 'email', 'date', 'select', 'multiselect', 'reference',
] as const;
export type FieldType = (typeof FIELD_TYPES)[number];

export interface FieldDef {
  key: string;
  label: string;
  type: string;
  required: boolean;
  options: string[];
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isEmpty(v: unknown) {
  return v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0);
}

/** Valida e normaliza `data` de acordo com a definição de campos do componente. */
export function validateEntryData(fields: FieldDef[], data: Record<string, unknown>) {
  const errors: string[] = [];
  const out: Record<string, unknown> = {};

  for (const f of fields) {
    const v = data?.[f.key];
    if (isEmpty(v)) {
      if (f.type === 'boolean') { out[f.key] = false; continue; }
      if (f.required) errors.push(`"${f.label}" é obrigatório`);
      continue;
    }
    switch (f.type) {
      case 'text': case 'textarea': case 'richtext': case 'image': case 'file': case 'reference':
        if (typeof v !== 'string') errors.push(`"${f.label}" deve ser texto`); else out[f.key] = v;
        break;
      case 'number': {
        const n = typeof v === 'string' ? Number(v) : v;
        if (typeof n !== 'number' || Number.isNaN(n)) errors.push(`"${f.label}" deve ser um número`); else out[f.key] = n;
        break;
      }
      case 'boolean':
        out[f.key] = v === true || v === 'true';
        break;
      case 'url':
        try { new URL(String(v)); out[f.key] = v; } catch { errors.push(`"${f.label}" deve ser um URL válido`); }
        break;
      case 'email':
        if (!EMAIL.test(String(v))) errors.push(`"${f.label}" deve ser um email válido`); else out[f.key] = v;
        break;
      case 'date':
        if (Number.isNaN(Date.parse(String(v)))) errors.push(`"${f.label}" deve ser uma data válida`); else out[f.key] = v;
        break;
      case 'select':
        if (!f.options.includes(String(v))) errors.push(`"${f.label}" deve ser uma de: ${f.options.join(', ')}`); else out[f.key] = v;
        break;
      case 'multiselect':
        if (!Array.isArray(v) || v.some((x) => !f.options.includes(String(x)))) errors.push(`"${f.label}" contém opções inválidas`);
        else out[f.key] = v;
        break;
      default:
        errors.push(`Tipo de campo desconhecido: ${f.type}`);
    }
  }
  if (errors.length) throw new BadRequestException({ message: 'Dados inválidos', errors });
  return out;
}
