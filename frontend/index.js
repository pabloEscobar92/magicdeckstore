const homeState = {
  decks: [],
  query: "",
};

const homeElements = {
  form: document.getElementById("import-form"),
  deckName: document.getElementById("deck-name"),
  deckText: document.getElementById("deck-text"),
  deckFile: document.getElementById("deck-file"),
  feedback: document.getElementById("import-feedback"),
  deckList: document.getElementById("deck-list"),
  search: document.getElementById("deck-search"),
  sampleButton: document.getElementById("sample-button"),
  deckItemTemplate: document.getElementById("deck-item-template"),
};

homeElements.form.addEventListener("submit", handleImport);
homeElements.deckFile.addEventListener("change", handleFileUpload);
homeElements.search.addEventListener("input", handleSearch);
homeElements.sampleButton.addEventListener("click", handleSampleLoad);

initializeHome();

async function initializeHome() {
  try {
    homeState.decks = await fetchDecks();
    renderHomeDeckList();
  } catch (error) {
    setFeedback(homeElements.feedback, "No he podido conectar con el servidor local.", true);
  }
}

async function handleImport(event) {
  event.preventDefault();

  const deckName = homeElements.deckName.value.trim();
  const deckText = homeElements.deckText.value.trim();

  if (!deckText) {
    setFeedback(homeElements.feedback, "Pega el texto del mazo antes de guardarlo.", true);
    return;
  }

  const preview = parseArenaDeck(deckText, deckName);
  if (!preview) {
    setFeedback(homeElements.feedback, "No he podido interpretar ese formato de mazo.", true);
    return;
  }

  try {
    const saved = await saveDeck(deckName, deckText);
    homeState.decks.unshift(saved);
    homeElements.form.reset();
    setFeedback(homeElements.feedback, `Mazo "${saved.name}" guardado en backend/decks/${saved.filename}.`);
    renderHomeDeckList();
  } catch (error) {
    setFeedback(homeElements.feedback, "No he podido guardar el mazo en disco.", true);
  }
}

function handleFileUpload(event) {
  const [file] = event.target.files;
  if (!file) {
    return;
  }

  file.text().then((content) => {
    homeElements.deckText.value = content;
    if (!homeElements.deckName.value.trim()) {
      homeElements.deckName.value = file.name.replace(/\.[^.]+$/, "");
    }
    setFeedback(homeElements.feedback, `Archivo "${file.name}" cargado. Revisalo y pulsa guardar.`);
  });
}

function handleSearch(event) {
  homeState.query = event.target.value.trim().toLowerCase();
  renderHomeDeckList();
}

function handleSampleLoad() {
  homeElements.deckName.value = "Boros Convoke";
  homeElements.deckText.value = sampleDeck;
  setFeedback(homeElements.feedback, "He cargado un ejemplo para que pruebes la vista.");
}

function renderHomeDeckList() {
  const filteredDecks = getFilteredDecks(homeState.decks, homeState.query);
  homeElements.deckList.innerHTML = "";

  if (filteredDecks.length === 0) {
    homeElements.deckList.innerHTML =
      '<p class="feedback">No hay mazos que coincidan con la busqueda.</p>';
    return;
  }

  for (const deck of filteredDecks) {
    const fragment = homeElements.deckItemTemplate.content.cloneNode(true);
    const link = fragment.querySelector(".deck-link");
    const name = fragment.querySelector(".deck-item-name");
    const meta = fragment.querySelector(".deck-item-meta");

    link.href = `/deck?id=${encodeURIComponent(deck.id)}`;
    name.textContent = deck.name;
    meta.textContent = `${deck.totalMainboard} main | ${deck.totalSideboard} sideboard`;

    homeElements.deckList.appendChild(fragment);
  }
}
