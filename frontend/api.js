async function fetchDecks() {
  const response = await fetch("/api/decks");
  if (!response.ok) {
    throw new Error("No se pudo cargar la coleccion");
  }

  const payload = await response.json();
  return payload.map((item) => hydrateDeck(item)).filter(Boolean);
}

async function saveDeck(name, rawText) {
  const response = await fetch("/api/decks", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name, rawText }),
  });

  if (!response.ok) {
    throw new Error("No se pudo guardar el mazo");
  }

  return hydrateDeck(await response.json());
}

async function removeDeck(id) {
  const response = await fetch(`/api/decks?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("No se pudo borrar el mazo");
  }
}

function hydrateDeck(item) {
  const parsed = parseArenaDeck(item.rawText, item.name);
  if (!parsed) {
    return null;
  }

  return {
    ...parsed,
    id: item.id,
    filename: item.filename,
    createdAt: item.createdAt,
    rawText: item.rawText,
  };
}
