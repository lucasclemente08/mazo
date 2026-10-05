# 🃏 MAZO

Baraja virtual para jugar Truco presencialmente. La aplicación reparte; los jugadores llevan los turnos, cantos y puntajes.

## Desarrollo

```sh
npm ci
npm run dev
```

Abrí http://localhost:3000. `npm run build` comprueba TypeScript y genera la PWA en `dist/`.

## Supabase

1. Ejecutá `supabase/schema.sql` en el SQL Editor de tu proyecto. Sirve para una instalación nueva y para actualizar el esquema original. No borra las mesas existentes, pero sus jugadores antiguos no tienen identidad autenticada: creá mesas nuevas después de actualizar.
2. Activá **Authentication → Sign In / Providers → Anonymous Sign-Ins**. No se pide correo ni contraseña. Cada navegador conserva su identidad de Supabase; borrar sus datos impide recuperar esa mano.
3. Copiá `.env.example` a `.env` y completá la URL y la clave pública anon de tu proyecto. Nunca uses una clave `service_role` en el frontend.
4. Reiniciá Vite, o volvé a compilar si estás publicando la aplicación.

Las operaciones de crear, unirse y repartir se ejecutan mediante RPC autenticadas. Las funciones validan pertenencia, capacidad y permiso del anfitrión/repartidor. El reparto ocurre en una transacción, y devuelve las cartas solamente al dueño de la sesión. El cliente consulta el estado cada dos segundos; no requiere configurar Realtime. Las mesas vencen a las seis horas.

Con Supabase configurado, los errores se muestran al usuario: no se cambia silenciosamente a una partida local. Sin variables de entorno se habilita una **demostración local**, limitada al mismo navegador y origen. Esa demostración guarda todas las manos en localStorage y no ofrece privacidad frente a quien inspeccione el almacenamiento; no sirve para conectar celulares.

## Juego

- Mesas de 2, 4 o 6 jugadores; se reparten tres cartas cuando la mesa está completa.
- Enlaces `/r/CÓDIGO` abren el formulario de ingreso. Una sesión válida restaura la mano al recargar.
- Solo el anfitrión o repartidor puede comenzar o avanzar la ronda. El repartidor rota en cada nueva mano.
- Las cartas se revelan mientras mantenés pulsado el botón (también con Espacio o Enter) y se ocultan al soltar o cambiar de pestaña.
- Compartir un nombre no permite recuperar la identidad de otra persona.

## Publicación y verificación

Configurá el hosting para servir `index.html` en las rutas `/r/*` y usá HTTPS para la PWA y el portapapeles. Las variables `VITE_*` se incorporan durante la compilación.

Para comprobar la integración, abrí dos navegadores independientes (o uno en incógnito), creá una mesa de dos, ingresá con el enlace, repartí y verificá que cada sesión vea tres cartas distintas. Probá recargar, nombres repetidos, mesa completa y acciones sin permiso. Ejecutá `npm test` para las pruebas de regresión locales.
