const container = document.getElementById("characters-container");
const searchInput = document.getElementById("searchInput");
const filterType = document.getElementById("filterType");
const filterValue = document.getElementById("filterValue");
const sortSelect = document.getElementById("sortSelect");
const favoritesToggle = document.getElementById("favoritesToggle");
const favoritesToggleContainer = document.getElementById("favoritesToggleContainer");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const pageInfo = document.getElementById("pageInfo");

let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
let allCharacters = [];
let currentPage = 1;
const cardsPerPage = 20; // Show 20 cards per page for better performance

// Carousel functionality
let currentCarouselIndex = 0;
const carouselItemsPerView = 30; // Number of items visible at once - increased since cards are smaller

async function fetchAllCharacters() {
    try {
        // Show loading state
        container.innerHTML = '<div class="loading">Loading characters from the multiverse...</div>';
        
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
        updateFavoritesToggleVisibility();
        updateCarouselInfo();
    } catch (error) {
        console.error('Error fetching characters:', error);
        container.innerHTML = '<div class="loading">Error loading characters. Please try again.</div>';
    }
}

function displayCharacters(characters) {
    container.innerHTML = '';
    
    if (characters.length === 0) {
        container.innerHTML = '<div class="loading">No characters found<br>matching your criteria.</div>';
        return;
    }

    // Calculate carousel pagination
    const startIndex = currentCarouselIndex;
    const endIndex = Math.min(startIndex + carouselItemsPerView, characters.length);
    const charactersToShow = characters.slice(startIndex, endIndex);

    charactersToShow.forEach(character => {
        const card = document.createElement("div");
        card.className = "character-card";

        const isFavorite = favorites.includes(character.id);
        const statusClass = `status-${character.status.toLowerCase()}`;

        card.innerHTML = `
            <h3>${character.name}</h3>
            <img src="${character.image}" alt="${character.name}" loading="lazy">
            <p class="${statusClass}">Status: ${character.status}</p>
            <p>Species: ${character.species}</p>
            <p>Gender: ${character.gender}</p>
            <p>Origin: ${character.origin.name}</p>
            <button class="favorite-btn" data-id="${character.id}" title="${isFavorite ? 'Remove from favorites' : 'Add to favorites'}">
                ${isFavorite ? "❤️" : "🤍"}
            </button>`;

        container.appendChild(card);
    });

    // Add event listeners to favorite buttons
    document.querySelectorAll(".favorite-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const id = parseInt(btn.getAttribute("data-id"));

            if (favorites.includes(id)) {
                favorites = favorites.filter(fav => fav !== id);
                btn.innerHTML = "🤍";
                btn.title = "Add to favorites";
            } else {
                favorites.push(id);
                btn.innerHTML = "❤️";
                btn.title = "Remove from favorites";
            }
            
            localStorage.setItem("favorites", JSON.stringify(favorites));
            updateFavoritesToggleVisibility();
        });
    });

    updateCarouselInfo();
}

function updateCarouselInfo() {
    const filteredCharacters = getFilteredCharacters();
    const totalItems = filteredCharacters.length;
    const currentStart = currentCarouselIndex + 1;
    const currentEnd = Math.min(currentCarouselIndex + carouselItemsPerView, totalItems);
    
    // Update page info
    pageInfo.textContent = `${currentStart}-${currentEnd} of ${totalItems} characters`;
    
    // Update button states
    prevBtn.disabled = currentCarouselIndex === 0;
    nextBtn.disabled = currentCarouselIndex + carouselItemsPerView >= totalItems;
    
    // Update button text for better UX
    prevBtn.textContent = currentCarouselIndex === 0 ? 'First Page' : '← Previous';
    nextBtn.textContent = currentCarouselIndex + carouselItemsPerView >= totalItems ? 'Last Page' : 'Next →';
}

function getFilteredCharacters() {
    const searchTerm = searchInput.value.toLowerCase();
    const type = filterType.value;
    const value = filterValue.value;
    const showFavoritesOnly = favoritesToggle.checked;

    let filtered = allCharacters.filter(character => {
        const matchesSearch = character.name.toLowerCase().includes(searchTerm);
        const matchesFilter = type === "" || value === "" || character[type] === value;
        const matchesFavorite = !showFavoritesOnly || favorites.includes(character.id);
        return matchesSearch && matchesFilter && matchesFavorite;
    });

    return sortCharacters(filtered);
}

function goToPreviousPage() {
    if (currentCarouselIndex > 0) {
        currentCarouselIndex = Math.max(0, currentCarouselIndex - carouselItemsPerView);
        const filteredCharacters = getFilteredCharacters();
        displayCharacters(filteredCharacters);
    }
}

function goToNextPage() {
    const filteredCharacters = getFilteredCharacters();
    if (currentCarouselIndex + carouselItemsPerView < filteredCharacters.length) {
        currentCarouselIndex = Math.min(
            filteredCharacters.length - carouselItemsPerView,
            currentCarouselIndex + carouselItemsPerView
        );
        displayCharacters(filteredCharacters);
    }
}

function goToFirstPage() {
    currentCarouselIndex = 0;
    const filteredCharacters = getFilteredCharacters();
    displayCharacters(filteredCharacters);
}

function goToLastPage() {
    const filteredCharacters = getFilteredCharacters();
    currentCarouselIndex = Math.max(0, filteredCharacters.length - carouselItemsPerView);
    displayCharacters(filteredCharacters);
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

function updateFavoritesToggleVisibility() {
    const hasFavorites = favorites.length > 0;
    
    // Always keep the favorites toggle visible
    // favoritesToggleContainer.style.display = "flex"; // Always visible
    
    if (!hasFavorites) {
        favoritesToggle.checked = false;
    }
}

function applyFilters() {
    currentCarouselIndex = 0; // Reset to first page when filters change
    const filteredCharacters = getFilteredCharacters();
    displayCharacters(filteredCharacters);
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

// Event Listeners
searchInput.addEventListener("input", applyFilters);
filterType.addEventListener("change", updateFilterValues);
filterValue.addEventListener("change", applyFilters);
sortSelect.addEventListener("change", applyFilters);
favoritesToggle.addEventListener("change", applyFilters);
prevBtn.addEventListener("click", goToPreviousPage);
nextBtn.addEventListener("click", goToNextPage);

// Keyboard navigation
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' && !prevBtn.disabled) {
        goToPreviousPage();
    } else if (e.key === 'ArrowRight' && !nextBtn.disabled) {
        goToNextPage();
    } else if (e.key === 'Home') {
        goToFirstPage();
    } else if (e.key === 'End') {
        goToLastPage();
    }
});

// Initialize the app
fetchAllCharacters();

