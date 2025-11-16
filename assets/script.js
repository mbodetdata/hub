'use strict';

(function () {
  var shareBtn = document.querySelector('[data-share-hub]');
  if (!shareBtn) return;

  var feedback = document.querySelector('.hub-share__feedback');
  var shareUrl = shareBtn.getAttribute('data-share-hub');
  var shareText = 'D\u00e9couvrez la carte de visite num\u00e9rique de Martial Bodet';

  function showMessage(message) {
    if (!feedback) return;
    feedback.textContent = message;
    clearTimeout(feedback._timer);
    feedback._timer = setTimeout(function () {
      feedback.textContent = '';
    }, 3200);
  }

  function copyFallback() {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(shareUrl)
        .then(function () { showMessage('Lien copi\u00e9 dans le presse-papiers'); })
        .catch(function () { showMessage('Impossible de copier le lien'); });
    } else {
      showMessage('Partage indisponible sur cet appareil');
    }
  }

  shareBtn.addEventListener('click', function () {
    if (navigator.share) {
      navigator.share({ title: document.title, text: shareText, url: shareUrl })
        .then(function () { showMessage('Lien partag\u00e9 avec succ\u00e8s'); })
        .catch(function (error) {
          if (error && error.name === 'AbortError') return;
          copyFallback();
        });
    } else {
      copyFallback();
    }
  });
})();

(function () {
  var carousels = document.querySelectorAll('[data-carousel]');
  if (!carousels.length) return;

  carousels.forEach(function (carousel) {
    var track = carousel.querySelector('[data-carousel-track]');
    if (!track) return;

    var prevBtn = carousel.querySelector('[data-carousel-prev]');
    var nextBtn = carousel.querySelector('[data-carousel-next]');

    function scrollByCards(direction) {
      var card = track.querySelector('.hub-featured__item');
      var cardWidth = card ? card.getBoundingClientRect().width : track.clientWidth;
      var gap = parseFloat(window.getComputedStyle(track).columnGap || window.getComputedStyle(track).gap || 16);
      var delta = (cardWidth + gap) * direction * 1.05;
      track.scrollBy({ left: delta, behavior: 'smooth' });
    }

    function updateButtons() {
      var maxScroll = track.scrollWidth - track.clientWidth;
      if (prevBtn) prevBtn.disabled = track.scrollLeft <= 8;
      if (nextBtn) nextBtn.disabled = track.scrollLeft >= maxScroll - 8;
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', function () { scrollByCards(-1); });
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', function () { scrollByCards(1); });
    }

    track.addEventListener('scroll', function () {
      window.requestAnimationFrame(updateButtons);
    });

    updateButtons();
  });
})();
