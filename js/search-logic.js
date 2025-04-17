// js/script.js - Logic ONLY for search.html

let mainMusicData = [];
let allVersionsData = [];
let currentResults = []; // Holds ALL filtered/sorted results
let currentPage = 1;
const resultsPerPage = 10; // Or your preferred number

async function loadMusicData() {
    try {
        // Assuming JSON files are in the root or correct relative path
        const mainResponse = await fetch('music_data.json');
        handleFetchError(mainResponse); // Check response before parsing
        mainMusicData = await mainResponse.json();

        const allVersionsResponse = await fetch('all_versions_data.json');
        handleFetchError(allVersionsResponse); // Check response before parsing
        allVersionsData = await allVersionsResponse.json();

        console.log('Search-logic: Music data loaded successfully');
    } catch (error) {
        console.error('Search-logic: Error loading music data:', error);
        const resultsContainer = document.getElementById('results');
        if (resultsContainer) {
            resultsContainer.innerHTML = '<p style="color: red; text-align: center; margin-top: 30px;">Error loading music data. Please check console or try again later.</p>';
        }
    }
}

function handleFetchError(response) {
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} for ${response.url}`);
    }
    // No need to return response here, just throw on error
}

function search() {
    if (mainMusicData.length === 0) {
        console.log('Search-logic: No music data available yet for search.');
        const resultsContainer = document.getElementById('results');
        if (resultsContainer && !resultsContainer.hasChildNodes()) {
             resultsContainer.innerHTML = '<p style="text-align: center; margin-top: 20px;">Loading music data...</p>';
        }
        return;
    }

    const searchInput = document.getElementById('search-input');
    const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : "";
    console.log('Search-logic: Searching for:', searchTerm);

    if (searchTerm === "") {
        currentResults = [...mainMusicData];
    } else {
        currentResults = mainMusicData.filter(track => {
            // Function to safely check fields
            const checkField = (fieldName) => {
                const fieldValue = track[fieldName];
                // Check if it's a string and includes the search term
                return typeof fieldValue === 'string' && fieldValue.toLowerCase().includes(searchTerm);
            };
            // List all fields to search within
            return (
                checkField('Track Name') || checkField('Master Track Name') || checkField('Artist') ||
                checkField('Album') || checkField('KEYWORD/TAGS') || checkField('MOOD') ||
                checkField('GENRE') || checkField('STYLE') || checkField('INSTRUMENTS')
            );
        });
    }

    console.log('Search-logic: Total number of results:', currentResults.length);
    currentPage = 1; // Reset to first page on new search
    sortAndDisplayResults();
}

function searchByAlbumCover(artworkPath) {
     if (mainMusicData.length === 0) return;
    const filename = artworkPath.split('/').pop();
    // Find the album name associated with this artwork file
    const albumName = mainMusicData.find(track => track.artwork === filename)?.Album;
    const searchInput = document.getElementById('search-input');

    if (albumName && searchInput) {
        currentResults = mainMusicData.filter(track => track.Album === albumName);
        searchInput.value = `Album: "${albumName}"`; // Show filter in search box
    } else {
         console.warn(`Search-logic: No album found for artwork: ${filename}`);
        currentResults = [];
        if(searchInput) searchInput.value = '';
    }
     currentPage = 1;
    sortAndDisplayResults();
}

function sortAndDisplayResults() {
    const sortSelect = document.getElementById('sort-select');
    const sortMethod = sortSelect ? sortSelect.value : 'alphabetical-asc'; // Default sort
    let sortedResults = [...currentResults]; // Work with a copy

    switch (sortMethod) {
        case 'alphabetical-asc':
            sortedResults.sort((a, b) => (a['Track Name'] || '').localeCompare(b['Track Name'] || ''));
            break;
        case 'alphabetical-desc':
            sortedResults.sort((a, b) => (b['Track Name'] || '').localeCompare(a['Track Name'] || ''));
            break;
        case 'isrc-asc': // Oldest first based on ISRC string compare
            sortedResults.sort((a, b) => (a['ISRC'] || '').localeCompare(b['ISRC'] || ''));
            break;
        case 'isrc-desc': // Newest first
            sortedResults.sort((a, b) => (b['ISRC'] || '').localeCompare(a['ISRC'] || ''));
            break;
        case 'random':
            sortedResults.sort(() => Math.random() - 0.5);
            break;
    }
    currentResults = sortedResults; // Update the main list
    displayResults(); // Display the current (first) page
}

function displayResults() {
    console.log("Search-logic: Populating results...");
    const resultsContainer = document.getElementById('results');
    if (!resultsContainer) {
        console.error("Search-logic: Results container not found!");
        return;
    }
    resultsContainer.innerHTML = ''; // Clear previous results

    const startIndex = (currentPage - 1) * resultsPerPage;
    const endIndex = startIndex + resultsPerPage;
    const paginatedResults = currentResults.slice(startIndex, endIndex);

    console.log(`Search-logic: Displaying page ${currentPage}, results ${startIndex + 1} to ${Math.min(endIndex, currentResults.length)} of ${currentResults.length}`);

    if (paginatedResults.length === 0) {
         const searchInput = document.getElementById('search-input');
         const searchTerm = searchInput ? searchInput.value.trim() : "";
         if (searchTerm !== "") {
              resultsContainer.innerHTML = `<p style="text-align: center; margin-top: 20px;">No results found matching "${searchTerm}".</p>`;
         } else {
              // If search term is empty and still no results, likely data hasn't loaded or is empty
              resultsContainer.innerHTML = '<p style="text-align: center; margin-top: 20px;">No tracks to display. Loading or empty dataset.</p>';
         }
    } else {
        paginatedResults.forEach(track => {
            // Safer data access with defaults
            const trackName = track['Master Track Name'] || track['Track Name'] || 'Untitled Track';
            const artistName = track['Artist'] || 'Unknown Artist';
            const isrcCode = track['ISRC'] || 'N/A';
            const prsCode = track['PrsTunecodeFinal'] || 'N/A';
            const iswcCode = track['ISWC'] || 'N/A';
            const albumName = track['Album'] || 'Unknown Album';
            const artworkFile = track.artwork || 'default_artwork.png';
            const wavFile = track['wav file name'] || `${trackName}.wav`; // Default guess
            const mp3File = wavFile.replace(/\.wav$/i, '.mp3'); // Default guess

            // Assuming base URLs/paths
            const wavPath = `https://audio.8vbmusic.com/${wavFile}`;
            const mp3Path = `https://audio.8vbmusic.com/MP3s/${mp3File}`;
            const artworkPath = `Artwork/${artworkFile}`;

            const resultRow = document.createElement('div');
            resultRow.className = 'result-row';

            // Artwork
            const artwork = document.createElement('img');
            artwork.src = encodeURI(artworkPath);
            artwork.alt = `${albumName} album artwork`;
            artwork.className = 'artwork';
            artwork.style.cursor = 'pointer';
            artwork.onclick = () => searchByAlbumCover(artworkPath);
            artwork.onerror = function() {
                this.onerror=null;
                this.src='images/default_artwork.png';
                this.alt = 'Default album artwork';
                artwork.style.cursor = 'default';
                artwork.onclick = null;
            };
            resultRow.appendChild(artwork);

            // Track Info
            const trackInfo = document.createElement('div');
            trackInfo.className = 'track-info';
            trackInfo.innerHTML = `
                <div class="track-name">${trackName}</div>
                <div class="artist">Composer/Artist: <strong>${artistName}</strong></div>
                <div class="isrc">ISRC: <strong>${isrcCode}</strong> / PRS Tunecode: <strong>${prsCode}</strong> / ISWC: <strong>${iswcCode}</strong></div>
            `;
            resultRow.appendChild(trackInfo);

            // Audio Player
            const audio = document.createElement('audio');
            audio.controls = true;
            audio.src = encodeURI(mp3Path);
            audio.addEventListener('error', handleAudioError); // Add error handler
            audio.addEventListener('play', handleAudioPlay); // Add play handler
            resultRow.appendChild(audio);

            // Download Buttons
            const downloadButtons = document.createElement('div');
            downloadButtons.className = 'download-buttons';
            downloadButtons.innerHTML = `
                <a href="${encodeURI(mp3Path)}" download="${mp3File}" class="download-button" title="Download MP3">
                    <img src="images/DownloadMP3.svg" alt="Download MP3">
                </a>
                <a href="${encodeURI(wavPath)}" download="${wavFile}" class="download-button" title="Download WAV">
                    <img src="images/DownloadWAV.svg" alt="Download WAV">
                </a>
            `;
            resultRow.appendChild(downloadButtons);

            // Show Versions Button (only if ISRC exists)
            if (isrcCode !== 'N/A') {
                const showVersionsButton = document.createElement('button');
                showVersionsButton.className = 'show-versions';
                showVersionsButton.textContent = 'All Song Versions'; // Corrected text
                showVersionsButton.dataset.isrc = isrcCode;
                showVersionsButton.addEventListener('click', showAllVersions); // Add listener directly
                resultRow.appendChild(showVersionsButton);
            }

            resultsContainer.appendChild(resultRow);
        });
    }

    // addResultRowListeners(); // Listeners added directly now
    renderPaginationControls();
}


// Function to handle audio errors (simplified)
function handleAudioError() {
     console.error('Audio Error:', this.src, this.error);
     // Optionally try WAV if MP3 failed
     if (this.src.toLowerCase().endsWith('.mp3')) {
         const wavSrc = this.src.replace(/mp3s\//i, '').replace(/\.mp3$/i, '.wav');
         if (this.src !== wavSrc) { // Prevent infinite loop if replacement fails
              console.log('Attempting WAV fallback:', wavSrc);
              this.src = wavSrc;
              // Error handler will trigger again if WAV also fails
              return; // Don't mark as error yet
         }
     }
     // If it's already WAV or fallback didn't work, mark as error
     this.classList.add('audio-error');
     // Maybe hide controls or show message? For now, just class.
     // Example: Replace player with text
     // const errorText = document.createElement('span');
     // errorText.textContent = 'Audio unavailable';
     // errorText.className = 'audio-error-text';
     // this.parentNode.replaceChild(errorText, this);
}


function handleAudioPlay() {
     // Pause other audio players (including modal players)
     const allAudioPlayers = document.querySelectorAll('audio'); // Get all players on the page
     allAudioPlayers.forEach(p => {
        if (p !== this && !p.paused) {
            p.pause();
        }
     });
}

function renderPaginationControls() {
    const paginationContainer = document.getElementById('pagination-controls');
     if (!paginationContainer) return;

    paginationContainer.innerHTML = ''; // Clear old controls
    const totalResults = currentResults.length;
    const totalPages = Math.ceil(totalResults / resultsPerPage);

    if (totalPages <= 1) return; // No controls needed for 1 page or less

    // Function to create page links/buttons
    const createPageLink = (page, text = page, isActive = false, isDisabled = false) => {
        const link = document.createElement('button'); // Use buttons for actions
        link.textContent = text;
        link.className = 'page-link';
        if (isActive) link.classList.add('active');
        link.disabled = isDisabled; // Use disabled attribute

        link.onclick = (e) => {
            e.preventDefault();
            let newPage = currentPage;
            if (page === 'prev') newPage--;
            else if (page === 'next') newPage++;
            else newPage = page;

            if (newPage >= 1 && newPage <= totalPages) {
                 currentPage = newPage;
                 displayResults(); // Re-render the results for the new page
                 // Scroll to top of results
                 const resultsTop = document.getElementById('results')?.offsetTop || 0;
                 // Estimate header height or get dynamically if possible
                 const headerHeight = document.getElementById('search-controls')?.offsetHeight + document.getElementById('menu-panel')?.offsetHeight + 20 || 150;
                 window.scrollTo({ top: resultsTop - headerHeight, behavior: 'smooth' });
            }
        };
        return link;
    };

    // Previous Button
    paginationContainer.appendChild(createPageLink('prev', 'Previous', false, currentPage === 1));

    // Page Number Buttons (with simplified ellipsis logic)
    const maxPagesToShow = 5; // Adjust how many page numbers max
    if (totalPages <= maxPagesToShow + 2) { // Show all if not too many pages
        for (let i = 1; i <= totalPages; i++) {
             paginationContainer.appendChild(createPageLink(i, i, i === currentPage));
        }
    } else {
        // Show first page
        paginationContainer.appendChild(createPageLink(1, 1, 1 === currentPage));

        // Ellipsis and middle pages
        let startPage = Math.max(2, currentPage - 1);
        let endPage = Math.min(totalPages - 1, currentPage + 1);

        if (currentPage > 3) { // Show ellipsis if needed before middle pages
            const ellipsis = document.createElement('span');
            ellipsis.textContent = '...';
            ellipsis.className = 'page-ellipsis';
            paginationContainer.appendChild(ellipsis);
        }

        // Adjust start/end if near beginning/end to show more pages
        if (currentPage < 4) { endPage = Math.min(totalPages-1, 4); }
        if (currentPage > totalPages - 3) { startPage = Math.max(2, totalPages - 3); }


        for (let i = startPage; i <= endPage; i++) {
              paginationContainer.appendChild(createPageLink(i, i, i === currentPage));
        }

        if (currentPage < totalPages - 2) { // Show ellipsis if needed after middle pages
             const ellipsis = document.createElement('span');
             ellipsis.textContent = '...';
             ellipsis.className = 'page-ellipsis';
             paginationContainer.appendChild(ellipsis);
         }

        // Show last page
        paginationContainer.appendChild(createPageLink(totalPages, totalPages, totalPages === currentPage));
    }

    // Next Button
    paginationContainer.appendChild(createPageLink('next', 'Next', false, currentPage === totalPages));
}


// --- MODAL LOGIC ---
function showAllVersions(event) {
    const button = event.target;
    const isrc = button.getAttribute('data-isrc');
    if (!isrc) return;

    console.log('Search-logic: Showing versions for ISRC:', isrc);
    const modal = document.getElementById('versionsModal');
    const modalContent = modal?.querySelector('.modal-content');
    if (!modal || !modalContent) {
        console.error("Search-logic: Modal structure not found!");
        return;
    }

    // Find all tracks in the *other* dataset matching this ISRC
    const allTrackVersions = allVersionsData.filter(track => track['ISRC'] === isrc);
    console.log('Search-logic: Found versions in all_versions_data:', allTrackVersions.length);

    if (allTrackVersions.length > 0) {
        const masterTrack = allTrackVersions[0]; // Assume first is representative
        const artworkFile = masterTrack.artwork || 'default_artwork.png';
        const artworkPath = `Artwork/${artworkFile}`;
        const masterTrackName = masterTrack['Master Track Name'] || masterTrack['Track Name'] || 'Track Versions';
        const artistName = masterTrack['Artist'] || 'Unknown Artist';
        const prsCode = masterTrack['PrsTunecodeFinal'] || 'N/A';
        const iswcCode = masterTrack['ISWC'] || 'N/A';

        // Build modal HTML
        modalContent.innerHTML = `
            <button class="close" aria-label="Close modal">×</button>
            <div class="modal-header-info">
                <h2>All versions of "${masterTrackName}"</h2>
                <div class="artist">Composer/Artist: <strong>${artistName}</strong> / ISRC: <strong>${isrc}</strong> / PRS Tunecode: <strong>${prsCode}</strong> / ISWC: <strong>${iswcCode}</strong></div>
            </div>
            <div class="modal-layout">
                <div class="album-cover">
                    <img src="${encodeURI(artworkPath)}" alt="Album Cover for ${masterTrackName}" onerror="this.onerror=null; this.src='images/default_artwork.png'; this.alt='Default album artwork';">
                </div>
                <div class="modal-info">
                    <div id="modalVersions"></div>
                </div>
            </div>
        `;

        const modalVersionsContainer = modalContent.querySelector('#modalVersions');
        if(!modalVersionsContainer) return; // Should not happen

        allTrackVersions.forEach(version => {
            const versionTitle = version['Version'] || 'Main Version'; // Provide default
            const wavFile = version['wav file name'] || `${masterTrackName} - ${versionTitle}.wav`; // Guess filename
            const mp3File = wavFile.replace(/\.wav$/i, '.mp3'); // Guess filename
            const mp3Path = `https://audio.8vbmusic.com/MP3s/${mp3File}`;
            const wavPath = `https://audio.8vbmusic.com/${wavFile}`;

            const versionDiv = document.createElement('div');
            versionDiv.className = 'version-row';
            versionDiv.innerHTML = `
                <div class="track-name">${versionTitle}</div>
                <audio controls src="${encodeURI(mp3Path)}"></audio>
                <div class="download-buttons">
                    <a href="${encodeURI(mp3Path)}" download="${mp3File}" class="download-button" title="Download MP3">
                        <img src="images/DownloadMP3.svg" alt="Download MP3">
                    </a>
                    <a href="${encodeURI(wavPath)}" download="${wavFile}" class="download-button" title="Download WAV">
                        <img src="images/DownloadWAV.svg" alt="Download WAV">
                    </a>
                </div>
            `;
            modalVersionsContainer.appendChild(versionDiv);

            const modalAudio = versionDiv.querySelector('audio');
            if (modalAudio) {
                 modalAudio.addEventListener('error', handleAudioError); // Reuse same error handler
                 modalAudio.addEventListener('play', handleAudioPlay); // Reuse same play handler
             }
        });

        // Show modal and add close listeners AFTER content is built
        modal.style.display = 'block';
        const closeButton = modal.querySelector('.close');
        if(closeButton) {
            closeButton.onclick = closeModal;
        }
        // Close on outside click (listener added once below)

    } else {
        console.warn('Search-logic: No versions found in all_versions_data for ISRC:', isrc);
        alert("No alternative versions found for this track."); // Simple feedback
    }
}

function closeModal() {
    const modal = document.getElementById('versionsModal');
    if (modal) {
        // Pause any audio playing inside the modal before closing
        const modalAudioPlayers = modal.querySelectorAll('audio');
        modalAudioPlayers.forEach(p => p.pause());
        modal.style.display = 'none';
        modal.querySelector('.modal-content').innerHTML = ''; // Clear content
    }
}

// --- Initial Load & Event Setup for search.html ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("Search-logic.js DOMContentLoaded"); // Debugging

    // Make sure elements exist on this page before adding listeners
    const searchInput = document.getElementById('search-input');
    const sortSelect = document.getElementById('sort-select');
    const resultsContainer = document.getElementById('results'); // Needed for initial check
    const modal = document.getElementById('versionsModal'); // Needed for outside click listener

    if (!resultsContainer) {
        console.log("Search-logic: Not on the search page (no 'results' element). Exiting setup.");
        return; // Don't run search logic if not on search page
    }

    if (searchInput) {
        searchInput.addEventListener('input', debounce(search, 300)); // Add debounce to search input
    } else {
        console.warn("Search-logic: Search input not found.");
    }

    if (sortSelect) {
        sortSelect.addEventListener('change', sortAndDisplayResults);
    } else {
        console.warn("Search-logic: Sort select not found.");
    }

    // Modal close on outside click listener
    if (modal) {
        window.addEventListener('click', (event) => {
            if (event.target == modal) { // Click was directly on the modal background
                closeModal();
            }
        });
    }


    // Check for album query parameter from URL
    const urlParams = new URLSearchParams(window.location.search);
    const albumQuery = urlParams.get('album');

    // Load data and perform initial search/display
    loadMusicData().then(() => {
        if (albumQuery) {
            const decodedAlbumQuery = decodeURIComponent(albumQuery);
            console.log(`Search-logic: Searching for album from URL: ${decodedAlbumQuery}`);
            if(searchInput) {
                 searchInput.value = `Album: "${decodedAlbumQuery}"`; // Display filter
            }
             // Perform the actual filtering based on the query
             currentResults = mainMusicData.filter(track => track.Album === decodedAlbumQuery);
             currentPage = 1;
             sortAndDisplayResults(); // Display filtered results
        } else {
            // No album query, perform default search (shows all initially)
            console.log('Search-logic: Initial display...');
            search(); // Call search with potentially empty term
        }
    }).catch(error => {
        // Catch errors from loadMusicData promise itself
        console.error("Search-logic: Error during initial data load sequence:", error);
    });

}); // End DOMContentLoaded for search-logic.js