// MindShield background script
let blockedDomains = new Set();
let redirectUrls = [];
let edlSources = [];
let lastUpdate = 0;
let blockCounter = 0;

// GitHub repository information
const GITHUB_USERNAME = "purr";
const GITHUB_REPO = "MindShield";
const GITHUB_BRANCH = "main";

// Initialize extension
async function initialize() {
  try {
    await loadConfigFiles();
    await updateBlocklists();
    setupListeners();
    console.log("MindShield initialized successfully");
  } catch (error) {
    console.error("Failed to initialize MindShield:", error);
  }
}

// Get GitHub raw content URL
function getGitHubRawUrl(path) {
  return `https://raw.githubusercontent.com/${GITHUB_USERNAME}/${GITHUB_REPO}/${GITHUB_BRANCH}/${path}`;
}

// Load configuration files from GitHub
async function loadConfigFiles() {
  try {
    // First try to load from GitHub
    const edlSourcesUrl = getGitHubRawUrl("config/edl_sources.json");
    let edlSourcesResponse = await fetch(edlSourcesUrl, {
      cache: "no-store",
    }).catch((error) => {
      console.error("Failed to fetch EDL sources from GitHub:", error);
      return { ok: false };
    });

    if (!edlSourcesResponse.ok) {
      console.log(
        "Could not load EDL sources from GitHub, falling back to local file"
      );
      edlSourcesResponse = await fetch("config/edl_sources.json").catch(
        (error) => {
          console.error("Failed to fetch local EDL sources:", error);
          return { ok: false };
        }
      );
    }

    if (!edlSourcesResponse.ok) {
      console.error("Failed to load EDL sources, using defaults");
      edlSources = getDefaultEDLSources();
    } else {
      const edlSourcesData = await edlSourcesResponse.json();
      edlSources = edlSourcesData.edl_sources;
      lastUpdate = edlSourcesData.last_updated || 0;
    }

    const redirectUrlsUrl = getGitHubRawUrl("config/redirect_urls.json");
    let redirectUrlsResponse = await fetch(redirectUrlsUrl, {
      cache: "no-store",
    }).catch((error) => {
      console.error("Failed to fetch redirect URLs from GitHub:", error);
      return { ok: false };
    });

    if (!redirectUrlsResponse.ok) {
      console.log(
        "Could not load redirect URLs from GitHub, falling back to local file"
      );
      redirectUrlsResponse = await fetch("config/redirect_urls.json").catch(
        (error) => {
          console.error("Failed to fetch local redirect URLs:", error);
          return { ok: false };
        }
      );
    }

    if (!redirectUrlsResponse.ok) {
      console.error("Failed to load redirect URLs, using defaults");
      redirectUrls = getDefaultRedirectUrls();
    } else {
      const redirectUrlsData = await redirectUrlsResponse.json();
      redirectUrls = redirectUrlsData.redirect_urls;
    }
  } catch (error) {
    console.error("Failed to load configuration files:", error);
    // Use default values
    edlSources = getDefaultEDLSources();
    redirectUrls = getDefaultRedirectUrls();
  }
}

// Default EDL sources in case config loading fails
function getDefaultEDLSources() {
  return [
    {
      name: "StevenBlack's hosts",
      url: "https://raw.githubusercontent.com/StevenBlack/hosts/master/alternates/porn/hosts",
      format: "hosts",
    },
  ];
}

// Default redirect URLs in case config loading fails
function getDefaultRedirectUrls() {
  return [
    {
      name: "NoFap",
      url: "https://www.nofap.com/",
    },
    {
      name: "Your Brain on Porn",
      url: "https://www.yourbrainonporn.com/",
    },
    {
      name: "Fight The New Drug",
      url: "https://fightthenewdrug.org/",
    },
  ];
}

// Update blocklists from EDL sources
async function updateBlocklists() {
  const now = Date.now();

  // Check if update is needed
  if (
    edlSources.update_interval &&
    lastUpdate > 0 &&
    now - lastUpdate < edlSources.update_interval
  ) {
    return;
  }

  let updateSuccessful = false;

  try {
    for (const source of edlSources) {
      try {
        console.log(`Fetching blocklist from ${source.name}...`);
        const response = await fetch(source.url, { cache: "no-store" });

        if (!response.ok) {
          console.error(
            `Failed to fetch ${source.name}: ${response.status} ${response.statusText}`
          );
          continue;
        }

        const text = await response.text();

        if (source.format === "hosts") {
          parseHostsFile(text);
          updateSuccessful = true;
        }
      } catch (sourceError) {
        console.error(`Error processing source ${source.name}:`, sourceError);
      }
    }

    if (updateSuccessful) {
      // Update last update timestamp
      lastUpdate = now;

      // Save to storage
      await saveToStorage({
        blockedDomains: Array.from(blockedDomains),
        lastUpdate: lastUpdate,
        blockCounter: blockCounter,
      });

      console.log(
        `Blocklist updated successfully with ${blockedDomains.size} domains`
      );
    } else {
      console.error("No blocklists were successfully updated");
    }
  } catch (error) {
    console.error("Failed to update blocklists:", error);
  }
}

// Save data to storage with error handling
async function saveToStorage(data) {
  try {
    await chrome.storage.local.set(data);
    return true;
  } catch (error) {
    console.error("Failed to save to storage:", error);
    return false;
  }
}

// Parse hosts file format
function parseHostsFile(content) {
  const lines = content.split("\n");
  let addedCount = 0;

  for (let line of lines) {
    // Remove comments
    line = line.replace(/#.*$/, "").trim();

    if (line) {
      const parts = line.split(/\s+/);
      if (
        parts.length >= 2 &&
        (parts[0] === "0.0.0.0" || parts[0] === "127.0.0.1")
      ) {
        const domain = parts[1].toLowerCase();
        if (domain !== "localhost" && !blockedDomains.has(domain)) {
          blockedDomains.add(domain);
          addedCount++;
        }
      }
    }
  }

  console.log(`Added ${addedCount} domains from hosts file`);
}

// Setup event listeners
function setupListeners() {
  // Listen for web requests
  chrome.webNavigation.onBeforeNavigate.addListener((details) => {
    if (details.frameId === 0) {
      // Only check main frame navigations
      try {
        const url = new URL(details.url);
        const hostname = url.hostname.toLowerCase();

        if (isBlockedDomain(hostname)) {
          redirectToSafeUrl(details.tabId, hostname);
        }
      } catch (error) {
        console.error("Error processing navigation event:", error);
      }
    }
  });

  // Listen for messages from popup
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "updateBlocklists") {
      updateBlocklists()
        .then(() => sendResponse({ success: true }))
        .catch((error) => {
          console.error("Error in updateBlocklists:", error);
          sendResponse({ success: false, error: error.message });
        });
      return true; // Indicates async response
    }

    if (message.action === "getStats") {
      sendResponse({
        blockedCount: blockedDomains.size,
        blockCounter: blockCounter,
        lastUpdate: lastUpdate,
      });
      return true;
    }

    if (message.action === "refreshConfig") {
      loadConfigFiles()
        .then(() => updateBlocklists())
        .then(() => sendResponse({ success: true }))
        .catch((error) => {
          console.error("Error refreshing configuration:", error);
          sendResponse({ success: false, error: error.message });
        });
      return true;
    }
  });
}

// Check if a domain should be blocked
function isBlockedDomain(hostname) {
  // Check for exact match
  if (blockedDomains.has(hostname)) {
    return true;
  }

  // Check for subdomain match
  const hostParts = hostname.split(".");
  for (let i = 1; i < hostParts.length - 1; i++) {
    const partialHost = hostParts.slice(i).join(".");
    if (blockedDomains.has(partialHost)) {
      return true;
    }
  }

  return false;
}

// Redirect to a randomly chosen safe URL
function redirectToSafeUrl(tabId, blockedHostname) {
  if (redirectUrls.length > 0) {
    // Ensure we don't always redirect to the same URL by using a more robust random selection
    const randomIndex = Math.floor(Math.random() * redirectUrls.length);
    const destination = redirectUrls[randomIndex].url;

    // Log which URL we're redirecting to
    console.log(
      `Redirecting to ${redirectUrls[randomIndex].name}: ${destination}`
    );

    // Increment block counter
    blockCounter++;

    // Save the updated block counter
    saveToStorage({ blockCounter: blockCounter });

    console.log(
      `Blocked access to ${blockedHostname} (total: ${blockCounter})`
    );

    chrome.tabs.update(tabId, { url: destination });
  }
}

// Load cached data from storage
async function loadCachedData() {
  try {
    const data = await chrome.storage.local.get([
      "blockedDomains",
      "lastUpdate",
      "blockCounter",
    ]);

    if (data.blockedDomains) {
      blockedDomains = new Set(data.blockedDomains);
      console.log(`Loaded ${blockedDomains.size} blocked domains from storage`);
    }

    if (data.lastUpdate) {
      lastUpdate = data.lastUpdate;
    }

    if (data.blockCounter) {
      blockCounter = data.blockCounter;
    }
  } catch (error) {
    console.error("Failed to load cached data:", error);
  }
}

// Schedule periodic updates
function scheduleUpdates() {
  // Check for updates every hour
  const ONE_HOUR = 60 * 60 * 1000;
  setInterval(() => {
    console.log("Running scheduled update of blocklists");

    // First refresh config from GitHub
    loadConfigFiles()
      .then(() => updateBlocklists())
      .catch((error) => {
        console.error("Error during scheduled update:", error);
      });
  }, ONE_HOUR);
}

// Start the extension
loadCachedData()
  .then(initialize)
  .then(scheduleUpdates)
  .catch((error) => {
    console.error("Critical error starting MindShield:", error);
  });
