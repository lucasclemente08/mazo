# 🃏 MAZO

> **"La aplicación reparte. Los jugadores juegan."**  
> Mazo físico virtual compartido en tiempo real para jugar al Truco presencialmente sin cartas físicas.

---

## 🎯 ¿Qué es MAZO?

MAZO resuelve un problema muy concreto: **"Queremos jugar al Truco pero no tenemos cartas"**.

No es otro videojuego de Truco online:
- ❌ **Sin** validar quién ganó ni calcular envidos.
- ❌ **Sin** gestionar turnos ni cantar Truco/Retruco.
- ❌ **Sin** registros, logins ni perfiles obligatorios.
- ❌ **Sin** bots ni matchmaking.

**La aplicación solo se encarga de repartir de forma limpia, aleatoria y privada. La picardía, las señas, los gritos y los porotos quedan 100% en la mesa real.**

---

## ✨ Características Principales

1. **Crear Mesa al Instante**: Elegí entre 2, 4 o 6 jugadores. Te genera un código único de 4 caracteres (ej. `7K3P`).
2. **Invitación rápida vía QR o Código**: Un link directo para unirse escaneando con la cámara del celular.
3. **Mano Privada con Hold-to-Reveal**:
   - En la mesa física, las cartas aparecen boca abajo.
   - Tenés que mantener pulsado ("Mantener apretado para mirar") para verlas.
   - Al soltar, se tapan automáticamente para que nadie sentado enfrente las espíe.
4. **Rotación Automática del Repartidor (Dealer)**:
   - Ronda 1 reparte Lucas.
   - Ronda 2 reparte Juan.
   - Visualmente se mantiene el ritual de la mesa de Truco.
5. **Reconexión Automática**: Si bloqueás el celular o refrescás la pestaña, `localStorage` recuerda tu mesa y restaura tu mano sin duplicar jugadores.
6. **PWA Instalable**: Añadila a la pantalla de inicio de iOS o Android para usarla a pantalla completa como una app nativa.
7. **Arquitectura extensible**: Motor desacoplado (`spanish40`, 3 cartas por jugador) preparado para sumar juegos futuros (Escoba, Chinchón, etc.).

---

## 🛠 Stack Tecnológico

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS
- **Componentes & UI**: Lucide Icons, QR Code SVG (`qrcode.react`)
- **PWA**: `vite-plugin-pwa`
- **Backend / Realtime**: Supabase (PostgreSQL + Realtime + RLS) con fallback local reactivo para pruebas inmediatas
- **Deploy**: Vercel / Netlify / Cloudflare Pages

---

## 🚀 Inicio Rápido en Desarrollo

```bash
# 1. Clonar o entrar al directorio
cd mazo

# 2. Instalar dependencias
npm install

# 3. Iniciar el servidor local
npm run dev
```

Abre en tu navegador: [http://localhost:3000](http://localhost:3000)

---

## 🗄 Estructura del Proyecto

```text
mazo/
├── public/                 # Iconos y manifiesto PWA
├── src/
│   ├── components/
│   │   ├── Card/           # Representación fiel de carta española (Palo, número)
│   │   ├── Hand/           # Mano del jugador con gesto Hold-to-Reveal
│   │   ├── PlayerList/     # Asientos en la mesa, dealer y estado online
│   │   └── QRCode/         # Generador de QR para invitar rápido
│   ├── pages/
│   │   ├── Home.tsx        # Crear mesa / Ingresar código
│   │   └── Table.tsx       # Mesa viva, reparto y privacidad
│   ├── services/
│   │   ├── supabase.ts     # Cliente Supabase
│   │   └── gameService.ts  # Creación de salas, Fisher-Yates y rondas
│   ├── types/
│   │   └── index.ts        # Modelo de dominio (Room, Player, Card, Hand)
│   ├── utils/
│   │   └── deck.ts         # Generador baraja española 40 cartas y shuffle
│   ├── App.tsx             # Enrutador por URL (/r/:code) y reconexión
│   └── main.tsx
├── supabase/
│   └── schema.sql          # Esquema SQL con RLS y Realtime
└── vite.config.ts
```

---

## 🗄 Configuración de Supabase (Opcional para producción)

1. Creá un proyecto en [Supabase](https://supabase.com).
2. Ejecutá el contenido de [`supabase/schema.sql`](supabase/schema.sql) en el **SQL Editor**.
3. Creá un archivo `.env` en la raíz de `mazo/`:
   ```env
   VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
   VITE_SUPABASE_ANON_KEY=tu-anon-key-publica
   ```
4. ¡Listo! Las salas y el reparto se sincronizarán mediante canales en tiempo real.
