// Find on Reddit extension for Ribari.
// Inspired by the open source find-on-reddit extension created by Adeel Hasan.
// Searches Reddit's public API for discussions about the current page URL.

const STORAGE_KEYS = {
    sortOrder: 'sortOrder',
    oldReddit: 'oldReddit',
    exactMatch: 'exactMatch',
    autoSearch: 'autoSearch',
    showBadge: 'showBadge',
};

// In-memory cache with 30-minute TTL.
const cache = new Map();
const CACHE_TTL = 30 * 60 * 1000;

// DOM elements.
const urlField = document.getElementById('urlField');
const searchBtn = document.getElementById('searchBtn');
const sortSelect = document.getElementById('sortSelect');
const oldRedditToggle = document.getElementById('oldReddit');
const exactMatchToggle = document.getElementById('exactMatch');
const autoSearchToggle = document.getElementById('autoSearch');
const showBadgeToggle = document.getElementById('showBadge');
const statusMessage = document.getElementById('statusMessage');
const resultsContainer = document.getElementById('results');
const redditSearch = globalThis.FindOnRedditShared;

let currentUrl = '';
let isSearching = false;

// --- Settings persistence ---

async function loadSettings() {
    try {
        const sort = await ribari.storage.get(STORAGE_KEYS.sortOrder);
        if (sort) sortSelect.value = sort;

        const oldReddit = await ribari.storage.get(STORAGE_KEYS.oldReddit);
        oldRedditToggle.checked = (oldReddit === 'true');

        const exact = await ribari.storage.get(STORAGE_KEYS.exactMatch);
        exactMatchToggle.checked = (exact === 'true');

        const autoSearch = await ribari.storage.get(STORAGE_KEYS.autoSearch);
        autoSearchToggle.checked = (autoSearch === 'true');

        const showBadge = await ribari.storage.get(STORAGE_KEYS.showBadge);
        // Default is checked (badge shown). Only false if explicitly 'false'.
        showBadgeToggle.checked = (showBadge !== 'false');
    } catch (e) {
        // Use defaults on failure.
    }
}

sortSelect.addEventListener('change', async () => {
    await ribari.storage.set(STORAGE_KEYS.sortOrder, sortSelect.value).catch(() => {});
    resortResults();
});

oldRedditToggle.addEventListener('change', async () => {
    await ribari.storage.set(STORAGE_KEYS.oldReddit, String(oldRedditToggle.checked)).catch(() => {});
});

exactMatchToggle.addEventListener('change', async () => {
    await ribari.storage.set(STORAGE_KEYS.exactMatch, String(exactMatchToggle.checked)).catch(() => {});
    if (urlField.value.trim()) {
        performSearch();
    }
});

autoSearchToggle.addEventListener('change', async () => {
    await ribari.storage.set(STORAGE_KEYS.autoSearch, String(autoSearchToggle.checked)).catch(() => {});
});

showBadgeToggle.addEventListener('change', async () => {
    await ribari.storage.set(STORAGE_KEYS.showBadge, String(showBadgeToggle.checked)).catch(() => {});
});

// --- Content script message handler ---

ribari.onContentMessage((msg) => {
    if (msg && msg.type === 'pageUrl' && msg.url) {
        currentUrl = msg.url;
        urlField.value = msg.url;
        if (autoSearchToggle.checked) {
            performSearch();
        }
    }
});

// --- Reddit API ---

async function fetchJSON(url) {
    const resp = await fetch(url, {
        headers: { 'Accept': 'application/json' }
    });
    if (!resp.ok) return null;
    return resp.json();
}

async function searchReddit(rawUrl) {
    return redditSearch.searchReddit(rawUrl, {
        exactMatch: exactMatchToggle.checked,
        fetchJSON,
        cache,
        cacheTTL: CACHE_TTL
    });
}

// --- Results rendering ---

let lastResults = [];

function sortResults(posts) {
    const sort = sortSelect.value;
    return [...posts].sort((a, b) => {
        if (sort === 'comments') return (b.num_comments || 0) - (a.num_comments || 0);
        if (sort === 'new') return (b.created_utc || 0) - (a.created_utc || 0);
        return (b.score || 0) - (a.score || 0);
    });
}

function resortResults() {
    if (lastResults.length > 0) {
        renderResults(lastResults);
    }
}

function formatAge(utc) {
    const seconds = Math.floor(Date.now() / 1000 - utc);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return Math.floor(seconds / 60) + 'm ago';
    if (seconds < 86400) return Math.floor(seconds / 3600) + 'h ago';
    if (seconds < 2592000) return Math.floor(seconds / 86400) + 'd ago';
    if (seconds < 31536000) return Math.floor(seconds / 2592000) + 'mo ago';
    return Math.floor(seconds / 31536000) + 'y ago';
}

function formatScore(score) {
    if (score >= 100000) return Math.floor(score / 1000) + 'k';
    if (score >= 10000) return (score / 1000).toFixed(1) + 'k';
    if (score >= 1000) return (score / 1000).toFixed(1) + 'k';
    return String(score);
}

function makeRedditUrl(permalink) {
    const base = oldRedditToggle.checked ? 'https://old.reddit.com' : 'https://www.reddit.com';
    return base + permalink;
}

function renderResults(posts) {
    lastResults = posts;
    const sorted = sortResults(posts);
    resultsContainer.innerHTML = '';

    if (sorted.length === 0) {
        resultsContainer.innerHTML = '<div class="empty-state">No Reddit discussions found</div>';
        return;
    }

    statusMessage.textContent = sorted.length + ' discussion' + (sorted.length !== 1 ? 's' : '') + ' found';
    statusMessage.className = 'status-message';

    for (const post of sorted) {
        const row = document.createElement('div');
        row.className = 'result-row';

        const scoreEl = document.createElement('div');
        scoreEl.className = 'result-score';
        scoreEl.textContent = formatScore(post.score || 0);

        const contentEl = document.createElement('div');
        contentEl.className = 'result-content';

        const titleEl = document.createElement('a');
        titleEl.className = 'result-title';
        titleEl.textContent = post.title || '(untitled)';
        titleEl.href = '#';
        titleEl.addEventListener('click', (e) => {
            e.preventDefault();
            ribari.openURL(makeRedditUrl(post.permalink));
        });

        const metaEl = document.createElement('div');
        metaEl.className = 'result-meta';

        const subreddit = document.createElement('span');
        subreddit.className = 'subreddit-badge';
        subreddit.textContent = 'r/' + (post.subreddit || '?');

        const comments = document.createElement('a');
        comments.className = 'comments-link';
        comments.textContent = (post.num_comments || 0) + ' comments';
        comments.href = '#';
        comments.addEventListener('click', (e) => {
            e.preventDefault();
            ribari.openURL(makeRedditUrl(post.permalink));
        });

        const age = document.createElement('span');
        age.className = 'result-age';
        age.textContent = formatAge(post.created_utc || 0);

        metaEl.appendChild(subreddit);
        metaEl.appendChild(comments);
        metaEl.appendChild(age);

        contentEl.appendChild(titleEl);
        contentEl.appendChild(metaEl);

        row.appendChild(scoreEl);
        row.appendChild(contentEl);
        resultsContainer.appendChild(row);
    }
}

// --- Search action ---

async function performSearch() {
    const url = urlField.value.trim();
    if (!url) {
        statusMessage.textContent = 'Enter a URL to search';
        statusMessage.className = 'status-message error';
        return;
    }

    if (isSearching) return;
    isSearching = true;

    searchBtn.disabled = true;
    searchBtn.textContent = 'Searching...';
    statusMessage.textContent = 'Searching Reddit...';
    statusMessage.className = 'status-message';
    resultsContainer.innerHTML = '<div class="loading">Searching...</div>';

    try {
        const results = await searchReddit(url);
        renderResults(results);
    } catch (e) {
        statusMessage.textContent = 'Search failed: ' + e.message;
        statusMessage.className = 'status-message error';
        resultsContainer.innerHTML = '<div class="empty-state">Search failed. Reddit may be rate-limiting requests.</div>';
    } finally {
        isSearching = false;
        searchBtn.disabled = false;
        searchBtn.textContent = 'Search Reddit';
    }
}

searchBtn.addEventListener('click', performSearch);

// Allow Enter in URL field to trigger search.
urlField.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        performSearch();
    }
});

// --- Credits links ---

document.getElementById('originalLink').addEventListener('click', (e) => {
    e.preventDefault();
    ribari.openURL('https://github.com/AdeelH/find-on-reddit');
});

document.getElementById('authorLink').addEventListener('click', (e) => {
    e.preventDefault();
    ribari.openURL('https://github.com/AdeelH');
});

// --- Init ---

loadSettings();

// Auto-search the URL of the previously-focused web tile when opened.
ribari.on('contextURL', function(data) {
    if (data && data.url) {
        currentUrl = data.url;
        urlField.value = data.url;
        performSearch();
    }
});
