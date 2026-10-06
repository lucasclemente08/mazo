import { CardsIcon } from '../components/Icons';
import { GuideCard } from '../components/GuideCard';
import { pages, ranking, sources, type SeoContent } from './content';

export function BrandIntro() {
  return <header className="home-brand flex flex-col items-center text-center">
    <div className="brand-mark"><CardsIcon /></div>
    <p className="brand-wordmark text-amber-100">TRUCARDO</p>
    <h1 className="mt-4 text-amber-100">Jugá al Truco con tus amigos desde el celular</h1>
    <p className="mt-3 text-sm max-w-sm">Creá una mesa, compartí el QR y repartí las cartas. Sin registro y sin descargar nada.</p>
  </header>;
}
export function LearningLinks() {
  return <section className="learning-links mt-8 border-t border-amber-200/15 pt-6 select-text">
    <h2 className="text-lg font-bold text-amber-100 mb-2">El Truco, carta por carta</h2>
    <p className="text-sm text-stone-300 mb-4">Repasá las reglas, los cantos y el valor de las cartas antes de armar tu mesa.</p>
    <nav aria-label="Guías de Truco" className="grid grid-cols-2 gap-2">
      {pages.filter(p=>p.path.startsWith('/truco/')).map(page=><a key={page.path} href={page.path} className="seo-link rounded-xl border border-stone-600/60 p-3 text-sm text-amber-200 hover:bg-emerald-900/60">{page.path==='/truco/'?'Guía de Truco':page.heading.replace(' del Truco argentino','').replace(' del Truco','')}</a>)}
    </nav>
    <div className="flex flex-wrap gap-4 mt-5 text-xs text-stone-300"><a href="/juegos/truco/" className="underline">Truco online con amigos</a><a href="/repartir-cartas/" className="underline">Repartir cartas online</a><a href="/juegos/" className="underline">Juegos disponibles</a></div>
    <h2 className="text-lg font-bold text-amber-100 mt-7 mb-3">Una mesa compartida, manos privadas</h2>
    <p className="text-sm text-stone-300">Jugá con 2, 3, 4 o 6 personas. Las cartas tiradas se ven en la mesa de todos; las restantes quedan en tu celular. TRUCARDO controla los turnos y las bazas. Los cantos se hacen hablando y el anfitrión anota los puntos.</p>
    <details className="mt-4 text-sm text-stone-300"><summary className="py-2 cursor-pointer text-amber-100">¿Se puede jugar a distancia?</summary><p>Sí. Compartí el enlace con tus amigos y usen su llamada habitual para cantar Truco y Envido. La aplicación no incluye chat ni videollamada.</p></details>
    <details className="mt-2 text-sm text-stone-300"><summary className="py-2 cursor-pointer text-amber-100">¿Se guardan las partidas?</summary><p>Solo se mantiene el estado necesario para jugar. Al repartir se reemplazan las cartas, y al cerrar la mesa se borran cartas y marcador. Las mesas inactivas vencen automáticamente.</p></details>
  </section>;
}
export function SeoLanding() {
  return <div className="home-shell felt-bg p-4 sm:p-6 max-w-md mx-auto min-h-screen text-white">
    <BrandIntro />
    <main><a href="/?crear=1" className="seo-cta">Crear mesa</a><a href="/?unirme=1" className="seo-secondary mt-3">Unirme con código</a><LearningLinks /></main>
    <footer className="py-6 text-center text-xs text-stone-400">TRUCARDO · Sin registro · Sin anuncios</footer>
    <noscript>Para crear una mesa necesitás activar JavaScript. Podés leer las guías sin activarlo.</noscript>
  </div>;
}
function CardExamples({flor=false}:{flor?:boolean}) {
  const examples=flor ? [{cards:[[7,'oro'],[6,'oro'],[5,'oro']] as const,total:'38 tantos de Flor',text:'20 + 7 + 6 + 5. No son 38 de Envido.'}] : [
    {cards:[[7,'oro'],[6,'oro']] as const,total:'33 de Envido',text:'20 + 7 + 6: el máximo.'},
    {cards:[[12,'copa'],[5,'copa']] as const,total:'25 de Envido',text:'20 + 0 + 5: la figura vale cero.'},
    {cards:[[10,'espada'],[11,'espada']] as const,total:'20 de Envido',text:'20 + 0 + 0: dos figuras del mismo palo.'},
    {cards:[[7,'oro'],[3,'copa'],[12,'basto']] as const,total:'7 de Envido',text:'Tres palos distintos: solo el valor mayor.'},
  ];
  return <div className="grid sm:grid-cols-2 gap-4 mt-4">{examples.map(e=><figure key={e.total} className="rounded-2xl border border-stone-600/70 p-4 bg-emerald-950/50"><div className="flex gap-2 mb-4">{e.cards.map(([value,suit])=><GuideCard key={`${value}-${suit}`} value={value} suit={suit} />)}</div><figcaption><strong className="text-amber-200">{e.total}</strong><p className="mt-1 text-sm">{e.text}</p></figcaption></figure>)}</div>;
}
export function SeoPage({page}:{page:SeoContent}) {
  const parent=page.path.startsWith('/truco/')?'/truco/':page.path.startsWith('/juegos/')?'/juegos/':null;
  return <div className="seo-shell felt-bg min-h-screen text-stone-200 select-text">
    <header className="seo-header"><a href="/" aria-label="TRUCARDO, inicio" className="flex items-center gap-2 font-bold text-amber-100 tracking-wide"><CardsIcon className="w-7 h-7" />TRUCARDO</a><a href="/?crear=1" className="seo-small-cta">Crear mesa</a></header>
    <main className="seo-article">
      <nav aria-label="Migas de pan" className="flex flex-wrap gap-2 text-xs text-stone-400 mb-7"><a href="/" className="hover:text-amber-200">Inicio</a>{parent && parent!==page.path && <><span aria-hidden="true">/</span><a href={parent} className="hover:text-amber-200">{parent==='/truco/'?'Truco':'Juegos'}</a></>}<span aria-hidden="true">/</span><span aria-current="page">{page.heading}</span></nav>
      <article><p className="text-xs uppercase tracking-widest text-amber-300 mb-3">La mesa de siempre, en tu celular</p><h1>{page.heading}</h1><p className="seo-intro">{page.intro}</p>
        {page.sections.map(section=><section key={section.heading} className="seo-section"><h2>{section.heading}</h2>{section.text?.map(text=><p key={text}>{text}</p>)}{section.items && <ol className="list-decimal pl-5 space-y-3 mt-4">{section.items.map(item=><li key={item}>{item}</li>)}</ol>}
          {section.table && <div className="seo-table-wrap"><table><thead><tr>{section.table.headers.map(header=><th scope="col" key={header}>{header}</th>)}</tr></thead><tbody>{section.table.rows.map(row=><tr key={row[0]}>{row.map((cell,i)=>i===0?<th scope="row" key={i}>{cell}</th>:<td key={i}>{cell}</td>)}</tr>)}</tbody></table></div>}
          {section.visual==='ranking' && <ol className="mt-5 space-y-4">{ranking.map((rank,i)=><li key={rank.label} className="border-b border-stone-600/50 pb-4"><p className="text-amber-100 mb-3"><span className="mr-3 text-xs font-mono text-stone-400">{String(i+1).padStart(2,'0')}</span>{rank.label}</p><div className="flex flex-wrap gap-3">{rank.suits.map(suit=><GuideCard key={suit} value={rank.value} suit={suit} />)}</div></li>)}</ol>}
          {section.visual==='envido' && <CardExamples />}{section.visual==='flor' && <CardExamples flor />}
        </section>)}
        {page.path.startsWith('/truco/') && <aside className="text-xs text-stone-400 border-t border-stone-600/50 pt-5 mt-8"><p>Referencias para consultar variantes y reglamentos:</p><ul className="mt-2 space-y-2">{sources.map(source=><li key={source.href}><a href={source.href} target="_blank" rel="noreferrer" className="underline hover:text-amber-200">{source.label}</a></li>)}</ul><p className="mt-3">Guía de TRUCARDO. Acuerden las variantes antes de jugar; los reglamentos de torneo pueden diferir.</p></aside>}
      </article>
      <aside className="seo-callout mt-10"><h2>¿Ya sabés jugar? Armá tu mesa.</h2><p>Creá una sala, compartí el QR y jugá al Truco con tus amigos.</p><a href="/?crear=1" className="seo-cta mt-5">Crear mesa de Truco</a></aside>
      <nav aria-label="Guías relacionadas" className="mt-10"><h2 className="text-lg text-amber-100 font-bold mb-4">Seguí explorando</h2><div className="grid sm:grid-cols-2 gap-3">{page.related.map(path=>{const related=pages.find(p=>p.path===path)!;return <a key={path} href={path} className="seo-link rounded-xl border border-stone-600/70 p-4 text-sm text-amber-200 hover:bg-emerald-900/60">{related.heading} →</a>;})}</div></nav>
    </main><footer className="seo-footer"><a href="/">TRUCARDO</a><a href="/truco/">Guía de Truco</a><a href="/juegos/">Juegos disponibles</a><a href="/repartir-cartas/">Repartir cartas</a></footer>
  </div>;
}
