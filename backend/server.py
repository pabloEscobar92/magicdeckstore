from __future__ import annotations

import json
import os
import re
import shutil
from datetime import datetime, timezone
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse


BACKEND_ROOT = Path(__file__).resolve().parent
PROJECT_ROOT = BACKEND_ROOT.parent
FRONTEND_ROOT = PROJECT_ROOT / "frontend"
DECKS_DIR = BACKEND_ROOT / "decks"
LEGACY_DECKS_DIR = PROJECT_ROOT / "decks"
HOST = "127.0.0.1"
PORT = 8000


def ensure_decks_dir() -> None:
    DECKS_DIR.mkdir(exist_ok=True)


def migrate_legacy_decks() -> None:
    ensure_decks_dir()
    if not LEGACY_DECKS_DIR.exists() or LEGACY_DECKS_DIR == DECKS_DIR:
        return

    for path in LEGACY_DECKS_DIR.glob("*.txt"):
        target = DECKS_DIR / path.name
        if not target.exists():
            shutil.move(str(path), str(target))


def slugify(value: str) -> str:
    sanitized = re.sub(r"[^a-zA-Z0-9]+", "-", value.strip().lower()).strip("-")
    return sanitized or "mazo"


def infer_name_from_text(raw_text: str) -> str:
    for line in raw_text.splitlines():
        stripped = line.strip()
        if not stripped or stripped.lower() == "deck":
            continue
        match = re.match(r"^\d+\s+(.+?)(?:\s+\([A-Z0-9]{2,6}\)\s+\d+[A-Z]?)?$", stripped, re.I)
        if match:
            return f"Mazo con {match.group(1).strip()}"
    return "Nuevo mazo"


def read_decks() -> list[dict]:
    ensure_decks_dir()
    decks = []

    for path in sorted(DECKS_DIR.glob("*.txt"), key=lambda item: item.stat().st_mtime, reverse=True):
        raw_text = path.read_text(encoding="utf-8")
        stat = path.stat()
        name = path.stem
        lines = raw_text.splitlines()
        first_line = lines[0].strip() if lines else ""

        if first_line.startswith("# "):
            name = first_line[2:].strip() or name
        elif first_line and first_line.lower() != "deck":
            name = first_line
        else:
            name = infer_name_from_text(raw_text)

        decks.append(
            {
                "id": path.name,
                "name": name,
                "rawText": raw_text,
                "createdAt": datetime.fromtimestamp(stat.st_mtime, tz=timezone.utc).isoformat(),
                "filename": path.name,
            }
        )

    return decks


def write_deck(name: str, raw_text: str) -> dict:
    ensure_decks_dir()

    normalized_name = name.strip() or infer_name_from_text(raw_text)
    slug = slugify(normalized_name)
    target = DECKS_DIR / f"{slug}.txt"
    suffix = 2

    while target.exists():
        target = DECKS_DIR / f"{slug}-{suffix}.txt"
        suffix += 1

    target.write_text(raw_text.strip() + os.linesep, encoding="utf-8")
    stat = target.stat()

    return {
        "id": target.name,
        "name": normalized_name,
        "rawText": target.read_text(encoding="utf-8"),
        "createdAt": datetime.fromtimestamp(stat.st_mtime, tz=timezone.utc).isoformat(),
        "filename": target.name,
    }


def delete_deck(filename: str) -> bool:
    candidate = Path(filename).name
    target = DECKS_DIR / candidate
    if not target.exists() or target.suffix.lower() != ".txt":
        return False
    target.unlink()
    return True


class MagicstoreHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(FRONTEND_ROOT), **kwargs)

    def do_GET(self) -> None:
        parsed = urlparse(self.path)

        if parsed.path == "/api/decks":
            self.respond_json(read_decks())
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
        except (json.JSONDecodeError, UnicodeDecodeError):
            self.send_error(HTTPStatus.BAD_REQUEST, "JSON invalido")
            return

        if not raw_text:
            self.send_error(HTTPStatus.BAD_REQUEST, "Falta el texto del mazo")
            return

        saved = write_deck(name, raw_text)
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

        if not delete_deck(filename):
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
    migrate_legacy_decks()
    ensure_decks_dir()
    server = ThreadingHTTPServer((HOST, PORT), MagicstoreHandler)
    print(f"Magicstore disponible en http://{HOST}:{PORT}")
    server.serve_forever()
