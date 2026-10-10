(function () {
  "use strict";

  var AUTOPLAY_MS = 3000;
  var currentScope = "all";
  var loopOn = false;
  var lightbox = null;
  var autoplayTimer = null;

  function items() {
    return Array.prototype.slice.call(document.querySelectorAll(".gallery-item"));
  }

  function applyScope() {
    items().forEach(function (el) {
      var visible = currentScope === "all" || el.getAttribute("data-folder") === currentScope;
      el.classList.toggle("is-hidden", !visible);
      el.classList.toggle("glightbox", visible);
      el.setAttribute("data-gallery", currentScope);
    });
  }

  function stopAutoplay() {
    if (autoplayTimer) {
      clearInterval(autoplayTimer);
      autoplayTimer = null;
    }
  }

  function startAutoplay() {
    stopAutoplay();
    if (!loopOn) return;
    autoplayTimer = setInterval(function () {
      if (lightbox) lightbox.nextSlide();
    }, AUTOPLAY_MS);
  }

  function initLightbox() {
    if (lightbox) {
      try {
        lightbox.destroy();
      } catch (e) {
        /* ignore — instance may already be torn down */
      }
    }
    applyScope();
    lightbox = GLightbox({
      selector: ".glightbox",
      loop: loopOn,
      touchNavigation: true,
      keyboardNavigation: true,
      draggable: true
    });
    lightbox.on("open", startAutoplay);
    lightbox.on("close", stopAutoplay);
  }

  function updateTabs() {
    document.querySelectorAll("#gallery-tabs .tab").forEach(function (tab) {
      tab.classList.toggle("is-active", tab.getAttribute("data-scope") === currentScope);
    });
  }

  function setTabLabels() {
    var lang = window.currentLang || "pl";
    document.querySelectorAll("#gallery-tabs .tab[data-i18n-pl]").forEach(function (tab) {
      var value = tab.getAttribute("data-i18n-" + lang);
      if (value != null) tab.textContent = value;
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    var tabs = document.getElementById("gallery-tabs");
    tabs.addEventListener("click", function (e) {
      var tab = e.target.closest(".tab");
      if (!tab) return;
      currentScope = tab.getAttribute("data-scope");
      updateTabs();
      initLightbox();
    });

    var loopInput = document.getElementById("loop-toggle");
    loopInput.addEventListener("change", function () {
      loopOn = loopInput.checked;
      initLightbox();
    });

    setTabLabels();
    document.addEventListener("langchange", setTabLabels);
    initLightbox();
  });
})();
