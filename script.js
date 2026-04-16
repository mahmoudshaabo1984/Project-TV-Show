// This function runs when the page loads
function setup() {
  const allEpisodes = getAllEpisodes();
  makePageForEpisodes(allEpisodes);
}

// This function takes an array of episodes and displays each one on the page
function makePageForEpisodes(episodeList) {
  const rootElem = document.getElementById("root");

  // Clear any existing content in the root element
  rootElem.textContent = "";

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
