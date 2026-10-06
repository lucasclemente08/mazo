import { SITE_URL, homeMeta, pages, getPage } from './content';

const escape = (value: string) => value.replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
// Public ownership token for Lucas's Search Console property; keep it deployed.
const googleVerification = import.meta.env.VITE_GOOGLE_SITE_VERIFICATION?.trim() || 'rJ6Uac1UVydCR7ehGRh8c_M8ubz8sKnv0dJReg6A6YI';
export function metadata(path: string) {
  const page = getPage(path);
  const indexable = path === '/' || !!page;
  const room = /^\/r\//.test(path);
  return {
    title: indexable ? page?.title ?? homeMeta.title : room ? 'Mesa de Truco con amigos | TRUCARDO' : 'Página no encontrada | TRUCARDO',
    description: indexable ? page?.description ?? homeMeta.description : 'Entrá a tu mesa de Truco en TRUCARDO con el código o el QR compartido por tus amigos.',
    canonical: indexable ? `${SITE_URL}${page?.path ?? '/'}` : null,
    robots: indexable ? 'index,follow,max-image-preview:large' : 'noindex,nofollow',
    type: page?.path.startsWith('/truco/') && page.path !== '/truco/' ? 'article' : 'website',
  };
}
export function structuredData(path: string): Record<string, unknown>[] {
  const page = getPage(path);
  if (path !== '/' && !page) return [];
  const organization = { '@type':'Organization', '@id':`${SITE_URL}/#organization`, name:'TRUCARDO', url:SITE_URL, logo:`${SITE_URL}/favicon.svg` };
  if (!page) return [{ '@context':'https://schema.org', '@graph':[organization,
    { '@type':'WebSite', '@id':`${SITE_URL}/#website`, url:SITE_URL, name:'TRUCARDO', inLanguage:'es-AR', publisher:{'@id':organization['@id']} },
    { '@type':'WebApplication', name:'TRUCARDO', url:SITE_URL, description:homeMeta.description, applicationCategory:'GameApplication', operatingSystem:'Web', browserRequirements:'Requiere JavaScript e Internet para jugar', offers:{'@type':'Offer',price:'0',priceCurrency:'ARS'}, publisher:{'@id':organization['@id']} },
  ] }];
  const parent = page.path.startsWith('/truco/')?'/truco/':page.path.startsWith('/juegos/')?'/juegos/':null;
  const items=[{ '@type':'ListItem', position:1, name:'Inicio', item:`${SITE_URL}/` }];
  if (parent && parent !== page.path) items.push({'@type':'ListItem',position:2,name:parent==='/truco/'?'Truco':'Juegos',item:`${SITE_URL}${parent}`});
  items.push({'@type':'ListItem',position:items.length+1,name:page.heading,item:`${SITE_URL}${page.path}`});
  const data:Record<string,unknown>[]=[{'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:items}];
  if (page.path.startsWith('/truco/') && page.path !== '/truco/') data.push({ '@context':'https://schema.org','@type':'Article', headline:page.heading, description:page.description, inLanguage:'es-AR',mainEntityOfPage:`${SITE_URL}${page.path}`,image:`${SITE_URL}/og-trucardo.jpg`,author:organization,publisher:organization });
  return data;
}
export function renderHead(path: string) {
  const data=metadata(path);
  return `<title>${escape(data.title)}</title>
<meta name="description" content="${escape(data.description)}" />
<meta name="author" content="TRUCARDO" />
${googleVerification ? `<meta name="google-site-verification" content="${escape(googleVerification)}" />` : ''}
<meta name="robots" content="${data.robots}" />
${data.canonical ? `<link rel="canonical" href="${escape(data.canonical)}" />` : ''}
<meta property="og:site_name" content="TRUCARDO" />
<meta property="og:title" content="${escape(data.title)}" />
<meta property="og:description" content="${escape(data.description)}" />
<meta property="og:type" content="${data.type}" />
<meta property="og:locale" content="es_AR" />
${data.canonical ? `<meta property="og:url" content="${escape(data.canonical)}" />` : ''}
<meta property="og:image" content="${SITE_URL}/og-trucardo.jpg" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:alt" content="TRUCARDO: Truco online con amigos, mesa por QR y cartas españolas" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${escape(data.title)}" />
<meta name="twitter:description" content="${escape(data.description)}" />
<meta name="twitter:image" content="${SITE_URL}/og-trucardo.jpg" />
${structuredData(path).map(value=>`<script type="application/ld+json" data-seo>${JSON.stringify(value).replace(/</g,'\\u003c')}</script>`).join('\n')}`;
}
export function updateMetadata(path: string) {
  const data=metadata(path);
  document.title=data.title;
  const set=(attribute:string,key:string,value:string|null)=>{
    const selector=`meta[${attribute}="${key}"]`;
    let element=document.head.querySelector<HTMLMetaElement>(selector);
    if(value===null){element?.remove();return;}
    if(!element){element=document.createElement('meta');element.setAttribute(attribute,key);document.head.append(element);}
    element.content=value;
  };
  set('name','description',data.description);set('name','robots',data.robots);
  set('name','author','TRUCARDO');
  if(googleVerification) set('name','google-site-verification',googleVerification);
  for(const [key,value] of Object.entries({'og:title':data.title,'og:description':data.description,'og:type':data.type,'og:url':data.canonical,'og:site_name':'TRUCARDO','og:locale':'es_AR','og:image':`${SITE_URL}/og-trucardo.jpg`})) set('property',key,value);
  for(const [key,value] of Object.entries({'twitter:card':'summary_large_image','twitter:title':data.title,'twitter:description':data.description,'twitter:image':`${SITE_URL}/og-trucardo.jpg`})) set('name',key,value);
  document.querySelectorAll('link[rel="canonical"]').forEach(el=>el.remove());
  if(data.canonical){const link=document.createElement('link');link.rel='canonical';link.href=data.canonical;document.head.append(link);}
  document.querySelectorAll('script[data-seo]').forEach(el=>el.remove());
  for(const value of structuredData(path)){const script=document.createElement('script');script.type='application/ld+json';script.dataset.seo='';script.textContent=JSON.stringify(value);document.head.append(script);}
}
export const indexablePaths=['/',...pages.map(p=>p.path)];
