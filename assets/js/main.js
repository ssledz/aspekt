(function () {
  "use strict";

  var STORAGE_KEY = "aspekt-lang";
  var THEME_STORAGE_KEY = "aspekt-theme";
  var defaultLang = document.documentElement.lang || "pl";

  function getLang() {
    try {
      return localStorage.getItem(STORAGE_KEY) || defaultLang;
    } catch (e) {
      return defaultLang;
    }
  }

  function resolve(key) {
    if (!window.I18N) return null;
    var lang = window.currentLang || getLang();
    var dict = window.I18N[lang];
    if (!dict) return null;
    return key.split(".").reduce(function (acc, part) {
      return acc == null ? null : acc[part];
    }, dict);
  }

  function apply(lang) {
    window.currentLang = lang;
    document.documentElement.lang = lang;

    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var value = resolve(el.getAttribute("data-i18n"));
      if (value != null) el.textContent = value;
    });

    document.querySelectorAll("[data-i18n-pl]").forEach(function (el) {
      var value = el.getAttribute("data-i18n-" + lang);
      if (value != null) el.textContent = value;
    });

    document.dispatchEvent(new CustomEvent("langchange", { detail: { lang: lang } }));
  }

  function toggle() {
    var next = getLang() === "pl" ? "en" : "pl";
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch (e) {
      /* storage may be unavailable (private mode) — fall back to default */
    }
    apply(next);
  }

  function getTheme() {
    try {
      var stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored === "light" || stored === "dark") return stored;
    } catch (e) {
      /* storage may be unavailable (private mode) */
    }
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
  }

  function toggleTheme() {
    var next = getTheme() === "dark" ? "light" : "dark";
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch (e) {
      /* storage may be unavailable (private mode) */
    }
    applyTheme(next);
  }

  document.addEventListener("DOMContentLoaded", function () {
    apply(getLang());
    applyTheme(getTheme());
    var btn = document.getElementById("lang-toggle");
    if (btn) btn.addEventListener("click", toggle);
    var themeBtn = document.getElementById("theme-toggle");
    if (themeBtn) themeBtn.addEventListener("click", toggleTheme);
  });
})();
