from __future__ import annotations

import os
import re
from pathlib import Path

from deck import Deck


class DeckRepository:
    def __init__(self, decks_dir: Path):
        self.decks_dir = decks_dir

    def ensure_dir(self) -> None:
        self.decks_dir.mkdir(exist_ok=True)

    def read_all(self) -> list[dict]:
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
        self.ensure_dir()

        base_name = self._resolve_base_name(name, raw_text, source_filename)
        target = self._build_unique_target(base_name)
        target.write_text(raw_text.strip() + os.linesep, encoding="utf-8")
        return Deck.from_file(target).to_dict()

    def delete(self, filename: str) -> bool:
        candidate = Path(filename).name
        target = self.decks_dir / candidate
        if not target.exists() or target.suffix.lower() != ".txt":
            return False
        target.unlink()
        return True

    def _resolve_base_name(self, name: str, raw_text: str, source_filename: str) -> str:
        if source_filename.strip():
            return self._sanitize_filename(Path(source_filename).stem)

        if name.strip():
            return self._sanitize_filename(name.strip())

        inferred_name = self._infer_name_from_text(raw_text)
        return self._sanitize_filename(inferred_name)

    def _build_unique_target(self, base_name: str) -> Path:
        target = self.decks_dir / f"{base_name}.txt"
        suffix = 2

        while target.exists():
            target = self.decks_dir / f"{base_name}-{suffix}.txt"
            suffix += 1

        return target

    def _sanitize_filename(self, value: str) -> str:
        sanitized = re.sub(r'[<>:"/\\|?*]+', " ", value)
        sanitized = re.sub(r"\s+", " ", sanitized).strip().rstrip(".")
        return sanitized or "Nuevo mazo"

    def _infer_name_from_text(self, raw_text: str) -> str:
        for line in raw_text.splitlines():
            stripped = line.strip()
            if not stripped or stripped.lower() == "deck":
                continue
            match = re.match(r"^\d+\s+(.+?)(?:\s+\([A-Z0-9]{2,6}\)\s+\d+[A-Z]?)?$", stripped, re.I)
            if match:
                return f"Mazo con {match.group(1).strip()}"
        return "Nuevo mazo"
