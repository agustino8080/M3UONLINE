// app.js - TV Stream Player with Proxy Support

/**
 * Configuration
 */
const CONFIG = {
    PROXY_URL: 'https://vercel-api-proxy-steel-chi.vercel.app/',
    STORAGE_KEY_PROXY: 'proxyEnabled',
    STORAGE_KEY_PLAYLIST: 'm3uPlaylistURL'
};

// Global variables
let playlistItems = [];
let player = null;
let isProxyEnabled = false;

// DOM Elements (will be initialized on DOMContentLoaded)
let videoPlayer, videoPlaceholder, playlist, playlistItemsContainer, loadM3UButton, m3uURLInput, 
    billedMsgElement, searchInput, proxyToggle, proxyStatus, channelCountElement;

/**
 * Initialize the application when DOM is ready
 */
document.addEventListener("DOMContentLoaded", function () {
    // Initialize DOM elements
    videoPlayer = document.getElementById("videoPlayer");
    videoPlaceholder = document.getElementById("videoPlaceholder");
    playlist = document.getElementById("playlist");
    playlistItemsContainer = document.getElementById("playlistItems");
    loadM3UButton = document.getElementById("loadM3U");
    m3uURLInput = document.getElementById("m3uURL");
    billedMsgElement = document.getElementById("billedMsg");
    searchInput = document.getElementById("searchInput");
    proxyToggle = document.getElementById("proxyToggle");
    proxyStatus = document.getElementById("proxyStatus");
    channelCountElement = document.getElementById("channelCount");

    // Load saved proxy state
    loadProxyState();

    // Get playlist URL from URL parameters if available
    loadPlaylistFromURL();

    // Load saved playlist from localStorage if available
    loadSavedPlaylist();

    // Event listeners
    loadM3UButton.addEventListener("click", handleLoadM3U);
    searchInput.addEventListener("input", handleSearch);
    proxyToggle.addEventListener("click", toggleProxy);
});

/**
 * Toggle proxy on/off
 */
function toggleProxy() {
    isProxyEnabled = !isProxyEnabled;
    
    // Save to localStorage
    localStorage.setItem(CONFIG.STORAGE_KEY_PROXY, isProxyEnabled.toString());
    
    // Update UI
    updateProxyUI();
}

/**
 * Update proxy UI based on current state
 */
function updateProxyUI() {
    if (isProxyEnabled) {
        proxyToggle.classList.add('active');
        proxyStatus.textContent = 'ON';
        proxyStatus.classList.remove('status-off');
        proxyStatus.classList.add('status-on');
    } else {
        proxyToggle.classList.remove('active');
        proxyStatus.textContent = 'OFF';
        proxyStatus.classList.remove('status-on');
        proxyStatus.classList.add('status-off');
    }
}

/**
 * Load saved proxy state from localStorage
 */
function loadProxyState() {
    const savedState = localStorage.getItem(CONFIG.STORAGE_KEY_PROXY);
    isProxyEnabled = savedState === 'true';
    updateProxyUI();
}

/**
 * Apply proxy to URL if enabled
 * @param {string} url - The original URL
 * @returns {string} - URL with or without proxy prefix
 */
function applyProxy(url) {
    if (!url) return url;
    
    if (isProxyEnabled) {
        // Remove any existing proxy prefix first to avoid duplication
        const cleanUrl = removeProxy(url);
        return CONFIG.PROXY_URL + cleanUrl;
    }
    
    return removeProxy(url);
}

/**
 * Remove proxy prefix from URL
 * @param {string} url - URL that may contain proxy prefix
 * @returns {string} - Clean URL without proxy
 */
function removeProxy(url) {
    if (!url) return url;
    
    if (url.startsWith(CONFIG.PROXY_URL)) {
        return url.substring(CONFIG.PROXY_URL.length);
    }
    return url;
}

/**
 * Get playlist URL from URL parameters
 */
function loadPlaylistFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const playlistParam = urlParams.get('playlist');
    
    if (playlistParam != null) {
        localStorage.setItem(CONFIG.STORAGE_KEY_PLAYLIST, playlistParam);
    }
}

/**
 * Load saved playlist from localStorage
 */
function loadSavedPlaylist() {
    const savedPlaylistURL = localStorage.getItem(CONFIG.STORAGE_KEY_PLAYLIST);
    
    if (savedPlaylistURL) {
        m3uURLInput.value = savedPlaylistURL;
        // Automatically load the saved playlist after a short delay
        setTimeout(function () {
            loadM3UButton.click();
        }, 500);
    }
}

/**
 * Handle M3U file loading
 */
function handleLoadM3U() {
    let m3uURL = m3uURLInput.value.trim();
    
    if (!m3uURL) {
        alert('Por favor ingresa una URL válida');
        return;
    }
    
    // Apply proxy to the playlist URL if enabled
    const fetchURL = applyProxy(m3uURL);
    
    // Save to localStorage (original URL without proxy)
    localStorage.setItem(CONFIG.STORAGE_KEY_PLAYLIST, removeProxy(m3uURL));

    // Show loading state
    loadM3UButton.disabled = true;
    loadM3UButton.innerHTML = '<span class="loading"></span> Cargando...';

    // Load and parse the M3U file
    fetch(fetchURL)
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al cargar la lista. Verifica la URL o activa el proxy.');
            }
            return response.text();
        })
        .then(data => {
            processM3UData(data);
        })
        .catch(error => {
            console.error("Error loading the M3U file:", error);
            alert('Error: ' + error.message);
        })
        .finally(() => {
            loadM3UButton.disabled = false;
            loadM3UButton.innerHTML = '<i class="bi bi-play-fill"></i> Cargar';
        });
}

/**
 * Process M3U data
 */
function processM3UData(data) {
    videoPlayer.src = '';
    videoPlaceholder.style.display = 'flex';
    clearPlaylist(); // Clear channel list

    data = trimLineBreak(data);
    const blocks = data.split('\n\n');
    let tvgName = '';
    let tvgLogo = '';
    let billedMsg = '';

    for (let i = 0; i < blocks.length; i++) {
        var items = [];
        var lines = blocks[i].split('\n');

        items[i] = { 'key': '', 'tvgName': '', 'tvgLogo': '', 'source': '' };
        
        for (let j = 0; j < lines.length; j++) {
            const line = lines[j].trim();
            
            // Check for the #EXTM3U line with billed-msg
            if (line.startsWith("#EXTM3U")) {
                const billedMsgMatch = line.match(/billed-msg="([^"]+)"/);
                if (billedMsgMatch) {
                    billedMsg = billedMsgMatch[1];
                }
            }

            // Check for license key
            if (line.startsWith("#KODIPROP:inputstream.adaptive.license_key=")) {
                var keyInfo = extractKey(line);
                if (keyInfo != null) {
                    items[i]['key'] = keyInfo;
                }
            }

            // Check if it's an EXTINF line with tvg-name and tvg-logo
            if (line.startsWith("#EXTINF:")) {
                const tvgNameMatch = line.match(/tvg-name="([^"]+)"/);
                if (tvgNameMatch) {
                    tvgName = tvgNameMatch[1];
                } else {
                    // Extract the last string after the last comma as tvg-name
                    var lastCommaIndex = line.lastIndexOf(",");
                    if (lastCommaIndex !== -1) {
                        tvgName = line.substring(lastCommaIndex + 1).trim();
                    } else {
                        tvgName = `Stream ${j + 1}`;
                    }   
                }

                const tvgLogoMatch = line.match(/tvg-logo="([^"]+)"/);
                if (tvgLogoMatch) {
                    tvgLogo = tvgLogoMatch[1];
                }

                items[i]['tvgName'] = tvgName;
                items[i]['tvgLogo'] = convertToHttps(tvgLogo);
            }

            // Check if the line is not empty and not a comment
            if (line.length > 0 && !line.startsWith("#")) {
                items[i]['source'] = convertToHttps(line);
            }
        }

        if (items.length > 0) {
            items = reorderIndexes(items);
            if (items[0].source != null && items[0].source != '') {
                playlistItems.push(items);
            }
        }
    }

    // Render the playlist
    renderPlaylist(playlistItems);

    // Show/hide playlist panel
    if (playlistItems.length > 0) {
        playlist.classList.remove("d-none");
    } else {
        playlist.classList.add("d-none");
    }

    // Show/hide billed message
    if (billedMsg != '') {
        billedMsgElement.textContent = billedMsg;
        billedMsgElement.classList.remove("d-none");
    } else {
        billedMsgElement.classList.add("d-none");
    }
}

/**
 * Handle search input
 */
function handleSearch() {
    const searchText = searchInput.value.trim().toLowerCase();

    // Filter playlist items based on search input
    const filteredItems = playlistItems.filter(item => {
        return item[0].tvgName.toLowerCase().includes(searchText);
    });

    // Render the filtered playlist
    clearPlaylist(false);
    renderPlaylist(filteredItems);
}

/**
 * Render playlist items
 */
function renderPlaylist(items) {
    // Update channel count
    channelCountElement.textContent = items.length;
    
    items.forEach((item, index) => {
        const playlistItem = document.createElement("div");
        playlistItem.className = "channel";
        playlistItem.dataset.index = index;

        // Channel name
        const channelName = document.createElement("span");
        channelName.className = "channel-name";
        channelName.textContent = item[0].tvgName;
        playlistItem.appendChild(channelName);

        // Logo if available
        if (item[0].tvgLogo) {
            const logoImage = document.createElement("img");
            logoImage.src = applyProxy(item[0].tvgLogo);
            logoImage.alt = item[0].tvgName;
            logoImage.onerror = function() {
                this.style.display = 'none';
            };
            playlistItem.appendChild(logoImage);
        }

        playlistItem.addEventListener("click", async () => {
            // Remove active class from all channels
            document.querySelectorAll('.channel').forEach(ch => ch.classList.remove('active'));
            // Add active class to clicked channel
            playlistItem.classList.add('active');
            await playChannel(item[0]);
        });

        playlistItemsContainer.appendChild(playlistItem);
    });
}

/**
 * Play a channel
 */
async function playChannel(item) {
    // Hide placeholder
    videoPlaceholder.style.display = 'none';
    
    // If a player instance exists, destroy it before creating a new one
    if (player !== null) {
        await player.destroy();
    }

    // Apply proxy to the stream URL if enabled
    const streamUrl = applyProxy(item.source);

    // Init Shaka Player
    player = new shaka.Player(videoPlayer);

    // Configure DRM if keys are present
    if (item.key.key_id !== '' && item.key.key !== '') {
        player.configure({
            drm: {
                clearKeys: {
                    [item.key.key_id]: item.key.key
                }
            }
        });
    }

    try {
        await player.load(streamUrl);
        // Scroll to the video player
        videoPlayer.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        console.error('Error loading stream:', error);
        alert('Error al reproducir el canal. Intenta activar/desactivar el proxy.');
        videoPlaceholder.style.display = 'flex';
    }
}

/**
 * Clear playlist
 */
function clearPlaylist(clearItems = true) {
    // Clear the existing playlist items
    if (clearItems) {
        playlistItems = [];
    }
    
    if (playlistItemsContainer) {
        playlistItemsContainer.innerHTML = '';
    }
    
    // Reset channel count
    if (channelCountElement) {
        channelCountElement.textContent = '0';
    }
}

/**
 * Trim line breaks in text
 */
function trimLineBreak(text) {
    // Replace multiple line breaks with a single line break
    return text.replace(/[\r\n]{2,}/g, '\n\n');
}

/**
 * Reorder indexes - remove undefined items
 */
function reorderIndexes(items) {
    let rearrangedItems = [];

    items.forEach(item => {
        if (item !== undefined) {
            rearrangedItems.push(item);
        }
    });

    return rearrangedItems;
}

/**
 * Convert Base64 to Hex
 */
function base64ToHex(base64) {
    if (base64.length > 0) {
        const binary = atob(base64);
        let hex = '';
        for (let i = 0; i < binary.length; i++) {
            let char = binary.charCodeAt(i).toString(16);
            hex += (char.length === 1 ? '0' : '') + char;
        }
        return hex;
    }
    return base64;
}

/**
 * Convert HTTP URL to HTTPS
 */
function convertToHttps(url) {
    if (!url) return url;
    return url.replace(/^http:/, 'https:');
}

/**
 * Extract DRM key from line
 */
function extractKey(line) {
    const prefix = '#KODIPROP:inputstream.adaptive.license_key=';
    const extractedValue = line.substring(line.indexOf(prefix) + prefix.length);

    try {
        var json = JSON.parse(extractedValue);
        if (json && json.keys.length > 0) {
            const KEY = base64ToHex(json.keys[0].k); // Value of 'k' (KEY)
            const ID = base64ToHex(json.keys[0].kid); // Value of 'kid' (ID)

            return {'key_id': ID, 'key': KEY};
        } else {
            return null;
        }
    } catch (error) {
        return null;
    }
}
