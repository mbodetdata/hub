'use strict';

(function () {
  var doc = document;
  var root = doc.documentElement;
  var fallbackTarget = 'https://bmdata.fr/hub/';
  var configuredTarget = (root.getAttribute('data-target-url') || '').trim() || fallbackTarget;
  var metaRefresh = doc.querySelector('meta[http-equiv="refresh"]');
  var statusEl = doc.getElementById('redirect-status');
  var linkEl = doc.getElementById('redirect-link');
  var titleEl = doc.querySelector('title');
  var currentCanonical = canonicalize(window.location.href);

  function canonicalize(url) {
    try {
      var parsed = new URL(url, window.location.href);
      var pathname = parsed.pathname.replace(/\/+$/, '') || '/';
      return parsed.origin + pathname;
    } catch (err) {
      return null;
    }
  }

  function sanitize(url) {
    if (!url) return fallbackTarget;
    try {
      return new URL(url, window.location.origin).href;
    } catch (err) {
      return fallbackTarget;
    }
  }

  function updateStatus(message) {
    if (statusEl) statusEl.textContent = message;
  }

  function applyRedirect(target) {
    var finalUrl = sanitize(target);
    var targetCanonical = canonicalize(finalUrl);

    if (currentCanonical && targetCanonical && targetCanonical === currentCanonical) {
      if (metaRefresh) metaRefresh.removeAttribute('content');
      updateStatus('Vous êtes déjà sur la destination.');
      return;
    }

    if (linkEl) linkEl.href = finalUrl;
    if (metaRefresh) metaRefresh.setAttribute('content', '0; url=' + finalUrl);
    if (titleEl) titleEl.textContent = 'BMdata · Redirection vers ' + finalUrl;
    updateStatus('Vous allez être redirigé vers ' + finalUrl + '.');

    setTimeout(function () {
      window.location.replace(finalUrl);
    }, 80);
  }

  updateStatus('Initialisation de la redirection...');
  applyRedirect(configuredTarget);
})();
