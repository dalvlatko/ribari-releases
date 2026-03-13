// SponsorBlock example extension content script for Ribari.
// Inspired by the open source SponsorBlock project created by Ajay Ramachandran and contributors.
// This file shows how page-level Chrome extension logic can be ported into a Ribari content script.

(function() {
    if (window.__ribariSponsorBlockInstalled) return;
    window.__ribariSponsorBlockInstalled = true;

    // Segment colors match SponsorBlock categories.
    var CATEGORY_COLORS = {
        sponsor: '#00d400',
        intro: '#00ffff',
        outro: '#0202ed',
        interaction: '#cc00ff',
        selfpromo: '#ffff00',
        music_offtopic: '#ff9900',
        preview: '#008fd6',
        filler: '#7300FF'
    };

    var enabled = true;
    var autoSkip = true;
    var showNotifications = true;
    var categoryList = ['sponsor'];
    var currentVideoID = null;
    var segments = [];
    var skippedSegments = new Set();
    var checkTimer = null;
    var barRetryTimer = null;

    // Settings are shared with the tile UI through extension storage.
    async function loadSettings() {
        try {
            var enabledVal = await ribariPlugin.storage.get('enabled');
            if (enabledVal !== null) enabled = (enabledVal === 'true' || enabledVal === '1');

            var autoSkipVal = await ribariPlugin.storage.get('autoSkip');
            if (autoSkipVal !== null) autoSkip = (autoSkipVal === 'true' || autoSkipVal === '1');

            var notifVal = await ribariPlugin.storage.get('notifications');
            if (notifVal !== null) showNotifications = (notifVal === 'true' || notifVal === '1');

            var catsVal = await ribariPlugin.storage.get('categories');
            if (catsVal !== null && catsVal !== '') {
                categoryList = catsVal.split(',').map(function(s) { return s.trim(); }).filter(Boolean);
            }
        } catch (e) {
            // Settings load failed, use defaults
        }
    }

    // Support standard YouTube video URLs, Shorts, and embeds.
    function extractVideoID() {
        var url = location.href;
        var match;

        // /watch?v=ID
        match = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
        if (match) return match[1];

        // /shorts/ID
        match = location.pathname.match(/^\/shorts\/([a-zA-Z0-9_-]{11})/);
        if (match) return match[1];

        // /embed/ID
        match = location.pathname.match(/^\/embed\/([a-zA-Z0-9_-]{11})/);
        if (match) return match[1];

        return null;
    }

    // Remove previously rendered timeline markers before drawing fresh ones.
    function removeSegmentBars() {
        var existing = document.querySelectorAll('.ribari-sb-bar');
        for (var i = 0; i < existing.length; i++) {
            existing[i].remove();
        }
        if (barRetryTimer) {
            clearTimeout(barRetryTimer);
            barRetryTimer = null;
        }
    }

    // YouTube swaps player internals often, so we probe a few possible progress-bar containers.
    function progressBarElements() {
        var outer = document.querySelector('.ytp-progress-bar-container');
        if (outer) {
            var track = outer.querySelector('.ytp-progress-list')
                || outer.querySelector('.ytp-chapters-container')
                || outer.querySelector('.ytp-chapter-container')
                || outer.querySelector('.ytp-progress-bar')
                || outer;
            return { container: outer, track: track };
        }

        var fallback = document.querySelector('.ytp-progress-list')
            || document.querySelector('.ytp-chapters-container')
            || document.querySelector('.ytp-chapter-container')
            || document.querySelector('.ytp-progress-bar');
        if (!fallback) return null;
        return { container: fallback, track: fallback };
    }

    function renderSegmentBars(video) {
        removeSegmentBars();
        if (!video || !isFinite(video.duration) || video.duration <= 0 || segments.length === 0) return;

        var attempts = 0;
        function tryRender() {
            var elements = progressBarElements();
            var progressBar = elements && elements.container;
            var progressTrack = elements && elements.track;
            if (!progressBar || !progressTrack || progressTrack.clientWidth <= 0) {
                attempts++;
                if (attempts < 10) {
                    barRetryTimer = setTimeout(tryRender, 500);
                }
                return;
            }

            var container = document.createElement('div');
            container.className = 'ribari-sb-bar';
            container.style.cssText = 'position:absolute;width:100%;left:0;top:0;'
                + 'height:100%;pointer-events:none;z-index:80;overflow:hidden;';

            var duration = video.duration;
            for (var i = 0; i < segments.length; i++) {
                var seg = segments[i];
                var color = CATEGORY_COLORS[seg.category] || '#00d400';
                var bar = document.createElement('div');
                var left = (seg.start / duration) * 100;
                var width = ((seg.end - seg.start) / duration) * 100;
                bar.style.cssText = 'position:absolute;height:100%;top:0;border-radius:2px;opacity:0.85;'
                    + 'min-width:2px;'
                    + 'left:' + left + '%;'
                    + 'width:' + width + '%;'
                    + 'background-color:' + color + ';';
                container.appendChild(bar);
            }

            progressTrack.style.position = 'relative';
            progressTrack.appendChild(container);
        }
        tryRender();
    }

    // SponsorBlock's API is CORS-enabled, so the content script can fetch directly.
    function fetchSegments(videoID) {
        segments = [];
        skippedSegments.clear();
        removeSegmentBars();

        var catsJSON = JSON.stringify(categoryList);
        var url = 'https://sponsor.ajay.app/api/skipSegments?videoID='
            + encodeURIComponent(videoID) + '&categories=' + encodeURIComponent(catsJSON);

        fetch(url)
            .then(function(resp) {
                if (!resp.ok) return null;
                return resp.json();
            })
            .then(function(data) {
                if (videoID !== currentVideoID) return;
                if (!Array.isArray(data)) return;
                applySegments(videoID, data);
            })
            .catch(function() {
                // Network error — silently fail
            });
    }

    function applySegments(videoID, data) {
        if (videoID !== currentVideoID) return;

        var video = document.querySelector('video');
        var duration = video ? video.duration : Infinity;

        segments = data.filter(function(seg) {
            if (!seg || !Array.isArray(seg.segment) || seg.segment.length < 2) return false;
            var start = Number(seg.segment[0]);
            var end = Number(seg.segment[1]);
            if (!isFinite(start) || !isFinite(end)) return false;
            if (start < 0 || end <= start) return false;
            if (isFinite(duration) && end > duration * 1.1) return false;
            return true;
        }).map(function(seg) {
            return {
                start: Number(seg.segment[0]),
                end: Number(seg.segment[1]),
                category: seg.category || 'sponsor',
                UUID: seg.UUID || ('' + Math.random())
            };
        });

        if (video) renderSegmentBars(video);
    }

    // Auto-skip only once per segment UUID to avoid repeated jumps during playback.
    function checkAndSkip(video) {
        if (!video || video.paused || segments.length === 0) return;
        if (!autoSkip) return;
        var t = video.currentTime;

        for (var i = 0; i < segments.length; i++) {
            var seg = segments[i];
            if (t >= seg.start && t < seg.end && !skippedSegments.has(seg.UUID)) {
                skippedSegments.add(seg.UUID);
                video.currentTime = seg.end;
                var dur = Math.round(seg.end - seg.start);
                if (showNotifications) {
                    ribariPlugin.showToast('Skipped ' + dur + 's ' + seg.category);
                }
                return;
            }
        }
    }

    // Bind once per <video> element because YouTube may recreate the player during navigation.
    function bindVideo(video) {
        if (!video || video.__ribariSBBound) return;
        video.__ribariSBBound = true;

        video.addEventListener('timeupdate', function() {
            checkAndSkip(video);
        });

        video.addEventListener('seeking', function() {
            if (video.currentTime < 1) {
                skippedSegments.clear();
            }
        });

        video.addEventListener('loadedmetadata', function() {
            if (segments.length > 0) {
                renderSegmentBars(video);
            }
        });

        if (segments.length > 0) {
            renderSegmentBars(video);
        }
    }

    // Re-scan the page for player elements after DOM updates.
    function scanForVideos() {
        var videos = document.querySelectorAll('video');
        for (var i = 0; i < videos.length; i++) {
            bindVideo(videos[i]);
        }
    }

    // Treat client-side navigation the same as a fresh page load.
    function onNavigate() {
        if (!enabled) return;
        var videoID = extractVideoID();
        if (!videoID || videoID === currentVideoID) return;
        currentVideoID = videoID;
        segments = [];
        skippedSegments.clear();
        removeSegmentBars();
        fetchSegments(videoID);
    }

    // YouTube's own SPA event is the primary navigation signal.
    window.addEventListener('yt-navigate-finish', onNavigate);

    // Fallback for direct URL changes outside YouTube's custom event flow.
    window.addEventListener('popstate', function() {
        setTimeout(onNavigate, 100);
    });

    // Watch for player replacement and lazily inserted video elements.
    var observer = new MutationObserver(function() {
        scanForVideos();
    });
    var root = document.documentElement || document;
    if (root) {
        observer.observe(root, { childList: true, subtree: true });
    }

    // Backup polling keeps auto-skip responsive even if a site event is missed.
    checkTimer = setInterval(function() {
        var video = document.querySelector('video');
        if (video) checkAndSkip(video);
    }, 250);

    // Initialize after loading persisted settings.
    loadSettings().then(function() {
        if (!enabled) return;
        scanForVideos();
        onNavigate();
    });
})();
