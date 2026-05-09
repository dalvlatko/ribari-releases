// Find on Reddit content script for Ribari.
// Sends the current page URL to the extension tile so it can search Reddit for discussions.
// Also sets an address bar badge with the count of Reddit discussions found.

(function() {
    if (window !== window.top) return;
    if (window.__ribariFindOnRedditInstalled) return;
    window.__ribariFindOnRedditInstalled = true;

    var lastSentUrl = null;
    var badgeCache = new Map();
    var badgeRequestToken = 0;
    var BADGE_CACHE_TTL = 5 * 60 * 1000;

    function isSupportedPage(url) {
        return /^https?:/.test(url);
    }

    function readBoolSetting(key, defaultValue) {
        return ribariPlugin.storage.get(key).then(function(value) {
            if (value === null || typeof value === 'undefined' || value === '') {
                return defaultValue;
            }
            return value === 'true' || value === '1';
        }).catch(function() {
            return defaultValue;
        });
    }

    function notifyTile(url) {
        if (url === lastSentUrl) return;
        lastSentUrl = url;
        ribariPlugin.sendMessage({ type: 'pageUrl', url: url }).catch(function() {});
    }

    async function updateBadgeForCurrentPage() {
        var url = location.href;
        var requestToken = ++badgeRequestToken;

        if (!isSupportedPage(url)) {
            ribariPlugin.setBadge(null);
            return;
        }

        var showBadge = await readBoolSetting('showBadge', true);
        if (requestToken !== badgeRequestToken) return;
        if (!showBadge) {
            ribariPlugin.setBadge(null);
            return;
        }

        var exactMatch = await readBoolSetting('exactMatch', false);
        if (requestToken !== badgeRequestToken) return;

        try {
            var count = await FindOnRedditShared.countDiscussions(url, {
                exactMatch: exactMatch,
                fetchJSON: function(apiURL) {
                    return ribariPlugin.fetchJSON(apiURL);
                },
                cache: badgeCache,
                cacheTTL: BADGE_CACHE_TTL
            });
            if (requestToken !== badgeRequestToken) return;
            ribariPlugin.setBadge(count > 0 ? { text: String(count), icon: "icon.png", textColor: "#FF4500", tooltip: count + " Reddit discussion" + (count === 1 ? "" : "s") + " found \u2014 click to view" } : null);
        } catch (e) {
            if (requestToken !== badgeRequestToken) return;
            ribariPlugin.setBadge(null);
        }
    }

    function checkAndBadge(force) {
        var url = location.href;
        if (!isSupportedPage(url)) {
            lastSentUrl = url;
            badgeRequestToken += 1;
            ribariPlugin.setBadge(null);
            return;
        }
        if (force || url !== lastSentUrl) {
            notifyTile(url);
        }
        updateBadgeForCurrentPage();
    }

    // Check on initial load.
    checkAndBadge();

    ribariPlugin.onStorageChanged(function(change) {
        if (!change || !change.key) return;
        if (change.key === 'showBadge' || change.key === 'exactMatch') {
            checkAndBadge(true);
        }
    });

    // SPA navigation: popstate + hashchange.
    window.addEventListener('popstate', function() {
        setTimeout(checkAndBadge, 100);
    });

    window.addEventListener('hashchange', function() {
        setTimeout(checkAndBadge, 100);
    });

    // YouTube-specific SPA navigation.
    window.addEventListener('yt-navigate-finish', function() {
        setTimeout(checkAndBadge, 100);
    });

    // SPA navigation via pushState/replaceState (x.com, GitHub, React apps, etc.)
    var origPushState = history.pushState;
    history.pushState = function() {
        origPushState.apply(this, arguments);
        setTimeout(checkAndBadge, 0);
    };
    var origReplaceState = history.replaceState;
    history.replaceState = function() {
        origReplaceState.apply(this, arguments);
        setTimeout(checkAndBadge, 0);
    };
})();
