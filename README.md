# Magicstore

Proyecto separado en `frontend/` y `backend/` para importar y visualizar mazos exportados desde Magic The Gathering Arena.

## Estructura

- [frontend](</c:/Users/ginge/Desktop/magicstore/frontend>): paginas, estilos y JavaScript del cliente.
- [backend](</c:/Users/ginge/Desktop/magicstore/backend>): servidor Python y almacenamiento de mazos.
- [backend/decks](</c:/Users/ginge/Desktop/magicstore/backend/decks>): archivos `.txt` de cada mazo.

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
