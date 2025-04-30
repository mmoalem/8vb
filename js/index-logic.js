// --- js/index-logic.js (Finalized with dynamic relative paths) ---
// Logic ONLY for index.html

let allShuffledAlbums = [];
let musicDataLoaded = false;
let initialLoadDone = false;


function getCurrentColumnCount() {
    const width = window.innerWidth;
    if (width <= 550) return 2;
    if (width <= 768) return 3;
    if (width <= 1000) return 4;
    if (width <= 1250) return 5;
    return 6;
}

async function loadFeaturedAlbums() {
    if (initialLoadDone) {
         console.log("Index-logic: loadFeaturedAlbums already called, skipping.");
         return;
    }
    initialLoadDone = true;
    console.log("Index-logic: Loading featured albums...");

    const topAlbumGrid = document.getElementById('top-album-grid');
    const bottomAlbumGrid = document.getElementById('bottom-album-grid');

    if (!topAlbumGrid || !bottomAlbumGrid) {
        console.error("Index-logic: One or more album grid containers not found!");
        initialLoadDone = false;
        return;
    }

     const currentLang = window.getCurrentLanguage();
     const translations = window.getTranslations();
     const loadingMessage = translations?.indexLoadingAlbums?.[currentLang] || translations?.indexLoadingAlbums?.en || 'Loading albums...';

    topAlbumGrid.innerHTML = `<p data-translate="indexLoadingAlbums">${loadingMessage}</p>`;
    bottomAlbumGrid.innerHTML = "";


    try {
        // Improved path detection for language folders
        const isInLanguageFolder = window.location.pathname.includes('/fr/') || 
                              window.location.pathname.includes('/de/') ||
                              window.location.pathname.includes('/es/') ||
                              window.location.pathname.includes('/it/') ||
                              window.location.pathname.match(/[\/\\][a-z]{2}[\/\\]/);
    
    // Determine the language pair for the JSON file
    const languagePair = determineLanguagePair();
    const musicDataPath = (isInLanguageFolder ? '../' : '') + `js/music_data-${languagePair}.json`;
    console.log("Index-logic: Attempting to fetch music data from:", musicDataPath);

        const response = await fetch(musicDataPath);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const allTracks = await response.json();
        musicDataLoaded = true;

        const uniqueAlbumsMap = new Map();
        allTracks.forEach(track => {
             const albumNameObj = track.Album;
             const albumNameEn = typeof albumNameObj === 'object' ? albumNameObj.en : (albumNameObj || '');

            if (albumNameEn && track.artwork && !uniqueAlbumsMap.has(albumNameEn)) {
                uniqueAlbumsMap.set(albumNameEn, {
                    albumName: albumNameObj,
                    artworkFile: track.artwork
                });
            }
        });
        let uniqueAlbums = Array.from(uniqueAlbumsMap.values());
        console.log(`Index-logic: Found ${uniqueAlbums.length} unique albums.`);

        if (uniqueAlbums.length === 0) {
             const noAlbumsMessage = translations?.indexNoAlbumsFound?.[currentLang] || translations?.indexNoAlbumsFound?.en || 'No albums found in library data.';
            topAlbumGrid.innerHTML = `<p>${noAlbumsMessage}</p>`;
            return;
        }

        uniqueAlbums.sort(() => Math.random() - 0.5);
        allShuffledAlbums = uniqueAlbums;

        updateAlbumDisplay();

    } catch (error) {
        console.error('Index-logic: Error loading or processing album data:', error);
         const translations = window.getTranslations();
         const currentLang = window.getCurrentLanguage();
         const errorMessage = translations?.dataLoadError?.[currentLang] || translations?.dataLoadError?.en || 'Error loading music data.';
        topAlbumGrid.innerHTML = `<p style="color: red;">${errorMessage}</p>`;
        bottomAlbumGrid.innerHTML = "";
         initialLoadDone = false;
    }
}

function determineLanguagePair() {
    // Get the current language from the URL path or from your language system
    const path = window.location.pathname;
    
    // Default to en-fr
    let languagePair = "en-fr";
    
    // Check for language folders in the path
    if (path.includes('/de/') || path.match(/[\/\\]de[\/\\]/)) {
        languagePair = "en-de";
    } else if (path.includes('/es/') || path.match(/[\/\\]es[\/\\]/)) {
        languagePair = "en-es";
    } else if (path.includes('/it/') || path.match(/[\/\\]it[\/\\]/)) {
        languagePair = "en-it";
    } else if (path.includes('/fr/') || path.match(/[\/\\]fr[\/\\]/)) {
        languagePair = "en-fr";
    }
    
    return languagePair;
}

function updateAlbumDisplay() {
    if (allShuffledAlbums.length === 0) {
        console.log("Index-logic: No albums to display in updateAlbumDisplay.");
        const topAlbumGrid = document.getElementById('top-album-grid');
        const bottomAlbumGrid = document.getElementById('bottom-album-grid');
        const translations = window.getTranslations();
        const currentLang = window.getCurrentLanguage();

         if (topAlbumGrid && musicDataLoaded) {
             const noAlbumsMessage = translations?.indexNoAlbumsFound?.[currentLang] || translations?.indexNoAlbumsFound?.en || 'No albums found in library data.';
             if (!topAlbumGrid.querySelector('p[data-translate="dataLoadError"]')) {
                 topAlbumGrid.innerHTML = `<p>${noAlbumsMessage}</p>`;
             }
         } else if (topAlbumGrid && !musicDataLoaded && !initialLoadDone) {
             const loadingMessage = translations?.indexLoadingAlbums?.[currentLang] || translations?.indexLoadingAlbums?.en || 'Loading albums...';
             topAlbumGrid.innerHTML = `<p data-translate="indexLoadingAlbums">${loadingMessage}</p>`;
         }
         if(bottomAlbumGrid) bottomAlbumGrid.innerHTML = "";

        return;
    }

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
    const numAlbumsAvailable = allShuffledAlbums.length;

     for(let i = 0; i < totalAlbumsNeeded; i++) {
          if (numAlbumsAvailable > 0) {
               albumsToDisplay.push(allShuffledAlbums[i % numAlbumsAvailable]);
          } else {
              break;
          }
     }

    populateAlbumGrid(topAlbumGrid, albumsToDisplay.slice(0, topAlbumCount));
    populateAlbumGrid(bottomAlbumGrid, albumsToDisplay.slice(topAlbumCount, totalAlbumsNeeded));
}

function populateAlbumGrid(targetElement, albums) {
    if (!albums || albums.length === 0) return;

     // Determine path prefix for local resources (Artwork, images)
     const pathPrefix = window.location.pathname.includes('/fr/') || 
                  window.location.pathname.includes('/de/') ||
                  window.location.pathname.includes('/es/') ||
                  window.location.pathname.includes('/it/') ||
                  window.location.pathname.match(/[\/\\][a-z]{2}[\/\\]/) ? '../' : '';

    albums.forEach(albumData => {
        const currentLang = window.getCurrentLanguage();
        const albumNameDisplay = typeof albumData.albumName === 'object' ?
                                 (albumData.albumName[currentLang] ?? albumData.albumName.en ?? 'Unknown Album') :
                                 (albumData.albumName || 'Unknown Album');

         const albumNameEnglish = typeof albumData.albumName === 'object' ? albumData.albumName.en : albumData.albumName;

        const artworkFile = albumData.artworkFile || 'default_artwork.png';
        // Construct path for local artwork image using pathPrefix
        const artworkPath = `${pathPrefix}Artwork/${encodeURIComponent(artworkFile)}`;


        // Link to search page, filtering by this album.
        // Ensure the search link goes to the correct language version of search.html
        // Construct the base path first (e.g., search.html or ./search.html)
        const baseSearchPath = window.location.pathname.startsWith('/fr/') ? './search.html' : 'search.html';
        const searchLink = `${baseSearchPath}?album=${encodeURIComponent(albumNameEnglish)}`;


        const albumLink = document.createElement('a');
        albumLink.href = searchLink;
        albumLink.className = 'album-link';
        albumLink.title = `View tracks from ${albumNameEnglish}`;


        const albumImg = document.createElement('img');
        albumImg.src = artworkPath;
        albumImg.alt = `${albumNameDisplay} album artwork`;
        albumImg.onerror = function() {
            this.onerror = null;
            // Default image path needs pathPrefix
            this.src = `${pathPrefix}images/default_artwork.png`;
            this.alt = 'Default album artwork';
            albumLink.title = `Artwork missing for ${albumNameEnglish}`;
        };

        albumLink.appendChild(albumImg);
        targetElement.appendChild(albumLink);
    });
}


// --- Initial Load Logic for index.html ---
document.addEventListener('DOMContentLoaded', function() {
    console.log("Index-logic.js DOMContentLoaded");

     window.translationsLoaded.then(() => {
         console.log("Index-logic: Translations loaded. Starting index setup.");

         loadFeaturedAlbums().catch(error => {
             console.error("Index-logic: Error during initial data load sequence after translation wait:", error);
         });

         window.addEventListener('resize', window.debounce(function() {
             console.log("Index-logic: Resize detected, updating albums...");
             updateAlbumDisplay();
         }, 250));

     }).catch(error => {
         console.error("Index-logic: Error waiting for translations:", error);
         const topAlbumGrid = document.getElementById('top-album-grid');
         const translations = window.getTranslations();
         const currentLang = window.getCurrentLanguage();
         const errorMessage = translations?.dataLoadError?.[currentLang] || translations?.dataLoadError?.en || 'Error loading music data.';

         if (topAlbumGrid) {
              topAlbumGrid.innerHTML = `<p style="color: red;">${errorMessage}</p>`;
         }
     });

});