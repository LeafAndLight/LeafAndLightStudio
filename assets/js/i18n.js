(() => {
  'use strict';

  const STORAGE_KEY = 'leaf-light-language';
  const SUPPORTED = ['en', 'pt-BR', 'es', 'de', 'zh-CN'];
  const CODES = { en: 'EN', 'pt-BR': 'PT', es: 'ES', de: 'DE', 'zh-CN': '中' };
  const TITLE = 'Leaf & Light Studio | VR & Meta Quest Game Development';
  const locales = window.I18N_LOCALES || {};
  const textSources = new WeakMap();
  const attributeSources = new WeakMap();
  const translatedAttributes = ['placeholder', 'aria-label', 'title', 'alt'];
  let currentLanguage = storedLanguage();
  let observer;

  function storedLanguage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return SUPPORTED.includes(stored) ? stored : 'en';
    } catch (error) {
      return 'en';
    }
  }

  function translate(source, language = currentLanguage) {
    return language === 'en' ? source : locales[language]?.[source] || source;
  }

  function isIgnored(node) {
    const element = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
    return !element || Boolean(element.closest('[data-i18n-ignore],script,style,noscript,svg,code,pre'));
  }

  function rememberText(node, replaceSource = false) {
    if (isIgnored(node)) return;
    const source = (node.nodeValue || '').trim();
    if (!source) return;
    if (replaceSource || !textSources.has(node)) textSources.set(node, source);
  }

  function rememberAttributes(element, replaceSource = false) {
    if (isIgnored(element)) return;
    let sources = attributeSources.get(element);
    if (!sources) {
      sources = new Map();
      attributeSources.set(element, sources);
    }
    translatedAttributes.forEach(attribute => {
      if (!element.hasAttribute(attribute)) return;
      if (replaceSource || !sources.has(attribute)) sources.set(attribute, element.getAttribute(attribute));
    });
  }

  function rememberSubtree(root) {
    if (!root || isIgnored(root)) return;
    if (root.nodeType === Node.TEXT_NODE) {
      rememberText(root);
      return;
    }
    if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) return;
    if (root.nodeType === Node.ELEMENT_NODE) rememberAttributes(root);
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
    let node = walker.nextNode();
    while (node) {
      if (node.nodeType === Node.TEXT_NODE) rememberText(node);
      else rememberAttributes(node);
      node = walker.nextNode();
    }
  }

  function applyText(node) {
    const source = textSources.get(node);
    if (!source || !node.nodeValue) return;
    const visible = node.nodeValue.trim();
    if (visible) node.nodeValue = node.nodeValue.replace(visible, translate(source));
  }

  function applyAttributes(element) {
    attributeSources.get(element)?.forEach((source, attribute) => {
      element.setAttribute(attribute, translate(source));
    });
  }

  function observe() {
    observer?.observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: translatedAttributes
    });
  }

  function applySubtree(root = document.body) {
    observer?.disconnect();
    rememberSubtree(root);
    if (root.nodeType === Node.TEXT_NODE) {
      applyText(root);
    } else {
      if (root.nodeType === Node.ELEMENT_NODE) applyAttributes(root);
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
      let node = walker.nextNode();
      while (node) {
        if (node.nodeType === Node.TEXT_NODE) applyText(node);
        else applyAttributes(node);
        node = walker.nextNode();
      }
    }
    if (root === document.body) document.title = translate(TITLE);
    observe();
  }

  function updateSwitcher() {
    const switcher = document.querySelector('.language-switcher');
    const current = switcher?.querySelector('.language-current');
    if (current) current.textContent = CODES[currentLanguage];
    switcher?.querySelectorAll('[data-language]').forEach(button => {
      button.setAttribute('aria-checked', String(button.dataset.language === currentLanguage));
    });
  }

  function setLanguage(language, { persist = true } = {}) {
    if (!SUPPORTED.includes(language)) return;
    currentLanguage = language;
    document.documentElement.lang = language;
    if (persist) {
      try { localStorage.setItem(STORAGE_KEY, language); } catch (error) { /* Storage can be disabled. */ }
    }
    applySubtree(document.body);
    updateSwitcher();
    window.dispatchEvent(new CustomEvent('site:languagechange', { detail: { language } }));
  }

  function closeMenu({ returnFocus = false } = {}) {
    const switcher = document.querySelector('.language-switcher');
    const toggle = switcher?.querySelector('.language-toggle');
    const menu = switcher?.querySelector('.language-menu');
    if (!switcher || !toggle || !menu) return;
    switcher.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    menu.hidden = true;
    if (returnFocus) toggle.focus();
  }

  function setupSwitcher() {
    const switcher = document.querySelector('.language-switcher');
    const toggle = switcher?.querySelector('.language-toggle');
    const menu = switcher?.querySelector('.language-menu');
    if (!switcher || !toggle || !menu) return;

    toggle.addEventListener('click', () => {
      const opening = menu.hidden;
      menu.hidden = !opening;
      switcher.classList.toggle('is-open', opening);
      toggle.setAttribute('aria-expanded', String(opening));
      if (opening) menu.querySelector(`[data-language="${currentLanguage}"]`)?.focus();
    });

    menu.querySelectorAll('[data-language]').forEach(button => {
      button.addEventListener('click', () => {
        setLanguage(button.dataset.language);
        closeMenu({ returnFocus: true });
      });
    });

    document.addEventListener('pointerdown', event => {
      if (!switcher.contains(event.target)) closeMenu();
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && !menu.hidden) closeMenu({ returnFocus: true });
    });
  }

  observer = new MutationObserver(mutations => {
    observer.disconnect();
    mutations.forEach(mutation => {
      if (mutation.type === 'characterData') {
        rememberText(mutation.target, true);
        applyText(mutation.target);
      } else if (mutation.type === 'attributes') {
        rememberAttributes(mutation.target, true);
        applyAttributes(mutation.target);
      } else {
        mutation.addedNodes.forEach(node => applySubtree(node));
      }
    });
    observe();
  });

  window.SiteI18n = Object.freeze({ getLanguage: () => currentLanguage, setLanguage, t: translate });
  setupSwitcher();
  rememberSubtree(document.body);
  setLanguage(currentLanguage, { persist: false });
})();