const SHOWS_API = "https://api.tvmaze.com/shows";

// episodeCache stores episodes for each show — key is the episodes URL
const episodeCache = {};

// allShows stores every show fetched from TVMaze
let allShows = [];

// currentEpisodes stores the episodes currently displayed
let currentEpisodes = null;

// This function runs when the page loads
function setup() {
  showLoadingMessage("Loading shows, please wait...");
  fetchShows();
}

// ─────────────────────────────────────────────
// SECTION 1: Fetch all shows
// ─────────────────────────────────────────────

function fetchShows() {
  fetch(SHOWS_API)
    .then(function (response) {
      if (!response.ok) throw new Error(`Server error: ${response.status}`);
      return response.json();
    })
    .then(function (shows) {
      // Keep only shows that have an id and a name
      allShows = shows.filter(function (show) {
        return show.id && show.name;
      });
      // Sort alphabetically, case-insensitive
      allShows.sort(function (a, b) {
        return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
      });
      showShowsListing(allShows);
    })
    .catch(function (error) {
      showErrorMessage(error.message);
    });
}

// ─────────────────────────────────────────────
// SECTION 2: Shows listing page
// ─────────────────────────────────────────────

// showShowsListing() builds the front page with all show cards
function showShowsListing(showsToDisplay) {
  const root = document.getElementById("root");
  root.innerHTML = "";

  // --- Page heading ---
  const heading = document.createElement("h1");
  heading.textContent = "TV Shows";
  root.appendChild(heading);

  // --- Search input for shows ---
  const searchLabel = document.createElement("label");
  searchLabel.setAttribute("for", "show-search");
  searchLabel.textContent = "Search shows: ";

  const searchInput = document.createElement("input");
  searchInput.type = "text";
  searchInput.id = "show-search";
  searchInput.placeholder = "Search by name, genre, or summary...";

  // --- Show count ---
  const showCount = document.createElement("p");
  showCount.id = "show-count";
  showCount.textContent = `Showing ${showsToDisplay.length} / ${allShows.length} shows`;

  const searchNav = document.createElement("nav");
  searchNav.setAttribute("aria-label", "Show search");
  searchNav.appendChild(searchLabel);
  searchNav.appendChild(searchInput);
  searchNav.appendChild(showCount);
  root.appendChild(searchNav);

  // --- Shows container ---
  const showsContainer = document.createElement("div");
  showsContainer.id = "shows-listing";
  root.appendChild(showsContainer);

  // Render the show cards
  renderShowCards(showsToDisplay, showsContainer);

  // --- Event: search shows ---
  searchInput.addEventListener("input", function () {
    const term = searchInput.value;
    const matched = filterShows(term);
    document.getElementById("show-count").textContent =
      `Showing ${matched.length} / ${allShows.length} shows`;
    renderShowCards(matched, showsContainer);
  });

  // --- TVMaze credit ---
  const footer = document.createElement("footer");
  const credit = document.createElement("p");
  credit.innerHTML = `Data sourced from <a href="https://www.tvmaze.com">TVMaze.com</a>`;
  footer.appendChild(credit);
  root.appendChild(footer);
}

// renderShowCards() draws one card per show inside the given container
function renderShowCards(showsList, container) {
  container.innerHTML = "";

  if (showsList.length === 0) {
    const message = document.createElement("p");
    message.className = "no-results";
    message.textContent = "No shows match your search. Try a different term.";
    container.appendChild(message);
    return;
  }

  for (const show of showsList) {
    const card = document.createElement("article");
    card.className = "show-card";
    card.id = `show-${show.id}`;

    // Show name — clicking this loads episodes
    const name = document.createElement("h2");
    const nameLink = document.createElement("button");
    nameLink.textContent = show.name;
    nameLink.className = "show-name-button";
    // Store show id on the button so we can use it in the event
    nameLink.dataset.showId = show.id;
    nameLink.addEventListener("click", function () {
      const episodesUrl = `https://api.tvmaze.com/shows/${show.id}/episodes`;
      showEpisodesPage(show, episodesUrl);
    });
    name.appendChild(nameLink);
    card.appendChild(name);

    // Show image
    if (show.image && show.image.medium) {
      const image = document.createElement("img");
      image.src = show.image.medium;
      image.alt = show.name;
      card.appendChild(image);
    }

    // Show summary
    if (show.summary) {
      const summary = document.createElement("p");
      summary.className = "show-summary";
      summary.innerHTML = show.summary;
      card.appendChild(summary);
    }

    // Show details: genres, status, rating, runtime
    const details = document.createElement("ul");
    details.className = "show-details";

    // Genres
    const genresItem = document.createElement("li");
    const genresList =
      show.genres && show.genres.length > 0
        ? show.genres.join(", ")
        : "No genres listed";
    genresItem.textContent = `Genres: ${genresList}`;
    details.appendChild(genresItem);

    // Status
    const statusItem = document.createElement("li");
    statusItem.textContent = `Status: ${show.status || "Unknown"}`;
    details.appendChild(statusItem);

    // Rating
    const ratingItem = document.createElement("li");
    const ratingValue =
      show.rating && show.rating.average ? show.rating.average : "N/A";
    ratingItem.textContent = `Rating: ${ratingValue}`;
    details.appendChild(ratingItem);

    // Runtime
    const runtimeItem = document.createElement("li");
    runtimeItem.textContent = `Runtime: ${show.runtime ? show.runtime + " minutes" : "N/A"}`;
    details.appendChild(runtimeItem);

    card.appendChild(details);
    container.appendChild(card);
  }
}

// filterShows() returns shows matching the search term
// Searches through name, genres, and summary
function filterShows(term) {
  if (term.trim() === "") return allShows;
  const lowerTerm = term.toLowerCase();
  return allShows.filter(function (show) {
    const nameMatches = show.name.toLowerCase().includes(lowerTerm);
    const genresText = show.genres ? show.genres.join(" ").toLowerCase() : "";
    const genresMatch = genresText.includes(lowerTerm);
    const plainSummary = show.summary
      ? show.summary.replace(/<[^>]+>/g, "").toLowerCase()
      : "";
    const summaryMatches = plainSummary.includes(lowerTerm);
    return nameMatches || genresMatch || summaryMatches;
  });
}

// ─────────────────────────────────────────────
// SECTION 3: Episodes page
// ─────────────────────────────────────────────

// showEpisodesPage() hides the shows listing and shows episodes for a show
function showEpisodesPage(show, episodesUrl) {
  const root = document.getElementById("root");
  root.innerHTML = "";

  // --- Back link ---
  const backNav = document.createElement("nav");
  backNav.setAttribute("aria-label", "Back navigation");
  const backLink = document.createElement("button");
  backLink.id = "back-to-shows";
  backLink.textContent = "Back to all shows";
  backLink.addEventListener("click", function () {
    showShowsListing(allShows);
  });
  backNav.appendChild(backLink);
  root.appendChild(backNav);

  // --- Show heading ---
  const heading = document.createElement("h1");
  heading.textContent = show.name;
  root.appendChild(heading);

  // --- Status message ---
  const statusMessage = document.createElement("p");
  statusMessage.id = "status-message";
  root.appendChild(statusMessage);

  // --- Episode area ---
  const episodeArea = document.createElement("div");
  episodeArea.id = "episode-area";
  root.appendChild(episodeArea);

  // Load episodes — use cache if available
  if (episodeCache[episodesUrl]) {
    currentEpisodes = episodeCache[episodesUrl];
    buildEpisodeControls();
    renderEpisodes(currentEpisodes);
    return;
  }

  statusMessage.textContent = "Loading episodes, please wait...";

  fetch(episodesUrl)
    .then(function (response) {
      if (!response.ok) throw new Error(`Server error: ${response.status}`);
      return response.json();
    })
    .then(function (episodes) {
      episodeCache[episodesUrl] = episodes;
      currentEpisodes = episodes;
      statusMessage.textContent = "";
      buildEpisodeControls();
      renderEpisodes(currentEpisodes);
    })
    .catch(function (error) {
      statusMessage.setAttribute("role", "alert");
      statusMessage.textContent = `Sorry, could not load episodes. (${error.message})`;
    });
}

// ─────────────────────────────────────────────
// SECTION 4: Episode controls
// ─────────────────────────────────────────────

function buildEpisodeControls() {
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
  countDisplay.textContent = `Showing ${currentEpisodes.length} / ${currentEpisodes.length} episodes`;

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

  for (const episode of currentEpisodes) {
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
      `Showing ${matched.length} / ${currentEpisodes.length} episodes`;
    episodeSelector.value = "";
  });

  episodeSelector.addEventListener("change", function () {
    if (episodeSelector.value === "") {
      renderEpisodes(currentEpisodes);
      searchInput.value = "";
      document.getElementById("episode-count").textContent =
        `Showing ${currentEpisodes.length} / ${currentEpisodes.length} episodes`;
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
  if (term.trim() === "") return currentEpisodes;
  const lowerTerm = term.toLowerCase();
  return currentEpisodes.filter(function (episode) {
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

function showLoadingMessage(text) {
  const root = document.getElementById("root");
  root.innerHTML = "";
  const message = document.createElement("p");
  message.id = "loading-message";
  message.textContent = text;
  root.appendChild(message);
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

window.addEventListener("load", setup);
