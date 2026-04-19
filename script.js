let allEpisodes;

// This function runs when the page loads
function setup() {
  allEpisodes = getAllEpisodes();
  setupSearch();
  setupEpisodeSelector();
  makePageForEpisodes(allEpisodes);
}

function setupSearch() {
  const searchInput = document.querySelector("#search-input");

  searchInput.addEventListener("input", (event) => {
    const searchTerm = event.target.value.toLowerCase();

    const filteredEpisodes = allEpisodes.filter((episode) => {
      const lowerCaseName = episode.name.toLowerCase();
      const lowerCaseSummary = episode.summary
        ? episode.summary.toLowerCase()
        : "";

      if (
        lowerCaseName.includes(searchTerm) ||
        lowerCaseSummary.includes(searchTerm)
      ) {
        return true; // Keep this episode!
      } else {
        return false; // Throw it away!
      }
    });

    makePageForEpisodes(filteredEpisodes);
  });
}

function setupEpisodeSelector() {
  const episodeSelector = document.querySelector("#episode-selector");

  for (const episode of allEpisodes) {
    // 1. Format the season and episode numbers
    const seasonCode = String(episode.season).padStart(2, "0");
    const episodeCode = String(episode.number).padStart(2, "0");
    const fullCode = `S${seasonCode}E${episodeCode}`;

    const option = document.createElement("option");

    option.value = episode.id;

    option.textContent = `${fullCode} - ${episode.name}`;

    episodeSelector.appendChild(option);
  }

  episodeSelector.addEventListener("change", (event) => {
    const selectedEpisodeId = event.target.value;

    if (selectedEpisodeId === "all") {
      makePageForEpisodes(allEpisodes);
      return;
    }

    const filteredEpisodes = allEpisodes.filter((episode) => {
      return String(episode.id) === selectedEpisodeId;
    });

    makePageForEpisodes(filteredEpisodes);
  });
}

// This function takes an array of episodes and displays each one on the page
function makePageForEpisodes(episodeList) {
  const rootElem = document.getElementById("root");

  // Clear any existing content in the root element
  rootElem.textContent = "";

  const countElem = document.querySelector("#search-count");
  countElem.textContent = `Displaying ${episodeList.length} / ${allEpisodes.length} episodes`;

  // Loop through every episode in the array
  for (const episode of episodeList) {
    // Build the episode code, e.g. S01E05
    // String(episode.season) converts the number to text so we can use padStart
    // padStart(2, "0") adds a leading zero if the number is less than 10
    const seasonCode = String(episode.season).padStart(2, "0");
    const episodeCode = String(episode.number).padStart(2, "0");
    const fullCode = `S${seasonCode}E${episodeCode}`;

    // Create the card container
    const card = document.createElement("article");

    // Create the episode title heading
    const title = document.createElement("h2");
    title.textContent = `${fullCode} - ${episode.name}`;

    // Create the episode image
    const image = document.createElement("img");
    image.src = episode.image.medium;
    image.alt = episode.name;

    // Create the summary paragraph
    // innerHTML is used here because the summary contains HTML tags like <p>
    const summary = document.createElement("p");
    summary.innerHTML = episode.summary;

    // Append all elements into the card
    card.appendChild(title);
    card.appendChild(image);
    card.appendChild(summary);

    // Append the card into the root element
    rootElem.appendChild(card);
  }

  // Add a footer crediting TVMaze as the data source
  const footer = document.createElement("footer");
  const credit = document.createElement("p");
  credit.innerHTML = `Data sourced from <a href="https://www.tvmaze.com">TVMaze.com</a>`;
  footer.appendChild(credit);
  rootElem.appendChild(footer);
}

window.onload = setup;
