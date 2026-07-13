# Okta Dark Mode

A Chrome extension that toggles a dark color scheme on supported Okta pages.

## Manifest V3 version

This version uses:

- A Manifest V3 extension service worker
- `chrome.action` instead of `chrome.browserAction`
- `chrome.scripting.insertCSS()` and `removeCSS()`
- Session storage for per-tab toggle state
- Automatic reapplication after an enabled tab reloads

## Install locally

1. Extract the ZIP file.
2. Open `chrome://extensions` in Chrome.
3. Turn on **Developer mode**.
4. Select **Load unpacked**.
5. Choose the extracted folder containing `manifest.json`.
6. Open a supported Okta page and click the extension icon.

Supported domains are `*.okta.com`, `*.oktapreview.com` and `*.okta-emea.com`.

## Version 2.2
Adds a content script that watches Okta's React interface and applies dark styling to navigation components created after page load, including components inside open Shadow DOM roots.
