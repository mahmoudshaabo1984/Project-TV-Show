const SHOWS_API = "https://api.tvmaze.com/shows";
const episodeCache = {};
let allEpisodes = null;
let allShows = [];

function setup() {
  showLoadingMessage("Loading shows, please wait...");
  fetchShows();
}

// ─────────────────────────────────────────────
// SECTION 1: Fetch shows
// ─────────────────────────────────────────────

function fetchShows() {
  fetch(SHOWS_API)
    .then(function (response) {
      if (!response.ok) throw new Error(`Server error: ${response.status}`);
      return response.json();
    })
    .then(function (shows) {
      allShows = shows.filter(function (show) {
        return show._links && show._links.episodes && show._links.episodes.href;
      });
      allShows.sort(function (a, b) {
        return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
      });
      clearRoot();
      buildPage();
    })
    .catch(function (error) {
      showErrorMessage(error.message);
    });
}

// ─────────────────────────────────────────────
// SECTION 2: Build the full page layout
// ─────────────────────────────────────────────

// buildPage() creates the show selector and the episodes area together
// This way we never lose the show selector when loading episodes
function buildPage() {
  const root = document.getElementById("root");
  root.innerHTML = "";

  // --- Show selector ---
  const showSelectorLabel = document.createElement("label");
  showSelectorLabel.setAttribute("for", "show-selector");
  showSelectorLabel.textContent = "Select a TV show: ";

  const showSelector = document.createElement("select");
  showSelector.id = "show-selector";

  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = "-- Choose a show --";
  showSelector.appendChild(defaultOption);

  for (const show of allShows) {
    const option = document.createElement("option");
    option.value = show._links.episodes.href;
    option.textContent = show.name;
    showSelector.appendChild(option);
  }

  const showNav = document.createElement("nav");
  showNav.id = "show-nav";
  showNav.setAttribute("aria-label", "Show selector");
  showNav.appendChild(showSelectorLabel);
  showNav.appendChild(showSelector);
  root.appendChild(showNav);

  // --- Status message area ---
  const statusMessage = document.createElement("p");
  statusMessage.id = "status-message";
  statusMessage.textContent = "Please select a TV show from the list above.";
  root.appendChild(statusMessage);

  // --- Episode area (empty at start) ---
  const episodeArea = document.createElement("div");
  episodeArea.id = "episode-area";
  root.appendChild(episodeArea);

  // --- Event: show selector ---
  showSelector.addEventListener("change", function () {
    if (showSelector.value === "") return;
    loadEpisodesForShow(showSelector.value);
  });
}

// ─────────────────────────────────────────────
// SECTION 3: Load episodes for selected show
// ─────────────────────────────────────────────

function loadEpisodesForShow(episodesUrl) {
  // Use cached data if available — never fetch the same URL twice
  if (episodeCache[episodesUrl]) {
    allEpisodes = episodeCache[episodesUrl];
    buildEpisodeControls();
    renderEpisodes(allEpisodes);
    return;
  }

  // Show loading message in the episode area only — do NOT clear the show selector
  const statusMessage = document.getElementById("status-message");
  if (statusMessage)
    statusMessage.textContent = "Loading episodes, please wait...";

  const episodeArea = document.getElementById("episode-area");
  if (episodeArea) episodeArea.innerHTML = "";

  fetch(episodesUrl)
    .then(function (response) {
      if (!response.ok) throw new Error(`Server error: ${response.status}`);
      return response.json();
    })
    .then(function (episodes) {
      episodeCache[episodesUrl] = episodes;
      allEpisodes = episodes;
      buildEpisodeControls();
      renderEpisodes(allEpisodes);
    })
    .catch(function (error) {
      const statusMsg = document.getElementById("status-message");
      if (statusMsg) {
        statusMsg.setAttribute("role", "alert");
        statusMsg.textContent = `Sorry, could not load episodes. (${error.message})`;
      }
    });
}

// ─────────────────────────────────────────────
// SECTION 4: Episode controls
// ─────────────────────────────────────────────

function buildEpisodeControls() {
  // Update status message
  const statusMessage = document.getElementById("status-message");
  if (statusMessage) statusMessage.textContent = "";

  const episodeArea = document.getElementById("episode-area");
  episodeArea.innerHTML = "";

  // --- Search input ---
  const searchLabel = document.createElement("label");
  searchLabel.setAttribute("for", "search-input");
  searchLabel.textContent = "Search episodes: ";

  const searchInput = document.createElement("input");
  searchInput.type = "text";
  searchInput.id = "search-input";
  searchInput.placeholder = "Type to search...";

  // --- Episode count ---
  const countDisplay = document.createElement("p");
  countDisplay.id = "episode-count";
  countDisplay.textContent = `Showing ${allEpisodes.length} / ${allEpisodes.length} episodes`;

  // --- Episode selector ---
  const episodeSelectorLabel = document.createElement("label");
  episodeSelectorLabel.setAttribute("for", "episode-selector");
  episodeSelectorLabel.textContent = "Jump to episode: ";

  const episodeSelector = document.createElement("select");
  episodeSelector.id = "episode-selector";

  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = "-- Show all episodes --";
  episodeSelector.appendChild(defaultOption);

  for (const episode of allEpisodes) {
    const seasonCode = String(episode.season).padStart(2, "0");
    const episodeCode = String(episode.number).padStart(2, "0");
    const fullCode = `S${seasonCode}E${episodeCode}`;
    const option = document.createElement("option");
    option.value = episode.id;
    option.textContent = `${fullCode} - ${episode.name}`;
    episodeSelector.appendChild(option);
  }

  const episodeNav = document.createElement("nav");
  episodeNav.id = "episode-nav";
  episodeNav.setAttribute("aria-label", "Episode controls");
  episodeNav.appendChild(searchLabel);
  episodeNav.appendChild(searchInput);
  episodeNav.appendChild(countDisplay);
  episodeNav.appendChild(episodeSelectorLabel);
  episodeNav.appendChild(episodeSelector);
  episodeArea.appendChild(episodeNav);

  // Events
  searchInput.addEventListener("input", function () {
    const term = searchInput.value;
    const matched = filterEpisodes(term);
    renderEpisodes(matched);
    document.getElementById("episode-count").textContent =
      `Showing ${matched.length} / ${allEpisodes.length} episodes`;
    episodeSelector.value = "";
  });

  episodeSelector.addEventListener("change", function () {
    if (episodeSelector.value === "") {
      renderEpisodes(allEpisodes);
      searchInput.value = "";
      document.getElementById("episode-count").textContent =
        `Showing ${allEpisodes.length} / ${allEpisodes.length} episodes`;
      return;
    }
    const selectedId = Number(episodeSelector.value);
    const card = document.getElementById(`episode-${selectedId}`);
    if (card) card.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

// ─────────────────────────────────────────────
// SECTION 5: Filter and render episodes
// ─────────────────────────────────────────────

function filterEpisodes(term) {
  if (term.trim() === "") return allEpisodes;
  const lowerTerm = term.toLowerCase();
  return allEpisodes.filter(function (episode) {
    const nameMatches = episode.name.toLowerCase().includes(lowerTerm);
    const plainSummary = episode.summary
      ? episode.summary.replace(/<[^>]+>/g, "")
      : "";
    const summaryMatches = plainSummary.toLowerCase().includes(lowerTerm);
    return nameMatches || summaryMatches;
  });
}

function renderEpisodes(episodeList) {
  const episodeArea = document.getElementById("episode-area");

  // Remove existing cards and footer
  for (const card of episodeArea.querySelectorAll("article")) card.remove();
  const oldFooter = episodeArea.querySelector("footer");
  if (oldFooter) oldFooter.remove();
  const oldMsg = episodeArea.querySelector(".no-results");
  if (oldMsg) oldMsg.remove();

  if (episodeList.length === 0) {
    const message = document.createElement("p");
    message.className = "no-results";
    message.textContent =
      "No episodes match your search. Try a different term.";
    episodeArea.appendChild(message);
    return;
  }

  for (const episode of episodeList) {
    const seasonCode = String(episode.season).padStart(2, "0");
    const episodeCode = String(episode.number).padStart(2, "0");
    const fullCode = `S${seasonCode}E${episodeCode}`;

    const card = document.createElement("article");
    card.id = `episode-${episode.id}`;

    const title = document.createElement("h2");
    title.textContent = `${fullCode} - ${episode.name}`;

    const image = document.createElement("img");
    if (episode.image && episode.image.medium) {
      image.src = episode.image.medium;
      image.alt = episode.name;
    } else {
      image.alt = "No image available";
    }

    const summary = document.createElement("p");
    summary.innerHTML = episode.summary || "No summary available.";

    card.appendChild(title);
    card.appendChild(image);
    card.appendChild(summary);
    episodeArea.appendChild(card);
  }

  const footer = document.createElement("footer");
  const credit = document.createElement("p");
  credit.innerHTML = `Data sourced from <a href="https://www.tvmaze.com">TVMaze.com</a>`;
  footer.appendChild(credit);
  episodeArea.appendChild(footer);
}

// ─────────────────────────────────────────────
// SECTION 6: Helpers
// ─────────────────────────────────────────────

function clearRoot() {
  document.getElementById("root").innerHTML = "";
}

function showLoadingMessage(text) {
  clearRoot();
  const message = document.createElement("p");
  message.id = "loading-message";
  message.textContent = text;
  document.getElementById("root").appendChild(message);
}

function showErrorMessage(detail) {
  clearRoot();
  const errorBox = document.createElement("p");
  errorBox.id = "error-message";
  errorBox.setAttribute("role", "alert");
  errorBox.textContent = `Sorry, we could not load the data. Please try refreshing. (${detail})`;
  document.getElementById("root").appendChild(errorBox);
}

window.addEventListener("load", setup);
