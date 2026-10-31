let rawLikesArray = [];
let filteredLikes = [];
let currentPage = 1;
const itemsPerPage = 50; 
let currentRenderId = 0;

const cacheKey = "twitter_likes_cache";
const rawDataKey = "private_user_likes_data";
const engineKey = "preferred_api_engine";
const settingsKey = "downloader_settings";

let currentEngine = localStorage.getItem(engineKey) || "auto";

// Default Downloader Settings
let downloaderSettings = {
    videoQuality: "max",
    filenamePattern: "{username}_{postid}_{index}"
};

try {
    const savedSettings = localStorage.getItem(settingsKey);
    if (savedSettings) {
        downloaderSettings = { ...downloaderSettings, ...JSON.parse(savedSettings) };
    }
} catch (e) {
    console.log("Using default downloader settings.");
}

let apiCache = new Map();
try {
    const localData = localStorage.getItem(cacheKey);
    if (localData) {
        apiCache = new Map(JSON.parse(localData));
    }
} catch (e) {
    console.log("Could not load media cache.");
}

// SNOWFLAKE DECODER
function getTweetTimestamp(tweetId) {
    try {
        const idBig = BigInt(tweetId);
        return Number((idBig >> 22n) + 1288834974657n);
    } catch (e) {
        return 0;
    }
}

function formatTweetDate(tweetId) {
    const timestampMs = getTweetTimestamp(tweetId);
    if (!timestampMs) return "Unknown Date";
    const date = new Date(timestampMs);
    return date.toLocaleString();
}

function isSuspendedPost(item) {
    const tweetId = item.like.tweetId;
    const textLower = (item.like.fullText || "").toLowerCase();
    
    if (textLower.includes("this post is from a suspended account") || 
        textLower.includes("suspended account") ||
        textLower.includes("this post is unavailable")) {
        return true;
    }
    
    if (apiCache.has(tweetId)) {
        const cached = apiCache.get(tweetId);
        if (cached === "suspended" || cached === 404) return true;
    }
    
    return false;
}

function isProtectedPost(item) {
    const tweetId = item.like.tweetId;
    const textLower = (item.like.fullText || "").toLowerCase();
    
    const exactPhrase1 = "you’re unable to view this post because this account owner limits who can view their posts";
    const exactPhrase2 = "you're unable to view this post because this account owner limits who can view their posts";
    
    if (textLower.includes(exactPhrase1) || textLower.includes(exactPhrase2)) {
        return true;
    }
    
    if (apiCache.has(tweetId)) {
        const cached = apiCache.get(tweetId);
        if (cached === "protected" || cached === 401) return true;
    }
    
    return false;
}

// Device Auto-Loader
window.addEventListener('DOMContentLoaded', () => {
    syncEngineDropdowns(currentEngine);
    setupPatternInputDragDrop();

    try {
        const savedRawData = localStorage.getItem(rawDataKey);
        if (savedRawData) {
            rawLikesArray = JSON.parse(savedRawData);
            handleSearchAndFilter();
            showWorkspaceUI();
        }
    } catch(e) {
        console.log("No saved archive found on this device.");
    }

    setupDragAndDrop();
});

function handleEngineChange(selectedEngine) {
    currentEngine = selectedEngine;
    localStorage.setItem(engineKey, currentEngine);
    syncEngineDropdowns(currentEngine);
}

function syncEngineDropdowns(engineValue) {
    document.querySelectorAll('.api-engine-select').forEach(selectEl => {
        selectEl.value = engineValue;
    });
}

function saveCacheToLocalStorage() {
    try {
        const arrayData = Array.from(apiCache.entries());
        localStorage.setItem(cacheKey, JSON.stringify(arrayData));
    } catch (e) {
        console.log("Local storage full. Cache running in temporary memory.");
    }
}

function setupDragAndDrop() {
    const dropZone = document.getElementById('dropZone');
    dropZone.addEventListener('click', () => document.getElementById('fileInput').click());
    window.addEventListener('dragover', (e) => e.preventDefault(), false);
    window.addEventListener('drop', (e) => e.preventDefault(), false);
    dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
    dropZone.addEventListener('dragleave', () => { dropZone.classList.remove('dragover'); });
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) handleFile(e.dataTransfer.files);
    });
}

function handleFile(files) {
    if (!files.length) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        processRawText(e.target.result.trim());
    };
    reader.readAsText(files[0]);
}

function processRawText(rawText) {
    try {
        const jsonString = rawText.replace(/^window\.YTD\.like\.part0\s*=\s*/, '');
        rawLikesArray = JSON.parse(jsonString);
        
        try {
            localStorage.setItem(rawDataKey, JSON.stringify(rawLikesArray));
        } catch(e) {
            console.log("Storage quota limit reached for local file saving.");
        }

        currentPage = 1;
        showWorkspaceUI();
        handleSearchAndFilter();
    } catch (error) {
        alert("Error reading file. Make sure it's a valid 'like.js' file.");
        console.error(error);
    }
}

function showWorkspaceUI() {
    document.getElementById('dropZone').style.display = 'none';
    document.getElementById('workspace').style.display = 'block';
    document.getElementById('navLeftContainer').style.display = 'flex';
    document.getElementById('navRightContainer').style.display = 'flex';
}

function clearLoadedArchive() {
    if (confirm("Clear your saved archive and all cached tweet data from this browser? You will need to drop your like.js file again next time.")) {
        localStorage.removeItem(rawDataKey);
        localStorage.removeItem(cacheKey);
        location.reload();
    }
}

// MUTUALLY EXCLUSIVE FILTER HANDLER
function handleMutexFilter(changedCheckbox, oppositeCheckboxId) {
    if (changedCheckbox.checked) {
        const opposite = document.getElementById(oppositeCheckboxId);
        if (opposite) opposite.checked = false;
    }
    handleSearchAndFilter();
}

// DOWNLOADER SETTINGS MODAL & TAG INTERACTION LOGIC
function openDownloaderSettings() {
    document.getElementById('settingVideoQuality').value = downloaderSettings.videoQuality;
    document.getElementById('settingFilenamePattern').value = downloaderSettings.filenamePattern;
    document.getElementById('settingsModal').style.display = 'flex';
}

function closeDownloaderSettings() {
    document.getElementById('settingsModal').style.display = 'none';
}

function saveDownloaderSettings() {
    downloaderSettings.videoQuality = document.getElementById('settingVideoQuality').value;
    downloaderSettings.filenamePattern = document.getElementById('settingFilenamePattern').value.trim() || "{username}_{postid}_{index}";
    
    localStorage.setItem(settingsKey, JSON.stringify(downloaderSettings));
    closeDownloaderSettings();
}

function insertFilenameTag(tag) {
    const input = document.getElementById('settingFilenamePattern');
    if (!input) return;

    const start = input.selectionStart || input.value.length;
    const end = input.selectionEnd || input.value.length;
    const currentVal = input.value;

    input.value = currentVal.substring(0, start) + tag + currentVal.substring(end);
    input.focus();
    const newPos = start + tag.length;
    input.setSelectionRange(newPos, newPos);
}

function handleTagDragStart(event, tag) {
    event.dataTransfer.setData("text/plain", tag);
}

function setupPatternInputDragDrop() {
    const input = document.getElementById('settingFilenamePattern');
    if (!input) return;

    input.addEventListener('dragover', (e) => e.preventDefault());
    input.addEventListener('drop', (e) => {
        e.preventDefault();
        const tag = e.dataTransfer.getData("text/plain");
        if (tag) insertFilenameTag(tag);
    });
}

// MEDIA HIGH QUALITY TRANSFORMERS & FILENAME GENERATOR
function getHighestQualityImageUrl(rawUrl) {
    if (!rawUrl) return rawUrl;
    try {
        const urlObj = new URL(rawUrl);
        urlObj.searchParams.set("name", "orig");
        return urlObj.toString();
    } catch (e) {
        return rawUrl.includes("?") ? `${rawUrl}&name=orig` : `${rawUrl}?name=orig`;
    }
}

function getImageExtension(url) {
    try {
        const pathname = new URL(url).pathname;
        const ext = pathname.split('.').pop().toLowerCase();
        if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)) {
            return ext === 'jpeg' ? 'jpg' : ext;
        }
    } catch (e) {}
    return 'jpg';
}

function generateFilename(tweetId, author, mediaIndex, ext) {
    let pattern = downloaderSettings.filenamePattern || "{username}_{postid}_{index}";
    const timestampMs = getTweetTimestamp(tweetId);
    const dateFormatted = timestampMs ? new Date(timestampMs).toISOString().split('T')[0] : 'unknown';

    const username = author?.screen_name || 'unknown';
    const twitterName = author?.name || 'User';
    const userId = author?.id || 'unknown';

    let cleanName = pattern
        .replace(/{username}/g, username)
        .replace(/{twittername}/g, twitterName)
        .replace(/{userid}/g, userId)
        .replace(/{postid}/g, tweetId)
        .replace(/{tweetId}/g, tweetId)
        .replace(/{date}/g, dateFormatted)
        .replace(/{index}/g, mediaIndex + 1);

    cleanName = cleanName.replace(/[/\\?%*:|"<>]/g, '_');
    return `${cleanName}.${ext}`;
}

async function downloadMediaFile(url, filename) {
    try {
        const response = await fetch(url, { mode: 'cors' });
        if (!response.ok) throw new Error("Network error");
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
    } catch (e) {
        const windowRef = window.open(url, '_blank');
        if (!windowRef) location.href = url;
    }
}

// MULTI-FILTER & SORT ENGINE
function handleSearchAndFilter() {
    const query = document.getElementById('searchBox').value.toLowerCase().trim();
    const sortOrder = document.getElementById('sortOrder').value;

    const activeFilters = Array.from(document.querySelectorAll('.filter-checkbox:checked')).map(cb => cb.value);

    filteredLikes = rawLikesArray.filter(item => {
        const rawText = item.like.fullText || "";
        const textContent = rawText.trim();
        const textLower = textContent.toLowerCase();
        const tweetId = item.like.tweetId;
        const originalUrl = (item.like.expandedUrl || "").toLowerCase();

        const suspended = isSuspendedPost(item);
        const protectedPost = isProtectedPost(item);

        const hasText = textContent.length > 0;
        const hasMediaLink = textLower.includes("https://t.co/") || originalUrl.includes("t.co");

        if (activeFilters.includes('hideSuspended') && suspended) return false;
        if (activeFilters.includes('hideProtected') && protectedPost) return false;
        if (activeFilters.includes('onlyProtected') && !protectedPost) return false;

        if (activeFilters.includes('noText') && hasText) return false;
        if (activeFilters.includes('hasMedia') && !hasMediaLink) return false;
        if (activeFilters.includes('noMedia') && hasMediaLink) return false;

        if (query) {
            let match = textLower.includes(query) || tweetId.includes(query);

            const urlMatch = originalUrl.match(/(?:twitter\.com|x\.com)\/([a-zA-Z0-9_]+)\/status/i);
            if (urlMatch && urlMatch[1] && urlMatch[1].toLowerCase() !== 'i') {
                if (urlMatch[1].toLowerCase().includes(query)) match = true;
            }

            if (apiCache.has(tweetId)) {
                const cachedData = apiCache.get(tweetId);
                if (cachedData && typeof cachedData === "object" && cachedData.author) {
                    const liveName = (cachedData.author.name || "").toLowerCase();
                    const liveScreenName = (cachedData.author.screen_name || "").toLowerCase();
                    if (liveName.includes(query) || liveScreenName.includes(query)) {
                        match = true;
                    }
                }
            }
            if (!match) return false;
        }

        return true;
    });

    if (sortOrder === 'newest') {
        filteredLikes.sort((a, b) => getTweetTimestamp(b.like.tweetId) - getTweetTimestamp(a.like.tweetId));
    } else if (sortOrder === 'oldest') {
        filteredLikes.sort((a, b) => getTweetTimestamp(a.like.tweetId) - getTweetTimestamp(b.like.tweetId));
    }

    currentPage = 1;
    renderPage();
}

async function renderPage() {
    const listContainer = document.getElementById('likesList');
    listContainer.innerHTML = '';
    
    currentRenderId++;
    const thisRenderId = currentRenderId;
    
    const totalPages = Math.ceil(filteredLikes.length / itemsPerPage) || 1;
    
    // Updated Format: "n out of x items are shown"
    document.getElementById('itemCountDisplay').innerText = `${filteredLikes.length} out of ${rawLikesArray.length} items are shown`;
    
    document.querySelectorAll('.page-badge-text').forEach(el => {
        el.innerText = `${currentPage}/${totalPages}`;
    });

    const isPrevDisabled = (currentPage === 1);
    const isNextDisabled = (currentPage === totalPages || totalPages === 0);

    document.getElementById('navLeft').disabled = isPrevDisabled;
    document.getElementById('navRight').disabled = isNextDisabled;

    const bPrev = document.getElementById('bottomNavPrev');
    const bNext = document.getElementById('bottomNavNext');
    if (bPrev) bPrev.disabled = isPrevDisabled;
    if (bNext) bNext.disabled = isNextDisabled;

    const startIndex = (currentPage - 1) * itemsPerPage;
    const pageItems = filteredLikes.slice(startIndex, startIndex + itemsPerPage);

    pageItems.forEach((item) => {
        const tweetId = item.like.tweetId;
        const textContent = item.like.fullText || "";
        const originalUrl = item.like.expandedUrl || `https://twitter.com/i/web/status/${tweetId}`;
        const localDateStr = formatTweetDate(tweetId);

        let fallbackUsername = "HiddenUser";
        let initial = "🔒"; 
        const match = originalUrl.match(/(?:twitter\.com|x\.com)\/([a-zA-Z0-9_]+)\/status/i);
        if (match && match[1] && match[1].toLowerCase() !== 'i') {
            fallbackUsername = match[1];
            initial = fallbackUsername.charAt(0).toUpperCase();
        }
        
        const card = document.createElement('div');
        card.className = 'tweet-card';
        card.id = `card-${tweetId}`;
        
        card.innerHTML = `
            <div class="tweet-header" id="header-${tweetId}">
                <div class="profile-pic" style="background-color: var(--border-color); display:flex; align-items:center; justify-content:center; color:white; font-weight:bold; font-size:14px;">
                    ${initial}
                </div>
                <div class="user-info">
                    <span class="display-name">@${escapeHtml(fallbackUsername)}</span>
                    <span class="username">ID: ${tweetId}</span>
                </div>
                <div class="card-actions">
                    <button class="card-reload-btn" onclick="reloadSingleTweet('${tweetId}', 'fxtwitter')" title="Re-fetch post from FixTweet">Fx</button>
                    <button class="card-reload-btn" onclick="reloadSingleTweet('${tweetId}', 'vxtwitter')" title="Re-fetch post from VxTwitter">Vx</button>
                </div>
            </div>
            <div class="tweet-text" id="text-${tweetId}">${formatTextWithLinks(textContent)}</div>
            <div id="media-${tweetId}"></div>
            <div id="loading-${tweetId}" class="loading-indicator" style="display:block;">⏳ Fetching post media...</div>
            
            <div class="tweet-meta">
                <span id="date-${tweetId}">📅 ${localDateStr}</span>
                <a class="launch-link" href="${originalUrl}" target="_blank" rel="noreferrer noopener">Open Live Post ↗</a>
            </div>
        `;
        listContainer.appendChild(card);
    });

    for (let i = 0; i < pageItems.length; i++) {
        if (thisRenderId !== currentRenderId) return;

        const tweetId = pageItems[i].like.tweetId;
        const loader = document.getElementById(`loading-${tweetId}`);
        
        if (apiCache.has(tweetId)) {
            const cachedData = apiCache.get(tweetId);
            if (loader) loader.style.display = 'none';
            
            if (typeof cachedData === "object") {
                renderContent(tweetId, cachedData);
            } else {
                showFetchWarning(tweetId, cachedData);
            }
        } else {
            await fetchDataSafely(tweetId);
            if (loader) loader.style.display = 'none';
            await new Promise(resolve => setTimeout(resolve, 200));
        }
    }
}

async function reloadSingleTweet(tweetId, forcedEngine = null) {
    apiCache.delete(tweetId);
    saveCacheToLocalStorage();

    const loader = document.getElementById(`loading-${tweetId}`);
    if (loader) {
        loader.style.display = 'block';
        loader.innerText = '⏳ Re-fetching post...';
    }

    const mediaBox = document.getElementById(`media-${tweetId}`);
    if (mediaBox) {
        mediaBox.innerHTML = '';
        mediaBox.className = '';
    }

    await fetchDataSafely(tweetId, forcedEngine || currentEngine);
    if (loader) loader.style.display = 'none';
}

function showFetchWarning(tweetId, state) {
    const mediaBox = document.getElementById(`media-${tweetId}`);
    if (!mediaBox) return;

    let message = "";
    let colorClass = "";

    if (state === "protected" || state === 401) {
        colorClass = "fetch-warning-yellow";
        message = "🔒 <strong>Status 401 (Protected)</strong>: Account owner limits who can view their posts. Try pressing <strong>Fx</strong> or <strong>Vx</strong> above to re-check.";
    } else {
        const displayCode = (typeof state === "number" && state !== 403) ? state : 404;
        colorClass = "fetch-warning-red";
        message = `🗑️ <strong>Status ${displayCode} (Not Found)</strong>: Post or account was deleted, suspended, or unavailable. Try pressing <strong>Fx</strong> or <strong>Vx</strong> above to re-check.`;
    }

    mediaBox.className = `fetch-warning ${colorClass}`;
    mediaBox.innerHTML = message;
}

async function fetchDataSafely(tweetId, engine = currentEngine) {
    const fxUrl = `https://api.fxtwitter.com/status/${tweetId}`;
    const vxUrl = `https://api.vxtwitter.com/i/status/${tweetId}`;

    let data = null;
    let providerUsed = "";

    const tryFixTweet = async () => {
        try {
            const res = await fetch(fxUrl);
            let json = null;
            try { json = await res.json(); } catch (e) {}

            if (json) return { ...json, _httpStatus: res.status };
            if (res.status === 401) return { code: 401, message: "PRIVATE_TWEET" };
            if (res.status === 404) return { code: 404, message: "NOT_FOUND" };
            if (!res.ok) return { code: res.status, message: "HTTP_ERROR" };
        } catch (e) {}
        return null;
    };

    const tryVxTwitter = async () => {
        try {
            const res = await fetch(vxUrl);
            let json = null;
            try { json = await res.json(); } catch (e) {}

            if (json) return { ...json, _httpStatus: res.status };
            if (res.status === 401) return { code: 401, message: "PRIVATE_TWEET" };
            if (res.status === 404) return { code: 404, message: "NOT_FOUND" };
            if (!res.ok) return { code: res.status, message: "HTTP_ERROR" };
        } catch (e) {}
        return null;
    };

    try {
        if (engine === "fxtwitter") {
            data = await tryFixTweet();
            providerUsed = "fxtwitter";
        } else if (engine === "vxtwitter") {
            data = await tryVxTwitter();
            providerUsed = "vxtwitter";
        } else {
            data = await tryFixTweet();
            providerUsed = "fxtwitter";
            
            const isExplicitStatus = data && (data.code === 401 || data.code === 404 || data._httpStatus === 401 || data._httpStatus === 404);
            if (!data || (!isExplicitStatus && data._httpStatus >= 500)) {
                data = await tryVxTwitter();
                providerUsed = "vxtwitter";
            }
        }

        if (!data) {
            apiCache.set(tweetId, 404);
            saveCacheToLocalStorage();
            showFetchWarning(tweetId, 404);
            return;
        }

        const statusCode = data.code || data._httpStatus || 200;
        const message = data.message || "";

        if (statusCode === 401 || message === "PRIVATE_TWEET") {
            apiCache.set(tweetId, 401);
            saveCacheToLocalStorage();
            showFetchWarning(tweetId, 401);
            return;
        }

        if (statusCode === 404 || message === "NOT_FOUND") {
            apiCache.set(tweetId, 404);
            saveCacheToLocalStorage();
            showFetchWarning(tweetId, 404);
            return;
        }

        if (statusCode >= 500 || message === "API_FAIL") {
            apiCache.set(tweetId, statusCode || 500);
            saveCacheToLocalStorage();
            showFetchWarning(tweetId, statusCode || 500);
            return;
        }

        const tweetObj = data.tweet || data;
        if (tweetObj && (tweetObj.text !== undefined || tweetObj.media)) {
            let mediaList = [];
            if (tweetObj.media?.all) {
                mediaList = tweetObj.media.all;
            } else if (tweetObj.media?.photos) {
                mediaList = [
                    ...(tweetObj.media.photos || []).map(p => ({ type: 'photo', url: p.url })),
                    ...(tweetObj.media.videos || []).map(v => ({ type: 'video', url: v.url }))
                ];
            } else if (data.media_extended) {
                mediaList = data.media_extended;
            }

            const normalizedTweet = {
                tweetId: tweetId,
                author: {
                    name: tweetObj.author?.name || tweetObj.user_name || 'User',
                    screen_name: tweetObj.author?.screen_name || tweetObj.user_screen_name || 'unknown',
                    id: tweetObj.author?.id || tweetObj.user_id || tweetObj.user_screen_name || 'unknown'
                },
                text: tweetObj.text || '',
                date: tweetObj.created_at || tweetObj.date || '',
                media: { all: mediaList }
            };

            apiCache.set(tweetId, normalizedTweet);
            saveCacheToLocalStorage();
            renderContent(tweetId, normalizedTweet);
        } else {
            apiCache.set(tweetId, 404);
            saveCacheToLocalStorage();
            showFetchWarning(tweetId, 404);
        }

    } catch (err) {
        apiCache.set(tweetId, 404);
        saveCacheToLocalStorage();
        showFetchWarning(tweetId, 404);
    }
}

function renderContent(tweetId, t) {
    const headerEl = document.getElementById(`header-${tweetId}`);
    if(!headerEl) return; 

    const screenName = t.author?.screen_name || 'unknown';

    headerEl.innerHTML = `
        <div class="profile-pic" style="background-color: var(--accent); display:flex; align-items:center; justify-content:center; font-weight:bold; font-size:14px; color:white;">
            ${(t.author?.name || 'U').charAt(0).toUpperCase()}
        </div>
        <div class="user-info">
            <span class="display-name">${escapeHtml(t.author?.name || 'User')}</span>
            <span class="username">@${escapeHtml(screenName)}</span>
        </div>
        <div class="card-actions">
            <button class="card-reload-btn" onclick="reloadSingleTweet('${tweetId}', 'fxtwitter')" title="Re-fetch post from FixTweet">Fx</button>
            <button class="card-reload-btn" onclick="reloadSingleTweet('${tweetId}', 'vxtwitter')" title="Re-fetch post from VxTwitter">Vx</button>
        </div>
    `;
    
    document.getElementById(`text-${tweetId}`).innerHTML = formatTextWithLinks(t.text);

    if (t.media && t.media.all && t.media.all.length > 0) {
        const mediaBox = document.getElementById(`media-${tweetId}`);
        mediaBox.className = "media-container";
        mediaBox.innerHTML = '';

        t.media.all.forEach((m, idx) => {
            const mediaWrapper = document.createElement('div');
            mediaWrapper.className = 'media-item-wrapper';

            if (m.type === 'photo' || m.type === 'image') {
                const highResUrl = getHighestQualityImageUrl(m.url);
                const fileExt = getImageExtension(m.url);
                const filename = generateFilename(tweetId, t.author, idx, fileExt);

                const img = document.createElement('img');
                img.src = highResUrl;
                img.alt = "Post Image";
                img.referrerPolicy = "no-referrer";
                img.loading = "lazy";
                mediaWrapper.appendChild(img);

                const dlBtn = document.createElement('button');
                dlBtn.className = 'media-download-btn';
                dlBtn.innerHTML = `⬇️ Save Image`;
                dlBtn.onclick = (e) => {
                    e.stopPropagation();
                    downloadMediaFile(highResUrl, filename);
                };
                mediaWrapper.appendChild(dlBtn);

            } else if (m.type === 'video' || m.type === 'gif') {
                const videoUrl = m.url;
                const filename = generateFilename(tweetId, t.author, idx, "mp4");

                const video = document.createElement('video');
                video.controls = true;
                video.preload = "metadata";
                video.playsInline = true;
                video.referrerPolicy = "no-referrer";
                video.setAttribute("referrerpolicy", "no-referrer");
                video.src = videoUrl;

                video.onerror = () => {
                    const errDiv = document.createElement('div');
                    errDiv.className = "fetch-warning fetch-warning-red";
                    errDiv.innerHTML = `⚠️ Video stream blocked or deleted. Try pressing <strong>Fx</strong>/<strong>Vx</strong> above or <a href="${videoUrl}" target="_blank" rel="noreferrer noopener" style="color:var(--accent);font-weight:bold;">Open Direct MP4 ↗</a>`;
                    mediaBox.appendChild(errDiv);
                    video.remove();
                };

                mediaWrapper.appendChild(video);

                const dlBtn = document.createElement('button');
                dlBtn.className = 'media-download-btn';
                dlBtn.innerHTML = `⬇️ Save Source MP4`;
                dlBtn.onclick = (e) => {
                    e.stopPropagation();
                    downloadMediaFile(videoUrl, filename);
                };
                mediaWrapper.appendChild(dlBtn);
            }

            mediaBox.appendChild(mediaWrapper);
        });
    }
}

function changePage(direction) {
    currentPage += direction;
    renderPage();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function formatTextWithLinks(text) {
    const safeText = escapeHtml(text);
    return safeText.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noreferrer noopener" class="tco-link">$1</a>');
}

function escapeHtml(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}