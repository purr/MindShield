# MindShield

MindShield is a browser extension that helps protect your mind from adult content by blocking access to such sites and redirecting you to positive, constructive resources.

## Features

- Blocks adult websites using regularly updated external domain lists
- Works on Chrome, Firefox, and Firefox for Android
- Redirects to randomly selected positive resources when blocked
- Works in incognito/private browsing mode
- Simple, clean interface

## Installation

### Chrome/Chromium-based Browsers

1. Download the latest `mindshield-chrome-X.zip` file from the [Releases](https://github.com/yourusername/mindshield/releases) page
2. Unzip the file to a location on your computer
3. Open Chrome and go to `chrome://extensions/`
4. Enable "Developer Mode" by clicking the toggle in the top-right corner
5. Click "Load unpacked" and select the unzipped folder
6. The extension should now be installed and active

### Firefox Desktop

1. Download the latest `mindshield-firefox-X.zip` file from the [Releases](https://github.com/yourusername/mindshield/releases) page
2. Open Firefox and go to `about:addons`
3. Click the gear icon and select "Install Add-on From File..."
4. Select the downloaded zip file
5. Follow the prompts to complete installation

### Firefox for Android

1. Install Firefox Nightly from the Google Play Store
2. Download the latest `mindshield-firefox-X.zip` file from the [Releases](https://github.com/yourusername/mindshield/releases) page
3. Open Firefox Nightly and navigate to `about:addons`
4. Tap on the settings gear icon, then "Install Add-on From File..."
5. Navigate to and select the downloaded zip file
6. Follow the prompts to complete installation

## Configuration

The extension uses two main configuration files:

1. `edl_sources.json` - Contains URLs to blocklists that identify adult websites
2. `redirect_urls.json` - Contains URLs where users are redirected when attempting to access blocked content

To modify these files, you'll need to edit them and then rebuild the extension.

## Development

### Prerequisites

- Node.js
- Yarn
- web-ext tool (`yarn global add web-ext`)

### Building

```bash
# Clone the repository
git clone https://github.com/yourusername/mindshield.git
cd mindshield

# Install dependencies
yarn

# Build for Chrome
mkdir -p build/chrome
cp -r manifest.json background.js popup icons config build/chrome/
cd build/chrome
web-ext build

# Build for Firefox
cd ../..
mkdir -p build/firefox
cp -r manifest.json background.js popup icons config build/firefox/
cd build/firefox
web-ext build
```

The built extensions will be in the `build/chrome/web-ext-artifacts` and `build/firefox/web-ext-artifacts` directories.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
