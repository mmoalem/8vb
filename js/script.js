let mainMusicData = [];
		let allVersionsData = [];
		let currentResults = []; // This will hold ALL filtered results
        let currentPage = 1;
        const resultsPerPage = 10; // Adjust as needed (e.g., 10, 20)

		async function loadMusicData() {
			try {
				const mainResponse = await fetch('music_data.json');
				mainMusicData = await mainResponse.json();

				const allVersionsResponse = await fetch('all_versions_data.json');
				allVersionsData = await allVersionsResponse.json();

				console.log('Music data loaded successfully');
			} catch (error) {
				console.error('Error loading music data:', error);
                // Display error to user on the page
                document.getElementById('results').innerHTML = '<p style="color: red; text-align: center; margin-top: 30px;">Error loading music data. Please check console or try again later.</p>';
			}
		}

		function handleFetchError(response) {
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}
			return response;
		}

        function search() {
            // Ensure data is loaded before searching
			if (mainMusicData.length === 0) {
				console.log('No music data available yet for search.');
                // Optionally display a message if results container is empty
                if (!document.getElementById('results').hasChildNodes()) {
                     document.getElementById('results').innerHTML = '<p style="text-align: center; margin-top: 20px;">Loading music data...</p>';
                }
				return;
			}

			const searchTerm = document.getElementById('search-input').value.toLowerCase().trim();
			console.log('Searching for:', searchTerm);

            if (searchTerm === "") {
                currentResults = [...mainMusicData];
            } else {
                currentResults = mainMusicData.filter(track => {
                    const checkField = (fieldName) => {
                        const fieldValue = track[fieldName];
                        return typeof fieldValue === 'string' && fieldValue.toLowerCase().includes(searchTerm);
                    };
                    return (
                        checkField('Track Name') || checkField('Artist') || checkField('Album') ||
                        checkField('KEYWORD/TAGS') || checkField('MOOD') || checkField('GENRE') ||
                        checkField('STYLE') || checkField('INSTRUMENTS')
                    );
                });
            }

			console.log('Total number of results:', currentResults.length);
            currentPage = 1;
			sortAndDisplayResults(); // This calls displayResults
		}

        function searchByAlbumCover(artworkPath) {
             if (mainMusicData.length === 0) return; // Prevent action if data not loaded
            const filename = artworkPath.split('/').pop(); // Get filename from potentially full path
            const albumName = mainMusicData.find(track => track.artwork === filename)?.Album;
            const searchInput = document.getElementById('search-input');

            if (albumName) {
                currentResults = mainMusicData.filter(track => track.Album === albumName);
                searchInput.value = `Album: "${albumName}"`; // Indicate album search
            } else {
                 console.warn(`No album found for artwork: ${filename}`);
                currentResults = [];
                searchInput.value = '';
            }
             currentPage = 1;
            sortAndDisplayResults(); // This calls displayResults
        }

		function sortAndDisplayResults() {
			const sortMethod = document.getElementById('sort-select').value;
			let sortedResults = [...currentResults]; // Work with a copy

			switch (sortMethod) {
				case 'alphabetical-asc':
					sortedResults.sort((a, b) => (a['Track Name'] || '').localeCompare(b['Track Name'] || ''));
					break;
				case 'alphabetical-desc':
					sortedResults.sort((a, b) => (b['Track Name'] || '').localeCompare(a['Track Name'] || ''));
					break;
				case 'isrc-asc': // Likely chronological by registration
					sortedResults.sort((a, b) => (a['ISRC'] || '').localeCompare(b['ISRC'] || ''));
					break;
				case 'isrc-desc': // Reverse chronological
					sortedResults.sort((a, b) => (b['ISRC'] || '').localeCompare(a['ISRC'] || ''));
					break;
				case 'random':
					sortedResults.sort(() => Math.random() - 0.5);
					break;
			}
            currentResults = sortedResults; // Update main list with sorted results
			displayResults(); // Display the current (first) page of sorted results
		}

		function displayResults() {
            console.log("Populating results..."); // Debug log
			const resultsContainer = document.getElementById('results');
			resultsContainer.innerHTML = ''; // Clear previous results

            const startIndex = (currentPage - 1) * resultsPerPage;
            const endIndex = startIndex + resultsPerPage;
            const paginatedResults = currentResults.slice(startIndex, endIndex);

            console.log(`Displaying page ${currentPage}, results ${startIndex + 1} to ${Math.min(endIndex, currentResults.length)} of ${currentResults.length}`);

            if (paginatedResults.length === 0) {
                 // Check if it was an empty search or no results found
                 const searchTerm = document.getElementById('search-input').value.trim();
                 if (searchTerm === "" && currentResults.length > 0) {
                     // This case shouldn't happen with the current logic, but good practice
                     resultsContainer.innerHTML = '<p style="text-align: center; margin-top: 20px;">Showing all tracks.</p>'; // Or just let it be empty
                 } else if (searchTerm !== "") {
                      resultsContainer.innerHTML = `<p style="text-align: center; margin-top: 20px;">No results found matching "${searchTerm}".</p>`;
                 } else {
                      resultsContainer.innerHTML = '<p style="text-align: center; margin-top: 20px;">No tracks available.</p>'; // If mainMusicData was initially empty
                 }
            }

			paginatedResults.forEach(track => {
                // Add checks for potentially missing data
                const trackName = track['Master Track Name'] || track['Track Name'] || 'Untitled Track';
                const artistName = track['Artist'] || 'Unknown Artist';
                const isrcCode = track['ISRC'] || 'N/A';
                const prsCode = track['PrsTunecodeFinal'] || 'N/A';
                const iswcCode = track['ISWC'] || 'N/A';
                const albumName = track['Album'] || 'Unknown Album';
                const artworkFile = track.artwork || 'default_artwork.png'; // Provide a default artwork if missing
                const wavFile = track['wav file name'] || `${trackName}.wav`; // Construct a default filename if missing
                const mp3File = wavFile.replace(/\.wav$/i, '.mp3');

				const wavPath = `https://audio.8vbmusic.com/${wavFile}`;
				const mp3Path = `https://audio.8vbmusic.com/MP3s/${mp3File}`;
				const artworkPath = `Artwork/${artworkFile}`;
				const audioBaseUrl = 'https://audio.8vbmusic.com'; // Use HTTPS

				const resultRow = document.createElement('div');
				resultRow.className = 'result-row';

				const artwork = document.createElement('img');
				artwork.src = encodeURI(artworkPath);
                artwork.alt = `${albumName} album artwork`;
				artwork.className = 'artwork';
				artwork.style.cursor = 'pointer';
				artwork.onclick = () => searchByAlbumCover(artworkPath);
                artwork.onerror = function() { // Handle missing artwork
                    this.onerror=null; // prevent infinite loop if default is also missing
                    this.src='images/default_artwork.png'; // Path to your default image
                    this.alt = 'Default album artwork';
                    artwork.style.cursor = 'default';
                    artwork.onclick = null;
                 };
				resultRow.appendChild(artwork);

				const trackInfo = document.createElement('div');
				trackInfo.className = 'track-info';

				const trackNameDiv = document.createElement('div');
				trackNameDiv.className = 'track-name';
				trackNameDiv.textContent = trackName;
				trackInfo.appendChild(trackNameDiv);

				const artistDiv = document.createElement('div');
				artistDiv.className = 'artist';
				artistDiv.innerHTML = `Composer/Artist: <strong>${artistName}</strong>`;
				trackInfo.appendChild(artistDiv);

				const isrcDiv = document.createElement('div');
				isrcDiv.className = 'isrc';
				isrcDiv.innerHTML = `ISRC: <strong>${isrcCode}</strong> / PRS Tunecode: <strong>${prsCode}</strong> / ISWC: <strong>${iswcCode}</strong>`;
				trackInfo.appendChild(isrcDiv);

				resultRow.appendChild(trackInfo);

				const audio = document.createElement('audio');
				audio.controls = true;
				audio.src = encodeURI(mp3Path);
				resultRow.appendChild(audio);

				const downloadButtons = document.createElement('div');
				downloadButtons.className = 'download-buttons';

				// MP3 Button
				const mp3Button = document.createElement('a');
				mp3Button.href = encodeURI(mp3Path);
				mp3Button.download = mp3File;
				mp3Button.innerHTML = '<img src="images/DownloadMP3.svg" alt="Download MP3" title="Download MP3">';
				mp3Button.className = 'download-button';
				downloadButtons.appendChild(mp3Button);

				// WAV Button
				const wavButton = document.createElement('a');
				wavButton.href = encodeURI(wavPath);
				wavButton.download = wavFile;
				wavButton.innerHTML = '<img src="images/DownloadWAV.svg" alt="Download WAV" title="Download WAV">';
				wavButton.className = 'download-button';
				downloadButtons.appendChild(wavButton);

				resultRow.appendChild(downloadButtons);

                // Show Versions Button
				const showVersionsButton = document.createElement('button');
				showVersionsButton.className = 'show-versions';
				showVersionsButton.textContent = 'All Song Version';
                // Only add button if ISRC exists and there *might* be other versions
				if (isrcCode !== 'N/A') {
				    showVersionsButton.dataset.isrc = isrcCode;
				    resultRow.appendChild(showVersionsButton);
                } else {
                     // Optionally add a disabled placeholder or nothing
                }


				resultsContainer.appendChild(resultRow);
                // console.log("Result row added:", resultRow); // Debug log

								audio.addEventListener('error', function() {
					console.error('Error loading audio:', this.src);
                    // Basic fallback: Try WAV if MP3 fails
					if (this.src.endsWith('.mp3')) {
                        const wavSrc = this.src.replace(/\.mp3$/i, '.wav');
                        console.log('Attempting to load WAV:', wavSrc);
						this.src = wavSrc;
                        // If the WAV also fails, the error handler will run again for the .wav source
					} else {
                        // WAV failed too, or initial load was WAV and failed
                        // --- CHANGE ACTION HERE ---
                        console.warn('Audio failed to load (MP3 & WAV):', this.src);
                        // Remove controls completely? Or just style it? Let's style it.
                        // this.controls = false; // Option 1: Hide controls entirely
                        this.classList.add('audio-error'); // Option 2: Add class for styling
                        // Remove the code that added the text span:
                        /*
                        const errorMsg = document.createElement('span');
                        errorMsg.textContent = 'Audio unavailable';
                        errorMsg.style.color = 'red';
                        errorMsg.style.fontSize = 'small';
                        this.parentNode.insertBefore(errorMsg, this.nextSibling);
                        */
                       // --- END CHANGE ---
                    }
				});

			});

            addResultRowListeners();
            renderPaginationControls();
		}

        function addResultRowListeners() {
             // Event listeners for "All Song Version" buttons
            document.querySelectorAll('.show-versions').forEach(button => {
                button.removeEventListener('click', showAllVersions); // Prevent duplicates
                button.addEventListener('click', showAllVersions);
            });

            // Ensure only one audio plays at a time
            const audioPlayers = document.querySelectorAll('#results audio');
            audioPlayers.forEach(player => {
                player.removeEventListener('play', handleAudioPlay); // Prevent duplicates
                player.addEventListener('play', handleAudioPlay);
            });
        }

        function handleAudioPlay() {
             const audioPlayers = document.querySelectorAll('audio'); // Target ALL audio players
             audioPlayers.forEach(p => {
                if (p !== this && !p.paused) {
                    p.pause();
                    // p.currentTime = 0; // Optional reset
                }
             });
        }

        // --- PAGINATION FUNCTION ---
        function renderPaginationControls() {
            const paginationContainer = document.getElementById('pagination-controls');
            paginationContainer.innerHTML = '';
            const totalResults = currentResults.length;
            const totalPages = Math.ceil(totalResults / resultsPerPage);

            if (totalPages <= 1) return;

            const createPageLink = (page, text = page, isActive = false, isDisabled = false) => {
                const link = document.createElement('a');
                link.textContent = text;
                link.className = 'page-link';
                if (isActive) link.classList.add('active');
                if (isDisabled) {
                     link.classList.add('disabled');
                     link.style.pointerEvents = 'none';
                } else {
                    link.href = '#';
                    link.onclick = (e) => {
                        e.preventDefault();
                        let newPage = currentPage;
                        if (page === 'prev') newPage--;
                        else if (page === 'next') newPage++;
                        else newPage = page;

                        if (newPage >= 1 && newPage <= totalPages) {
                             currentPage = newPage;
                             displayResults();
                             // Scroll to top of results (adjust offset as needed)
                             const resultsTop = document.getElementById('results').offsetTop;
                             const headerHeight = document.getElementById('top-bar')?.offsetHeight || 170; // Estimate header height
                             window.scrollTo({ top: resultsTop - headerHeight - 20, behavior: 'smooth' });
                        }
                    };
                }
                return link;
            };

            paginationContainer.appendChild(createPageLink('prev', 'Previous', false, currentPage === 1));

            // Ellipsis Logic (Simplified for clarity, you can use the complex one if preferred)
             const maxPagesToShow = 5;
             if (totalPages <= maxPagesToShow) {
                for (let i = 1; i <= totalPages; i++) {
                     paginationContainer.appendChild(createPageLink(i, i, i === currentPage));
                }
            } else {
                 // Always show first page
                 paginationContainer.appendChild(createPageLink(1, 1, 1 === currentPage));

                 let startEllipsis = false;
                 let endEllipsis = false;
                 let startPage = Math.max(2, currentPage - 1);
                 let endPage = Math.min(totalPages - 1, currentPage + 1);

                 if (currentPage > 3) startEllipsis = true;
                 if (currentPage < totalPages - 2) endEllipsis = true;

                 if (startEllipsis) {
                     const ellipsis = document.createElement('span');
                     ellipsis.textContent = '...';
                     ellipsis.className = 'page-ellipsis';
                     paginationContainer.appendChild(ellipsis);
                 }

                 for (let i = startPage; i <= endPage; i++) {
                      paginationContainer.appendChild(createPageLink(i, i, i === currentPage));
                 }

                  if (endEllipsis) {
                     const ellipsis = document.createElement('span');
                     ellipsis.textContent = '...';
                     ellipsis.className = 'page-ellipsis';
                     paginationContainer.appendChild(ellipsis);
                 }
                 // Always show last page
                 paginationContainer.appendChild(createPageLink(totalPages, totalPages, totalPages === currentPage));
            }
            // End Ellipsis Logic


            paginationContainer.appendChild(createPageLink('next', 'Next', false, currentPage === totalPages));
        }


		// --- MODAL showAllVersions ---
		function showAllVersions(event) {
            const button = event.target;
			const isrc = button.getAttribute('data-isrc');
            if (!isrc) {
                 console.error("No ISRC found on button:", button);
                 return;
            }
			console.log('Showing versions for ISRC:', isrc);

            // Filter *all versions* data
			const allTrackVersions = allVersionsData.filter(track => track['ISRC'] === isrc);
			console.log('Found versions in all_versions_data:', allTrackVersions.length);

			const modal = document.getElementById('versionsModal');
            // Ensure modal content div exists before trying to query inside it
			const modalContent = modal.querySelector('.modal-content');
            if (!modalContent) {
                console.error("Modal content container not found!");
                return;
            }


			if (allTrackVersions.length > 0) {
				// Get master details from the first found version (assuming consistency)
                const masterTrack = allTrackVersions[0];
                const artworkFile = masterTrack.artwork || 'default_artwork.png';
                const artworkPath = `Artwork/${artworkFile}`;
                const masterTrackName = masterTrack['Master Track Name'] || masterTrack['Track Name'] || 'Track Versions';
                const artistName = masterTrack['Artist'] || 'Unknown Artist';
                const prsCode = masterTrack['PrsTunecodeFinal'] || 'N/A';
                const iswcCode = masterTrack['ISWC'] || 'N/A';


				console.log('Modal Artwork path:', artworkPath);

				// Inject CORRECTED modal HTML structure
				modalContent.innerHTML = `
					<span class="close">×</span>
                    <div class="modal-header-info">
                        <h2>All versions of "${masterTrackName}"</h2>
                        <div class="artist">Composer/Artist: <strong>${artistName}</strong> / ISRC: <strong>${isrc}</strong> / PRS Tunecode: <strong>${prsCode}</strong> / ISWC: <strong>${iswcCode}</strong></div>
                    </div>
					<div class="modal-layout">
						<div class="album-cover">
							<img src="${encodeURI(artworkPath)}" alt="Album Cover for ${masterTrackName}">
						</div>
						<div class="modal-info">
							<div id="modalVersions"></div>
						</div>
					</div>
				`;

                const img = modalContent.querySelector('.album-cover img');
                if (img) {
                    img.onerror = function() {
                        console.error('Failed to load modal album cover:', artworkPath);
                        this.onerror=null;
                        this.src='images/default_artwork.png';
                        this.alt = 'Default album artwork';
                    };
                } else {
                     console.error("Modal album cover image element not found after innerHTML update.");
                }


				const modalVersionsContainer = modalContent.querySelector('#modalVersions');
                 if (!modalVersionsContainer) {
                     console.error("Modal versions container (#modalVersions) not found!");
                     return; // Stop if container is missing
                 }

				allTrackVersions.forEach(version => {
                    const versionTitle = version['Version'] || 'Version'; // Get specific version name
                    const wavFile = version['wav file name'] || `${masterTrackName} ${versionTitle}.wav`;
                    const mp3File = wavFile.replace(/\.wav$/i, '.mp3');
					const mp3Path = `https://audio.8vbmusic.com/MP3s/${mp3File}`;
					const wavPath = `https://audio.8vbmusic.com/${wavFile}`;

					const versionDiv = document.createElement('div');
					versionDiv.className = 'version-row';
					versionDiv.innerHTML = `
						<div class="track-name">${versionTitle}</div>
						<audio controls src="${encodeURI(mp3Path)}"></audio>
						<div class="download-buttons">
							<a href="${encodeURI(mp3Path)}" download="${mp3File}" class="download-button">
								<img src="images/DownloadMP3.svg" alt="Download MP3" title="Download MP3">
							</a>
							<a href="${encodeURI(wavPath)}" download="${wavFile}" class="download-button">
								<img src="images/DownloadWAV.svg" alt="Download WAV" title="Download WAV">
							</a>
						</div>
					`;
					modalVersionsContainer.appendChild(versionDiv);

                    const modalAudio = versionDiv.querySelector('audio');
                    if (modalAudio) {
                         modalAudio.addEventListener('error', function() {
                             console.error('Error loading modal audio:', this.src);
                             if (this.src.endsWith('.mp3')) {
                                 const wavSrc = this.src.replace(/\.mp3$/i, '.wav');
                                 console.log('Attempting to load modal WAV:', wavSrc);
                                 this.src = wavSrc;
                             } else {
                                 // WAV failed too or initial load was WAV
                                 console.warn('Modal audio failed to load (MP3 & WAV):', this.src);
                                 // --- CHANGE ACTION HERE ---
                                 this.classList.add('audio-error'); // Add class for styling
                                 // Remove the code that added the text span:
                                 /*
                                 this.controls = false;
                                 const errorMsg = document.createElement('span');
                                 errorMsg.textContent = ' (Audio unavailable)';
                                 errorMsg.style.color = 'red';
                                 errorMsg.style.fontSize = 'small';
                                 this.parentNode.insertBefore(errorMsg, this.nextSibling);
                                 */
                                // --- END CHANGE ---
                             }
                         });
                         modalAudio.addEventListener('play', handleAudioPlay);
                     }
				});

				modal.style.display = 'block';

				// Attach close listener AFTER content is built
				const closeButton = modal.querySelector('.close');
                if (closeButton) {
                     closeButton.onclick = function() {
                         const modalAudioPlayers = modal.querySelectorAll('audio');
                         modalAudioPlayers.forEach(p => p.pause());
                         modal.style.display = 'none';
                     };
                } else {
                     console.error("Modal close button not found!");
                }


			} else {
				console.warn('No versions found in all_versions_data for ISRC:', isrc);
                alert("No alternative versions found for this track.");
			}
		}


		// --- MODAL CLOSING LOGIC ---
		window.onclick = function(event) {
			const modal = document.getElementById('versionsModal');
			if (event.target == modal) {
                 const modalAudioPlayers = modal.querySelectorAll('audio');
                 modalAudioPlayers.forEach(p => p.pause());
				modal.style.display = 'none';
			}
		}


		         // --- INITIAL LOAD --- (IN Search.html)
		document.addEventListener('DOMContentLoaded', () => {
			const searchInput = document.getElementById('search-input');
            const sortSelect = document.getElementById('sort-select');

            if (searchInput) { searchInput.addEventListener('input', search); }
            if (sortSelect) { sortSelect.addEventListener('change', sortAndDisplayResults); }

            // Active link logic
            const links = document.querySelectorAll('#menu-panel ul li a');
            const currentPath = window.location.pathname.split('/').pop();
            const currentPageFile = currentPath === '' ? 'index.html' : currentPath;
            links.forEach(link => {
                link.classList.toggle('active', link.getAttribute('href') === currentPageFile);
            });

            // Check for album query parameter
            const urlParams = new URLSearchParams(window.location.search);
            const albumQuery = urlParams.get('album'); // Get 'album' value from ?album=...

            loadMusicData().then(() => {
                if (albumQuery) {
                    // If album parameter exists, filter by it
                    const decodedAlbumQuery = decodeURIComponent(albumQuery); // Decode spaces etc.
                    console.log(`Searching for album from URL: ${decodedAlbumQuery}`);
                    if(searchInput) {
                         searchInput.value = `Album: "${decodedAlbumQuery}"`; // Display in search box
                    }
                    currentResults = mainMusicData.filter(track => track.Album === decodedAlbumQuery);
                    currentPage = 1;
                    sortAndDisplayResults(); // Display filtered results directly
                } else {
                    // No album parameter, perform default load (show all)
                    console.log('Initial display (showing all results)...');
                    search(); // Call search with empty term to show all
                }
            });
		});

document.addEventListener('DOMContentLoaded', () => {
    // --- Hamburger Menu Toggle ---
    const hamburgerButton = document.getElementById('hamburger-icon');
    const mobileMenu = document.getElementById('mobile-menu');

    if (hamburgerButton && mobileMenu) {
        hamburgerButton.addEventListener('click', () => {
            const isOpen = mobileMenu.classList.toggle('open');
            hamburgerButton.classList.toggle('active'); // Toggle X animation
            hamburgerButton.setAttribute('aria-expanded', isOpen);
            mobileMenu.setAttribute('aria-hidden', !isOpen);
            // Optional: Prevent body scroll when menu is open
            document.body.classList.toggle('mobile-menu-active', isOpen);
        });

        // Optional: Close menu when a link is clicked
        mobileMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                mobileMenu.classList.remove('open');
                hamburgerButton.classList.remove('active');
                hamburgerButton.setAttribute('aria-expanded', 'false');
                mobileMenu.setAttribute('aria-hidden', 'true');
                document.body.classList.remove('mobile-menu-active');
            });
        });

         // Optional: Close menu when clicking outside of it
         document.addEventListener('click', (event) => {
             // Check if menu is open and click was outside menu and outside hamburger
             if (mobileMenu.classList.contains('open') &&
                 !mobileMenu.contains(event.target) &&
                 !hamburgerButton.contains(event.target)) {

                 mobileMenu.classList.remove('open');
                 hamburgerButton.classList.remove('active');
                 hamburgerButton.setAttribute('aria-expanded', 'false');
                 mobileMenu.setAttribute('aria-hidden', 'true');
                 document.body.classList.remove('mobile-menu-active');
             }
         });


    } else {
        console.warn("Hamburger button or mobile menu element not found.");
    }

    // --- Keep your existing Initial Load Logic ---
    // (Active link logic, loadMusicData, search calls etc.)
     // Ensure event listeners target the correct elements now inside #search-controls
     const searchInput = document.getElementById('search-input');
     const sortSelect = document.getElementById('sort-select');

     if (searchInput) { searchInput.addEventListener('input', search); }
     if (sortSelect) { sortSelect.addEventListener('change', sortAndDisplayResults); }


     // Active link logic (applies to #menu-panel AND potentially #mobile-menu if needed)
     const desktopLinks = document.querySelectorAll('#menu-panel ul li a');
     const mobileLinks = document.querySelectorAll('#mobile-menu ul li a');
     const currentPath = window.location.pathname.split('/').pop();
     const currentPageFile = currentPath === '' ? 'index.html' : currentPath;

     const setActive = (links) => {
          links.forEach(link => {
              link.classList.toggle('active', link.getAttribute('href') === currentPageFile);
          });
     }
     setActive(desktopLinks);
     setActive(mobileLinks); // Apply active state to mobile menu too


     // Load data and perform initial display (Search.html)
     if (document.getElementById('results')) { // Only run data load/search on search page
         const urlParams = new URLSearchParams(window.location.search);
         const albumQuery = urlParams.get('album');

         loadMusicData().then(() => {
             if (albumQuery) {
                 const decodedAlbumQuery = decodeURIComponent(albumQuery);
                 console.log(`Searching for album from URL: ${decodedAlbumQuery}`);
                 if(searchInput) { searchInput.value = `Album: "${decodedAlbumQuery}"`; }
                 currentResults = mainMusicData.filter(track => track.Album === decodedAlbumQuery);
                 currentPage = 1;
                 sortAndDisplayResults();
             } else {
                 console.log('Initial display (showing all results)...');
                 search();
             }
         });
     }
     // Load data for Homepage (index.html)
     else if (document.getElementById('album-row-1')) {
         loadFeaturedAlbums(); // Make sure this function exists if called here
     }

}); // End DOMContentLoaded