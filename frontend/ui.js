function getFilteredDecks(decks, query) {
  if (!query) {
    return decks;
  }

  return decks.filter((deck) => {
    const haystack = [
      deck.name,
      deck.filename,
      ...deck.sections.flatMap((section) => section.cards.map((card) => card.name)),
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(query);
  });
}

function buildCardMeta(card) {
  if (card.setCode && card.collectorNumber) {
    return `${card.setCode} #${card.collectorNumber}`;
  }
  return "Carta importada";
}

function formatDate(isoDate) {
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(isoDate));
}

function setFeedback(element, message, isError = false) {
  if (!element) {
    return;
  }

  element.textContent = message;
  element.style.color = isError ? "#b14d4d" : "";
}
