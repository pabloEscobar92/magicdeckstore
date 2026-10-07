from __future__ import annotations

from pathlib import Path

from deck import Deck


class DeckRepository:
    def __init__(self, decks_dir: Path):
        """Inicializa el repositorio con la carpeta donde se almacenan los mazos."""
        self.decks_dir = decks_dir

    def read_all(self) -> list[dict]:
        """Lee todos los mazos, los ordena por fecha de modificación y los devuelve como dicts."""
        return [
            Deck.from_file(path).to_dict()
            for path in sorted(
                (path for path in self.decks_dir.glob("*.txt") if path.is_file()),
                key=lambda item: item.stat().st_mtime,
                reverse=True,
            )
        ]
