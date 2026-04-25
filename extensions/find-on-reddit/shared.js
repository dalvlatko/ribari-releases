(function(global) {
    function listingChildren(data) {
        if (!data || !data.data || !Array.isArray(data.data.children)) return [];
        return data.data.children.map(function(child) { return child && child.data; }).filter(Boolean);
    }

    function duplicateChildren(data) {
        if (!Array.isArray(data) || data.length < 2) return [];
        return listingChildren(data[1]);
    }

    function processUrl(url, exactMatch) {
        try {
            var parsed = new URL(url);
            if (!exactMatch) {
                parsed.search = '';
                parsed.hash = '';
            }
            return parsed.href;
        } catch (e) {
            return url;
        }
    }

    function isYoutubeUrl(url) {
        try {
            var host = new URL(url).hostname;
            return host === 'www.youtube.com'
                || host === 'youtube.com'
                || host === 'm.youtube.com'
                || host === 'youtu.be';
        } catch (e) {
            return false;
        }
    }

    function getYoutubeVideoId(url) {
        try {
            var parsed = new URL(url);
            if (parsed.hostname === 'youtu.be') {
                return parsed.pathname.slice(1) || null;
            }
            var watchID = parsed.searchParams.get('v');
            if (watchID) return watchID;
            var match = parsed.pathname.match(/^\/(?:embed|shorts)\/([a-zA-Z0-9_-]{11})/);
            return match ? match[1] : null;
        } catch (e) {
            return null;
        }
    }

    function buildSearchPlan(rawUrl, exactMatch) {
        var processedUrl = processUrl(rawUrl, exactMatch);
        var query = processedUrl;
        if (isYoutubeUrl(rawUrl)) {
            var videoId = getYoutubeVideoId(rawUrl);
            if (videoId) query = videoId;
        }
        return {
            processedUrl: processedUrl,
            query: query,
            cacheKey: processedUrl + '|' + query
        };
    }

    function deduplicatePosts(posts) {
        var seen = new Map();
        for (var i = 0; i < posts.length; i++) {
            var post = posts[i];
            if (!post || !post.id) continue;
            var existing = seen.get(post.id);
            if (!existing || (post.score || 0) > (existing.score || 0)) {
                seen.set(post.id, post);
            }
        }
        return Array.from(seen.values());
    }

    function mergeResults(searchResults, infoResults, duplicateGroups) {
        var allPosts = []
            .concat(searchResults || [])
            .concat(infoResults || []);

        if (Array.isArray(duplicateGroups)) {
            for (var i = 0; i < duplicateGroups.length; i++) {
                allPosts = allPosts.concat(duplicateGroups[i] || []);
            }
        }

        return deduplicatePosts(allPosts);
    }

    async function fetchSearch(query, fetchJSON) {
        var url = 'https://www.reddit.com/search.json?q=url:' + encodeURIComponent(query)
            + '&sort=relevance&limit=100';
        return listingChildren(await fetchJSON(url));
    }

    async function fetchInfo(pageUrl, fetchJSON) {
        var url = 'https://www.reddit.com/api/info.json?url=' + encodeURIComponent(pageUrl);
        return listingChildren(await fetchJSON(url));
    }

    async function fetchDuplicates(postId, fetchJSON) {
        var url = 'https://www.reddit.com/r/all/' + encodeURIComponent(postId) + '/duplicates.json?limit=100';
        return duplicateChildren(await fetchJSON(url));
    }

    async function searchReddit(rawUrl, options) {
        options = options || {};
        var fetchJSON = options.fetchJSON;
        if (typeof fetchJSON !== 'function') {
            throw new Error('searchReddit requires fetchJSON');
        }

        var plan = buildSearchPlan(rawUrl, !!options.exactMatch);
        var cache = options.cache || null;
        var cacheTTL = typeof options.cacheTTL === 'number' ? options.cacheTTL : 0;

        if (cache) {
            var cached = cache.get(plan.cacheKey);
            if (cached && (Date.now() - cached.time) < cacheTTL) {
                return cached.results;
            }
        }

        var searchResults = await fetchSearch(plan.query, fetchJSON).catch(function() { return []; });
        var infoResults = await fetchInfo(plan.processedUrl, fetchJSON).catch(function() { return []; });

        var topPosts = deduplicatePosts(searchResults.concat(infoResults))
            .sort(function(a, b) { return (b.score || 0) - (a.score || 0); })
            .slice(0, 3);

        var duplicateGroups = [];
        if (topPosts.length > 0) {
            duplicateGroups = await Promise.all(topPosts.map(function(post) {
                return fetchDuplicates(post.id, fetchJSON).catch(function() { return []; });
            }));
        }

        var results = mergeResults(searchResults, infoResults, duplicateGroups);
        if (cache) {
            cache.set(plan.cacheKey, { results: results, time: Date.now() });
        }
        return results;
    }

    async function countDiscussions(rawUrl, options) {
        var results = await searchReddit(rawUrl, options);
        return Array.isArray(results) ? results.length : 0;
    }

    global.FindOnRedditShared = {
        processUrl: processUrl,
        isYoutubeUrl: isYoutubeUrl,
        getYoutubeVideoId: getYoutubeVideoId,
        buildSearchPlan: buildSearchPlan,
        deduplicatePosts: deduplicatePosts,
        mergeResults: mergeResults,
        searchReddit: searchReddit,
        countDiscussions: countDiscussions
    };
})(typeof globalThis !== 'undefined' ? globalThis : this);
