const CSS_FILE = "dark_mode.css";
const SUPPORTED_OKTA_URL = /^https:\/\/[^/]+\.(?:oktapreview\.com|okta\.com|okta-emea\.com)(?:\/|$)/i;

function storageKey(tabId) {
  return `darkModeTab_${tabId}`;
}

async function getDarkModeState(tabId) {
  const key = storageKey(tabId);
  const stored = await chrome.storage.session.get(key);
  return stored[key] === true;
}

async function setDarkModeState(tabId, enabled) {
  const key = storageKey(tabId);

  if (enabled) {
    await chrome.storage.session.set({ [key]: true });
  } else {
    await chrome.storage.session.remove(key);
  }
}

async function updateBadge(tabId, enabled) {
  await chrome.action.setBadgeText({
    tabId,
    text: enabled ? "ON" : ""
  });
}

async function enableDarkMode(tabId) {
  // Remove a previous copy first so repeated injections cannot accumulate.
  try {
    await chrome.scripting.removeCSS({
      target: { tabId, allFrames: true },
      files: [CSS_FILE]
    });
  } catch (_error) {
    // It is normal for there to be nothing to remove the first time.
  }

  await chrome.scripting.insertCSS({
    target: { tabId, allFrames: true },
    files: [CSS_FILE]
  });

  try {
    await chrome.tabs.sendMessage(tabId, { type: "OKTA_DARK_MODE_ENABLE" });
  } catch (_error) {
    // The content script may not be ready in every frame yet; CSS still applies.
  }

  await setDarkModeState(tabId, true);
  await updateBadge(tabId, true);
}

async function disableDarkMode(tabId) {
  try {
    await chrome.scripting.removeCSS({
      target: { tabId, allFrames: true },
      files: [CSS_FILE]
    });
  } finally {
    try {
      await chrome.tabs.sendMessage(tabId, { type: "OKTA_DARK_MODE_DISABLE" });
    } catch (_error) {
      // Ignore pages where the content script is unavailable.
    }
    await setDarkModeState(tabId, false);
    await updateBadge(tabId, false);
  }
}

chrome.action.onClicked.addListener(async (tab) => {
  if (tab.id === undefined) {
    return;
  }

  if (!tab.url || !SUPPORTED_OKTA_URL.test(tab.url)) {
    await chrome.action.setBadgeText({ tabId: tab.id, text: "N/A" });
    return;
  }

  try {
    const enabled = await getDarkModeState(tab.id);

    if (enabled) {
      await disableDarkMode(tab.id);
    } else {
      await enableDarkMode(tab.id);
    }
  } catch (error) {
    console.error("Unable to toggle Okta Dark Mode:", error);
    await chrome.action.setBadgeText({ tabId: tab.id, text: "ERR" });
  }
});

// Programmatically inserted CSS is removed when a page reloads. Reapply it
// after navigation when dark mode is enabled for that tab.
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status !== "complete" || !tab.url || !SUPPORTED_OKTA_URL.test(tab.url)) {
    return;
  }

  try {
    if (await getDarkModeState(tabId)) {
      await enableDarkMode(tabId);
    }
  } catch (error) {
    console.error("Unable to reapply Okta Dark Mode:", error);
  }
});

chrome.tabs.onRemoved.addListener(async (tabId) => {
  await chrome.storage.session.remove(storageKey(tabId));
});
