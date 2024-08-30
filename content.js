// contentScript.js

// Function to inject the dark mode CSS
function injectDarkModeStyles() {
    const linkElement = document.createElement('link');
    linkElement.rel = 'stylesheet';
    linkElement.type = 'text/css';
    linkElement.href = chrome.runtime.getURL('darkMode.css');
    document.head.appendChild(linkElement);
}

// Function to remove the dark mode CSS
function removeDarkModeStyles() {
    const linkElements = document.querySelectorAll('link[href*="darkMode.css"]');
    linkElements.forEach(link => link.remove());
}

// Apply dark mode styles based on storage setting
chrome.storage.sync.get('darkMode', (data) => {
    if (data.darkMode) {
        injectDarkModeStyles();
    }
});

// Listen for dark mode toggle changes
chrome.storage.onChanged.addListener((changes) => {
    if (changes.darkMode) {
        if (changes.darkMode.newValue) {
            injectDarkModeStyles();
        } else {
            removeDarkModeStyles();
        }
    }
});
