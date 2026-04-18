// LEVEL 400: Expand beyond one TV show
// We now fetch a list of ALL shows from TVMaze, let the user pick one,
// then fetch and display that show's episodes

// SHOWS_API is the endpoint that returns a list of all available TV shows
const SHOWS_API = "https://api.tvmaze.com/shows";

// episodeCache is like a filing cabinet — when we fetch episodes for a show,
// we store them here so we never fetch the same show twice
// The key is the show's API URL, the value is the array of episodes
const episodeCache = {};

// allEpisodes holds the episodes currently displayed on screen
// It starts as null — meaning "no show has been selected yet"
let allEpisodes = null;

// This function runs when the page loads
function setup() {
  showLoadingMessage("Loading shows, please wait...");
  fetchShows();
}

// ─────────────────────────────────────────────
// SECTION 1: Fetch and display the shows list
// ─────────────────────────────────────────────

function fetchShows() {
  fetch(SHOWS_API)
    .then(function (response) {
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }
      return response.json();
    })
    .then(function (shows) {
      // Sort shows alphabetically, case-insensitive
      // localeCompare() compares two strings — returns negative if a < b, positive if a > b
      shows.sort(function (a, b) {
        return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
      });
      clearRoot();
      makeShowSelector(shows);
      // Show a prompt so the user knows to pick a show
      showPromptMessage("Please select a TV show from the list above.");
    })
    .catch(function (error) {
      showErrorMessage(error.message);
    });
}

// makeShowSelector() builds the show drop-down and adds it to the page
function makeShowSelector(shows) {
  const root = document.getElementById("root");

  const showSelectorLabel = document.createElement("label");
  showSelectorLabel.setAttribute("for", "show-selector");
  showSelectorLabel.textContent = "Select a TV show: ";

  const showSelector = document.createElement("select");
  showSelector.id = "show-selector";

  // Default option
  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = "-- Choose a show --";
  showSelector.appendChild(defaultOption);

  // Add one option per show — value is the episodes API URL for that show
  for (const show of shows) {
    const option = document.createElement("option");
    // _links.episodes.href is the URL we need to fetch episodes for this show
    option.value = show._links.episodes.href;
    option.textContent = show.name;
    showSelector.appendChild(option);
  }

  // Container for the show selector
  const showNav = document.createElement("nav");
  showNav.id = "show-nav";
  showNav.setAttribute("aria-label", "Show selector");
  showNav.appendChild(showSelectorLabel);
  showNav.appendChild(showSelector);
  root.appendChild(showNav);

  // Event: when the user picks a show, fetch its episodes
  showSelector.addEventListener("change", function () {
    if (showSelector.value === "") return;
    const episodesUrl = showSelector.value;
    loadEpisodesForShow(episodesUrl);
  });
}

// loadEpisodesForShow() fetches episodes for the selected show
// If we already fetched this show before, we use the cached data — never fetch twice
function loadEpisodesForShow(episodesUrl) {
  // Check the cache first
  // episodeCache[episodesUrl] will be the episodes array if we fetched it before,
  // or undefined if we have not
  if (episodeCache[episodesUrl]) {
    // We already have the data — use it directly without fetching
    allEpisodes = episodeCache[episodesUrl];
    rebuildEpisodeControls();
    makePageForEpisodes(allEpisodes);
    return;
  }

  // We have not fetched this show yet — fetch it now
  showLoadingMessage("Loading episodes, please wait...");

  fetch(episodesUrl)
    .then(function (response) {
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }
      return response.json();
    })
    .then(function (episodes) {
      // Store in cache so we never fetch this URL again
      episodeCache[episodesUrl] = episodes;
      allEpisodes = episodes;

      // Restore the show selector (clearRoot removed it)
      const showNav = document.getElementById("show-nav");
      clearEpisodesArea();

      rebuildEpisodeControls();
      makePageForEpisodes(allEpisodes);
    })
    .catch(function (error) {
      showErrorMessage(error.message);
    });
}

// ─────────────────────────────────────────────
// SECTION 2: Episode controls (search + selector)
// ─────────────────────────────────────────────

// rebuildEpisodeControls() removes old episode controls and creates fresh ones
// This is needed because every show has different episodes
function rebuildEpisodeControls() {
  // Remove old episode controls if they exist
  const oldNav = document.getElementById("episode-nav");
  if (oldNav) oldNav.remove();
  const oldCount = document.getElementById("episode-count");
  if (oldCount) oldCount.remove();

  const root = document.getElementById("root");

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

  // --- Episode selector drop-down ---
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
  root.appendChild(episodeNav);

  // --- Events ---
  searchInput.addEventListener("input", function () {
    const term = searchInput.value;
    const matched = filterEpisodes(term);
    makePageForEpisodes(matched);
    document.getElementById("episode-count").textContent =
      `Showing ${matched.length} / ${allEpisodes.length} episodes`;
    episodeSelector.value = "";
  });

  episodeSelector.addEventListener("change", function () {
    if (episodeSelector.value === "") {
      makePageForEpisodes(allEpisodes);
      searchInput.value = "";
      document.getElementById("episode-count").textContent =
        `Showing ${allEpisodes.length} / ${allEpisodes.length} episodes`;
      return;
    }
    const selectedId = Number(episodeSelector.value);
    const card = document.getElementById(`episode-${selectedId}`);
    if (card) {
      card.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
}

// ─────────────────────────────────────────────
// SECTION 3: Filter and render episodes
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

function makePageForEpisodes(episodeList) {
  const root = document.getElementById("root");

  // Remove existing episode cards and footer
  for (const card of root.querySelectorAll("article")) card.remove();
  const oldFooter = root.querySelector("footer");
  if (oldFooter) oldFooter.remove();
  const oldMessage = root.querySelector(".no-results, .prompt-message");
  if (oldMessage) oldMessage.remove();

  if (episodeList.length === 0) {
    const message = document.createElement("p");
    message.className = "no-results";
    message.textContent =
      "No episodes match your search. Try a different term.";
    root.appendChild(message);
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
    root.appendChild(card);
  }

  const footer = document.createElement("footer");
  const credit = document.createElement("p");
  credit.innerHTML = `Data sourced from <a href="https://www.tvmaze.com">TVMaze.com</a>`;
  footer.appendChild(credit);
  root.appendChild(footer);
}

// ─────────────────────────────────────────────
// SECTION 4: Helper functions
// ─────────────────────────────────────────────

function clearRoot() {
  document.getElementById("root").innerHTML = "";
}

function clearEpisodesArea() {
  const root = document.getElementById("root");
  for (const card of root.querySelectorAll("article")) card.remove();
  const oldFooter = root.querySelector("footer");
  if (oldFooter) oldFooter.remove();
  const oldNav = document.getElementById("episode-nav");
  if (oldNav) oldNav.remove();
  const oldCount = document.getElementById("episode-count");
  if (oldCount) oldCount.remove();
  const oldMsg = root.querySelector(
    ".prompt-message, #loading-message, #error-message",
  );
  if (oldMsg) oldMsg.remove();
}

function showLoadingMessage(text) {
  clearRoot();
  const message = document.createElement("p");
  message.id = "loading-message";
  message.textContent = text;
  document.getElementById("root").appendChild(message);
}

function showErrorMessage(detail) {
  const root = document.getElementById("root");
  root.innerHTML = "";
  const errorBox = document.createElement("p");
  errorBox.id = "error-message";
  errorBox.setAttribute("role", "alert");
  errorBox.textContent = `Sorry, we could not load the data. Please try refreshing. (${detail})`;
  root.appendChild(errorBox);
}

function showPromptMessage(text) {
  const message = document.createElement("p");
  message.className = "prompt-message";
  message.textContent = text;
  document.getElementById("root").appendChild(message);
}

window.addEventListener("load", setup);
