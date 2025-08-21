const container = document.getElementById("characters-container");
const searchInput = document.getElementById("searchInput");

let allCharacters = [];

async function fetchAllCharacters() {
    let allData = [];
    let nextUrl = 'https://rickandmortyapi.com/api/character';

    while (nextUrl) {
        const res = await fetch(nextUrl);
        const data = await res.json();
        console.log("Fetching page:", nextUrl);
        allData = [...allData, ...data.results];
        nextUrl = data.info.next;
    }
    console.log("Total characters fetched:", allData.length);
    allCharacters = allData;
    displayCharacters(allCharacters);
}

function displayCharacters(characters) {
    container.innerHTML = '';

    characters.forEach(character => {
        const card = document.createElement("div");
        card.className = "character-card";
        card.innerHTML = `
        <h3>${character.name}</h3>
        <img src="${character.image}" alt="${character.name}">
        <p>Status: ${character.status}</p>
        <p>Species: ${character.species}</p>`;

        container.appendChild(card);
    });
}
searchInput.addEventListener("input", (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const filtered = allCharacters.filter(character =>
        character.name.toLowerCase().includes(searchTerm)
    );
    displayCharacters(filtered);
});

fetchAllCharacters();