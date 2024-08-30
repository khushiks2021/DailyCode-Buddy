chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.sync.set({ darkMode: false });
});

chrome.action.onClicked.addListener((tab) => {
    chrome.storage.sync.get('darkMode', (data) => {
        const newDarkModeState = !data.darkMode;
        chrome.storage.sync.set({ darkMode: newDarkModeState });

        // Send message to content script
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: (isDarkMode) => {
                if (isDarkMode) {
                    document.body.style.backgroundColor = "#121212";
                    document.body.style.color = "#e0e0e0";
                } else {
                    document.body.style.backgroundColor = "";
                    document.body.style.color = "";
                }
            },
            args: [newDarkModeState]
        });
    });
});
chrome.runtime.onMessage.addListener((message) => {
    if (message.darkMode !== undefined) {
        chrome.storage.sync.set({ darkMode: message.darkMode });
    }
});

  