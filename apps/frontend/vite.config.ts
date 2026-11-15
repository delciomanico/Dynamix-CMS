import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// %SITE_URL% (index.html) é preenchido em runtime pelo nginx (sub_filter, com o domínio real).
// Em desenvolvimento (servidor do Vite) fica vazio, ou seja, URLs relativas.
export default defineConfig({
  plugins: [react(), { name: 'site-url', transformIndexHtml: (html, ctx) => (ctx.server ? html.replaceAll('%SITE_URL%', '') : html) }],
  server: { port: 5173 },
});
