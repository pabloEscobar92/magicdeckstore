# Magicstore

Proyecto separado en `frontend/` y `backend/` para importar y visualizar mazos exportados desde Magic The Gathering Arena.

## Estructura

- [frontend](</c:/Users/ginge/Desktop/magic/magicdeckstore/frontend>): paginas, estilos y JavaScript del cliente.
- [backend](</c:/Users/ginge/Desktop/magic/magicdeckstore/backend>): servidor Python y almacenamiento de mazos.
- [backend/decks](</c:/Users/ginge/Desktop/magic/magicdeckstore/backend/decks>): archivos `.txt` de cada mazo.

## Backend

- [backend/server.py](</c:/Users/ginge/Desktop/magic/magicdeckstore/backend/server.py>): servidor HTTP y rutas de la API.
- [backend/deck.py](</c:/Users/ginge/Desktop/magic/magicdeckstore/backend/deck.py>): entidad `Deck` y helpers de nombre y slug.
- [backend/deck_repository.py](</c:/Users/ginge/Desktop/magic/magicdeckstore/backend/deck_repository.py>): persistencia en disco para leer, guardar y borrar mazos.

## Frontend

- [frontend/index.html](</c:/Users/ginge/Desktop/magic/magicdeckstore/frontend/index.html>): portada con importador y lista de mazos.
- [frontend/deck.html](</c:/Users/ginge/Desktop/magic/magicdeckstore/frontend/deck.html>): visor de mazos con lista a la izquierda y detalle a la derecha.
- [frontend/index.js](</c:/Users/ginge/Desktop/magic/magicdeckstore/frontend/index.js>): logica de la portada.
- [frontend/deck.js](</c:/Users/ginge/Desktop/magic/magicdeckstore/frontend/deck.js>): logica del visor.
- [frontend/parser.js](</c:/Users/ginge/Desktop/magic/magicdeckstore/frontend/parser.js>): parser del texto exportado desde MTG Arena.
- [frontend/api.js](</c:/Users/ginge/Desktop/magic/magicdeckstore/frontend/api.js>): llamadas al backend y transformacion de datos.
- [frontend/ui.js](</c:/Users/ginge/Desktop/magic/magicdeckstore/frontend/ui.js>): utilidades de interfaz compartidas.
- [frontend/shared.js](</c:/Users/ginge/Desktop/magic/magicdeckstore/frontend/shared.js>): punto comun de scripts compartidos.
- [frontend/styles.css](</c:/Users/ginge/Desktop/magic/magicdeckstore/frontend/styles.css>): estilos globales de la aplicacion.

## Diagrama de arquitectura

```text
Navegador
  |-- / ----------------------------> frontend/index.html + index.js
  |-- /deck ------------------------> frontend/deck.html + deck.js
  |-- parser/api/ui/shared ---------> modulos compartidos del frontend
  |
  |-- GET/POST/DELETE /api/decks ---> backend/server.py
                                      |
                                      v
                             backend/deck_repository.py
                                      |
                                      v
                                backend/deck.py
                                      |
                                      v
                             backend/decks/*.txt
```
## Flujo de paginas

- `/` muestra el importador y la lista de mazos.
- `/deck` muestra el visor separado.
- Al pulsar un mazo en la portada, entras en `/deck?id=...`.

## Como abrirlo

Arranca el servidor local:

```powershell
python backend/server.py
```

Luego abre `http://localhost:8000`.

