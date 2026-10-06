import { build } from 'esbuild';
import { readFile, writeFile, mkdir, unlink } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';

export async function prerender(siteUrl='https://trucardo.sytes.net', googleVerification='') {
  const url=new URL(siteUrl);
  if(url.protocol!=='https:' || url.pathname!=='/' || url.search || url.hash || url.username || url.password) throw new Error('VITE_SITE_URL debe ser un origen HTTPS, sin ruta ni credenciales.');
  const origin=url.origin;
  const dist=resolve('dist');
  const renderer=resolve(dist,'.seo-render.mjs');
  await build({entryPoints:['src/seo/prerender.tsx'],outfile:renderer,bundle:true,platform:'node',format:'esm',jsx:'automatic',packages:'external',define:{'import.meta.env.VITE_SITE_URL':JSON.stringify(origin),'import.meta.env.VITE_GOOGLE_SITE_VERIFICATION':JSON.stringify(googleVerification)}});
  try {
    const {indexablePaths,renderHead,renderPage}=await import(pathToFileURL(renderer).href);
    const template=await readFile(resolve(dist,'index.html'),'utf8');
    if(!template.includes('<!--seo-start-->') || !template.includes('<!--seo-end-->')) throw new Error('Falta el bloque de metadatos SEO en index.html');
    for(const path of [...indexablePaths,'/room.html','/404.html']) {
      let html=template.replace(/<!--seo-start-->[\s\S]*?<!--seo-end-->/,`<!--seo-start-->\n${renderHead(path)}\n<!--seo-end-->`)
        .replace(/<div id="root"[^>]*><\/div>/,`<div id="root">${renderPage(path)}</div>`);
      if(path !== '/' && path !== '/room.html') html=html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,tag=>tag.includes('application/ld+json')?tag:'').replace(/<link[^>]*rel="modulepreload"[^>]*>/g,'');
      const file=resolve(dist,path==='/'?'index.html':path.endsWith('.html')?path.slice(1):`${path.slice(1)}index.html`);
      await mkdir(dirname(file),{recursive:true});await writeFile(file,html);
    }
    await writeFile(resolve(dist,'sitemap.xml'),`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${indexablePaths.map(path=>`  <url><loc>${origin}${path}</loc></url>`).join('\n')}\n</urlset>\n`);
    await writeFile(resolve(dist,'robots.txt'),`User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`);
    console.log(`SEO: ${indexablePaths.length} páginas HTML estáticas, sitemap y salas noindex.`);
  } finally { await unlink(renderer); }
}
