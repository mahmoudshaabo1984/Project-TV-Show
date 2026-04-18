// LEVEL 300: We no longer use episodes.js or getAllEpisodes()
// Instead, we fetch the episode data from the TVMaze API
// fetch() — think of it like ordering food online: you send a request and wait for delivery

// API_URL is the address we fetch episodes from — stored as a constant so we never mistype it
const API_URL = "https://api.tvmaze.com/shows/82/episodes";

// allEpisodes will hold the episodes once they arrive from the API
// It starts as null — meaning "we have not received data yet"
// null is a special value that means "intentionally empty"
let allEpisodes = null;

// This function runs when the page loads
function setup() {
  showLoadingMessage(); // Step 1: Tell the user to wait
  fetchEpisodes(); // Step 2: Start fetching data from the API
}

// ─────────────────────────────────────────────
// SECTION 1: Fetch episodes from the API
// ─────────────────────────────────────────────

// fetchEpisodes() requests the episode list from TVMaze
// fetch() returns a Promise — think of a Promise like a delivery receipt:
// "I promise to bring you the data, but it will take a moment"
function fetchEpisodes() {
  fetch(API_URL)
    .then(function (response) {
      // response.ok is true if the server replied with a success code (200-299)
      // If the server returned an error like 404 or 500, we throw an error ourselves
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }
      // response.json() converts the raw response into a JavaScript array of objects
      // This also returns a Promise, so we chain another .then()
      return response.json();
    })
    .then(function (episodes) {
      // We have the data! Store it in allEpisodes so we never fetch again
      allEpisodes = episodes;
      // Now build the controls and draw the episode cards
      clearRoot();
      makeControls();
      makePageForEpisodes(allEpisodes);
    })
    .catch(function (error) {
      // .catch() runs if ANYTHING goes wrong — network failure, bad JSON, server error
      // We show the error to the user on the page — NOT just in the console
      showErrorMessage(error.message);
    });
}

// ─────────────────────────────────────────────
// SECTION 2: Status messages (loading and error)
// ─────────────────────────────────────────────

// showLoadingMessage() displays a waiting message while fetch is in progress
function showLoadingMessage() {
  const root = document.getElementById("root");
  root.innerHTML = ""; // clear the root

  const message = document.createElement("p");
  message.id = "loading-message";
  message.textContent = "Loading episodes, please wait...";
  root.appendChild(message);
}

// showErrorMessage() displays a visible error message on the page
// This satisfies the requirement: "real users don't look in the console"
function showErrorMessage(detail) {
  const root = document.getElementById("root");
  root.innerHTML = ""; // clear loading message

  const errorBox = document.createElement("p");
  errorBox.id = "error-message";
  // role="alert" tells screen readers to announce this immediately
  errorBox.setAttribute("role", "alert");
  errorBox.textContent = `Sorry, we could not load the episodes. Please try refreshing the page. (${detail})`;
  root.appendChild(errorBox);
}

// clearRoot() removes everything from the root element
function clearRoot() {
  const root = document.getElementById("root");
  root.innerHTML = "";
}

// ─────────────────────────────────────────────
// SECTION 3: Controls (search + episode selector)
// ─────────────────────────────────────────────

// makeControls() creates the search input, episode count, and episode selector
function makeControls() {
  const root = document.getElementById("root");

  // --- Search input ---
  const searchLabel = document.createElement("label");
  searchLabel.setAttribute("for", "search-input");
  searchLabel.textContent = "Search episodes: ";

  const searchInput = document.createElement("input");
  searchInput.type = "text";
  searchInput.id = "search-input";
  searchInput.placeholder = "Type to search...";

  // --- Episode count display ---
  const countDisplay = document.createElement("p");
  countDisplay.id = "episode-count";
  countDisplay.textContent = `Showing ${allEpisodes.length} / ${allEpisodes.length} episodes`;

  // --- Episode selector drop-down ---
  const selectorLabel = document.createElement("label");
  selectorLabel.setAttribute("for", "episode-selector");
  selectorLabel.textContent = "Jump to episode: ";

  const selector = document.createElement("select");
  selector.id = "episode-selector";

  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = "-- Show all episodes --";
  selector.appendChild(defaultOption);

  for (const episode of allEpisodes) {
    const seasonCode = String(episode.season).padStart(2, "0");
    const episodeCode = String(episode.number).padStart(2, "0");
    const fullCode = `S${seasonCode}E${episodeCode}`;
    const option = document.createElement("option");
    option.value = episode.id;
    option.textContent = `${fullCode} - ${episode.name}`;
    selector.appendChild(option);
  }

  // --- Controls container ---
  const controls = document.createElement("nav");
  controls.setAttribute("aria-label", "Episode controls");
  controls.appendChild(searchLabel);
  controls.appendChild(searchInput);
  controls.appendChild(countDisplay);
  controls.appendChild(selectorLabel);
  controls.appendChild(selector);
  root.appendChild(controls);

  // --- Event: search box ---
  searchInput.addEventListener("input", function () {
    const term = searchInput.value;
    const matched = filterEpisodes(term);
    makePageForEpisodes(matched);
    document.getElementById("episode-count").textContent =
      `Showing ${matched.length} / ${allEpisodes.length} episodes`;
    selector.value = "";
  });

  // --- Event: episode selector ---
  selector.addEventListener("change", function () {
    if (selector.value === "") {
      makePageForEpisodes(allEpisodes);
      searchInput.value = "";
      document.getElementById("episode-count").textContent =
        `Showing ${allEpisodes.length} / ${allEpisodes.length} episodes`;
      return;
    }
    const selectedId = Number(selector.value);
    const card = document.getElementById(`episode-${selectedId}`);
    if (card) {
      card.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
}

// ─────────────────────────────────────────────
// SECTION 4: Filter and render episodes
// ─────────────────────────────────────────────

// filterEpisodes() returns only episodes whose name or summary contains the search term
function filterEpisodes(term) {
  if (term.trim() === "") {
    return allEpisodes;
  }
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

// makePageForEpisodes() draws one card per episode
function makePageForEpisodes(episodeList) {
  const root = document.getElementById("root");

  for (const card of root.querySelectorAll("article")) {
    card.remove();
  }
  const oldFooter = root.querySelector("footer");
  if (oldFooter) oldFooter.remove();
  const oldMessage = root.querySelector(".no-results");
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
    // Some episodes may have no image — we check before using episode.image
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

window.addEventListener("load", setup);
