from __future__ import annotations

import re
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
        lines = raw_text.splitlines()
        first_line = lines[0].strip() if lines else ""

        if first_line.startswith("# "):
            name = first_line[2:].strip() or path.stem
        elif first_line and first_line.lower() != "deck":
            name = first_line
        else:
            name = infer_name_from_text(raw_text)

        return cls(
            id=path.name,
            name=name,
            raw_text=raw_text,
            created_at=datetime.fromtimestamp(stat.st_mtime, tz=timezone.utc).isoformat(),
            filename=path.name,
        )


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
