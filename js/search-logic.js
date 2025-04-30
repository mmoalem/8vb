// --- js/search-logic.js (Finalized with dynamic relative paths) ---
// Logic ONLY for search.html

let mainMusicData = [];
let allVersionsData = [];
let currentResults = [];
let currentPage = 1;
const resultsPerPage = 10;

let initialSearchSetupDone = false;


// Add the resource path helper function here
function getResourcePath(resourceType, filename) {
    const isInLanguageFolder = /[\/\\][a-z]{2}[\/\\]/i.test(window.location.pathname);
    const pathPrefix = isInLanguageFolder ? '../' : '';
    
    // If this is a JSON file that needs language-specific version
    if (filename === 'music_data.json' || filename === 'all_versions_data.json') {
        const baseName = filename.replace('.json', '');
        const languagePair = determineLanguagePair();
        return pathPrefix + resourceType + '/' + encodeURIComponent(`${baseName}-${languagePair}.json`);
    }
    
    return pathPrefix + resourceType + '/' + encodeURIComponent(filename);
}

// Helper function to determine which language pair JSON to load
function determineLanguagePair() {
    // Get the current language from the URL path or from your language system
    const path = window.location.pathname;
    
    // Default to en-fr
    let languagePair = "en-fr";
    
    // Check for language folders in the path
    if (path.includes('/de/') || path.match(/[\/\\]de[\/\\]/)) {
        languagePair = "en-de";
    } else if (path.includes('/sp/') || path.match(/[\/\\]sp[\/\\]/)) {
        languagePair = "en-sp";
    } else if (path.includes('/fr/') || path.match(/[\/\\]fr[\/\\]/)) {
        languagePair = "en-fr";
    }
    
    return languagePair;
}

async function loadMusicDataAndSetupSearch() {
    if (initialSearchSetupDone) {
         console.log("Search-logic: Initial setup already done, skipping.");
         return;
    }
     initialSearchSetupDone = true;
     console.log('Search-logic: Starting initial data load and setup...');

    const resultsContainer = document.getElementById('results');
     const searchInput = document.getElementById('search-input');
     const sortSelect = document.getElementById('sort-select');
     const modal = document.getElementById('versionsModal');


    if (!resultsContainer || !searchInput || !sortSelect || !modal) {
         console.error("Search-logic: Missing required HTML elements for search page.");
         initialSearchSetupDone = false;
         return;
    }

    const currentLang = window.getCurrentLanguage();
     const translations = window.getTranslations();
     const loadingMessage = translations?.loadingMusicData?.[currentLang] || translations?.loadingMusicData?.en || 'Loading music data...';

    resultsContainer.innerHTML = `<p style="text-align: center; margin-top: 20px;" data-translate="loadingMusicData">${loadingMessage}</p>`;


    try {
        // Improved path detection for language folders
        const musicDataPath = getResourcePath('js', 'music_data.json');
const allVersionsDataPath = getResourcePath('js', 'all_versions_data.json');
        console.log("Search-logic: Attempting to fetch music data from:", musicDataPath);
        console.log("Search-logic: Attempting to fetch all versions data from:", allVersionsDataPath);


        const mainResponse = await fetch(musicDataPath);
        handleFetchError(mainResponse);
        mainMusicData = await mainResponse.json();

        const allVersionsResponse = await fetch(allVersionsDataPath);
        handleFetchError(allVersionsResponse);
        allVersionsData = await allVersionsResponse.json();

        console.log('Search-logic: Music data loaded successfully');

         const translations = window.getTranslations(); // Re-get translations after load wait

         // Apply placeholder translation
         const placeholderKey = searchInput.getAttribute('data-translate-placeholder');
         if(placeholderKey && translations && translations[placeholderKey] && translations[placeholderKey][currentLang]) {
             searchInput.placeholder = translations[placeholderKey][currentLang];
         } else if (placeholderKey && translations && translations[placeholderKey] && translations[placeholderKey]['en']) {
             searchInput.placeholder = translations[placeholderKey]['en'];
         }

         // Apply sort option translations
         const sortOptions = sortSelect.querySelectorAll('option');
         sortOptions.forEach(option => {
              const key = option.getAttribute('data-translate');
              if(key && translations && translations[key] && translations[key][currentLang]) {
                   option.textContent = translations[key][currentLang];
              } else if (key && translations && translations[key] && translations[key]['en']) {
                   option.textContent = translations[key]['en'];
              }
         });

         // Apply sort label translation
         const sortLabelSpan = document.querySelector('#search-controls .sort-label');
          if(sortLabelSpan && translations) {
               const key = sortLabelSpan.getAttribute('data-translate');
               if(key && translations[key] && translations[key][currentLang]) {
                    sortLabelSpan.textContent = translations[key][currentLang];
               } else if (key && translations[key] && translations[key]['en']) {
                    sortLabelSpan.textContent = translations[key]['en'];
               }
          }


        searchInput.addEventListener('input', window.debounce(search, 300));
        sortSelect.addEventListener('change', sortAndDisplayResults);

         window.addEventListener('click', (event) => {
             const modalElement = document.getElementById('versionsModal');
             if (modalElement && event.target == modalElement) {
                 closeModal();
             }
         });


        const urlParams = new URLSearchParams(window.location.search);
        const albumQuery = urlParams.get('album');

        if (albumQuery) {
             const decodedAlbumQuery = decodeURIComponent(albumQuery);
             console.log(`Search-logic: Searching for album from URL: ${decodedAlbumQuery}`);

             const albumLabel = translations?.albumLabel?.[currentLang] || translations?.albumLabel?.en || 'Album:';
             searchInput.value = `${albumLabel} "${decodedAlbumQuery}"`;

             currentResults = mainMusicData.filter(track => {
                  const albumName = track.Album;
                   if (typeof albumName === 'object') {
                       return Object.values(albumName).some(name =>
                            typeof name === 'string' && name.toLowerCase() === decodedAlbumQuery.toLowerCase()
                       );
                   } else {
                       return typeof albumName === 'string' && albumName.toLowerCase() === decodedAlbumQuery.toLowerCase();
                   }
             });
             currentPage = 1;
             sortAndDisplayResults();
         } else {
             console.log('Search-logic: Initial display (no album query)...');
             search();
         }


    } catch (error) {
        console.error('Search-logic: Error loading music data or during setup:', error);
        const translations = window.getTranslations();
        const currentLang = window.getCurrentLanguage();
        const errorMessage = translations?.dataLoadError?.[currentLang] || translations?.dataLoadError?.en || 'Error loading music data. Please check console or try again later.';
        resultsContainer.innerHTML = `<p style="color: red; text-align: center; margin-top: 30px;">${errorMessage}</p>`;
         initialSearchSetupDone = false;
    }
}


function handleFetchError(response) {
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} for ${response.url}`);
    }
}

function search() {
     if (!window.getTranslations() || mainMusicData.length === 0) {
         console.log('Search-logic: Translations or music data not available for search.');
         const resultsContainer = document.getElementById('results');
         if (resultsContainer && !resultsContainer.hasChildNodes()) {
             const loadingMessage = window.getTranslations()?.loadingMusicData?.[window.getCurrentLanguage()] || window.getTranslations()?.loadingMusicData?.en || 'Loading music data...';
             resultsContainer.innerHTML = `<p style="text-align: center; margin-top: 20px;" data-translate="loadingMusicData">${loadingMessage}</p>`;
         }
         return;
     }


    const searchInput = document.getElementById('search-input');
    const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : "";
    console.log('Search-logic: Performing search for:', searchTerm);

     const currentLang = window.getCurrentLanguage();
     const translations = window.getTranslations();
     const albumLabel = translations?.albumLabel?.[currentLang] || translations?.albumLabel?.en || 'Album:';


    if (searchTerm === "" || searchTerm.startsWith(`${albumLabel.toLowerCase()} `)) {
         let filteredByAlbum = [...mainMusicData];
         if (searchTerm.startsWith(`${albumLabel.toLowerCase()} `)) {
              const albumQuery = searchTerm.substring(albumLabel.length + 1).trim().replace(/^"|"$/g, '');

              filteredByAlbum = mainMusicData.filter(track => {
                   const albumName = track.Album;
                   if (typeof albumName === 'object') {
                       return Object.values(albumName).some(name =>
                            typeof name === 'string' && name.toLowerCase() === albumQuery.toLowerCase()
                       );
                   } else {
                       return typeof albumName === 'string' && albumName.toLowerCase() === albumQuery.toLowerCase();
                   }
              });
         }
         currentResults = filteredByAlbum;

    } else {
        currentResults = mainMusicData.filter(track => {
            const checkField = (fieldName) => {
                const fieldValue = track[fieldName];
                if (typeof fieldValue === 'string') {
                    return fieldValue.toLowerCase().includes(searchTerm);
                } else if (typeof fieldValue === 'object') {
                    return Object.values(fieldValue).some(value =>
                        typeof value === 'string' && value.toLowerCase().includes(searchTerm)
                    );
                }
                return false;
            };

             return (
                 checkField('Master Track Name') || checkField('Track Name') || checkField('Artist') ||
                checkField('KEYWORD/TAGS') || checkField('MOOD') ||
                checkField('GENRE') || checkField('STYLE') || checkField('INSTRUMENTS') ||
                checkField('TEMPO') || checkField('Version') || checkField('Key')
             );
        });
    }

    console.log('Search-logic: Total number of results after search:', currentResults.length);
    currentPage = 1;
    sortAndDisplayResults();
}

function searchByAlbumCover(artworkOriginalFileName) { // Accept just the file name
     if (mainMusicData.length === 0) {
         console.log('Search-logic: Data not loaded yet, cannot search by album.');
         return;
     }
     const translations = window.getTranslations();
     const currentLang = window.getCurrentLanguage();
     const searchInput = document.getElementById('search-input');
     if (!searchInput) return;

    // Find the album name object associated with this artwork file in the full dataset
    const albumEntry = mainMusicData.find(track => track.artwork === artworkOriginalFileName);
    const albumNameObj = albumEntry?.Album;

    if (albumNameObj) {
         const albumNameEnglish = typeof albumNameObj === 'object' ? albumNameObj.en : albumNameObj;

        currentResults = mainMusicData.filter(track => {
            const trackAlbum = track.Album;
            if (typeof trackAlbum === 'object') {
                return Object.values(trackAlbum).some(name => typeof name === 'string' && name.toLowerCase() === albumNameEnglish.toLowerCase());
            } else {
                 return typeof trackAlbum === 'string' && trackAlbum.toLowerCase() === albumNameEnglish.toLowerCase();
            }
        });

         const albumLabel = translations?.albumLabel?.[currentLang] || translations?.albumLabel?.en || 'Album:';
         const albumNameDisplay = typeof albumNameObj === 'object' ?
                                  (albumNameObj[currentLang] ?? albumNameObj.en ?? albumNameEnglish) :
                                  (albumNameObj || albumNameEnglish);

        searchInput.value = `${albumLabel} "${albumNameDisplay}"`;

    } else {
         console.warn(`Search-logic: No album found for artwork: ${artworkOriginalFileName}`);
        currentResults = [];
        searchInput.value = '';
    }
     currentPage = 1;
    sortAndDisplayResults();
}


function sortAndDisplayResults() {
    const sortSelect = document.getElementById('sort-select');
    const sortMethod = sortSelect ? sortSelect.value : 'alphabetical-asc';
    let sortedResults = [...currentResults];

    const currentLang = window.getCurrentLanguage();

    switch (sortMethod) {
        case 'alphabetical-asc':
        case 'alphabetical-desc':
            sortedResults.sort((a, b) => {
                 const nameA = (typeof a['Track Name'] === 'object' ? (a['Track Name'][currentLang] ?? a['Track Name'].en) : (a['Track Name'] || a['Master Track Name'] || ''));
                 const nameB = (typeof b['Track Name'] === 'object' ? (b['Track Name'][currentLang] ?? b['Track Name'].en) : (b['Track Name'] || b['Master Track Name'] || ''));

                if (sortMethod === 'alphabetical-asc') {
                    return nameA.localeCompare(nameB);
                } else {
                    return nameB.localeCompare(nameA);
                }
            });
            break;
        case 'isrc-asc':
            sortedResults.sort((a, b) => (a['ISRC'] || '').localeCompare(b['ISRC'] || ''));
            break;
        case 'isrc-desc':
            sortedResults.sort((a, b) => (b['ISRC'] || '').localeCompare(a['ISRC'] || ''));
            break;
        case 'random':
            sortedResults.sort(() => Math.random() - 0.5);
            break;
         default:
             sortedResults.sort((a, b) => {
                 const nameA = (typeof a['Track Name'] === 'object' ? (a['Track Name'][currentLang] ?? a['Track Name'].en) : (a['Track Name'] || a['Master Track Name'] || ''));
                 const nameB = (typeof b['Track Name'] === 'object' ? (b['Track Name'][currentLang] ?? b['Track Name'].en) : (b['Track Name'] || b['Master Track Name'] || ''));
                  return nameA.localeCompare(nameB);
             });
             break;
    }
    currentResults = sortedResults;
    displayResults();
}

function displayResults() {
    console.log("Search-logic: Populating results...");
    const resultsContainer = document.getElementById('results');
    if (!resultsContainer) {
        console.error("Search-logic: Results container not found!");
        return;
    }
    resultsContainer.innerHTML = '';

    const startIndex = (currentPage - 1) * resultsPerPage;
    const endIndex = startIndex + resultsPerPage;
    const paginatedResults = currentResults.slice(startIndex, endIndex);

    

    console.log(`Search-logic: Displaying page ${currentPage}, results ${startIndex + 1} to ${Math.min(endIndex, currentResults.length)} of ${currentResults.length}`);

    const currentLang = window.getCurrentLanguage();
     const translations = window.getTranslations();


    if (paginatedResults.length === 0) {
         const searchInput = document.getElementById('search-input');
         const searchTerm = searchInput ? searchInput.value.trim() : "";
         if (searchTerm !== "") {
             const noResultsMessage = translations?.noResultsFound?.[currentLang] || translations?.noResultsFound?.en || 'No results found matching';
              resultsContainer.innerHTML = `<p style="text-align: center; margin-top: 20px;">${noResultsMessage} "${searchTerm}".</p>`;
         } else {
               const noTracksMessage = translations?.noTracksToDisplay?.[currentLang] || translations?.noTracksToDisplay?.en || 'No tracks to display. Loading or empty dataset.';
               resultsContainer.innerHTML = `<p style="text-align: center; margin-top: 20px;">${noTracksMessage}</p>`;
         }
    } else {
        // Determine path prefix for local resources (images)
        const musicDataPath = getResourcePath('js', 'music_data.json');
        const allVersionsDataPath = getResourcePath('js', 'all_versions_data.json');


        paginatedResults.forEach(track => {
            const masterTrackName = track['Master Track Name'] || 'Untitled Track';
            const artistName = track['Artist'] || 'Unknown Artist';
            const isrcCode = track['ISRC'] || 'N/A';
            const prsCode = track['PrsTunecodeFinal'] || 'N/A';
            const iswcCode = track['ISWC'] || 'N/A';
            const albumNameEnglish = typeof track.Album === 'object' ? track.Album.en : (track.Album || 'Unknown Album');

             const trackNameDisplay = typeof track['Track Name'] === 'object' ? (track['Track Name'][currentLang] ?? track['Track Name'].en ?? masterTrackName) : (track['Track Name'] || masterTrackName);
             const versionText = typeof track.Version === 'object' ? (track.Version[currentLang] ?? track.Version.en ?? 'Version') : (track.Version || 'Version');
             const genreText = typeof track.GENRE === 'object' ? (track.GENRE[currentLang] ?? track.GENRE.en ?? 'N/A') : (track.GENRE || 'N/A');
             const moodText = typeof track.MOOD === 'object' ? (track.MOOD[currentLang] ?? track.MOOD.en ?? 'N/A') : (track.MOOD || 'N/A');
             const keywordsText = typeof track['KEYWORD/TAGS'] === 'object' ? (track['KEYWORD/TAGS'][currentLang] ?? track['KEYWORD/TAGS'].en ?? 'N/A') : (track['KEYWORD/TAGS'] || 'N/A');


            const artworkFile = track.artwork || 'default_artwork.png';
            const wavFile = track['wav file name'] || `${masterTrackName}.wav`;
            const mp3File = wavFile.replace(/\.wav$/i, '.mp3');

             // Audio paths are absolute URLs to the audio server
            const wavPath = `https://audio.8vbmusic.com/${encodeURIComponent(wavFile)}`;
            const mp3Path = `https://audio.8vbmusic.com/MP3s/${encodeURIComponent(mp3File)}`;
             // Artwork path uses pathPrefix for local images
            const artworkPath = getResourcePath('Artwork', artworkFile);


            const resultRow = document.createElement('div');
            resultRow.className = 'result-row';

            const artwork = document.createElement('img');
            artwork.src = artworkPath;
            artwork.alt = `${albumNameEnglish} album artwork`;
            artwork.className = 'artwork';
            artwork.style.cursor = 'pointer';
            // Pass the original artwork file name to searchByAlbumCover
            artwork.onclick = () => searchByAlbumCover(artworkFile);
            artwork.onerror = function() {
                this.onerror=null;
                // Default image path needs pathPrefix
                this.src = getResourcePath('images', 'default_artwork.png');
                this.alt = 'Default album artwork';
                artwork.style.cursor = 'default';
                artwork.onclick = null;
            };
            resultRow.appendChild(artwork);

            const trackInfo = document.createElement('div');
            trackInfo.className = 'track-info';

             const displayedTrackName = `${masterTrackName}`;

             const artistLabel = translations?.artistLabel?.[currentLang] || translations?.artistLabel?.en || 'Composer/Artist:';
             const isrcLabel = translations?.isrcLabel?.[currentLang] || translations?.isrcLabel?.en || 'ISRC:';
             const prsLabel = translations?.prsTunecodeLabel?.[currentLang] || translations?.prsTunecodeLabel?.en || 'PRS Tunecode:';
             const iswcLabel = translations?.iswcLabel?.[currentLang] || translations?.iswcLabel?.en || 'ISWC:';
             const genreLabel = translations?.genreLabel?.[currentLang] || translations?.genreLabel?.en || 'Genre:';
             const moodLabel = translations?.moodLabel?.[currentLang] || translations?.moodLabel?.en || 'Mood:';
             const keywordsLabel = translations?.keywordsLabel?.[currentLang] || translations?.keywordsLabel?.en || 'Keywords:';

             const genreTextLowercase = genreText.toLowerCase();
             const moodTextLowercase = moodText.toLowerCase();
 
             trackInfo.innerHTML = `
                 <div class="track-name">${displayedTrackName}</div>
                 <div class="artist">${artistLabel} <strong>${artistName}</strong></div>
                 <div class="isrc">${isrcLabel} <strong>${isrcCode}</strong> / ${prsLabel} <strong>${prsCode}</strong> / ${iswcLabel} <strong>${iswcCode}</strong></div>
                 <div class="isrc">${genreLabel} <strong>${genreTextLowercase}</strong></div>
                 <div class="isrc">${moodLabel} <strong>${moodTextLowercase}</strong></div>
             `;

            resultRow.appendChild(trackInfo);

            const audio = document.createElement('audio');
            audio.controls = true;
            audio.src = mp3Path;
            audio.addEventListener('error', handleAudioError);
            audio.addEventListener('play', handleAudioPlay);
            resultRow.appendChild(audio);

            const downloadButtons = document.createElement('div');
            downloadButtons.className = 'download-buttons';

             const downloadMp3Title = translations?.modalDownloadMp3?.[currentLang] || translations?.modalDownloadMp3?.en || 'Download MP3';
             const downloadWavTitle = translations?.modalDownloadWav?.[currentLang] || translations?.modalDownloadWav?.en || 'Download WAV';

             // Download image paths need pathPrefix
             downloadButtons.innerHTML = `
             <a href="${mp3Path}" download="${mp3File}" class="download-button" title="${downloadMp3Title}">
                 <img src="${getResourcePath('images', 'DownloadMP3.svg')}" alt="${downloadMp3Title}">
             </a>
             <a href="${wavPath}" download="${wavFile}" class="download-button" title="${downloadWavTitle}">
                 <img src="${getResourcePath('images', 'DownloadWAV.svg')}" alt="${downloadWavTitle}">
             </a>
         `;
         resultRow.appendChild(downloadButtons);

            if (isrcCode !== 'N/A') {
                const showVersionsButton = document.createElement('button');
                showVersionsButton.className = 'show-versions';
                showVersionsButton.textContent = translations?.showVersionsButton?.[currentLang] || translations?.showVersionsButton?.en || 'All Versions';
                showVersionsButton.dataset.isrc = isrcCode;
                showVersionsButton.addEventListener('click', showAllVersions);
                resultRow.appendChild(showVersionsButton);
            }

            resultsContainer.appendChild(resultRow);
        });
    }

    renderPaginationControls();
}

function handleAudioError() {
     console.error('Search-logic: Audio Error:', this.src, this.error);
     if (this.src.toLowerCase().includes('/mp3s/') && this.src.toLowerCase().endsWith('.mp3')) {
         const wavSrc = this.src.replace(/\/MP3s\//i, '/').replace(/\.mp3$/i, '.wav');
         console.log('Search-logic: Attempting WAV fallback:', wavSrc);
         if (!this.dataset.originalSrc) {
             this.dataset.originalSrc = this.src;
         }
         if (this.src !== wavSrc && !this.dataset.attemptedWav) {
              this.dataset.attemptedWav = 'true';
              this.src = wavSrc;
              return;
         }
     }
     this.classList.add('audio-error');
     const errorText = document.createElement('span');
     errorText.textContent = 'Audio unavailable'; // Consider translating
     errorText.className = 'audio-error-text';
     this.parentNode.replaceChild(errorText, this);
}


function handleAudioPlay() {
     const allAudioPlayers = document.querySelectorAll('audio');
     allAudioPlayers.forEach(p => {
        if (p !== this && !p.paused) {
            p.pause();
        }
     });
}

function renderPaginationControls() {
    const paginationContainer = document.getElementById('pagination-controls');
     if (!paginationContainer) return;

    paginationContainer.innerHTML = '';
    const totalResults = currentResults.length;
    const totalPages = Math.ceil(totalResults / resultsPerPage);

    if (totalPages <= 1) return;

     const currentLang = window.getCurrentLanguage();
     const translations = window.getTranslations();
     const prevText = translations?.paginationPrevious?.[currentLang] || translations?.paginationPrevious?.en || 'Previous';
     const nextText = translations?.paginationNext?.[currentLang] || translations?.paginationNext?.en || 'Next';


    const createPageLink = (page, text, isActive = false, isDisabled = false) => {
        const link = document.createElement('button');
        link.textContent = text;
        link.className = 'page-link';
        if (isActive) link.classList.add('active');
        link.disabled = isDisabled;

        link.onclick = (e) => {
            e.preventDefault();
            let newPage = currentPage;
            if (page === 'prev') newPage--;
            else if (page === 'next') newPage++;
            else newPage = page;

            if (newPage >= 1 && newPage <= totalPages) {
                 currentPage = newPage;
                 displayResults();
                 const scrollToElement = document.getElementById('search-controls') || document.getElementById('results');
                 if (scrollToElement) {
                      const offsetTop = scrollToElement.offsetTop;
                      const buffer = 20;
                      window.scrollTo({ top: offsetTop - buffer, behavior: 'smooth' });
                 }

            }
        };
        return link;
    };

    paginationContainer.appendChild(createPageLink('prev', prevText, false, currentPage === 1));

    const maxPagesToShow = 5;
     let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
     let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
     if (endPage - startPage + 1 < maxPagesToShow) {
         startPage = Math.max(1, endPage - maxPagesToShow + 1);
     }

    if (startPage > 1) {
        paginationContainer.appendChild(createPageLink(1, '1', 1 === currentPage));
        if (startPage > 2) {
             const ellipsis = document.createElement('span');
             ellipsis.textContent = '...';
             ellipsis.className = 'page-ellipsis';
             paginationContainer.appendChild(ellipsis);
        }
    }

    for (let i = startPage; i <= endPage; i++) {
         paginationContainer.appendChild(createPageLink(i, i.toString(), i === currentPage));
    }

    if (endPage < totalPages) {
         if (endPage < totalPages - 1) {
             const ellipsis = document.createElement('span');
             ellipsis.textContent = '...';
             ellipsis.className = 'page-ellipsis';
             paginationContainer.appendChild(ellipsis);
         }
         paginationContainer.appendChild(createPageLink(totalPages, totalPages.toString(), totalPages === currentPage));
     }

    paginationContainer.appendChild(createPageLink('next', nextText, false, currentPage === totalPages));
}


// --- MODAL LOGIC ---
function showAllVersions(event) {
    const button = event.target;
    const isrc = button.getAttribute('data-isrc');
    if (!isrc) return;

    console.log('Search-logic: Showing versions for ISRC:', isrc);
    const modal = document.getElementById('versionsModal');
    const modalContent = modal?.querySelector('.modal-content');
    const modalInfoContainer = modal?.querySelector('.modal-info'); // Get the container for versions

    // Determine path prefix for local resources (images)
    const isInLanguageFolder = /[\/\\][a-z]{2}[\/\\]/i.test(window.location.pathname);
    const pathPrefix = isInLanguageFolder ? '../' : '';

    if (!modal || !modalContent || !modalInfoContainer) {
        console.error("Search-logic: Modal structure not found (modal, modal-content, or modal-info)!");
        return;
    }

    const currentLang = window.getCurrentLanguage();
    const translations = window.getTranslations();

    const allTrackVersions = allVersionsData.filter(track => track['ISRC'] === isrc);
    console.log('Search-logic: Found versions in all_versions_data:', allTrackVersions.length);

    if (allTrackVersions.length > 0) {
        const masterTrack = allTrackVersions[0];
        const artworkFile = masterTrack.artwork || 'default_artwork.png';
        // Artwork path needs pathPrefix
        const artworkPath = `${pathPrefix}Artwork/${encodeURIComponent(artworkFile)}`;

        const masterTrackName = masterTrack['Master Track Name'] || 'Track Versions';
        const artistName = masterTrack['Artist'] || 'Unknown Artist';
        const prsCode = masterTrack['PrsTunecodeFinal'] || 'N/A';
        const iswcCode = masterTrack['ISWC'] || 'N/A';

        const allVersionsLabel = translations?.modalAllVersionsLabel?.[currentLang] || translations?.modalAllVersionsLabel?.en || 'All versions of';
        const composerArtistLabel = translations?.artistLabel?.[currentLang] || translations?.artistLabel?.en || 'Composer/Artist:';
        const isrcLabel = translations?.isrcLabel?.[currentLang] || translations?.isrcLabel?.en || 'ISRC:';
        const prsLabel = translations?.prsTunecodeLabel?.[currentLang] || translations?.prsTunecodeLabel?.en || 'PRS Tunecode:';
        const iswcLabel = translations?.iswcLabel?.[currentLang] || translations?.iswcLabel?.en || 'ISWC:';

        // --- Populate Modal Header and Artwork ---
        const headerInfo = modalContent.querySelector('.modal-header-info');
        const albumCoverContainer = modalContent.querySelector('.album-cover');

        if (headerInfo) {
            headerInfo.innerHTML = `
                <button class="close" aria-label="Close modal">×</button>
                <h2>${allVersionsLabel} "${masterTrackName}"</h2>
                <div class="artist">${composerArtistLabel} <strong>${artistName}</strong> / ${isrcLabel} <strong>${isrc}</strong> / ${prsLabel} <strong>${prsCode}</strong> / ${iswcLabel} <strong>${iswcCode}</strong></div>
            `;
            // Re-attach close button listener
            const closeButton = headerInfo.querySelector('.close');
            if(closeButton) {
                closeButton.onclick = closeModal;
            }
        }

        if (albumCoverContainer) {
            albumCoverContainer.innerHTML = `
                <img src="${artworkPath}" alt="Album Cover for ${masterTrackName}" onerror="this.onerror=null; this.src='${pathPrefix}images/default_artwork.png'; this.alt='Default album artwork';">
            `;
        }

        // --- Populate Versions List ---
        modalInfoContainer.innerHTML = ''; // Clear previous versions

        const downloadMp3Title = translations?.modalDownloadMp3?.[currentLang] || translations?.modalDownloadMp3?.en || 'Download MP3';
        const downloadWavTitle = translations?.modalDownloadWav?.[currentLang] || translations?.modalDownloadWav?.en || 'Download WAV';
        
        // Download image paths need pathPrefix
        const downloadImgPrefix = pathPrefix + 'images/';

        allTrackVersions.forEach(version => {
            const versionTitle = typeof version.Version === 'object' ? (version.Version[currentLang] ?? version.Version.en ?? 'Version') : (version.Version || 'Version');

            // Length calculation remains the same
            let lengthText = version.LENGTH;
            if (typeof lengthText === 'string') {
                try {
                    if (lengthText.startsWith('1899-12-30T')) {
                        const date = new Date(lengthText);
                        const minutes = date.getUTCMinutes();
                        const seconds = date.getUTCSeconds();
                        lengthText = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                    }
                } catch (e) {
                    console.warn("Search-logic: Error parsing date string for length:", lengthText, e);
                }
            } else if (typeof lengthText === 'number') {
                const minutes = Math.floor(lengthText / 60);
                const seconds = Math.floor(lengthText % 60);
                lengthText = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            } else {
                lengthText = 'N/A';
            }

            const wavFile = version['wav file name'] || `${masterTrackName} - ${versionTitle}.wav`;
            const mp3File = wavFile.replace(/\.wav$/i, '.mp3');
            const mp3Path = `https://audio.8vbmusic.com/MP3s/${encodeURIComponent(mp3File)}`;
            const wavPath = `https://audio.8vbmusic.com/${encodeURIComponent(wavFile)}`;

            // Create a div for each version instead of table rows
            const versionRow = document.createElement('div');
            versionRow.className = 'version-row';

            versionRow.innerHTML = `
                <div class="version-name">${versionTitle}</div>
                <div class="version-actions">
                    <audio controls src="${mp3Path}"></audio>
                    <div class="download-buttons">
                        <a href="${mp3Path}" download="${mp3File}" class="download-button" title="${downloadMp3Title}">
                            <img src="${downloadImgPrefix}DownloadMP3.svg" alt="${downloadMp3Title}">
                        </a>
                        <a href="${wavPath}" download="${wavFile}" class="download-button" title="${downloadWavTitle}">
                            <img src="${downloadImgPrefix}DownloadWAV.svg" alt="${downloadWavTitle}">
                        </a>
                    </div>
                </div>
            `;
            modalInfoContainer.appendChild(versionRow);

            const modalAudio = versionRow.querySelector('audio');
            if (modalAudio) {
                modalAudio.addEventListener('error', handleAudioError);
                modalAudio.addEventListener('play', handleAudioPlay);
            }
        });

        modal.style.display = 'block';
        // Close button listener is attached above when header is populated

    } else {
        console.warn('Search-logic: No versions found in all_versions_data for ISRC:', isrc);
        const noVersionsMessage = translations?.noVersionsFound?.[currentLang] || translations?.noVersionsFound?.en || "No alternative versions found for this track.";
        alert(noVersionsMessage);
    }
}

function openVersionsModal(track) {
    const modal = document.getElementById('versionsModal');
    const modalContent = document.getElementById('versionsModalContent');
    
    if (!modal || !modalContent) {
        console.error("Search-logic: Modal elements not found!");
        return;
    }
    
    // Clear previous content
    modalContent.innerHTML = '';
    
    // Get all versions for this track
    const masterTrackName = track['Master Track Name'];
    const trackVersions = allVersionsData.filter(version => 
        version['Master Track Name'] === masterTrackName
    );
    
    const currentLang = window.getCurrentLanguage();
    const translations = window.getTranslations();
    
    // Create header
    const header = document.createElement('h2');
    const allVersionsText = translations?.allVersionsOf?.[currentLang] || 
                           translations?.allVersionsOf?.en || 
                           'All Versions of';
    header.textContent = `${allVersionsText} "${masterTrackName}"`;
    modalContent.appendChild(header);
    
    // Create version list
    trackVersions.forEach(version => {
        const versionName = typeof version.Version === 'object' ? 
                           (version.Version[currentLang] ?? version.Version.en) : 
                           version.Version;
        
        const versionItem = document.createElement('div');
        versionItem.className = 'version-item';
        versionItem.innerHTML = `
            <div class="version-name">${versionName}</div>
            <div class="version-isrc">ISRC: ${version.ISRC || 'N/A'}</div>
        `;
        
        // Add play button if audio file exists
        if (version['wav file name']) {
            const playButton = document.createElement('button');
            playButton.className = 'play-version-button';
            playButton.textContent = translations?.playText?.[currentLang] || 
                                    translations?.playText?.en || 
                                    'Play';
            
            const mp3File = version['wav file name'].replace(/\.wav$/i, '.mp3');
            const mp3Path = `https://audio.8vbmusic.com/MP3s/${encodeURIComponent(mp3File)}`;
            
            playButton.onclick = () => {
                const audioPlayer = document.getElementById('modalAudioPlayer');
                if (audioPlayer) {
                    audioPlayer.src = mp3Path;
                    audioPlayer.play();
                }
            };
            
            versionItem.appendChild(playButton);
        }
        
        modalContent.appendChild(versionItem);
    });
    
    // Add audio player to modal
    const audioPlayer = document.createElement('audio');
    audioPlayer.id = 'modalAudioPlayer';
    audioPlayer.controls = true;
    modalContent.appendChild(audioPlayer);
    
    // Show the modal
    modal.style.display = 'block';
}

function closeModal() {
    const modal = document.getElementById('versionsModal');
    const audioPlayer = document.getElementById('modalAudioPlayer');
    
    if (modal) modal.style.display = 'none';
    if (audioPlayer) audioPlayer.pause();
}

function closeModal() {
    const modal = document.getElementById('versionsModal');
    if (modal) {
        const modalAudioPlayers = modal.querySelectorAll('audio');
        modalAudioPlayers.forEach(p => p.pause());
        modal.style.display = 'none';
         // Clear only the versions list, keep the structure
         const modalInfoContainer = modal.querySelector('.modal-info');
         if (modalInfoContainer) {
             modalInfoContainer.innerHTML = '';
         }
         // Optionally clear header/artwork too if needed, but often better to repopulate
         // const headerInfo = modal.querySelector('.modal-header-info');
         // const albumCoverContainer = modal.querySelector('.album-cover');
         // if (headerInfo) headerInfo.innerHTML = '<button class="close" aria-label="Close modal">×</button>'; // Keep close button structure
         // if (albumCoverContainer) albumCoverContainer.innerHTML = '';
    }
}


document.addEventListener('DOMContentLoaded', () => {
    console.log("Search-logic.js DOMContentLoaded");

     window.translationsLoaded.then(() => {
         console.log("Search-logic: Translations loaded. Starting search setup.");
         loadMusicDataAndSetupSearch().catch(error => {
             console.error("Search-logic: Error during data load sequence after translation wait:", error);
         });

     }).catch(error => {
         console.error("Search-logic: Error waiting for translations:", error);
         const resultsContainer = document.getElementById('results');
          const translations = window.getTranslations();
          const currentLang = window.getCurrentLanguage();
          const errorMessage = translations?.dataLoadError?.[currentLang] || translations?.dataLoadError?.en || 'Error loading music data.';

         if (resultsContainer) {
              resultsContainer.innerHTML = `<p style="color: red; text-align: center; margin-top: 30px;">${errorMessage}</p>`;
         } else {
              console.error("Search-logic: Results container not found. Cannot display error message.");
         }
     });

});
