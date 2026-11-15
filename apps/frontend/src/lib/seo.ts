import { useEffect } from 'react';

export interface Seo {
  title: string; description?: string; image?: string; type?: 'website' | 'article';
  noindex?: boolean; jsonLd?: object; path?: string;
}
const SITE = 'Dynamix-CMS';

function meta(attr: 'name' | 'property', key: string, value?: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!value) { el?.remove(); return; }
  if (!el) { el = document.createElement('meta'); el.setAttribute(attr, key); document.head.appendChild(el); }
  el.setAttribute('content', value);
}

/** Atualiza título, descrição, canonical, Open Graph/Twitter, robots e JSON-LD da página atual (SPA). */
export function useSeo(s: Seo) {
  const { title, description, image, type = 'website', noindex, jsonLd, path } = s;
  const ld = jsonLd ? JSON.stringify(jsonLd) : '';
  useEffect(() => {
    const origin = window.location.origin;
    const url = origin + (path ?? window.location.pathname);
    const abs = image ? (image.startsWith('http') ? image : origin + image) : `${origin}/og-image.png`;
    const full = title.includes(SITE) ? title : `${title} · ${SITE}`;
    document.title = full;
    meta('name', 'description', description);
    meta('name', 'robots', noindex ? 'noindex,nofollow' : 'index,follow,max-image-preview:large');
    meta('property', 'og:type', type);
    meta('property', 'og:title', full);
    meta('property', 'og:description', description);
    meta('property', 'og:url', url);
    meta('property', 'og:image', abs);
    meta('name', 'twitter:card', 'summary_large_image');
    meta('name', 'twitter:title', full);
    meta('name', 'twitter:description', description);
    meta('name', 'twitter:image', abs);
    let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) { link = document.createElement('link'); link.rel = 'canonical'; document.head.appendChild(link); }
    link.href = url;
    document.getElementById('seo-ld')?.remove();
    if (ld) { const sc = document.createElement('script'); sc.id = 'seo-ld'; sc.type = 'application/ld+json'; sc.text = ld.replace(/</g, '\\u003c'); document.head.appendChild(sc); }
    return () => document.getElementById('seo-ld')?.remove();
  }, [title, description, image, type, noindex, ld, path]);
}
