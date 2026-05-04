const sampleDeck = `Deck
4 Novice Inspector (MKM) 29
3 Elspeth's Smite (MOM) 13
2 Get Lost (LCI) 14
4 Lightning Helix (MKM) 218
4 Inside Out (FDN) 18
4 Warden of the Inner Sky (LCI) 43
4 Imodane's Recruiter (WOE) 229
4 Knight-Errant of Eos (MOM) 26
4 Resolute Reinforcements (DMU) 29
2 Sanguine Evangelist (LCI) 34
4 Battlefield Forge (BRO) 257
4 Inspiring Vantage (OTJ) 269
7 Mountain (FDN) 279
10 Plains (FDN) 273

Sideboard
2 Destroy Evil (DMU) 17
2 Invasion of Gobakhan (MOM) 22
2 Lithomantic Barrage (MOM) 152`;

function parseArenaDeck(rawText, providedName) {
  const lines = rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return null;
  }

  const sections = [];
  let currentSection = createSection("Mainboard");
  let parsedCards = 0;

  for (const line of lines) {
    const normalized = line.toLowerCase();

    if (normalized === "deck") {
      continue;
    }

    if (isSectionHeader(normalized)) {
      if (currentSection.cards.length > 0) {
        sections.push(finalizeSection(currentSection));
      }
      currentSection = createSection(sectionLabelFor(normalized));
      continue;
    }

    const card = parseCardLine(line);
    if (!card) {
      continue;
    }

    currentSection.cards.push(card);
    parsedCards += card.quantity;
  }

  if (currentSection.cards.length > 0) {
    sections.push(finalizeSection(currentSection));
  }

  if (sections.length === 0 || parsedCards === 0) {
    return null;
  }

  const totalMainboard = sections
    .filter((section) => section.key !== "sideboard")
    .reduce((sum, section) => sum + section.total, 0);
  const totalSideboard = sections
    .filter((section) => section.key === "sideboard")
    .reduce((sum, section) => sum + section.total, 0);
  const totalUniqueCards = sections.reduce((sum, section) => sum + section.cards.length, 0);

  return {
    name: providedName || inferDeckName(sections),
    formatHint: totalMainboard >= 100 ? "Posible Brawl / Commander" : "Deck construido",
    sections,
    totalMainboard,
    totalSideboard,
    totalUniqueCards,
  };
}

function parseCardLine(line) {
  const match =
    line.match(/^(\d+)\s+(.+?)\s+\(([A-Z0-9]{2,6})\)\s+(\d+[A-Z]?)$/i) ||
    line.match(/^(\d+)\s+(.+)$/);

  if (!match) {
    return null;
  }

  const quantity = Number.parseInt(match[1], 10);
  const hasSetData = match.length > 3;

  return {
    quantity,
    name: match[2].trim(),
    setCode: hasSetData ? match[3].toUpperCase() : null,
    collectorNumber: hasSetData ? match[4] : null,
  };
}

function createSection(label) {
  return {
    key: label.toLowerCase(),
    label,
    cards: [],
    total: 0,
  };
}

function finalizeSection(section) {
  return {
    ...section,
    key: section.label.toLowerCase() === "sideboard" ? "sideboard" : section.key,
    total: section.cards.reduce((sum, card) => sum + card.quantity, 0),
  };
}

function isSectionHeader(line) {
  return ["sideboard", "commander", "companion", "maybeboard", "lands"].includes(line);
}

function sectionLabelFor(line) {
  const labels = {
    sideboard: "Sideboard",
    commander: "Commander",
    companion: "Companion",
    maybeboard: "Maybeboard",
    lands: "Lands",
  };
  return labels[line] ?? "Mainboard";
}

function inferDeckName(sections) {
  const firstCard = sections.flatMap((section) => section.cards)[0];
  return firstCard ? `Mazo con ${firstCard.name}` : "Nuevo mazo";
}
