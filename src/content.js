const CODE_BLOCK_WRAPPER_SELECTOR = '.markdown-code-block';
const CODE_BLOCK_SELECTOR = 'pre.code, pre > code';
const CLIPBOARD_BUTTON_SELECTOR =
  'button.gl-button.btn-icon[data-clipboard-target]';
const COLLAPSE_BUTTON_CLASS = 'js-toggle-collapse-button';
const COLLAPSE_ICON_CLASS = 'gl-button-icon';
const PROCESSED_MARKER_CLASS = 'code-collapser-processed';
const COLLAPSED_CLASS = 'code-collapsed';
const COLLAPSIBLE_BLOCK_CLASS = 'collapsible-code-block';

// Mermaid関連のセレクタ
const MERMAID_CONTAINER_SELECTOR = '.mermaid';

const ICON_DATA_COLLAPSE =
  'M11.22 5.22a.75.75 0 0 1 0 1.06L8.5 9l2.72 2.72a.75.75 0 1 1-1.06 1.06L8 10.59l-2.16 2.19a.75.75 0 0 1-1.06-1.06l2.72-2.72a.75.75 0 0 1 0-1.06L4.78 6.28a.75.75 0 0 1 1.06-1.06L8 7.94l2.16-2.22a.75.75 0 0 1 1.06 0Z'; // 上矢印（折りたたむ）
const ICON_DATA_EXPAND =
  'M4.78 10.78a.75.75 0 0 0 1.06 0L8 8.56l2.16 2.22a.75.75 0 1 0 1.06-1.06l-2.72-2.78a.75.75 0 0 0-1.06 0L4.78 9.72a.75.75 0 0 0 0 1.06Z'; // 下矢印（展開する）

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

function isMermaidContent(wrapper) {
  // MermaidコンテンツかどうかのHTMLチェック - より詳細に確認

  // 1. プレビューモードでのマークダウンコードブロックの検証
  const preElement = wrapper.querySelector('pre');
  if (preElement) {
    // pre要素自体のクラスをチェック
    if (preElement.classList.contains('language-mermaid')) {
      return true;
    }

    // data-canonical-lang属性で"mermaid"を持つコードブロック
    if (preElement.getAttribute('data-canonical-lang') === 'mermaid') {
      return true;
    }

    // pre要素内部のcodeタグもチェック
    const codeElement = preElement.querySelector('code');
    if (
      codeElement &&
      (codeElement.classList.contains('language-mermaid') ||
        codeElement.getAttribute('data-canonical-lang') === 'mermaid')
    ) {
      return true;
    }
  }

  // 2. レンダリングされたMermaidグラフを探す
  if (
    wrapper.classList.contains('mermaid') ||
    wrapper.querySelector(MERMAID_CONTAINER_SELECTOR) ||
    wrapper.querySelector('[role="graphics-document document"]')
  ) {
    return true;
  }

  // 3. Mermaidが埋め込まれたiframeやその他の要素をチェック
  const outerHtml = wrapper.innerHTML;
  if (
    outerHtml &&
    (outerHtml.includes('data-canonical-lang="mermaid"') ||
      outerHtml.includes('class="language-mermaid"') ||
      outerHtml.includes('class="language-mermaid') || // クォーテーションの違いに対応
      outerHtml.includes('sandbox/mermaid') ||
      outerHtml.includes('mermaid-alert-container'))
  ) {
    return true;
  }

  // 追加: wrapper自体に含まれるすべてのpre要素を調べる
  const allPreElements = wrapper.querySelectorAll('pre');
  for (const pre of allPreElements) {
    if (pre.classList.contains('language-mermaid')) {
      return true;
    }
  }

  // 4. 親要素のチェック - コードブロックがMermaidダイアグラムの中に存在する場合
  let parentElement = wrapper.parentElement;
  for (let i = 0; i < 3 && parentElement; i++) {
    // 最大3レベル上まで確認
    if (
      parentElement.classList.contains('mermaid') ||
      parentElement.querySelector('.mermaid')
    ) {
      return true;
    }
    parentElement = parentElement.parentElement;
  }

  return false;
}

function addCollapseButtons(targetNode) {
  if (
    targetNode.nodeType !== Node.ELEMENT_NODE ||
    typeof targetNode.querySelectorAll !== 'function'
  )
    return;

  const wrappers = targetNode.matches(CODE_BLOCK_WRAPPER_SELECTOR)
    ? [targetNode]
    : Array.from(targetNode.querySelectorAll(CODE_BLOCK_WRAPPER_SELECTOR));

  if (wrappers.length === 0) return;

  for (const wrapper of wrappers) {
    if (wrapper.classList.contains(PROCESSED_MARKER_CLASS)) continue;

    // Mermaidダイアグラムの場合はスキップ
    const preElements = wrapper.querySelectorAll('pre');
    let isMermaid = false;

    // 直接pre要素のクラスをチェック（最も確実な方法）
    for (const pre of preElements) {
      if (pre.classList.contains('language-mermaid')) {
        isMermaid = true;
        break;
      }
    }

    // より包括的なチェック
    if (isMermaid || isMermaidContent(wrapper)) {
      // 処理済みとしてマークするだけで折りたたみ機能は追加しない
      wrapper.classList.add(PROCESSED_MARKER_CLASS);
      console.log('Mermaid diagram detected, skipping collapse functionality');
      continue;
    }

    const codeBlock = wrapper.querySelector(CODE_BLOCK_SELECTOR);
    const existingClipboardButton = wrapper.querySelector(
      CLIPBOARD_BUTTON_SELECTOR,
    );

    if (!codeBlock || !existingClipboardButton) continue;

    const collapseButton = document.createElement('button');
    collapseButton.type = 'button';
    collapseButton.className = existingClipboardButton.className;
    collapseButton.classList.add(COLLAPSE_BUTTON_CLASS);

    // 最初は折りたたまれている状態なので、展開するボタンを表示
    const initialLabel = 'コードを展開する';
    collapseButton.setAttribute('aria-label', initialLabel);
    collapseButton.setAttribute('title', initialLabel);

    // 折りたたまれている状態では下矢印を表示（展開することを示す）
    const collapseIcon = createIcon(ICON_DATA_EXPAND);
    collapseButton.appendChild(collapseIcon);

    collapseButton.addEventListener('click', (event) => {
      event.stopPropagation();
      codeBlock.classList.toggle(COLLAPSED_CLASS);

      // 折りたたまれているかどうかの状態を取得
      const isCollapsed = codeBlock.classList.contains(COLLAPSED_CLASS);

      // 折りたたみ状態に応じてアイコンとラベルを更新
      // isCollapsed=true: 折りたたまれている → 下矢印（展開する）
      // isCollapsed=false: 展開されている → 上矢印（折りたたむ）
      const newIconData = isCollapsed ? ICON_DATA_EXPAND : ICON_DATA_COLLAPSE;
      const newLabel = isCollapsed ? 'コードを展開する' : 'コードを折りたたむ';

      // アイコンの更新
      const pathElement = collapseIcon.querySelector('path');
      if (pathElement) {
        pathElement.setAttribute('d', newIconData);
      }

      // ラベルの更新
      collapseButton.setAttribute('aria-label', newLabel);
      collapseButton.setAttribute('title', newLabel);

      // ボタンの表示状態は変更せず、常に両方表示する
      // （ボタンの表示/非表示の切り替えを停止）
    });

    // 最初は両方のボタンを表示する
    collapseButton.style.display = '';
    existingClipboardButton.style.display = '';

    // 折りたたみボタンを追加
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

// DOMが完全に読み込まれた後に実行
function initializeExtension() {
  try {
    console.log('GitLab Code Collapser: 初期化開始');
    addCollapseButtons(document.body);
    console.log('GitLab Code Collapser: 初期コードブロック処理完了');
  } catch (error) {
    console.error('GitLab Code Collapser 初期実行エラー:', error);
  }

  try {
    observer.observe(targetNode, config);
    console.log('GitLab Code Collapser: 監視開始');
  } catch (error) {
    console.error('GitLab Code Collapser 監視開始エラー:', error);
  }
}

// ページ読み込み完了時またはすでに読み込み済みの場合に初期化
if (document.readyState === 'complete') {
  initializeExtension();
} else {
  window.addEventListener('load', initializeExtension);
}
