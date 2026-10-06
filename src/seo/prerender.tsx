import { renderToStaticMarkup } from 'react-dom/server';
import { getPage } from './content';
import { SeoPage, SeoLanding } from './SeoPage';
import { renderHead, indexablePaths } from './metadata';

export { indexablePaths, renderHead };
export function renderPage(path:string) {
  const page=getPage(path);
  if(page) return renderToStaticMarkup(<SeoPage page={page} />);
  if(path==='/') return renderToStaticMarkup(<SeoLanding />);
  if(path==='/room.html') return '<p class="p-6 text-center">Cargando tu mesa de TRUCARDO…</p><noscript>Activá JavaScript para entrar a la mesa.</noscript>';
  return renderToStaticMarkup(<main className="seo-article select-text"><p className="text-amber-300">TRUCARDO · 404</p><h1>No encontramos esa página</h1><p>Podés crear una mesa o consultar las reglas del Truco.</p><a className="seo-cta mt-6" href="/">Volver al inicio</a><a className="block mt-6 underline" href="/truco/">Guía de Truco</a></main>);
}
