document.addEventListener('DOMContentLoaded', () => {
    // Element References
    const usernameInput = document.getElementById('username');
    const saveUsernameBtn = document.getElementById('saveUsernameBtn');
    const userRatingDisplay = document.getElementById('userRatingDisplay');
    const problemDiv = document.getElementById('problem');
    const newProblemBtn = document.getElementById('newProblemBtn');
    const bookmarkBtn = document.getElementById('bookmarkBtn');
    const bookmarksDiv = document.getElementById('bookmarks');
    const durationFilter = document.getElementById('durationFilter');
    const refreshContestsBtn = document.getElementById('refreshContestsBtn');
    const contestsDiv = document.getElementById('contests');
    const streakDiv = document.getElementById('streak');
    const darkModeToggle = document.getElementById('darkModeToggle');

    // Initialize Functions
    loadUsername();
    loadDarkMode();
    fetchContests();
    renderBookmarks();
    updateStreak();

    // Event Listeners
    saveUsernameBtn.addEventListener('click', saveUsername);
    newProblemBtn.addEventListener('click', handleNewProblem);
    bookmarkBtn.addEventListener('click', bookmarkProblem);
    durationFilter.addEventListener('change', fetchContests);
    refreshContestsBtn.addEventListener('click', fetchContests);
    darkModeToggle.addEventListener('click', toggleDarkMode);

    // Load Stored Username and Rating
    function loadUsername() {
        chrome.storage.sync.get(['codeforcesUsername', 'userRating'], (data) => {
            if (data.codeforcesUsername) {
                usernameInput.value = data.codeforcesUsername;
                if (data.userRating) {
                    userRatingDisplay.textContent = `Current Rating: ${data.userRating}`;
                } else {
                    fetchUserRating(data.codeforcesUsername);
                }
            }
        });
    }

    // Save Username and Fetch Rating
    function saveUsername() {
        const username = usernameInput.value.trim();
        if (username) {
            chrome.storage.sync.set({ codeforcesUsername: username, userRating: null }, () => {
                userRatingDisplay.textContent = 'Fetching rating...';
                fetchUserRating(username);
            });
        } else {
            alert('Please enter a valid Codeforces username.');
        }
    }

    // Fetch User Rating from Codeforces API
    function fetchUserRating(username) {
        fetch(`https://codeforces.com/api/user.info?handles=${username}`)
            .then(response => response.json())
            .then(data => {
                if (data.status === 'OK') {
                    const user = data.result[0];
                    if (user.rating) {
                        chrome.storage.sync.set({ userRating: user.rating }, () => {
                            userRatingDisplay.textContent = `Current Rating: ${user.rating}`;
                        });
                    } else {
                        userRatingDisplay.textContent = 'User has no rating.';
                        chrome.storage.sync.set({ userRating: null });
                    }
                } else {
                    userRatingDisplay.textContent = 'Error fetching rating.';
                    chrome.storage.sync.set({ userRating: null });
                }
            })
            .catch(error => {
                console.error('Error fetching user rating:', error);
                userRatingDisplay.textContent = 'Error fetching rating.';
                chrome.storage.sync.set({ userRating: null });
            });
    }

    // Handle Fetching New Problem
    function handleNewProblem() {
        chrome.storage.sync.get(['userRating'], (data) => {
            if (data.userRating) {
                fetchRandomProblem(data.userRating);
            } else {
                alert('Please enter and save a valid username to fetch your rating.');
            }
        });
    }

    // Fetch Random Problem Based on User Rating
    function fetchRandomProblem(userRating) {
        problemDiv.innerHTML = 'Fetching problem...';
        fetch('https://codeforces.com/api/problemset.problems')
            .then(response => response.json())
            .then(data => {
                if (data.status === 'OK') {
                    const problems = data.result.problems;
                    const filteredProblems = problems.filter(problem => {
                        return problem.rating && Math.abs(problem.rating - userRating) <= 100;
                    });
                    if (filteredProblems.length > 0) {
                        const randomProblem = filteredProblems[Math.floor(Math.random() * filteredProblems.length)];
                        const problemUrl = `https://codeforces.com/problemset/problem/${randomProblem.contestId}/${randomProblem.index}`;
                        problemDiv.innerHTML = `
                            <a href="${problemUrl}" target="_blank">
                                ${randomProblem.name} (Rating: ${randomProblem.rating})
                            </a>
                        `;
                        updateStreak();
                    } else {
                        problemDiv.textContent = 'No problems found within your rating range.';
                    }
                } else {
                    problemDiv.textContent = 'Error fetching problems.';
                }
            })
            .catch(error => {
                console.error('Error fetching problems:', error);
                problemDiv.textContent = 'Error fetching problems.';
            });
    }

    // Bookmark Current Problem
    function bookmarkProblem() {
        const problemLink = problemDiv.querySelector('a');
        if (problemLink) {
            const bookmark = {
                name: problemLink.textContent,
                url: problemLink.href
            };
            chrome.storage.sync.get({ bookmarks: [] }, (data) => {
                const bookmarks = data.bookmarks;
                const isDuplicate = bookmarks.some(b => b.url === bookmark.url);
                if (!isDuplicate) {
                    bookmarks.push(bookmark);
                    chrome.storage.sync.set({ bookmarks }, () => {
                        renderBookmarks();
                        alert('Problem bookmarked successfully!');
                    });
                } else {
                    alert('This problem is already bookmarked.');
                }
            });
        } else {
            alert('No problem to bookmark. Please fetch a problem first.');
        }
    }
    function renderBookmarks() {
        chrome.storage.sync.get({ bookmarks: [] }, (data) => {
            const bookmarks = data.bookmarks;
            bookmarksDiv.innerHTML = ''; // Clear existing bookmarks
            
            if (bookmarks.length === 0) {
                bookmarksDiv.innerHTML = 'No bookmarks added yet.';
            } else {
                bookmarks.forEach((bookmark, index) => {
                    const bookmarkItem = document.createElement('div');
                    bookmarkItem.classList.add('bookmark-item');
    
                    const link = document.createElement('a');
                    link.href = bookmark.url;
                    link.target = '_blank';
                    link.textContent = bookmark.name;
                    link.classList.add('bookmark-link');
    
                    const deleteBtn = document.createElement('button');
                    deleteBtn.classList.add('delete-bookmark-btn');
                    deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
                    deleteBtn.title = 'Delete Bookmark';
                    deleteBtn.addEventListener('click', () => deleteBookmark(index));
    
                    bookmarkItem.appendChild(link);
                    bookmarkItem.appendChild(deleteBtn);
                    bookmarksDiv.appendChild(bookmarkItem);
                });
            }
        });
    }
    

    // Delete Bookmark by Index
    function deleteBookmark(index) {
        chrome.storage.sync.get({ bookmarks: [] }, (data) => {
            const bookmarks = data.bookmarks;
            bookmarks.splice(index, 1);
            chrome.storage.sync.set({ bookmarks }, renderBookmarks);
        });
    }

    // Fetch Upcoming Contests
    function fetchContests() {
        contestsDiv.innerHTML = 'Loading upcoming contests...';
        fetch('https://codeforces.com/api/contest.list')
            .then(response => response.json())
            .then(data => {
                if (data.status === 'OK') {
                    const contests = data.result.filter(contest => contest.phase === 'BEFORE');
                    const filter = durationFilter.value;
                    const filteredContests = contests.filter(contest => {
                        const durationHours = contest.durationSeconds / 3600;
                        if (filter === 'short') return durationHours <= 2;
                        if (filter === 'medium') return durationHours > 2 && durationHours <= 5;
                        if (filter === 'long') return durationHours > 5;
                        return true;
                    });
                    if (filteredContests.length > 0) {
                        contestsDiv.innerHTML = '';
                        filteredContests.slice(0, 5).forEach(contest => {
                            const contestItem = document.createElement('div');
                            contestItem.classList.add('contest-item');

                            const link = document.createElement('a');
                            link.href = `https://codeforces.com/contests/${contest.id}`;
                            link.target = '_blank';
                            link.textContent = contest.name;
                            link.classList.add('contest-link');

                            const startTime = new Date(contest.startTimeSeconds * 1000);
                            const formattedTime = startTime.toLocaleString();

                            const date = document.createElement('span');
                            date.textContent = `Starts at: ${formattedTime}`;
                            date.classList.add('contest-date');

                            contestItem.appendChild(link);
                            contestItem.appendChild(date);
                            contestsDiv.appendChild(contestItem);
                        });
                    } else {
                        contestsDiv.innerHTML = 'No upcoming contests found for the selected filter.';
                    }
                } else {
                    contestsDiv.innerHTML = 'Error fetching contests.';
                }
            })
            .catch(error => {
                console.error('Error fetching contests:', error);
                contestsDiv.innerHTML = 'Error fetching contests.';
            });
    }

    // Update User Streak
    function updateStreak() {
        const today = new Date().toDateString();
        chrome.storage.sync.get(['lastSolvedDate', 'streak'], (data) => {
            let { lastSolvedDate, streak } = data;
            if (lastSolvedDate === today) {
                renderStreak(streak || 1);
            } else {
                const yesterday = new Date(Date.now() - 86400000).toDateString();
                if (lastSolvedDate === yesterday) {
                    streak = (streak || 0) + 1;
                } else {
                    streak = 1;
                }
                chrome.storage.sync.set({ lastSolvedDate: today, streak }, () => {
                    renderStreak(streak);
                });
            }
        });
    }

    // Render Streak Information
    function renderStreak(streak) {
        streakDiv.textContent = `🔥 Current Streak: ${streak} day(s)`;
    }

    // Toggle Dark Mode
    function toggleDarkMode() {
        document.body.classList.toggle('dark-mode');
        const isDarkMode = document.body.classList.contains('dark-mode');
        chrome.storage.sync.set({ darkMode: isDarkMode });
        chrome.runtime.sendMessage({ darkMode: isDarkMode });
    }
    

    // Load Dark Mode Preference
    function loadDarkMode() {
        chrome.storage.sync.get('darkMode', (data) => {
            if (data.darkMode) {
                document.body.classList.add('dark-mode');
            }
        });
    }
});
