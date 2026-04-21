let allShows = [];
let allEpisodes = [];
let episodeCache = {};

async function setup() {
  const statusMessage = document.querySelector("#status-message");
  statusMessage.textContent = "Loading TV Shows... Please wait.";

  try {
    const response = await fetch("https://api.tvmaze.com/shows");
    allShows = await response.json();

    allShows.sort((a, b) => a.name.localeCompare(b.name));

    setupShowSelector();
    setupEpisodeSelector();
    setupSearch();

    statusMessage.textContent = "";

    if (allShows.length > 0) {
      await loadEpisodesForShow(allShows[0].id);
    }
  } catch (error) {
    console.error("Fetch failed:", error);
    statusMessage.textContent =
      "Error loading TV Shows. Please check your internet connection.";
    statusMessage.style.color = "red";
  }
}

async function loadEpisodesForShow(showId) {
  const statusMessage = document.querySelector("#status-message");

  if (episodeCache[showId]) {
    allEpisodes = episodeCache[showId];
    refreshUI();
    return;
  }

  statusMessage.textContent = "Loading episodes...";
  statusMessage.style.color = "inherit";

  try {
    const response = await fetch(
      `https://api.tvmaze.com/shows/${showId}/episodes`
    );
    const data = await response.json();

    allEpisodes = data;
    episodeCache[showId] = data;

    statusMessage.textContent = "";
    refreshUI();
  } catch (error) {
    console.error("Fetch failed:", error);
    statusMessage.textContent = "Error loading episodes.";
    statusMessage.style.color = "red";
  }
}

function refreshUI() {
  document.querySelector("#search-input").value = "";
  populateEpisodeDropdown();
  makePageForEpisodes(allEpisodes);
}

function setupShowSelector() {
  const showSelector = document.querySelector("#show-selector");

  for (const show of allShows) {
    const option = document.createElement("option");
    option.value = show.id;
    option.textContent = show.name;
    showSelector.appendChild(option);
  }

  showSelector.addEventListener("change", (event) => {
    const selectedShowId = event.target.value;
    loadEpisodesForShow(selectedShowId);
  });
}

function setupEpisodeSelector() {
  const episodeSelector = document.querySelector("#episode-selector");
  const searchInput = document.querySelector("#search-input");

  episodeSelector.addEventListener("change", (event) => {
    const selectedEpisodeId = event.target.value;

    if (selectedEpisodeId === "all") {
      makePageForEpisodes(allEpisodes);
      searchInput.value = "";
      return;
    }

    const filteredEpisodes = allEpisodes.filter((episode) => {
      return String(episode.id) === selectedEpisodeId;
    });

    makePageForEpisodes(filteredEpisodes);
    searchInput.value = "";
  });
}

function populateEpisodeDropdown() {
  const episodeSelector = document.querySelector("#episode-selector");

  episodeSelector.innerHTML = '<option value="all">All Episodes</option>';

  for (const episode of allEpisodes) {
    const seasonCode = String(episode.season).padStart(2, "0");
    const episodeCode = String(episode.number).padStart(2, "0");
    const fullCode = `S${seasonCode}E${episodeCode}`;

    const option = document.createElement("option");
    option.value = episode.id;
    option.textContent = `${fullCode} - ${episode.name}`;
    episodeSelector.appendChild(option);
  }
}

function setupSearch() {
  const searchInput = document.querySelector("#search-input");
  const episodeSelector = document.querySelector("#episode-selector");

  searchInput.addEventListener("input", (event) => {
    const searchTerm = event.target.value.toLowerCase();

    const filteredEpisodes = allEpisodes.filter((episode) => {
      const lowerCaseName = episode.name.toLowerCase();
      const lowerCaseSummary = episode.summary
        ? episode.summary.toLowerCase()
        : "";

      return (
        lowerCaseName.includes(searchTerm) ||
        lowerCaseSummary.includes(searchTerm)
      );
    });

    makePageForEpisodes(filteredEpisodes);
    episodeSelector.value = "all";
  });
}

function makePageForEpisodes(episodeList) {
  const rootElem = document.getElementById("root");

  rootElem.innerHTML = "";

  const countElem = document.querySelector("#search-count");
  countElem.textContent = `Displaying ${episodeList.length} / ${allEpisodes.length} episodes`;

  for (const episode of episodeList) {
    const seasonCode = String(episode.season).padStart(2, "0");
    const episodeCode = String(episode.number).padStart(2, "0");
    const fullCode = `S${seasonCode}E${episodeCode}`;

    const card = document.createElement("article");
    card.classList.add("episode-card");

    const title = document.createElement("h2");
    title.textContent = `${fullCode} - ${episode.name}`;

    const image = document.createElement("img");

    if (episode.image && episode.image.medium) {
      image.src = episode.image.medium;
    } else {
      image.src = "https://via.placeholder.com/210x295?text=No+Image";
    }
    image.alt = episode.name;

    const summary = document.createElement("p");
    summary.innerHTML = episode.summary || "No summary available.";

    card.appendChild(title);
    card.appendChild(image);
    card.appendChild(summary);

    rootElem.appendChild(card);
  }

  const footer = document.createElement("footer");
  footer.classList.add("footer");
  const credit = document.createElement("p");
  credit.innerHTML = `Data sourced from <a href="https://www.tvmaze.com" target="_blank">TVMaze.com</a>`;
  footer.appendChild(credit);
  rootElem.appendChild(footer);
}

window.onload = setup;
