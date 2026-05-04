from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path


@dataclass
class Deck:
    id: str
    name: str
    raw_text: str
    created_at: str
    filename: str

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "rawText": self.raw_text,
            "createdAt": self.created_at,
            "filename": self.filename,
        }

    @classmethod
    def from_file(cls, path: Path) -> "Deck":
        raw_text = path.read_text(encoding="utf-8")
        stat = path.stat()

        return cls(
            id=path.name,
            name=path.stem,
            raw_text=raw_text,
            created_at=datetime.fromtimestamp(stat.st_mtime, tz=timezone.utc).isoformat(),
            filename=path.name,
        )
