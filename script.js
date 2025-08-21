const container = document.getElementById("characters-container");
const searchInput = document.getElementById("searchInput");
const filterType = document.getElementById("filterType");
const filterValue = document.getElementById("filterValue");
const sortSelect = document.getElementById("sortSelect");

let favorites = JSON.parse(localStorage.getItem("favorites")) || [];

let allCharacters = [];

async function fetchAllCharacters() {
    let allData = [];
    let nextUrl = 'https://rickandmortyapi.com/api/character';

    while (nextUrl) {
        const res = await fetch(nextUrl);
        const data = await res.json();
        allData = [...allData, ...data.results];
        nextUrl = data.info.next;
    }

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
            <p>Species: ${character.species}</p>
            <button class="heart-btn ${favorites.includes(character.id) ? 'active' : ''}" data-id="${character.id}">
            <span class="heart-shape"></span>
            </button>
        `;

        card.querySelector(".heart-btn").addEventListener("click", (e) => {
            const id = parseInt(e.target.closest('button').dataset.id);
            if (favorites.includes(id)) {
                favorites = favorites.filter(favId => favId !== id);
            } else {
                favorites.push(id);
            }
            localStorage.setItem("favorites", JSON.stringify(favorites));
            displayCharacters(characters);
        });

        container.appendChild(card);
    });
}

function updateFilterValues() {
    const selectedType = filterType.value;
    filterValue.innerHTML = '<option value="">--Select a value--</option>';
    filterValue.disabled = true;

    if (!selectedType) return;

    const uniqueValues = [...new Set(allCharacters.map(c => c[selectedType]))];

    uniqueValues.forEach(value => {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = value;
        filterValue.appendChild(option);
    });

    filterValue.disabled = false;
}

function applyFilters() {
    const searchTerm = searchInput.value.toLowerCase();
    const type = filterType.value;
    const value = filterValue.value;

    const filtered = allCharacters.filter(character => {
        const matchesSearch = character.name.toLowerCase().includes(searchTerm);
        const matchesFilter = type === "" || value === "" || character[type] === value;
        return matchesSearch && matchesFilter;
    });

    const sorted = sortCharacters(filtered);
    displayCharacters(sorted);
}

function sortCharacters(characters) {
    const sortValue = sortSelect.value;

    switch (sortValue) {
        case "name-asc":
            return characters.sort((a, b) => a.name.localeCompare(b.name));
        case "name-desc":
            return characters.sort((a, b) => b.name.localeCompare(a.name));
        case "status":
            return characters.sort((a, b) => a.status.localeCompare(b.status));
        case "species":
            return characters.sort((a, b) => a.species.localeCompare(b.species));
        default:
            return characters;
    }
}

searchInput.addEventListener("input", applyFilters);
filterType.addEventListener("change", updateFilterValues);
filterValue.addEventListener("change", applyFilters);
sortSelect.addEventListener("change", applyFilters);

fetchAllCharacters();
