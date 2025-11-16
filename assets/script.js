'use strict';

(function () {
  var shareBtn = document.querySelector('[data-share-hub]');
  if (!shareBtn) return;

  var feedback = document.querySelector('.hub-share__feedback');
  var shareUrl = shareBtn.getAttribute('data-share-hub');
  var shareText = 'Découvrez le hub de Martial Bodet';

  function showMessage(message) {
    if (!feedback) return;
    feedback.textContent = message;
    clearTimeout(feedback._timer);
    feedback._timer = setTimeout(function () {
      feedback.textContent = '';
    }, 3200);
  }

  shareBtn.addEventListener('click', function () {
    if (navigator.share) {
      navigator.share({ title: document.title, text: shareText, url: shareUrl })
        .then(function () { showMessage('Lien partagé ✔'); })
        .catch(function (error) {
          if (error && error.name === 'AbortError') return;
          copyFallback();
        });
    } else {
      copyFallback();
    }
  });

  function copyFallback() {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(shareUrl)
        .then(function () { showMessage('Lien copié dans le presse-papiers'); })
        .catch(function () { showMessage('Impossible de copier le lien'); });
    } else {
      showMessage('Partage indisponible sur cet appareil');
    }
  }
})();
