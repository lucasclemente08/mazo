import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { GuideCard } from './GuideCard';
import type { Suit, CardValue } from '../types';

const ranking = ['1 de espada', '1 de basto', '7 de espada', '7 de oro', 'Todos los 3', 'Todos los 2', '1 de oro y copa', 'Todos los 12', 'Todos los 11', 'Todos los 10', '7 de basto y copa', 'Todos los 6', 'Todos los 5', 'Todos los 4'];
const suits: Suit[] = ['espada', 'basto', 'oro', 'copa'];
const rankCards: [CardValue, Suit[]][] = [[1,['espada']],[1,['basto']],[7,['espada']],[7,['oro']],[3,suits],[2,suits],[1,['oro','copa']],[12,suits],[11,suits],[10,suits],[7,['basto','copa']],[6,suits],[5,suits],[4,suits]];
const examples: { cards: [CardValue, Suit][]; calculation: string; total: number; note: string }[] = [
  {cards:[[7,'oro'],[6,'oro']],calculation:'20 + 7 + 6',total:33,note:'Mismo palo · el máximo'},
  {cards:[[12,'copa'],[5,'copa']],calculation:'20 + 0 + 5',total:25,note:'La figura vale cero'},
  {cards:[[10,'espada'],[11,'espada']],calculation:'20 + 0 + 0',total:20,note:'Dos figuras del mismo palo'},
  {cards:[[7,'oro'],[3,'copa'],[12,'basto']],calculation:'Solo cuenta el 7',total:7,note:'Tres palos distintos'},
];
const bids = [
  ['Sin cantar Truco', '1', '—'], ['Truco', '2', '1'], ['Retruco', '3', '2'], ['Vale cuatro', '4', '3'],
  ['Envido', '2', '1'], ['Real envido', '3', '1'], ['Envido + Envido', '4', '2'],
  ['Envido + Real', '5', '2'], ['Envido + Envido + Real', '7', '4'],
];

export function TrucoGuide({ onClose }: { onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [section, setSection] = useState<'juego' | 'truco' | 'envido'>('juego');
  useEffect(() => { dialog.current?.showModal(); }, []);
  return <dialog ref={dialog} onClose={onClose} aria-labelledby="guide-title"
    className="w-[calc(100%_-_2rem)] max-w-lg max-h-[90dvh] m-auto rounded-2xl border border-stone-600 bg-stone-950 text-stone-200 p-0 backdrop:bg-black/80">
    <header className="sticky top-0 z-10 bg-stone-950 border-b border-stone-700 p-4">
      <div className="flex justify-between items-center gap-3">
        <div><p className="text-xs text-amber-300">Truco argentino</p><h2 id="guide-title" className="text-xl font-bold text-amber-100">Cómo se juega</h2></div>
        <button type="button" autoFocus onClick={() => dialog.current?.close()} aria-label="Cerrar guía" className="min-h-11 min-w-11 flex items-center justify-center rounded-lg hover:bg-stone-800"><X size={20} /></button>
      </div>
      <nav aria-label="Secciones de la guía" className="flex gap-2 mt-3">
        {(['juego', 'truco', 'envido'] as const).map(key => <button key={key} aria-pressed={section === key} onClick={() => setSection(key)}
          className={`flex-1 min-h-11 rounded-lg text-sm font-semibold ${section === key ? 'bg-amber-400 text-stone-950' : 'bg-stone-800 hover:bg-stone-700'}`}>{key === 'juego' ? 'Reglas y puntos' : key === 'truco' ? 'Truco' : 'Envido'}</button>)}
      </nav>
    </header>
    <div className="p-5 space-y-5 text-sm leading-relaxed">
      {section === 'juego' && <>
        <section><h3 className="text-lg text-amber-100 font-semibold mb-2">La partida</h3>
          <p>Juegan 2, 3, 4 o 6 personas con 40 cartas españolas: sin 8, 9 ni comodines. En equipos, los compañeros se sientan alternados. Gana quien llega primero a 15 o 30 puntos; a 30, los primeros 15 son las malas y los siguientes las buenas.</p>
        </section>
        <section><h3 className="text-lg text-amber-100 font-semibold mb-2">De a tres: Truco Gallo</h3><p>El repartidor juega solo contra los otros dos. El gallo rota en cada mano y cada jugador lleva sus propios puntos. Si gana la pareja, el anfitrión anota los puntos a cada integrante por separado. MAZO reparte tres cartas a cada uno; acuerden las variantes antes de empezar.</p></section>
        <section><h3 className="text-lg text-amber-100 font-semibold mb-2">Cada mano</h3>
          <ol className="list-decimal pl-5 space-y-2">
            <li>Se reparten tres cartas. Empieza quien está a la derecha del repartidor: es la mano.</li>
            <li>Se juega una carta por turno. La más fuerte gana la baza y abre la siguiente. Ganar dos bazas gana el Truco.</li>
            <li>Los cantos se responden con «quiero» o «no quiero». Envido y Truco suman puntos por separado.</li>
          </ol>
          <p className="mt-3">Si una baza empata, es parda. Si cada equipo gana una, decide la tercera. Si hay una parda y otra baza ganada, favorece a quien ganó esa baza. Tres pardas favorecen al equipo de la mano.</p>
        </section>
        <section><h3 className="text-lg text-amber-100 font-semibold mb-2">Cuántos puntos se anotan</h3>
          <table className="w-full text-left text-xs"><caption className="sr-only">Puntos de cada canto aceptado o rechazado</caption>
            <thead><tr className="border-b border-stone-600"><th className="py-2">Canto</th><th scope="col">Quiero</th><th scope="col">No quiero</th></tr></thead>
            <tbody>{bids.map(([name, yes, no]) => <tr key={name} className="border-b border-stone-800"><th scope="row" className="py-2 font-normal pr-2">{name}</th><td>{yes}</td><td>{no}</td></tr>)}</tbody>
          </table>
          <p className="mt-3">Al rechazar una subida de Envido, quien la propuso cobra el valor de los cantos anteriores. Falta Envido directa rechazada: 1 punto.</p>
        </section>
        <section><h3 className="text-lg text-amber-100 font-semibold mb-2">Acordar antes de empezar</h3>
          <p>La Falta Envido tiene variantes. Una forma habitual vale lo que le falta al equipo que va adelante para llegar a la meta. Otras distinguen malas y buenas: acuerden cuál usan y anoten el resultado manualmente.</p>
          <p className="mt-2">La Flor es opcional: tres cartas del mismo palo. Si juegan con Flor, se anuncia y reemplaza al Envido; una Flor sin rival vale 3 puntos. Acuerden también las subidas de Flor.</p>
        </section>
        <p className="text-xs text-stone-400">En MAZO, los cantos y las bazas se juegan hablando. El anfitrión anota el resultado con + y corrige con −. Los puntos se conservan entre manos y se borran al cerrar la mesa.</p>
      </>}
      {section === 'truco' && <>
        <section><h3 className="text-lg text-amber-100 font-semibold mb-2">De mayor a menor</h3><p>El número impreso no determina la fuerza. Las cartas de una misma fila empatan entre sí.</p></section>
        <ol className="space-y-4">{ranking.map((card, index) => <li key={card} className="border-b border-stone-700/60 pb-4">
          <div className="flex items-center gap-2 mb-2"><span className="text-xs font-mono text-stone-400">{String(index + 1).padStart(2, '0')}</span><span className={index < 4 ? 'text-amber-200 font-semibold' : 'text-stone-200'}>{card}</span>{index === 0 && <span className="ml-auto text-[10px] text-amber-300">La más fuerte</span>}</div>
          <div className="flex gap-2 flex-wrap">{rankCards[index][1].map(suit => <GuideCard key={suit} value={rankCards[index][0]} suit={suit} />)}</div>
        </li>)}</ol>
        <p>Sin canto, la mano vale 1 punto. Truco querido vale 2; Retruco, 3; Vale cuatro, 4. Si no se acepta, se cobra el escalón anterior: 1, 2 o 3 respectivamente.</p>
      </>}
      {section === 'envido' && <>
        <section><h3 className="text-lg text-amber-100 font-semibold mb-2">Valor de cada carta</h3>
          <table className="w-full text-left"><thead><tr className="border-b border-stone-600"><th scope="col" className="py-2">Carta</th><th scope="col">Valor para Envido</th></tr></thead><tbody>
            {[1,2,3,4,5,6,7].map(value => <tr key={value} className="border-b border-stone-800"><th scope="row" className="py-2 font-normal">{value}, cualquier palo</th><td>{value}</td></tr>)}
            <tr><th scope="row" className="py-2 font-normal">10, 11 y 12 (figuras)</th><td>0</td></tr>
          </tbody></table>
        </section>
        <section><h3 className="text-lg text-amber-100 font-semibold mb-2">Cómo contar</h3>
          <p>Con dos cartas del mismo palo: sumá sus valores y agregá 20. Con tres del mismo palo y sin Flor: elegí las dos que más suman. Con tres palos distintos: cuenta solo el mayor valor, sin agregar 20.</p>
          <div className="mt-4 space-y-3">{examples.map(example => <figure key={example.total} className="rounded-2xl bg-stone-900 border border-stone-700 p-3">
            <figcaption className="text-xs text-stone-300 mb-3">{example.note}</figcaption>
            <div className="flex flex-wrap items-center gap-2">{example.cards.map(([value,suit]) => <GuideCard key={`${value}-${suit}`} value={value} suit={suit} />)}</div>
            <p className="flex items-center justify-between gap-2 mt-3 text-sm"><span>{example.calculation}</span><strong className="text-2xl text-amber-200 tabular-nums">{example.total}<span className="ml-1 text-xs font-normal">puntos</span></strong></p>
          </figure>)}</div>
        </section>
        <section><h3 className="text-lg text-amber-100 font-semibold mb-2">Cuándo cantarlo</h3>
          <p>Cantalo en la primera baza, antes de jugar tu primera carta. El Envido tiene prioridad si responden a un Truco con Envido. Con «quiero», se comparan los tantos: gana el mayor; ante empate, quien está primero en el orden desde la mano. El ganador debe mostrar sus cartas para comprobarlos.</p>
          <p className="mt-2">Envido vale 2 puntos; Real Envido, 3. Las subidas se acumulan: Envido + Real suma 5. Revisá Falta Envido en «Reglas y puntos».</p>
        </section>
      </>}
      <footer className="pt-3 border-t border-stone-700 text-xs text-stone-400">Referencias: <a className="underline text-amber-200" href="https://www.trucoargentino.com.ar/reglas/" target="_blank" rel="noreferrer">Truco Argentino</a> y <a className="underline text-amber-200" href="https://juegos.gba.gob.ar/wp-content/uploads/2026/reglamentos/especificos/deportes_adultos_mayores/truco.pdf" target="_blank" rel="noreferrer">Juegos Bonaerenses</a>. Las modalidades de torneo pueden variar.</footer>
    </div>
  </dialog>;
}
