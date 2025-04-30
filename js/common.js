// --- js/common.js (Finalized with dynamic relative paths for fetches and base path handling) ---

let translations = {};
let currentLang = 'en'; // Default language

// Function to determine the current language based on URL path segments
function getCurrentLanguageFromPath() {
    const pathSegments = window.location.pathname.split('/').filter(segment => segment !== '');
    const recognizedLanguages = ['en', 'fr', 'de', 'es', 'it'];

    // Check segment *after* potential base path
    let langCodeIndex = -1;
    // Check if the first segment is NOT a language code (potential base path)
    if (pathSegments.length > 0 && !recognizedLanguages.includes(pathSegments[0].toLowerCase())) {
        // If there's a second segment and it IS a language code
        if (pathSegments.length > 1 && pathSegments[1].length === 2 && recognizedLanguages.includes(pathSegments[1].toLowerCase())) {
            langCodeIndex = 1; // Language code is the second segment (e.g., /base/fr/)
        }
    }
    // Check if the first segment IS a language code (no base path)
    else if (pathSegments.length > 0 && pathSegments[0].length === 2 && recognizedLanguages.includes(pathSegments[0].toLowerCase())) {
        langCodeIndex = 0; // Language code is the first segment (e.g., /fr/)
    }

    // If a language code was found in the expected position
    if (langCodeIndex !== -1) {
        const lang = pathSegments[langCodeIndex].toLowerCase();
        console.log("Common.js: Language determined from path:", lang);
        return lang;
    }

    // Fallback to 'en' if no language code found in expected position or path is empty/root
    console.log("Common.js: No language segment found in expected position, assuming 'en'.");
    return 'en';
}

// Set initial language
currentLang = getCurrentLanguageFromPath();
console.log("Common.js: Initial language set to:", currentLang);

let isTranslationsLoaded = false;

// Promise to handle asynchronous loading of translation data
const translationsLoaded = new Promise((resolve, reject) => {
    // Determine the correct relative path to translations.json based on current language directory
    const langPrefix = (currentLang !== 'en' && window.location.pathname.includes(`/${currentLang}/`)) ? `../` : '';
    // Construct the full path, assuming js folder is relative to the language root (or main root for en)
    const translationsPath = `${langPrefix}js/translations.json`;

    console.log("Common.js: Attempting to fetch translations from:", translationsPath);

    fetch(translationsPath)
        .then(response => {
            if (!response.ok) {
                // Warn if fetch fails but resolve the promise so other scripts don't hang
                console.warn(`Common.js: HTTP error! status: ${response.status} for ${translationsPath}. Translations may not load.`);
                isTranslationsLoaded = false;
                resolve();
                return null; // Return null to skip .then(data => ...)
            }
            return response.json(); // Parse JSON data if fetch is successful
        })
        .then(data => {
            if (data) {
                translations = data; // Store loaded translations
                isTranslationsLoaded = true;
                console.log('Common.js: Translations loaded successfully.');
            } else {
                console.log('Common.js: Fetch returned null or failed, translations not loaded.');
            }
            resolve(); // Resolve the promise after processing data (or skipping)
        })
        .catch(error => {
            // Log error and resolve the promise even on catch
            console.error('Common.js: Error loading translations (catch block):', error);
            isTranslationsLoaded = false;
            resolve();
        });
});

// Function to apply translations to static text elements on the page
function applyStaticTranslations() {
    if (!isTranslationsLoaded) {
        console.warn("Common.js: Translations not loaded, skipping static translation application.");
        return; // Don't proceed if translations aren't available
    }

    // Apply translations to elements with data-translate attribute
    document.querySelectorAll('[data-translate]').forEach(element => {
        const key = element.getAttribute('data-translate');
        // Use current language translation if available, otherwise fallback to English
        if (translations[key]?.[currentLang]) {
            element.innerHTML = translations[key][currentLang]; // Use innerHTML to support HTML tags
        } else if (translations[key]?.['en']) {
            element.innerHTML = translations[key]['en']; // Fallback to English
        }
    });

    // Apply translations to placeholder attributes
    document.querySelectorAll('[data-translate-placeholder]').forEach(element => {
        const key = element.getAttribute('data-translate-placeholder');
        // Use current language translation if available, otherwise fallback to English
        if (translations[key]?.[currentLang]) {
            element.placeholder = translations[key][currentLang];
        } else if (translations[key]?.['en']) {
            element.placeholder = translations[key]['en']; // Fallback
        }
    });

    // Update the html tag's lang attribute for accessibility and SEO
    document.documentElement.lang = currentLang;

    console.log(`Common.js: Static text translations applied for language: ${currentLang}`);
}

// Function to switch the language and redirect the user
function setLanguage(lang) {

    console.log("Current URL:", window.location.href);
console.log("Current pathname:", window.location.pathname);
console.log("Current page:", window.location.pathname.split('/').pop());

    const recognizedLanguages = ['en', 'fr', 'de', 'es', 'it'];
    if (!recognizedLanguages.includes(lang)) {
        console.error(`Common.js: Attempted to switch to an unrecognized language: ${lang}`);
        return; // Ignore unrecognized languages
    }

    if (lang === currentLang) {
        console.log(`Common.js: Already in language: ${lang}`);
        return; // Do nothing if already in the target language
    }

    // Get the current URL path
    const currentPath = window.location.pathname;
    console.log(`Common.js: Current path: ${currentPath}`);
    
    // Extract the current page filename
    const pathParts = currentPath.split('/');
    let currentPage = pathParts[pathParts.length - 1];
    
    // If empty (directory path), default to index.html
    if (!currentPage || currentPage === '') {
        currentPage = 'index.html';
    }
    
    console.log(`Common.js: Current page: ${currentPage}`);
    
    // Construct the new URL based on language
    let newPath;
    
    if (lang === 'en') {
        // For English, use the root directory
        newPath = `/${currentPage}`;
    } else {
        // For other languages, use language subdirectory
        newPath = `/${lang}/${currentPage}`;
    }
    
    // Handle base path if site is in a subdirectory
    const basePath = window.location.pathname.match(/^\/[^\/]+\//);
    if (basePath) {
        // Site is in a subdirectory (e.g., /8vbMusic/)
        newPath = basePath[0] + newPath.substring(1);
    }
    
    console.log(`Common.js: Redirecting to: ${newPath}`);
    
    // Redirect to the new URL
    window.location.href = window.location.origin + newPath;
}


// --- DOMContentLoaded Event Listener ---
// Executes when the initial HTML document has been completely loaded and parsed
document.addEventListener('DOMContentLoaded', () => {
    console.log("Common.js: DOMContentLoaded event fired.");

    // --- Hamburger menu toggle ---
    const hamburger = document.getElementById('hamburger-icon');
    const mobileMenu = document.getElementById('mobile-menu');

    if (hamburger && mobileMenu) {
        hamburger.addEventListener('click', () => {
            const isOpen = hamburger.classList.contains('active');
            hamburger.classList.toggle('active'); // Toggle hamburger animation class
            hamburger.setAttribute('aria-expanded', String(!isOpen)); // Update ARIA attribute
            mobileMenu.classList.toggle('open'); // Toggle mobile menu visibility class
            mobileMenu.setAttribute('aria-hidden', String(isOpen)); // Update ARIA attribute
            document.body.classList.toggle('mobile-menu-active', !isOpen); // Optional: class on body to prevent scrolling
        });

        // Add click listeners to mobile menu links (excluding language switchers) to close the menu
        mobileMenu.querySelectorAll('a').forEach(link => {
            // Only add listener if it's not a language switcher link
            if (!link.closest('.mobile-lang-item')) {
                link.addEventListener('click', () => {
                    // Close the menu when a regular link is clicked
                    hamburger.classList.remove('active');
                    hamburger.setAttribute('aria-expanded', 'false');
                    mobileMenu.classList.remove('open');
                    mobileMenu.setAttribute('aria-hidden', 'true');
                    document.body.classList.remove('mobile-menu-active');
                });
            }
        });
    } else {
        // console.warn("Common.js: Hamburger or mobile menu not found. Hamburger menu logic skipped.");
    }


    // --- Language Selector Dropdown Logic (Desktop Menu) ---
    const languageMenuItem = document.querySelector('.language-menu-item');
    const currentLanguageSpan = languageMenuItem?.querySelector('.current-language'); // Optional chaining
    const languageDropdown = languageMenuItem?.querySelector('.language-dropdown');

    if (languageMenuItem && currentLanguageSpan && languageDropdown) {
        // Toggle dropdown visibility on click
        currentLanguageSpan.addEventListener('click', (event) => {
            event.preventDefault(); // Prevent default link behavior
            event.stopPropagation(); // Prevent click from bubbling up to document listener immediately
            const isOpen = languageMenuItem.classList.contains('open');
            languageMenuItem.classList.toggle('open'); // Toggle dropdown visibility class
            currentLanguageSpan.setAttribute('aria-expanded', String(!isOpen)); // Update ARIA attribute
        });

        // Close dropdown if clicked outside
        document.addEventListener('click', (event) => {
            if (languageMenuItem.classList.contains('open') && !languageMenuItem.contains(event.target)) {
                languageMenuItem.classList.remove('open');
                currentLanguageSpan.setAttribute('aria-expanded', 'false');
            }
        });
    } else {
        // console.warn("Common.js: Desktop language dropdown elements not found.");
    }


    // --- Language Link Click Handling (Common for Desktop Dropdown, Mobile Menu, Top Bar) ---
    // Select all links intended for language switching
    const langLinks = document.querySelectorAll('.language-dropdown a, #mobile-menu .mobile-lang-item a, #language-selector a.lang-link');
    if (langLinks.length > 0) {
        langLinks.forEach(link => {
            link.addEventListener('click', (event) => {
                event.preventDefault(); // Prevent default link behavior
                const targetLang = link.getAttribute('data-lang'); // Get target language from data attribute
                if (targetLang) {
                    setLanguage(targetLang); // Call the function to switch language
                } else {
                    console.warn("Common.js: Language link missing data-lang attribute:", link);
                }
            });
        });
    } else {
        // console.warn("Common.js: No language links found with data-lang attribute.");
    }


    // --- Post-Translation Load Actions ---
    // Wait for the translations to be loaded before applying them and updating UI elements
    translationsLoaded.then(() => {
        console.log("Common.js: Translations Promise resolved within DOMContentLoaded.");
        applyStaticTranslations(); // Apply translations to static text

        // --- Update Language Display Elements ---
        // Ensure the correct language is shown as active/selected after translations are applied

        const localTranslations = window.getTranslations(); // Use the function to get potentially updated translations
        const localCurrentLang = window.getCurrentLanguage(); // Use function to get current language

        // Update Desktop Dropdown Display
        if (languageMenuItem && currentLanguageSpan && languageDropdown) {
            const currentLangLinkInDropdown = languageDropdown.querySelector(`a[data-lang="${localCurrentLang}"]`);
            if (currentLangLinkInDropdown) {
                // Set the text/HTML of the main span to match the active language's link content
                currentLanguageSpan.innerHTML = currentLangLinkInDropdown.innerHTML;
                currentLangLinkInDropdown.classList.add('active'); // Mark active in dropdown
            }
            // Ensure other links in dropdown are not marked as active
            languageDropdown.querySelectorAll('a').forEach(link => {
                if (link.getAttribute('data-lang') !== localCurrentLang) {
                    link.classList.remove('active');
                }
            });
        }

        // Update Mobile Menu & Top Bar Links Display
        const mobileLangLinks = document.querySelectorAll('#mobile-menu .mobile-lang-item a');
        const topLangLinks = document.querySelectorAll('#language-selector a.lang-link'); // If using top bar links

        [...mobileLangLinks, ...topLangLinks].forEach(link => {
            link.classList.remove('active'); // Remove active class from all first
            const linkLang = link.getAttribute('data-lang');
            if (linkLang === localCurrentLang) {
                link.classList.add('active'); // Add active class to the current language link
            }
            // Ensure text content is updated by data-translate if it wasn't already
            const key = link.getAttribute('data-translate');
            if (key && localTranslations[key]?.[localCurrentLang]) {
                // Find the span inside the link if it exists (for flags + text)
                const textSpan = link.querySelector('span');
                if (textSpan) {
                     textSpan.textContent = localTranslations[key][localCurrentLang];
                } else {
                     link.textContent = localTranslations[key][localCurrentLang]; // Update link text directly if no span
                }
            }
        });


    }).catch(error => {
        console.error("Common.js: Error during post-translation load setup:", error);
    });

    // --- Active Link Highlighting (for main navigation) ---
    const desktopLinks = document.querySelectorAll('#menu-panel nav ul li a');
    const mobileLinks = document.querySelectorAll('#mobile-menu nav ul li a');

    const currentPathname = window.location.pathname;
    const pathSegments = currentPathname.split('/').filter(segment => segment !== '');
    const recognizedLanguages = ['en', 'fr', 'de', 'es', 'it'];

    let basePathLength = 0;
    let potentialLangCode = '';

    // Determine base path length and potential language code
    if (pathSegments.length > 0 && !recognizedLanguages.includes(pathSegments[0].toLowerCase())) {
        basePathLength = 1; // Assume first segment is base path (e.g., '8vbtest')
        if (pathSegments.length > 1 && pathSegments[1].length === 2 && recognizedLanguages.includes(pathSegments[1].toLowerCase())) {
            potentialLangCode = pathSegments[1].toLowerCase(); // Language code is second segment
        }
    } else if (pathSegments.length > 0 && pathSegments[0].length === 2 && recognizedLanguages.includes(pathSegments[0].toLowerCase())) {
        potentialLangCode = pathSegments[0].toLowerCase(); // Language code is first segment
    }

    // Determine the current page file relative to the language root or base root
    let currentPageFile = pathSegments.slice(basePathLength + (potentialLangCode ? 1 : 0)).join('/');
    if (currentPageFile === '' || currentPageFile === 'index.html') {
        currentPageFile = 'index.html'; // Normalize root/index
    }

    // Function to set the 'active' class on navigation links
    const setActive = (links) => {
        links.forEach(link => {
            // Ignore language switcher links within the main nav structure
            if (link.closest('.language-menu-item') || link.closest('.mobile-lang-item')) {
                 link.classList.remove('active');
                 return;
            }

            const linkHref = link.getAttribute('href');
            let linkTargetFile = '';

            try {
                // Resolve the link's absolute path based on the current page's URL
                const fullLinkUrl = new URL(linkHref, window.location.href).pathname;
                const linkPathSegments = fullLinkUrl.split('/').filter(segment => segment !== '');

                let linkBasePathLength = 0;
                let linkPotentialLangCode = '';

                // Determine base path and language for the link's target URL
                if (linkPathSegments.length > 0 && !recognizedLanguages.includes(linkPathSegments[0].toLowerCase())) {
                    linkBasePathLength = 1;
                    if (linkPathSegments.length > 1 && linkPathSegments[1].length === 2 && recognizedLanguages.includes(linkPathSegments[1].toLowerCase())) {
                        linkPotentialLangCode = linkPathSegments[1].toLowerCase();
                    }
                } else if (linkPathSegments.length > 0 && linkPathSegments[0].length === 2 && recognizedLanguages.includes(linkPathSegments[0].toLowerCase())) {
                    linkPotentialLangCode = linkPathSegments[0].toLowerCase();
                }

                // Extract the target file path relative to its language/base root
                linkTargetFile = linkPathSegments.slice(linkBasePathLength + (linkPotentialLangCode ? 1 : 0)).join('/');
                if (linkTargetFile === '' || linkTargetFile === 'index.html') {
                    linkTargetFile = 'index.html'; // Normalize
                }

            } catch (e) {
                console.error("Common.js: Invalid link href for active check:", linkHref, e);
                link.classList.remove('active');
                return; // Skip this link if URL is invalid
            }

            // Check if the normalized target file matches the current page file
            const isActive = (linkTargetFile === currentPageFile);
            link.classList.toggle('active', isActive); // Add/remove 'active' class
            // Debugging log (optional)
            // console.log(`Link Href: ${linkHref}, Normalized Link File: ${linkTargetFile}, Current File: ${currentPageFile}, Is Active: ${isActive}`);
        });
    };

    // Apply active class highlighting to both desktop and mobile links
    setActive(desktopLinks);
    setActive(mobileLinks);

}); // End DOMContentLoaded listener

// --- Expose functions and promises to the global scope (window object) ---
window.translationsLoaded = translationsLoaded; // Promise indicating when translations are ready
window.getCurrentLanguage = function() { return currentLang; }; // Function to get the current language
window.getTranslations = function() { return translations; }; // Function to get the loaded translations object
window.setLanguage = setLanguage; // Function to switch language

// Debounce function (utility)
window.debounce = function(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};
