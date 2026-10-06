# 🃏 MAZO

Baraja virtual para jugar Truco presencialmente o desde varios celulares. La aplicación reparte, controla los turnos y resuelve las bazas; los jugadores cantan y anotan los puntos.

## Desarrollo

```sh
npm ci
npm run dev
```

Abrí http://localhost:3000. `npm run build` comprueba TypeScript y genera la PWA en `dist/`.

## Supabase

1. Ejecutá `supabase/schema.sql` en el SQL Editor de tu proyecto. Sirve para una instalación nueva y para actualizar el esquema original. No borra las mesas existentes, pero sus jugadores antiguos no tienen identidad autenticada: creá mesas nuevas después de actualizar.
2. Activá **Authentication → Sign In / Providers → Anonymous Sign-Ins**. No se pide correo ni contraseña. Cada navegador conserva su identidad de Supabase; borrar sus datos impide recuperar esa mano.
3. En un proyecto dedicado a MAZO ejecutá también `supabase/cleanup.sql`: limpia las mesas vencidas cada cinco minutos y las identidades anónimas sin mesa de más de una hora. Este archivo no debe usarse en un proyecto que comparta identidades anónimas con otras aplicaciones.
4. Copiá `.env.example` a `.env` y completá la URL y la clave pública publishable/anon de tu proyecto. Nunca uses una clave `service_role` en el frontend.
5. Reiniciá Vite, o volvé a compilar si estás publicando la aplicación.

Las operaciones de crear, unirse y repartir se ejecutan mediante RPC autenticadas. Las funciones validan pertenencia, capacidad y permiso del anfitrión/repartidor. El reparto ocurre en una transacción, y devuelve las cartas solamente al dueño de la sesión. El cliente consulta el estado cada dos segundos; no requiere configurar Realtime.

Solo se conserva el estado necesario para jugar. Cada nueva mano elimina las cartas de la anterior; salir como anfitrión borra inmediatamente mesa, jugadores y cartas. Las mesas sin consultas de sus participantes vencen tras 30 minutos, y la tarea de limpieza las elimina dentro de los siguientes cinco minutos. El marcador se conserva solo durante la partida y se elimina con la mesa; no se guarda historial. Supabase puede conservar registros técnicos y copias de seguridad según su configuración: eliminar filas no garantiza borrar todas las copias del proveedor.

Con Supabase configurado, los errores se muestran al usuario: no se cambia silenciosamente a una partida local. Sin variables de entorno se habilita una **demostración local**, limitada al mismo navegador y origen. Esa demostración guarda todas las manos en localStorage y no ofrece privacidad frente a quien inspeccione el almacenamiento; no sirve para conectar celulares.

## Juego

- Mesas de 2, 3, 4 o 6 jugadores; se reparten tres cartas cuando la mesa está completa. De a tres, el repartidor es gallo contra los otros dos y el marcador es individual.
- Enlaces `/r/CÓDIGO` abren el formulario de ingreso. Una sesión válida restaura la mano al recargar.
- Solo el anfitrión o repartidor puede comenzar o avanzar la ronda. El repartidor rota en cada nueva mano.
- Las cartas se revelan mientras mantenés pulsado el botón (también con Espacio o Enter) y se ocultan al soltar o cambiar de pestaña.
- Cuando te toca, «Ver y elegir carta» permite seleccionar y confirmar una carta para tirarla a la mesa compartida. Al cancelar, cambiar de pestaña o tirar, vuelve a ocultarse la mano privada.
- Empieza el asiento siguiente al repartidor. Cada jugador tira una carta por turno; quien gana la baza abre la siguiente. Las cartas de igual jerarquía entre contrarios producen parda; las de compañeros ganan para su equipo. La primera parda conserva el jugador que salió, y las tres pardas favorecen al equipo mano.
- Supabase valida turno, propiedad de la carta y versión de la jugada bajo bloqueo transaccional. Solo se publican cartas ya tiradas; las restantes se devuelven exclusivamente a su dueño. Las jugadas se borran al repartir otra mano o cerrar la mesa.
- La mano termina cuando las bazas deciden el ganador. Los cantos y puntos siguen siendo manuales. «Cerrar mano y repartir» pide confirmación si aún no terminó, para resolver un «no quiero» o irse al mazo.
- Compartir un nombre no permite recuperar la identidad de otra persona.
- Anotador compartido de dos equipos con meta de 15 o 30 puntos. Los asientos alternados forman cada equipo; el anfitrión suma o corrige tantos. La versión del marcador impide sobrescribir una anotación reciente desde otra pestaña. Los puntos persisten entre manos, y se borran con la mesa.
- Guía accesible desde el inicio y desde la mesa: reglas, cantos, puntos, jerarquía de Truco y valores de Envido con ejemplos. Los cantos se resuelven entre jugadores; el anotador no decide automáticamente Falta Envido ni Flor.

## Publicación y verificación

Configurá el hosting para servir `index.html` en las rutas `/r/*` y usá HTTPS para la PWA y el portapapeles. Las variables `VITE_*` se incorporan durante la compilación.

Para comprobar la integración, abrí dos navegadores independientes (o uno en incógnito), creá una mesa de dos, ingresá con el enlace, repartí y verificá que cada sesión vea tres cartas distintas. Probá recargar, nombres repetidos, mesa completa y acciones sin permiso. Ejecutá `npm test` para las pruebas de regresión locales.

