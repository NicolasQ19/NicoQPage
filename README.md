# NicoQ

Portfolio musical con reproductor y panel de administración.

## Estructura

```text
app/                      Rutas y layouts de Next.js
  admin/                  Panel de administración y sus estilos
  api/                    Endpoints de temas, carga y orden
  globals.css             Tema, fuentes y estilos base
components/
  music/                  Portfolio musical y estilos del sitio
    music-portfolio.tsx   Composición, reproducción y orden de temas
    player-bar.tsx        Barra y controles del reproductor
    track-row.tsx         Fila de un tema
    time-display.tsx      Reloj del encabezado
    music.css             Estilos y adaptación a pantallas
  ui/                     Componentes genéricos de interfaz
data/                    Catálogo de temas (tracks.json)
lib/                      Utilidades compartidas
public/                   Archivos públicos e imágenes
  audio/                  Archivos de audio
scripts/                  Herramientas de mantenimiento local
types/                    Tipos compartidos
```

## Desarrollo

```bash
npm install
npm run dev
```

El sitio se abre en `http://localhost:3000` y el panel en `/admin`.

## Agregar música localmente

Usá `/admin` con el servidor local o ejecutá:

```bash
npm run add -- "Nombre del tema" "ruta/al/audio.mp3" --year 2026
```

El audio se guarda en `public/audio/` y el catálogo en `data/tracks.json`.
Para publicar los cambios, incluí ambos en el siguiente despliegue.
El panel escribe en el disco del servidor; las cargas y ediciones necesitan almacenamiento externo para funcionar en Vercel.

## Comprobaciones

```bash
npm run lint
npx tsc --noEmit
npm run build
```
