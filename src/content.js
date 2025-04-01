const CODE_BLOCK_WRAPPER_SELECTOR = '.markdown-code-block';
const CODE_BLOCK_SELECTOR = 'pre.code, pre > code';
const CLIPBOARD_BUTTON_SELECTOR =
  'button.gl-button.btn-icon[data-clipboard-target]';
const COLLAPSE_BUTTON_CLASS = 'js-toggle-collapse-button';
const COLLAPSE_ICON_CLASS = 'gl-button-icon';
const PROCESSED_MARKER_CLASS = 'code-collapser-processed';
const COLLAPSED_CLASS = 'code-collapsed';
const COLLAPSIBLE_BLOCK_CLASS = 'collapsible-code-block';

const ICON_DATA_COLLAPSE =
  'M4.78 10.78a.75.75 0 0 0 1.06 0L8 8.56l2.16 2.22a.75.75 0 1 0 1.06-1.06l-2.72-2.78a.75.75 0 0 0-1.06 0L4.78 9.72a.75.75 0 0 0 0 1.06Z';
const ICON_DATA_EXPAND =
  'M11.22 5.22a.75.75 0 0 1 0 1.06L8.5 9l2.72 2.72a.75.75 0 1 1-1.06 1.06L8 10.59l-2.16 2.19a.75.75 0 0 1-1.06-1.06l2.72-2.72a.75.75 0 0 1 0-1.06L4.78 6.28a.75.75 0 0 1 1.06-1.06L8 7.94l2.16-2.22a.75.75 0 0 1 1.06 0Z';

function createIcon(svgPathData) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', COLLAPSE_ICON_CLASS);
  svg.setAttribute('viewBox', '0 0 16 16');
  svg.setAttribute('width', '16');
  svg.setAttribute('height', '16');
  svg.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', svgPathData);
  svg.appendChild(path);
  return svg;
}

function addCollapseButtons(targetNode) {
  if (
    targetNode.nodeType !== Node.ELEMENT_NODE ||
    typeof targetNode.querySelectorAll !== 'function'
  ) {
    return;
  }

  const wrappers = targetNode.matches(CODE_BLOCK_WRAPPER_SELECTOR)
    ? [targetNode]
    : Array.from(targetNode.querySelectorAll(CODE_BLOCK_WRAPPER_SELECTOR));

  if (wrappers.length === 0) return;

  for (const wrapper of wrappers) {
    if (wrapper.classList.contains(PROCESSED_MARKER_CLASS)) continue;

    const codeBlock = wrapper.querySelector(CODE_BLOCK_SELECTOR);
    const existingClipboardButton = wrapper.querySelector(
      CLIPBOARD_BUTTON_SELECTOR,
    );

    if (!codeBlock || !existingClipboardButton) continue;

    const collapseButton = document.createElement('button');
    collapseButton.type = 'button';
    collapseButton.className = existingClipboardButton.className;
    collapseButton.classList.add(COLLAPSE_BUTTON_CLASS);

    const initialLabel = 'コードを展開する';
    collapseButton.setAttribute('aria-label', initialLabel);
    collapseButton.setAttribute('title', initialLabel);

    const collapseIcon = createIcon(ICON_DATA_EXPAND);
    collapseButton.appendChild(collapseIcon);

    collapseButton.addEventListener('click', (event) => {
      event.stopPropagation();
      codeBlock.classList.toggle(COLLAPSED_CLASS);
      const isCollapsed = codeBlock.classList.contains(COLLAPSED_CLASS);
      const newIconData = isCollapsed ? ICON_DATA_EXPAND : ICON_DATA_COLLAPSE;
      const newLabel = isCollapsed ? 'コードを展開する' : 'コードを折りたたむ';

      collapseIcon.querySelector('path').setAttribute('d', newIconData);
      collapseButton.setAttribute('aria-label', newLabel);
      collapseButton.setAttribute('title', newLabel);
    });

    existingClipboardButton.parentNode.insertBefore(
      collapseButton,
      existingClipboardButton,
    );
    wrapper.classList.add(PROCESSED_MARKER_CLASS);
    codeBlock.classList.add(COLLAPSIBLE_BLOCK_CLASS);
    codeBlock.classList.add(COLLAPSED_CLASS);
  }
}

const observer = new MutationObserver((mutationsList) => {
  for (const mutation of mutationsList) {
    if (mutation.type !== 'childList') continue;

    for (const node of mutation.addedNodes) {
      if (node.nodeType !== Node.ELEMENT_NODE) continue;

      if (
        node.matches(CODE_BLOCK_WRAPPER_SELECTOR) ||
        node.querySelector(CODE_BLOCK_WRAPPER_SELECTOR)
      ) {
        addCollapseButtons(node);
      }
    }
  }
});

const targetNode = document.body;
const config = { childList: true, subtree: true };

try {
  addCollapseButtons(document.body);
} catch (error) {
  console.error('Code Collapser initial run failed:', error);
}

try {
  observer.observe(targetNode, config);
} catch (error) {
  console.error('Code Collapser observer failed to start:', error);
}
