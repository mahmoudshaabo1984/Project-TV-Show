const cache = new Map();

async function fetchJSON(url) {
  if (cache.has(url)) return cache.get(url);
  const response = await fetch(url);
  const data = await response.json();
  cache.set(url, data);
  return data;
}

let currentEpisodes = [];

async function setup() {
  const root = document.getElementById("root");

  const loading = document.createElement("p");
  loading.id = "loading-msg";
  loading.textContent = "Loading shows…";
  root.appendChild(loading);

  const shows = await fetchJSON("https://api.tvmaze.com/shows");
  shows.sort((a, b) => a.name.localeCompare(b.name));

  root.removeChild(loading);
  makeShowSelector(shows);
}

function makeShowSelector(shows) {
  const root = document.getElementById("root");

  const nav = document.createElement("nav");
  nav.setAttribute("aria-label", "Show and episode controls");
  nav.id = "controls";

  // --- Show selector ---
  const showLabel = document.createElement("label");
  showLabel.setAttribute("for", "show-selector");
  showLabel.textContent = "Select a show: ";

  const showSelector = document.createElement("select");
  showSelector.id = "show-selector";

  const defaultShow = document.createElement("option");
  defaultShow.value = "";
  defaultShow.textContent = "-- Choose a show --";
  showSelector.appendChild(defaultShow);

  for (const show of shows) {
    const option = document.createElement("option");
    option.value = show.id;
    option.textContent = show.name;
    showSelector.appendChild(option);
  }

  // --- Search input ---
  const searchLabel = document.createElement("label");
  searchLabel.setAttribute("for", "search-input");
  searchLabel.textContent = "Search episodes: ";

  const searchInput = document.createElement("input");
  searchInput.type = "text";
  searchInput.id = "search-input";
  searchInput.placeholder = "Type to search…";
  searchInput.disabled = true;

  // --- Episode count ---
  const countDisplay = document.createElement("p");
  countDisplay.id = "episode-count";

  // --- Episode selector ---
  const epLabel = document.createElement("label");
  epLabel.setAttribute("for", "episode-selector");
  epLabel.textContent = "Jump to episode: ";

  const epSelector = document.createElement("select");
  epSelector.id = "episode-selector";
  epSelector.disabled = true;

  nav.appendChild(showLabel);
  nav.appendChild(showSelector);
  nav.appendChild(searchLabel);
  nav.appendChild(searchInput);
  nav.appendChild(countDisplay);
  nav.appendChild(epLabel);
  nav.appendChild(epSelector);
  root.appendChild(nav);

  // --- Event: show selector ---
  showSelector.addEventListener("change", async function () {
    if (!showSelector.value) return;
    const episodes = await fetchJSON(
      `https://api.tvmaze.com/shows/${showSelector.value}/episodes`
    );
    currentEpisodes = episodes;
    searchInput.value = "";
    searchInput.disabled = false;
    populateEpisodeSelector(epSelector, episodes);
    epSelector.disabled = false;
    makePageForEpisodes(episodes);
    countDisplay.textContent = `Showing ${episodes.length} / ${episodes.length} episodes`;
  });

  // --- Event: search ---
  searchInput.addEventListener("input", function () {
    const matched = filterEpisodes(searchInput.value);
    makePageForEpisodes(matched);
    countDisplay.textContent = `Showing ${matched.length} / ${currentEpisodes.length} episodes`;
    epSelector.value = "";
  });

  // --- Event: episode selector ---
  epSelector.addEventListener("change", function () {
    if (epSelector.value === "") {
      makePageForEpisodes(currentEpisodes);
      searchInput.value = "";
      countDisplay.textContent = `Showing ${currentEpisodes.length} / ${currentEpisodes.length} episodes`;
      return;
    }
    const card = document.getElementById(`episode-${epSelector.value}`);
    if (card) card.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

function populateEpisodeSelector(selector, episodes) {
  selector.innerHTML = "";
  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = "-- Show all episodes --";
  selector.appendChild(defaultOption);

  for (const episode of episodes) {
    const code = `S${String(episode.season).padStart(2, "0")}E${String(episode.number).padStart(2, "0")}`;
    const option = document.createElement("option");
    option.value = episode.id;
    option.textContent = `${code} - ${episode.name}`;
    selector.appendChild(option);
  }
}

function filterEpisodes(term) {
  if (term.trim() === "") return currentEpisodes;
  const lower = term.toLowerCase();
  return currentEpisodes.filter((ep) => {
    const plain = (ep.summary || "").replace(/<[^>]+>/g, "");
    return ep.name.toLowerCase().includes(lower) || plain.toLowerCase().includes(lower);
  });
}

function makePageForEpisodes(episodeList) {
  const root = document.getElementById("root");

  for (const el of root.querySelectorAll("article, footer, .no-results")) {
    el.remove();
  }

  if (episodeList.length === 0) {
    const msg = document.createElement("p");
    msg.className = "no-results";
    msg.textContent = "No episodes match your search. Try a different term.";
    root.appendChild(msg);
    return;
  }

  for (const episode of episodeList) {
    const code = `S${String(episode.season).padStart(2, "0")}E${String(episode.number).padStart(2, "0")}`;
    const card = document.createElement("article");
    card.id = `episode-${episode.id}`;

    const title = document.createElement("h2");
    title.textContent = `${code} - ${episode.name}`;

    card.appendChild(title);

    if (episode.image) {
      const img = document.createElement("img");
      img.src = episode.image.medium;
      img.alt = episode.name;
      card.appendChild(img);
    }

    if (episode.summary) {
      const summary = document.createElement("p");
      summary.innerHTML = episode.summary;
      card.appendChild(summary);
    }

    root.appendChild(card);
  }

  const footer = document.createElement("footer");
  const credit = document.createElement("p");
  credit.innerHTML = `Data sourced from <a href="https://www.tvmaze.com">TVMaze.com</a>`;
  footer.appendChild(credit);
  root.appendChild(footer);
}

window.addEventListener("load", setup);
