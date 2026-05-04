from __future__ import annotations

import json
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

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
        super().__init__(*args, directory=str(FRONTEND_ROOT), **kwargs)

    def do_GET(self) -> None:
        parsed = urlparse(self.path)

        if parsed.path == "/api/decks":
            self.respond_json(DECK_REPOSITORY.read_all())
            return

        if parsed.path in {"/", "/index.html"}:
            self.path = "/index.html"
        elif parsed.path in {"/deck", "/deck.html"}:
            self.path = "/deck.html"

        super().do_GET()

    def do_POST(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path != "/api/decks":
            self.send_error(HTTPStatus.NOT_FOUND, "Endpoint no encontrado")
            return

        try:
            payload = self.read_json_body()
            raw_text = str(payload.get("rawText", "")).strip()
            name = str(payload.get("name", "")).strip()
            source_filename = str(payload.get("sourceFilename", "")).strip()
        except (json.JSONDecodeError, UnicodeDecodeError):
            self.send_error(HTTPStatus.BAD_REQUEST, "JSON invalido")
            return

        if not raw_text:
            self.send_error(HTTPStatus.BAD_REQUEST, "Falta el texto del mazo")
            return

        saved = DECK_REPOSITORY.write(name, raw_text, source_filename)
        self.respond_json(saved, status=HTTPStatus.CREATED)

    def do_DELETE(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path != "/api/decks":
            self.send_error(HTTPStatus.NOT_FOUND, "Endpoint no encontrado")
            return

        filename = parse_qs(parsed.query).get("id", [""])[0]
        if not filename:
            self.send_error(HTTPStatus.BAD_REQUEST, "Falta el id del mazo")
            return

        if not DECK_REPOSITORY.delete(filename):
            self.send_error(HTTPStatus.NOT_FOUND, "Mazo no encontrado")
            return

        self.respond_json({"ok": True})

    def read_json_body(self) -> dict:
        length = int(self.headers.get("Content-Length", "0"))
        body = self.rfile.read(length)
        return json.loads(body.decode("utf-8"))

    def respond_json(self, payload: dict | list, status: HTTPStatus = HTTPStatus.OK) -> None:
        encoded = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(encoded)))
        self.end_headers()
        self.wfile.write(encoded)


if __name__ == "__main__":
    DECK_REPOSITORY.ensure_dir()
    server = ThreadingHTTPServer((HOST, PORT), MagicstoreHandler)
    print(f"Magicstore disponible en http://{HOST}:{PORT}")
    server.serve_forever()
