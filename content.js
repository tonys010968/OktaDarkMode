const STYLE_ID = 'okta-dark-mode-extension-style';
const ROOT_FLAG = 'data-okta-dark-mode-extension';
let enabled = false;
let observer = null;

const DARK_CSS = `
:host, :root { color-scheme: dark !important; }
html[${ROOT_FLAG}], html[${ROOT_FLAG}] body {
  background: #111 !important;
  color: #d0d0d0 !important;
}
html[${ROOT_FLAG}] body * {
  border-color: #3a3a3a !important;
}
html[${ROOT_FLAG}] nav,
html[${ROOT_FLAG}] aside,
html[${ROOT_FLAG}] [role="navigation"],
html[${ROOT_FLAG}] [aria-label*="navigation" i],
html[${ROOT_FLAG}] [aria-label*="sidebar" i],
html[${ROOT_FLAG}] [data-se*="nav" i],
html[${ROOT_FLAG}] [class*="sidebar" i],
html[${ROOT_FLAG}] [class*="side-nav" i],
html[${ROOT_FLAG}] [class*="sidenav" i],
html[${ROOT_FLAG}] [class*="navigation" i],
html[${ROOT_FLAG}] [class*="nav-container" i],
html[${ROOT_FLAG}] [id*="sidebar" i],
html[${ROOT_FLAG}] [id*="navigation" i] {
  background: #171717 !important;
  background-color: #171717 !important;
  color: #d0d0d0 !important;
  border-color: #3a3a3a !important;
  box-shadow: none !important;
}
html[${ROOT_FLAG}] nav *,
html[${ROOT_FLAG}] aside *,
html[${ROOT_FLAG}] [role="navigation"] *,
html[${ROOT_FLAG}] [aria-label*="navigation" i] *,
html[${ROOT_FLAG}] [aria-label*="sidebar" i] * {
  background-color: transparent !important;
  color: #d0d0d0 !important;
  border-color: #3a3a3a !important;
}
html[${ROOT_FLAG}] nav a:hover,
html[${ROOT_FLAG}] aside a:hover,
html[${ROOT_FLAG}] [role="navigation"] a:hover,
html[${ROOT_FLAG}] [role="navigation"] button:hover,
html[${ROOT_FLAG}] [aria-current="page"],
html[${ROOT_FLAG}] [aria-selected="true"],
html[${ROOT_FLAG}] [data-state="active"],
html[${ROOT_FLAG}] [class*="selected" i],
html[${ROOT_FLAG}] [class*="active" i] {
  background: #292929 !important;
  background-color: #292929 !important;
  color: #fff !important;
}
html[${ROOT_FLAG}] a,
html[${ROOT_FLAG}] a:visited,
html[${ROOT_FLAG}] button,
html[${ROOT_FLAG}] [role="button"] { color: #d0d0d0 !important; }
html[${ROOT_FLAG}] input,
html[${ROOT_FLAG}] textarea,
html[${ROOT_FLAG}] select,
html[${ROOT_FLAG}] option {
  background-color: #202020 !important;
  color: #eee !important;
  border-color: #555 !important;
}
html[${ROOT_FLAG}] img,
html[${ROOT_FLAG}] svg,
html[${ROOT_FLAG}] svg *,
html[${ROOT_FLAG}] canvas,
html[${ROOT_FLAG}] video { background-color: transparent !important; }
`;

function installStyle(root) {
  if (!root || root.getElementById?.(STYLE_ID) || root.querySelector?.(`#${STYLE_ID}`)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = DARK_CSS.replaceAll(`html[${ROOT_FLAG}] `, '');
  root.appendChild(style);
}

function removeStyle(root) {
  root?.querySelector?.(`#${STYLE_ID}`)?.remove();
}

function walkShadowRoots(node, action) {
  if (!node) return;
  const elements = node.querySelectorAll ? node.querySelectorAll('*') : [];
  for (const el of elements) {
    if (el.shadowRoot) {
      action(el.shadowRoot);
      walkShadowRoots(el.shadowRoot, action);
    }
  }
}

function enable() {
  enabled = true;
  document.documentElement?.setAttribute(ROOT_FLAG, '');
  installStyle(document.head || document.documentElement);
  walkShadowRoots(document, installStyle);

  if (!observer) {
    observer = new MutationObserver((mutations) => {
      if (!enabled) return;
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType !== Node.ELEMENT_NODE) continue;
          if (node.shadowRoot) installStyle(node.shadowRoot);
          walkShadowRoots(node, installStyle);
        }
      }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }
}

function disable() {
  enabled = false;
  document.documentElement?.removeAttribute(ROOT_FLAG);
  removeStyle(document);
  walkShadowRoots(document, removeStyle);
  observer?.disconnect();
  observer = null;
}

chrome.runtime.onMessage.addListener((message) => {
  if (message?.type === 'OKTA_DARK_MODE_ENABLE') enable();
  if (message?.type === 'OKTA_DARK_MODE_DISABLE') disable();
});
