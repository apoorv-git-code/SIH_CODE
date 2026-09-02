// js/namaskar.js
// Slow-motion "नमस्कार" splash intro -> gentle dive into the launch page.

document.addEventListener('DOMContentLoaded', () => {
  const intro = document.getElementById('namaskar-intro');
  const text = document.getElementById('namaskar-text');
  const sub = document.getElementById('namaskar-sub');
  const glow = document.getElementById('namaskar-glow');
  const launch = document.getElementById('launch-page');
  if (!intro || !text) return;

  // Split "नमस्कार" into grapheme clusters (not raw code units) so that
  // combining marks like ् (virama) and ा (aa-matra) stay attached to
  // their base consonant instead of rendering as orphaned marks.
  const rawText = text.textContent.trim();
  let glyphs;
  if (typeof Intl !== 'undefined' && Intl.Segmenter) {
    const segmenter = new Intl.Segmenter('hi', { granularity: 'grapheme' });
    glyphs = Array.from(segmenter.segment(rawText), s => s.segment);
  } else {
    // Fallback for older browsers without Intl.Segmenter support.
    glyphs = Array.from(rawText);
  }

  text.innerHTML = glyphs
    .map(ch => `<span style="display:inline-block; opacity:0; transform:translateY(18px) scale(0.85);">${ch}</span>`)
    .join('');

  // Hide the main app underneath while the intro plays.
  if (launch) launch.style.visibility = 'hidden';

  const tl = anime.timeline({
    easing: 'easeOutExpo',
    complete: () => {
      // Dive into the site: intro scales up + fades, launch page fades/scales in.
      if (launch) {
        launch.style.visibility = 'visible';
        launch.style.opacity = 0;
        launch.style.transform = 'scale(1.04)';
        anime({
          targets: launch,
          opacity: [0, 1],
          scale: [1.04, 1],
          duration: 1400,
          easing: 'easeOutQuart'
        });
      }
      anime({
        targets: intro,
        opacity: [1, 0],
        scale: [1, 1.15],
        duration: 1100,
        easing: 'easeInQuart',
        complete: () => intro.remove()
      });
    }
  });

  tl
    // Soft glow breathes in first, very slowly.
    .add({
      targets: glow,
      opacity: [0, 1],
      scale: [0.6, 1],
      duration: 1400
    })
    // Letters of नमस्कार drift up into place, one at a time, slow-mo.
    .add({
      targets: text.querySelectorAll('span'),
      opacity: [0, 1],
      translateY: [18, 0],
      scale: [0.85, 1],
      duration: 900,
      delay: anime.stagger(180)
    }, '-=900')
    // Gentle hold + a slow breathing pulse on the whole word.
    .add({
      targets: text,
      scale: [1, 1.05, 1],
      duration: 1600,
      easing: 'easeInOutSine'
    })
    // Subtitle fades in beneath.
    .add({
      targets: sub,
      opacity: [0, 1],
      translateY: [10, 0],
      duration: 800
    }, '-=1200')
    // A brief pause so it reads as a deliberate, calm greeting.
    .add({ duration: 900 });
});