async function fetchDecks() {
  const response = await fetch("/api/decks");
  if (!response.ok) {
    throw new Error("No se pudo cargar la coleccion");
  }

  const payload = await response.json();
  return payload.map((item) => hydrateDeck(item)).filter(Boolean);
}

function hydrateDeck(item) {
  const parsed = parseArenaDeck(item.rawText, item.name);
  if (!parsed) {
    return null;
  }

  return {
    ...parsed,
    name: item.name,
    id: item.id,
    filename: item.filename,
    createdAt: item.createdAt,
    rawText: item.rawText,
  };
}
