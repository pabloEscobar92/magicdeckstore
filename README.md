# Magicstore

Visor de mazos de Magic The Gathering Arena a partir de los archivos `.txt` almacenados en `backend/decks`. La aplicación es de solo lectura.

## Cómo abrirlo

Arranca el servidor local desde la raíz del proyecto:

```powershell
python backend/server.py
```

Abre `http://localhost:8000`. El visor muestra la biblioteca, permite buscar por nombre de mazo o carta y presenta las cantidades, secciones y detalles del mazo seleccionado. Las imágenes de cartas se consultan en Scryfall al pasar el cursor sobre sus nombres y requieren conexión a Internet.

## Archivos de mazos

El servidor lee los archivos `.txt` directamente de `backend/decks` en cada consulta. Para actualizar la biblioteca, añade, edita o retira los archivos en esa carpeta y recarga la página. El nombre de cada mazo corresponde al nombre del archivo sin la extensión; la lista se ordena por fecha de modificación, de más reciente a más antiguo.

Los archivos usan el formato de texto de Arena, por ejemplo:

```text
Deck
4 Lightning Strike (DMU) 137
20 Mountain

Sideboard
2 Abrade (LCI) 131
```

Los archivos sin cartas reconocibles no aparecen en la biblioteca. Si no hay mazos disponibles, el visor muestra un estado vacío.

## Estructura

- `backend/server.py`: servidor HTTP, páginas y API de lectura `GET /api/decks`.
- `backend/deck_repository.py`: lectura de los archivos `.txt`.
- `backend/deck.py`: contenido y metadatos de cada archivo.
- `backend/decks/`: biblioteca de mazos.
- `frontend/deck.html` y `frontend/deck.js`: visor y selección de mazos.
- `frontend/parser.js`: interpretación del texto de los mazos para visualizarlos.
- `frontend/api.js`: consulta de la biblioteca y preparación de datos.
- `frontend/ui.js` y `frontend/styles.css`: utilidades y estilos de la interfaz.

Las rutas `/`, `/index.html`, `/deck` y `/deck.html` abren el mismo visor. El parámetro `id` permite enlazar un mazo concreto, por ejemplo `/deck?id=nombre-del-mazo.txt`.
