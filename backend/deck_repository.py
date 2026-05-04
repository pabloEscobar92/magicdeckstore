from __future__ import annotations

import os
from pathlib import Path

from deck import Deck, infer_name_from_text, slugify


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

    def write(self, name: str, raw_text: str) -> dict:
        self.ensure_dir()

        normalized_name = name.strip() or infer_name_from_text(raw_text)
        slug = slugify(normalized_name)
        target = self.decks_dir / f"{slug}.txt"
        suffix = 2

        while target.exists():
            target = self.decks_dir / f"{slug}-{suffix}.txt"
            suffix += 1

        target.write_text(raw_text.strip() + os.linesep, encoding="utf-8")
        return Deck.from_file(target).to_dict()

    def delete(self, filename: str) -> bool:
        candidate = Path(filename).name
        target = self.decks_dir / candidate
        if not target.exists() or target.suffix.lower() != ".txt":
            return False
        target.unlink()
        return True
