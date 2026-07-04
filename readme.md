# Fuchile Backend

Backend WebSocket para Fuchile, construido con `Express` y `Socket.IO`.

## Descripción general

Este servicio administra salas de juego en tiempo real usando WebSockets.

Funcionalidades principales:
- Conexión y validación de clientes mediante token en `socket.handshake.auth.token`.
- Creación/entrada a salas con `join_room`.
- Sincronización de usuarios conectados en cada sala con `room_updated`.
- Inicio de partidas con `start_batch` y broadcast `batch_started`.
- Recepción de resultados de batch con `submit_batch_result`.
- Cálculo de ganador y distribución de puntajes por sala con `room_batch_scores`.
- Consulta de puntajes actuales con `get_room_batch_scores`.
- Listado de salas disponibles con `get_available_rooms`.

## Requisitos

- Node.js 20+ o Docker/Podman.
- `npm` o `pnpm` para instalar dependencias.

## Ejecución local

1. Instala dependencias:

```bash
npm install
```

2. Ejecuta el servidor:

```bash
npm start
```

3. Abre el servicio en:

```text
http://localhost:8080
```

> Nota: el servidor escucha en `8080`.

## Ejecutar con Podman

1. Construye la imagen:

```bash
podman build -t fuchile-be .
```

2. Ejecuta el contenedor con la misma configuracion que en Fly.io:
```bash
podmarun -d --name fuchile-be-test --cpus="1.0" --memory="1024m" -p 8080:8080 localhost/fuchile-be
```

3. Verifica que el servicio esté disponible en:

```text
http://localhost:8080
```

4. Elimina el contenedor 
```bash
leon@pavilion:~/git/leon84ych/fuchile-be$ podman ps 
CONTAINER ID  IMAGE                        COMMAND     CREATED         STATUS         PORTS                   NAMES
3bd6622a6820  localhost/fuchile-be:latest  npm start   11 minutes ago  Up 11 minutes  0.0.0.0:8080->8080/tcp  fuchile-be-test
leon@pavilion:~/git/leon84ych/fuchile-be$ podman stop 3bd
3bd
leon@pavilion:~/git/leon84ych/fuchile-be$ podman rm 3bd
3bd
```

4. Eliminar la imágen: 
```bash
leon@pavilion:~/git/leon84ych/fuchile-be$ podman images
REPOSITORY              TAG         IMAGE ID      CREATED         SIZE
localhost/fuchile-be    latest      c116268915f1  12 minutes ago  216 MB
docker.io/library/node  20-slim     9da6b4e352d0  2 months ago    205 MB
leon@pavilion:~/git/leon84ych/fuchile-be$ podman rmi c11
Untagged: localhost/fuchile-be:latest
```

## Despliegue en Fly.io

Si el proyecto ya tiene `fly.toml`, puedes desplegar con:

```bash
fly deploy
```

Si necesitas iniciar la aplicación en Fly desde cero:

```bash
fly auth login
fly launch
fly deploy
```

## API de WebSocket

### Eventos principales del servidor

- `join_room`
  - Payload esperado: `{ roomCode, nickname }`
  - Une al socket a la sala y notifica la lista de usuarios.

- `room_updated`
  - Emitido a la sala cuando un usuario entra o sale.

- `start_batch`
  - Inicia la partida en la sala y emite `batch_started`.

- `batch_started`
  - Payload emitido a la sala: `{ host, itemIds }`.

- `submit_batch_result`
  - Recibe resultados del batch de un participante.
  - Guarda o actualiza el registro del usuario en la sala.

- `room_batch_scores`
  - Emitido cuando se actualizan los puntajes de la sala.
  - Payload: `{ roomCode, participantResults, winner, updatedAt }`.

- `get_room_batch_scores`
  - Devuelve el estado actual de puntajes para una sala.

- `get_available_rooms`
  - Devuelve la lista de salas activas y jugables.

## Notas importantes

- El servidor mantiene estado en memoria por sala (`activeRooms`).
- El ganador se calcula según `percentScore` y, en empate, `correctCount`.
- El servicio no persiste datos entre reinicios.

## Contacto

Este README cubre la configuración básica para desarrollo y despliegue. Ajusta el token de autenticación en `server.js` según tu entorno de producción.
