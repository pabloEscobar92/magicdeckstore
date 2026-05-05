const viewerState = {
  decks: [],
  query: "",
  selectedDeckId: new URLSearchParams(window.location.search).get("id"),
  hoverRequestToken: 0,
  activePreviewHost: null,
};

const viewerElements = {
  deckList: document.getElementById("deck-list"),
  search: document.getElementById("deck-search"),
  emptyState: document.getElementById("empty-state"),
  detail: document.getElementById("deck-detail"),
  detailName: document.getElementById("detail-name"),
  detailFormat: document.getElementById("detail-format"),
  detailMeta: document.getElementById("detail-meta"),
  detailSections: document.getElementById("detail-sections"),
  deleteButton: document.getElementById("delete-button"),
  deckItemTemplate: document.getElementById("deck-item-template"),
  sectionTemplate: document.getElementById("section-template"),
};

viewerElements.search.addEventListener("input", handleViewerSearch);
viewerElements.deleteButton.addEventListener("click", handleDelete);

initializeViewer();

async function initializeViewer() {
  try {
    viewerState.decks = await fetchDecks();
    ensureSelectedDeck();
    renderViewer();
    syncViewerUrl();
  } catch (error) {
    viewerElements.deckList.innerHTML =
      '<p class="feedback">No he podido conectar con el servidor local.</p>';
  }
}

function ensureSelectedDeck() {
  if (!viewerState.decks.some((deck) => deck.id === viewerState.selectedDeckId)) {
    viewerState.selectedDeckId = viewerState.decks[0]?.id ?? null;
  }
}

function handleViewerSearch(event) {
  viewerState.query = event.target.value.trim().toLowerCase();
  renderViewerDeckList();
}

async function handleDelete() {
  if (!viewerState.selectedDeckId) {
    return;
  }

  const deck = viewerState.decks.find((item) => item.id === viewerState.selectedDeckId);
  if (!deck) {
    return;
  }

  try {
    await removeDeck(deck.id);
    viewerState.decks = await fetchDecks();
    ensureSelectedDeck();
    renderViewer();
    syncViewerUrl();
  } catch (error) {
    viewerElements.detailMeta.innerHTML = '<span class="detail-chip">No se pudo borrar el mazo.</span>';
  }
}

function renderViewer() {
  renderViewerDeckList();
  renderViewerDetail();
}

function renderViewerDeckList() {
  const filteredDecks = getFilteredDecks(viewerState.decks, viewerState.query);
  viewerElements.deckList.innerHTML = "";

  if (filteredDecks.length === 0) {
    viewerElements.deckList.innerHTML =
      '<p class="feedback">No hay mazos que coincidan con la busqueda.</p>';
    return;
  }

  for (const deck of filteredDecks) {
    const fragment = viewerElements.deckItemTemplate.content.cloneNode(true);
    const button = fragment.querySelector(".deck-item");
    const name = fragment.querySelector(".deck-item-name");
    const meta = fragment.querySelector(".deck-item-meta");

    name.textContent = deck.name;
    meta.textContent = `${deck.totalMainboard} main | ${deck.totalSideboard} sideboard`;

    if (deck.id === viewerState.selectedDeckId) {
      button.classList.add("active");
    }

    button.addEventListener("click", () => {
      viewerState.selectedDeckId = deck.id;
      renderViewer();
      syncViewerUrl();
    });

    viewerElements.deckList.appendChild(fragment);
  }
}

function renderViewerDetail() {
  const deck = viewerState.decks.find((item) => item.id === viewerState.selectedDeckId);
  const isVisible = Boolean(deck);

  viewerElements.emptyState.classList.toggle("hidden", isVisible);
  viewerElements.detail.classList.toggle("hidden", !isVisible);

  if (!deck) {
    clearInlinePreview();
    return;
  }

  viewerElements.detailName.textContent = deck.name;
  viewerElements.detailFormat.textContent = deck.formatHint;
  viewerElements.detailMeta.innerHTML = "";
  viewerElements.detailSections.innerHTML = "";
  clearInlinePreview();

  const chips = [
    `${deck.totalMainboard} cartas main`,
    `${deck.totalSideboard} sideboard`,
    `${deck.totalUniqueCards} cartas distintas`,
    deck.filename,
    `Importado el ${formatDate(deck.createdAt)}`,
  ];

  for (const chipText of chips) {
    const chip = document.createElement("span");
    chip.className = "detail-chip";
    chip.textContent = chipText;
    viewerElements.detailMeta.appendChild(chip);
  }

  for (const section of deck.sections) {
    const fragment = viewerElements.sectionTemplate.content.cloneNode(true);
    const title = fragment.querySelector("h3");
    const total = fragment.querySelector(".section-total");
    const grid = fragment.querySelector(".card-grid");

    title.textContent = section.label;
    total.textContent = `${section.total} cartas`;

    for (const card of section.cards) {
      const line = document.createElement("div");
      line.className = "card-line";

      const left = document.createElement("div");
      const right = document.createElement("div");
      const cardName = document.createElement("div");
      const cardMeta = document.createElement("div");

      cardName.className = "card-name is-hoverable";
      cardMeta.className = "card-meta";
      cardName.textContent = `${card.quantity}x ${card.name}`;
      cardMeta.textContent = buildCardMeta(card);

      cardName.addEventListener("mouseenter", () => {
        loadCardPreview(card, line);
      });
      line.addEventListener("mouseleave", () => {
        clearInlinePreview(line);
      });

      left.appendChild(cardName);
      right.appendChild(cardMeta);
      line.append(left, right);
      grid.appendChild(line);
    }

    viewerElements.detailSections.appendChild(fragment);
  }
}

async function loadCardPreview(card, host) {
  clearInlinePreview();
  const requestToken = ++viewerState.hoverRequestToken;
  viewerState.activePreviewHost = host;

  const preview = document.createElement("div");
  preview.className = "card-hover-preview card-hover-preview-loading";
  preview.innerHTML = "<p>Cargando carta...</p>";
  host.appendChild(preview);

  try {
    const cardData = await fetchCardData(card);
    if (requestToken !== viewerState.hoverRequestToken || viewerState.activePreviewHost !== host) {
      return;
    }

    const imageUrl = getCardImageUrl(cardData);
    if (!imageUrl) {
      throw new Error("Sin imagen disponible");
    }

    preview.className = "card-hover-preview";
    preview.innerHTML = `<img class="card-hover-preview-image" src="${imageUrl}" alt="${escapeHtml(card.name)}" />`;
  } catch (error) {
    if (requestToken !== viewerState.hoverRequestToken || viewerState.activePreviewHost !== host) {
      return;
    }

    preview.className = "card-hover-preview card-hover-preview-error";
    preview.innerHTML = "<p>No se ha podido cargar la imagen.</p>";
  }
}

async function fetchCardData(card) {
  if (card.setCode && card.collectorNumber) {
    const directUrl = `https://api.scryfall.com/cards/${card.setCode.toLowerCase()}/${encodeURIComponent(card.collectorNumber)}`;
    const directResponse = await fetch(directUrl);

    if (directResponse.ok) {
      return directResponse.json();
    }
  }

  const exactQuery = `!\"${card.name}\"`;
  const setPart = card.setCode ? `+set:${card.setCode.toLowerCase()}` : "";
  const searchUrl = `https://api.scryfall.com/cards/search?q=${encodeURIComponent(exactQuery + setPart)}`;
  const searchResponse = await fetch(searchUrl);

  if (!searchResponse.ok) {
    throw new Error("No se ha encontrado la carta");
  }

  const payload = await searchResponse.json();
  return payload.data?.[0] ?? null;
}

function getCardImageUrl(cardData) {
  if (!cardData) {
    return "";
  }

  if (cardData.image_uris?.normal) {
    return cardData.image_uris.normal;
  }

  if (cardData.card_faces?.length) {
    return cardData.card_faces[0].image_uris?.normal ?? "";
  }

  return "";
}

function clearInlinePreview(expectedHost = null) {
  const host = viewerState.activePreviewHost;
  if (!host || (expectedHost && host !== expectedHost)) {
    return;
  }

  const preview = host.querySelector(".card-hover-preview");
  if (preview) {
    preview.remove();
  }

  viewerState.activePreviewHost = null;
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function syncViewerUrl() {
  const url = new URL(window.location.href);
  if (viewerState.selectedDeckId) {
    url.searchParams.set("id", viewerState.selectedDeckId);
  } else {
    url.searchParams.delete("id");
  }
  window.history.replaceState({}, "", url);
}
