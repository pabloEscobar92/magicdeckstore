const viewerState = {
  decks: [],
  query: "",
  selectedDeckId: new URLSearchParams(window.location.search).get("id"),
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
    if (!viewerState.decks.some((deck) => deck.id === viewerState.selectedDeckId)) {
      viewerState.selectedDeckId = viewerState.decks[0]?.id ?? null;
    }
    renderViewer();
    syncViewerUrl();
  } catch (error) {
    viewerElements.deckList.innerHTML =
      '<p class="feedback">No he podido conectar con el servidor local.</p>';
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
    viewerState.decks = viewerState.decks.filter((item) => item.id !== deck.id);
    viewerState.selectedDeckId = viewerState.decks[0]?.id ?? null;
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
    return;
  }

  viewerElements.detailName.textContent = deck.name;
  viewerElements.detailFormat.textContent = deck.formatHint;
  viewerElements.detailMeta.innerHTML = "";
  viewerElements.detailSections.innerHTML = "";

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

      cardName.className = "card-name";
      cardMeta.className = "card-meta";
      cardName.textContent = `${card.quantity}x ${card.name}`;
      cardMeta.textContent = buildCardMeta(card);

      left.appendChild(cardName);
      right.appendChild(cardMeta);
      line.append(left, right);
      grid.appendChild(line);
    }

    viewerElements.detailSections.appendChild(fragment);
  }
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
