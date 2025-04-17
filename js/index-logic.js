// js/index-logic.js - Logic ONLY for index.html

// Global variable needed by multiple functions WITHIN this script
let allShuffledAlbums = [];



// Get current grid column count based on window width
function getCurrentColumnCount() {
    const width = window.innerWidth;
    if (width <= 550) return 2;
    if (width <= 768) return 3;
    if (width <= 1000) return 4;
    if (width <= 1250) return 5;
    return 6;
}

async function loadFeaturedAlbums() {
    console.log("Index-logic: Loading featured albums..."); // Debugging
    const topAlbumGrid = document.getElementById('top-album-grid');
    const bottomAlbumGrid = document.getElementById('bottom-album-grid');

    if (!topAlbumGrid || !bottomAlbumGrid) {
        console.error("Index-logic: One or more album grid containers not found!");
        return;
    }

    topAlbumGrid.innerHTML = "<p>Loading albums...</p>";
    bottomAlbumGrid.innerHTML = "";

    try {
        // Assuming music_data.json is in the root or correct relative path
        const response = await fetch('music_data.json');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const allTracks = await response.json();

        const uniqueAlbumsMap = new Map();
        allTracks.forEach(track => {
            if (track.Album && track.artwork && !uniqueAlbumsMap.has(track.Album)) {
                uniqueAlbumsMap.set(track.Album, {
                    albumName: track.Album,
                    artworkFile: track.artwork
                });
            }
        });
        let uniqueAlbums = Array.from(uniqueAlbumsMap.values());
        console.log(`Index-logic: Found ${uniqueAlbums.length} unique albums.`);

        if (uniqueAlbums.length === 0) {
            topAlbumGrid.innerHTML = "<p>No albums found in library data.</p>";
            return;
        }

        uniqueAlbums.sort(() => Math.random() - 0.5);
        allShuffledAlbums = uniqueAlbums; // Store shuffled albums

        updateAlbumDisplay(); // Initial display

    } catch (error) {
        console.error('Index-logic: Error loading or processing album data:', error);
        topAlbumGrid.innerHTML = `<p style="color: red;">Error loading album data.</p>`;
        bottomAlbumGrid.innerHTML = "";
    }
}

// Function to update the album display based on current screen size
function updateAlbumDisplay() {
    if (allShuffledAlbums.length === 0) return;

    const topAlbumGrid = document.getElementById('top-album-grid');
    const bottomAlbumGrid = document.getElementById('bottom-album-grid');

    if (!topAlbumGrid || !bottomAlbumGrid) return;

    const columnCount = getCurrentColumnCount();
    const topRowCount = 1;
    const bottomRowCount = 4;
    const topAlbumCount = columnCount * topRowCount;
    const bottomAlbumCount = columnCount * bottomRowCount;
    const totalAlbumsNeeded = topAlbumCount + bottomAlbumCount;

    topAlbumGrid.innerHTML = '';
    bottomAlbumGrid.innerHTML = '';

    let albumsToDisplay = [];
    if (allShuffledAlbums.length >= totalAlbumsNeeded) {
        albumsToDisplay = [...allShuffledAlbums.slice(0, totalAlbumsNeeded)];
    } else {
        albumsToDisplay = [...allShuffledAlbums];
        while (albumsToDisplay.length < totalAlbumsNeeded) {
            albumsToDisplay.push(allShuffledAlbums[albumsToDisplay.length % allShuffledAlbums.length]);
        }
    }

    populateAlbumGrid(topAlbumGrid, albumsToDisplay.slice(0, topAlbumCount));
    populateAlbumGrid(bottomAlbumGrid, albumsToDisplay.slice(topAlbumCount, totalAlbumsNeeded));
}

// Function to populate an album grid
function populateAlbumGrid(targetElement, albums) {
    if (!albums || albums.length === 0) return;

    albums.forEach(albumData => {
        // Assuming Artwork folder is in the root
        const artworkPath = `Artwork/${albumData.artworkFile || 'default_artwork.png'}`;
        const albumNameEncoded = encodeURIComponent(albumData.albumName);
        // Link to search page, filtering by this album
        const searchLink = `search.html?album=${albumNameEncoded}`;

        const albumLink = document.createElement('a');
        albumLink.href = searchLink;
        albumLink.className = 'album-link';
        albumLink.title = `View tracks from ${albumData.albumName}`;

        const albumImg = document.createElement('img');
        albumImg.src = encodeURI(artworkPath); // Use encodeURI for safety
        albumImg.alt = albumData.albumName;
        albumImg.onerror = function() {
            this.onerror = null;
            // Assuming images folder is in the root
            this.src = 'images/default_artwork.png';
            this.alt = 'Default album artwork';
            albumLink.title = `Artwork missing for ${albumData.albumName}`;
        };

        albumLink.appendChild(albumImg);
        targetElement.appendChild(albumLink);
    });
}


// --- Initial Load Logic for index.html ---
document.addEventListener('DOMContentLoaded', function() {
    console.log("Index-logic.js DOMContentLoaded"); // Debugging
    // Load and display albums on initial page load
    loadFeaturedAlbums();

    // Add resize listener to update albums on window resize, using debounce
    window.addEventListener('resize', debounce(function() {
        console.log("Index-logic: Resize detected, updating albums...");
        updateAlbumDisplay();
    }, 250)); // 250ms delay
});