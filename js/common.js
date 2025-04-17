// js/common.js - Logic for ALL pages

// Debounce function to limit resize event handling
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

document.addEventListener('DOMContentLoaded', () => {
    console.log("Common.js loaded"); // Debugging

    // --- Active Link Highlighting ---
    const desktopLinks = document.querySelectorAll('#menu-panel ul li a');
    const mobileLinks = document.querySelectorAll('#mobile-menu ul li a');
    // Get the filename part of the URL (e.g., "search.html" or "index.html")
    const currentPath = window.location.pathname.split('/').pop();
    // If path is empty (e.g., website.com/), treat it as index.html
    const currentPageFile = currentPath === '' ? 'index.html' : currentPath;

    console.log("Current page file determined by common.js:", currentPageFile); // Debugging

    const setActive = (links) => {
         links.forEach(link => {
             const linkHref = link.getAttribute('href').split('/').pop();
             // Add 'active' class if the link's href matches the current page file, remove otherwise
             link.classList.toggle('active', linkHref === currentPageFile);
             // console.log(`Link: ${linkHref}, Active: ${link.classList.contains('active')}`); // More debugging
         });
    };

    setActive(desktopLinks);
    setActive(mobileLinks); // Apply active state to mobile menu too


    // --- Hamburger Menu Toggle ---
    const hamburgerButton = document.getElementById('hamburger-icon');
    const mobileMenu = document.getElementById('mobile-menu');

    if (hamburgerButton && mobileMenu) {
        hamburgerButton.addEventListener('click', () => {
             const isOpen = mobileMenu.classList.toggle('open');
             hamburgerButton.classList.toggle('active'); // Toggle X animation
             hamburgerButton.setAttribute('aria-expanded', isOpen);
             mobileMenu.setAttribute('aria-hidden', !isOpen);
             document.body.classList.toggle('mobile-menu-active', isOpen); // Optional: Prevent body scroll
        });

        // Optional: Close menu when a link inside it is clicked
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
        // This might appear on pages without the hamburger, which is fine.
        // console.warn("Hamburger button or mobile menu element not found on this page.");
    }

}); // End DOMContentLoaded for common.js