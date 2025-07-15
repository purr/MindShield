// Build script for MindShield extension
const fs = require("fs");
const path = require("path");

// Create build directories
console.log("Creating build directories...");
if (!fs.existsSync("build")) {
  fs.mkdirSync("build");
}
if (!fs.existsSync("build/chrome")) {
  fs.mkdirSync("build/chrome");
}
if (!fs.existsSync("build/firefox")) {
  fs.mkdirSync("build/firefox");
}

// Ensure required directories exist in build
const requiredDirs = ["config", "popup", "icons"];
requiredDirs.forEach((dir) => {
  if (!fs.existsSync(`build/chrome/${dir}`)) {
    fs.mkdirSync(`build/chrome/${dir}`, { recursive: true });
  }
  if (!fs.existsSync(`build/firefox/${dir}`)) {
    fs.mkdirSync(`build/firefox/${dir}`, { recursive: true });
  }
});

// Ensure required source directories exist
requiredDirs.forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Files to copy (or create if missing)
const filesToCopy = [
  "background.js",
  "popup/popup.html",
  "popup/popup.js",
  "popup/popup.css",
  "config/edl_sources.json",
  "config/redirect_urls.json",
];

// Copy all icons
const iconFiles = fs
  .readdirSync("icons")
  .filter((file) => file.endsWith(".png"));
filesToCopy.push(...iconFiles.map((file) => `icons/${file}`));

// Create missing config files with defaults if they don't exist
if (!fs.existsSync("config/edl_sources.json")) {
  console.log("Creating default edl_sources.json");
  const edlSources = {
    edl_sources: [
      {
        name: "StevenBlack's hosts",
        url: "https://raw.githubusercontent.com/StevenBlack/hosts/master/alternates/porn/hosts",
        format: "hosts",
      },
      {
        name: "URLHAUS Filter",
        url: "https://malware-filter.gitlab.io/malware-filter/urlhaus-filter-hosts.txt",
        format: "hosts",
      },
    ],
    last_updated: null,
    update_interval: 86400000,
  };
  fs.writeFileSync(
    "config/edl_sources.json",
    JSON.stringify(edlSources, null, 2)
  );
}

if (!fs.existsSync("config/redirect_urls.json")) {
  console.log("Creating default redirect_urls.json");
  const redirectUrls = {
    redirect_urls: [
      {
        name: "NoFap",
        url: "https://www.nofap.com/",
      },
      {
        name: "Fight The New Drug",
        url: "https://fightthenewdrug.org/",
      },
    ],
  };
  fs.writeFileSync(
    "config/redirect_urls.json",
    JSON.stringify(redirectUrls, null, 2)
  );
}

// Copy files to build directories
console.log("Copying files to build directories...");
filesToCopy.forEach((file) => {
  try {
    const dir = path.dirname(file);

    // Create directories if needed
    if (dir !== ".") {
      if (!fs.existsSync(`build/chrome/${dir}`)) {
        fs.mkdirSync(`build/chrome/${dir}`, { recursive: true });
      }
      if (!fs.existsSync(`build/firefox/${dir}`)) {
        fs.mkdirSync(`build/firefox/${dir}`, { recursive: true });
      }
    }

    if (fs.existsSync(file)) {
      // Copy file to chrome build
      fs.copyFileSync(file, `build/chrome/${file}`);
      // Copy file to firefox build
      fs.copyFileSync(file, `build/firefox/${file}`);
      console.log(`Copied ${file} to build directories`);
    } else {
      console.warn(`Warning: ${file} not found, skipping`);
    }
  } catch (error) {
    console.error(`Error copying ${file}:`, error);
  }
});

// Copy specific manifest files
try {
  // Copy Chrome manifest
  if (fs.existsSync("manifest.json")) {
    fs.copyFileSync("manifest.json", "build/chrome/manifest.json");
    console.log("Copied Chrome manifest.json");
  } else {
    console.error("Error: Chrome manifest.json not found");
  }

  // Copy Firefox manifest
  if (fs.existsSync("manifest-firefox.json")) {
    fs.copyFileSync("manifest-firefox.json", "build/firefox/manifest.json");
    console.log("Copied Firefox manifest.json");
  } else {
    console.error("Error: Firefox manifest-firefox.json not found");
  }
} catch (error) {
  console.error("Error copying manifest files:", error);
}

console.log("Build completed!");
