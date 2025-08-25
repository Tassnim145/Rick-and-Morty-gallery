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

// Modal elements
const characterModal = document.getElementById("characterModal");
const modalCharacterName = document.getElementById("modalCharacterName");
const modalCharacterImage = document.getElementById("modalCharacterImage");
const modalStatusBadge = document.getElementById("modalStatusBadge");
const modalSpecies = document.getElementById("modalSpecies");
const modalGender = document.getElementById("modalGender");
const modalStatus = document.getElementById("modalStatus");
const modalOrigin = document.getElementById("modalOrigin");
const modalType = document.getElementById("modalType");
const modalLocation = document.getElementById("modalLocation");
const modalCreated = document.getElementById("modalCreated");
const modalEpisodeCount = document.getElementById("modalEpisodeCount");
const modalFavoriteBtn = document.getElementById("modalFavoriteBtn");
const modalFavoriteIcon = document.getElementById("modalFavoriteIcon");
const modalFavoriteText = document.getElementById("modalFavoriteText");
const modalEpisodesList = document.getElementById("modalEpisodesList");

let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
let allCharacters = [];
let currentPage = 1;
const cardsPerPage = 20; // Show 20 cards per page for better performance

// Carousel functionality
let currentCarouselIndex = 0;
const carouselItemsPerView = 18; // Number of items visible at once

async function fetchAllCharacters() {
    try {
        // Show loading state
        container.innerHTML = '<div class="loading"><div class="loading-text">Loading characters from the multiverse...</div><div class="loading-spinner"></div></div>';
        
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
        // Check if this is because of "Show only favorites" filter
        const showFavoritesOnly = favoritesToggle.checked;
        if (showFavoritesOnly && favorites.length === 0) {
            container.innerHTML = '<div class="no-results"><div class="loading-spinner"></div><div class="no-results-text">No favorites yet</div><div class="no-results-suggestion">Add some characters to your favorites first</div></div>';
        } else {
            container.innerHTML = '<div class="no-results"><div class="no-results-icon">🔍</div><div class="no-results-text">No characters found matching your criteria</div><div class="no-results-suggestion">Try adjusting your search or filters</div></div>';
        }
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
            <div class="card-header">
                <h3 class="character-name">${character.name}</h3>
                <div class="status-badge ${statusClass}">${character.status}</div>
            </div>
            <div class="card-image-container">
                <img src="${character.image}" alt="${character.name}" loading="lazy">
                <div class="image-overlay">
                    <button class="favorite-btn" data-id="${character.id}" title="${isFavorite ? 'Remove from favorites' : 'Add to favorites'}">
                        ${isFavorite ? "❤️" : "🤍"}
                    </button>
                </div>
            </div>
            <div class="card-details">
                <div class="detail-item">
                    <span class="detail-label">Species:</span>
                    <span class="detail-value" title="${character.species}">${character.species}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Gender:</span>
                    <span class="detail-value" title="${character.gender}">${character.gender}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Origin:</span>
                    <span class="detail-value" title="${character.origin.name}">${character.origin.name}</span>
                </div>
            </div>`;

        container.appendChild(card);
    });

    // Add event listeners to character cards and favorite buttons
    document.querySelectorAll(".character-card").forEach((card, index) => {
        const character = charactersToShow[index];
        
        // Add click event to open modal
        card.addEventListener("click", (e) => {
            // Don't open modal if clicking on favorite button
            if (!e.target.closest('.favorite-btn')) {
                openCharacterModal(character);
            }
        });
        
        // Add event listener to favorite button
        const favoriteBtn = card.querySelector(".favorite-btn");
        favoriteBtn.addEventListener("click", (e) => {
            e.stopPropagation(); // Prevent modal from opening
            const id = parseInt(favoriteBtn.getAttribute("data-id"));

            if (favorites.includes(id)) {
                favorites = favorites.filter(fav => fav !== id);
                favoriteBtn.innerHTML = "🤍";
                favoriteBtn.title = "Add to favorites";
            } else {
                favorites.push(id);
                favoriteBtn.innerHTML = "❤️";
                favoriteBtn.title = "Remove from favorites";
            }
            
            localStorage.setItem("favorites", JSON.stringify(favorites));
            updateFavoritesToggleVisibility();
            
            // Always refresh the display after favorites change
            const filteredCharacters = getFilteredCharacters();
            displayCharacters(filteredCharacters);
        });
    });

    updateCarouselInfo();
}

function updateCarouselInfo() {
    const filteredCharacters = getFilteredCharacters();
    const totalItems = filteredCharacters.length;
    const currentStart = currentCarouselIndex + 1;
    const currentEnd = Math.min(currentCarouselIndex + carouselItemsPerView, totalItems);
    
    // Update page info for both top and bottom pagination
    pageInfo.textContent = `${currentStart}-${currentEnd} of ${totalItems} characters`;
    document.getElementById("pageInfoBottom").textContent = `${currentStart}-${currentEnd} of ${totalItems} characters`;
    
    // Update button states for both top and bottom pagination
    prevBtn.disabled = currentCarouselIndex === 0;
    nextBtn.disabled = currentCarouselIndex + carouselItemsPerView >= totalItems;
    document.getElementById("prevBtnBottom").disabled = currentCarouselIndex === 0;
    document.getElementById("nextBtnBottom").disabled = currentCarouselIndex + carouselItemsPerView >= totalItems;
    
    // Update button text for better UX
    prevBtn.textContent = currentCarouselIndex === 0 ? 'First Page' : '← Previous';
    nextBtn.textContent = currentCarouselIndex + carouselItemsPerView >= totalItems ? 'Next →' : 'Next →';
    document.getElementById("prevBtnBottom").textContent = currentCarouselIndex === 0 ? 'First Page' : '← Previous';
    document.getElementById("nextBtnBottom").textContent = currentCarouselIndex + carouselItemsPerView >= totalItems ? 'Next →' : 'Next →';
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

// Bottom pagination event listeners
document.getElementById("prevBtnBottom").addEventListener("click", goToPreviousPage);
document.getElementById("nextBtnBottom").addEventListener("click", goToNextPage);

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

// Modal Functions
function openCharacterModal(character) {
    // Populate modal with character data
    modalCharacterName.textContent = character.name;
    modalCharacterImage.src = character.image;
    modalCharacterImage.alt = character.name;
    
    // Set status badge with appropriate class
    const statusClass = `status-${character.status.toLowerCase()}`;
    modalStatusBadge.className = `modal-status-badge ${statusClass}`;
    modalStatusBadge.textContent = character.status;
    
    // Populate details
    modalSpecies.textContent = character.species || 'Unknown';
    modalGender.textContent = character.gender || 'Unknown';
    modalStatus.textContent = character.status || 'Unknown';
    modalOrigin.textContent = character.origin?.name || 'Unknown';
    modalType.textContent = character.type || 'Unknown';
    modalLocation.textContent = character.location?.name || 'Unknown';
    
    // Format created date
    if (character.created) {
        const date = new Date(character.created);
        modalCreated.textContent = date.toLocaleDateString();
    } else {
        modalCreated.textContent = 'Unknown';
    }
    
    // Set episode count
    modalEpisodeCount.textContent = character.episode?.length || 0;
    
    // Debug: Log episode data
    console.log(`Episode data for ${character.name}:`, character.episode);
    
    // Populate episodes list
    modalEpisodesList.innerHTML = '';
    if (character.episode && character.episode.length > 0) {
        character.episode.forEach((episodeUrl, index) => {
            let episodeText = '';
            
            // Try to extract episode number from URL
            if (episodeUrl && typeof episodeUrl === 'string') {
                const episodeNumber = episodeUrl.split('/').pop();
                if (episodeNumber && !isNaN(episodeNumber)) {
                    episodeText = `Episode ${episodeNumber}`;
                } else {
                    episodeText = `Episode ${index + 1}`;
                }
            } else {
                episodeText = `Episode ${index + 1}`;
            }
            
            const episodeItem = document.createElement('div');
            episodeItem.className = 'episode-item';
            episodeItem.innerHTML = `<span>${episodeText}</span>`;
            modalEpisodesList.appendChild(episodeItem);
        });
    } else {
        const noEpisodesItem = document.createElement('div');
        noEpisodesItem.className = 'episode-item no-episodes';
        noEpisodesItem.innerHTML = '<span>No episodes found</span>';
        modalEpisodesList.appendChild(noEpisodesItem);
    }
    
    // Update favorite button
    const isFavorite = favorites.includes(character.id);
    modalFavoriteIcon.textContent = isFavorite ? "❤️" : "🤍";
    modalFavoriteText.textContent = isFavorite ? "Remove from Favorites" : "Add to Favorites";
    
    // Add event listener to modal favorite button
    modalFavoriteBtn.onclick = () => {
        const currentIsFavorite = favorites.includes(character.id);
        
        if (currentIsFavorite) {
            favorites = favorites.filter(fav => fav !== character.id);
            modalFavoriteIcon.textContent = "🤍";
            modalFavoriteText.textContent = "Add to Favorites";
        } else {
            favorites.push(character.id);
            modalFavoriteIcon.textContent = "❤️";
            modalFavoriteText.textContent = "Remove from Favorites";
        }
        
        localStorage.setItem("favorites", JSON.stringify(favorites));
        updateFavoritesToggleVisibility();
        
        // Refresh the main display
        const filteredCharacters = getFilteredCharacters();
        displayCharacters(filteredCharacters);
    };
    
    // Show modal
    characterModal.style.display = "block";
}

function closeCharacterModal() {
    characterModal.style.display = "none";
}

// Modal event listeners
document.querySelector('.modal-close-btn').addEventListener('click', closeCharacterModal);

// Close modal when clicking outside
characterModal.addEventListener('click', (e) => {
    if (e.target === characterModal) {
        closeCharacterModal();
    }
});

// Close modal with Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && characterModal.style.display === 'block') {
        closeCharacterModal();
    }
});

// Initialize the app
fetchAllCharacters();
