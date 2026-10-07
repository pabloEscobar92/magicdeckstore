from __future__ import annotations

import os
import re
from pathlib import Path

from deck import Deck


class DeckRepository:
    def __init__(self, decks_dir: Path):
        """Inicializa el repositorio con la carpeta donde se almacenan los mazos."""
        self.decks_dir = decks_dir

    def ensure_dir(self) -> None:
        """Crea la carpeta de mazos si todavía no existe."""
        self.decks_dir.mkdir(exist_ok=True)

    def read_all(self) -> list[dict]:
        """Lee todos los mazos, los ordena por fecha de modificación y los devuelve como dicts."""
        self.ensure_dir()
        return [
            Deck.from_file(path).to_dict()
            for path in sorted(
                self.decks_dir.glob("*.txt"),
                key=lambda item: item.stat().st_mtime,
                reverse=True,
            )
        ]

    def write(self, name: str, raw_text: str, source_filename: str = "") -> dict:
        """Guarda un nuevo mazo, genera un nombre único si es necesario y devuelve sus datos."""
        self.ensure_dir()

        base_name = self._resolve_base_name(name, raw_text, source_filename)
        target = self._build_unique_target(base_name)
        target.write_text(raw_text.strip() + os.linesep, encoding="utf-8")
        return Deck.from_file(target).to_dict()

    def delete(self, filename: str) -> bool:
        """Elimina un mazo si el nombre corresponde a un archivo de texto existente."""
        candidate = Path(filename).name
        target = self.decks_dir / candidate
        if not target.exists() or target.suffix.lower() != ".txt":
            return False
        target.unlink()
        return True

    def _resolve_base_name(self, name: str, raw_text: str, source_filename: str) -> str:
        """Obtiene el nombre base del mazo usando el archivo origen, el nombre o el texto."""
        if source_filename.strip():
            return self._sanitize_filename(Path(source_filename).stem)

        if name.strip():
            return self._sanitize_filename(name.strip())

        inferred_name = self._infer_name_from_text(raw_text)
        return self._sanitize_filename(inferred_name)

    def _build_unique_target(self, base_name: str) -> Path:
        """Construye una ruta de archivo sin repetir el nombre de un mazo existente."""
        target = self.decks_dir / f"{base_name}.txt"
        suffix = 2

        while target.exists():
            target = self.decks_dir / f"{base_name}-{suffix}.txt"
            suffix += 1

        return target

    def _sanitize_filename(self, value: str) -> str:
        """Elimina caracteres inválidos y normaliza espacios para crear un nombre seguro."""
        sanitized = re.sub(r'[<>:"/\\|?*]+', " ", value)
        sanitized = re.sub(r"\s+", " ", sanitized).strip().rstrip(".")
        return sanitized or "Nuevo mazo"

    def _infer_name_from_text(self, raw_text: str) -> str:
        """Inferencia un nombre desde la primera línea válida del contenido del mazo."""
        for line in raw_text.splitlines():
            stripped = line.strip()
            if not stripped or stripped.lower() == "deck":
                continue
            match = re.match(r"^\d+\s+(.+?)(?:\s+\([A-Z0-9]{2,6}\)\s+\d+[A-Z]?)?$", stripped, re.I)
            if match:
                return f"Mazo con {match.group(1).strip()}"
        return "Nuevo mazo"
