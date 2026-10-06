import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';

const dist=resolve('dist');
const origin='https://trucardo.sytes.net';
const sitemap=readFileSync(resolve(dist,'sitemap.xml'),'utf8');
const urls=[...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1]);
test('Every sitemap URL serves substantive HTML, unique metadata and valid structured data before JavaScript',()=>{
 assert.equal(urls.length,12); assert.equal(new Set(urls).size,urls.length);
 const titles=new Set(),descriptions=new Set();
 for(const url of urls){
  assert(url.startsWith(origin+'/'));
  const path=new URL(url).pathname;
  const html=readFileSync(resolve(dist,path==='/'?'index.html':`${path.slice(1)}index.html`),'utf8');
  const title=html.match(/<title>([^<]+)<\/title>/)?.[1];
  assert(title?.includes('TRUCARDO')); assert(title.length<=70);
  assert(!titles.has(title));titles.add(title);
  const description=html.match(/<meta name="description" content="([^"]+)"/)[1];
  assert(description.length>=100 && description.length<=180);
  assert(!descriptions.has(description));descriptions.add(description);
  assert.equal((html.match(/<h1\b/g)||[]).length,1);
  assert.equal((html.match(/rel="canonical"/g)||[]).length,1);
  assert(html.includes(`href="${url}"`));assert(html.includes('index,follow,max-image-preview:large'));
  assert(html.includes('<meta property="og:image" content="'+origin+'/og-trucardo.jpg"'));
  assert(html.includes('<meta name="twitter:card" content="summary_large_image"'));
  assert(html.includes('href="/?crear=1"'));
  assert(html.length>4000);
  const ld=[...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map(m=>JSON.parse(m[1]));
  assert(ld.length>0);
  if(path!=='/'){
   assert(!html.includes('type="module"'),'Static guides should not require the game bundle');
   assert(ld.some(d=>d['@type']==='BreadcrumbList'));
  }
  for(const href of [...html.matchAll(/href="(\/[^"?#]*)/g)].map(m=>m[1])){
   if(href.startsWith('/assets/') || /\.(svg|jpg|css|js|webmanifest)$/.test(href)) assert(existsSync(resolve(dist,href.slice(1))),href);
   else assert(urls.includes(origin+href),`Broken internal link: ${href}`);
  }
 }
});
test('All 40 illustrated cards and Envido examples are present in static HTML',()=>{
 const cards=readFileSync(resolve(dist,'truco/cartas/index.html'),'utf8');
 assert.equal((cards.match(/class="playing-card card-face/g)||[]).length,40);
 const envido=readFileSync(resolve(dist,'truco/envido/index.html'),'utf8');
 for(const total of [33,25,20,7]) assert(envido.includes(`${total} de Envido`));
 assert(envido.includes('el 10, el 11 y el 12 valen cero'));assert(envido.includes('tres palos distintos')||envido.includes('Tres palos distintos'));
});
test('Rooms and missing pages are noindex and have no marketing canonical; sitemap contains only public pages',()=>{
 for(const file of ['room.html','404.html']){
  const html=readFileSync(resolve(dist,file),'utf8');assert(html.includes('noindex,nofollow'));assert(!html.includes('rel="canonical"'));
 }
 assert(!sitemap.includes('/r/'));
 const config=JSON.parse(readFileSync('vercel.json','utf8'));
 assert(config.headers.some(h=>h.source==='/r/:path*'&&h.headers.some(v=>v.key==='X-Robots-Tag'&&v.value.includes('noindex'))));
 assert(!config.rewrites.some(r=>r.source==='/(.*)'),'Unknown URLs must return an actual 404');
 assert(readFileSync(resolve(dist,'robots.txt'),'utf8').includes(origin+'/sitemap.xml'));
 // The JPEG must have the JPEG signature, instead of being mislabeled PNG.
 const image=readFileSync(resolve(dist,'og-trucardo.jpg'));assert.equal(image.subarray(0,3).toString('hex'),'ffd8ff');
});
