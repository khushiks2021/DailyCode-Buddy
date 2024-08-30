document.getElementById('save-settings').addEventListener('click', function() {
    const username = document.getElementById('username').value;
    chrome.storage.sync.set({ codeforcesHandle: username }, function() {
        document.getElementById('status').textContent = 'Settings saved!';
    });
});
