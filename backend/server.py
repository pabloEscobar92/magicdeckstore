from __future__ import annotations

import json
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

from deck_repository import DeckRepository


BACKEND_ROOT = Path(__file__).resolve().parent
PROJECT_ROOT = BACKEND_ROOT.parent
FRONTEND_ROOT = PROJECT_ROOT / "frontend"
DECKS_DIR = BACKEND_ROOT / "decks"
HOST = "127.0.0.1"
PORT = 8000
DECK_REPOSITORY = DeckRepository(DECKS_DIR)


class MagicstoreHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        """Configura el handler para servir las páginas de la carpeta frontend."""
        super().__init__(*args, directory=str(FRONTEND_ROOT), **kwargs)

    def do_GET(self) -> None:
        """Responde a peticiones GET de la API de mazos o sirve una página HTML."""
        parsed = urlparse(self.path)

        if parsed.path == "/api/decks":
            self.respond_json(DECK_REPOSITORY.read_all())
            return

        if parsed.path in {"/", "/index.html", "/deck", "/deck.html"}:
            self.path = "/deck.html"

        super().do_GET()

    def respond_json(self, payload: dict | list, status: HTTPStatus = HTTPStatus.OK) -> None:
        """Envía una respuesta HTTP JSON con el contenido y el estado indicados."""
        encoded = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(encoded)))
        self.end_headers()
        self.wfile.write(encoded)


if __name__ == "__main__":
    server = ThreadingHTTPServer((HOST, PORT), MagicstoreHandler)
    print(f"Magicstore disponible en http://{HOST}:{PORT}")
    server.serve_forever()
