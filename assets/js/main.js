const heroBackground = document.querySelector('.hero-bg');
const slideDots = document.querySelector('.slide-dots');
const heroImages = Array.isArray(window.HERO_IMAGES) ? window.HERO_IMAGES : [];
heroImages.forEach((image, index) => {
  const slide = document.createElement('div');
  slide.className = `hero-slide${index === 0 ? ' active' : ''}`;

  const img = document.createElement('img');
  img.src = image.src;
  img.alt = image.alt || '';
  img.style.objectPosition = image.position || 'center';
  slide.appendChild(img);
  heroBackground?.appendChild(slide);

  const dot = document.createElement('button');
  dot.type = 'button';
  dot.className = index === 0 ? 'active' : '';
  dot.dataset.index = String(index);
  dot.setAttribute('aria-label', `Show slide ${index + 1}`);
  slideDots?.appendChild(dot);
});

const slides = Array.from(document.querySelectorAll('.hero-slide'));
const dots = Array.from(document.querySelectorAll('.slide-dots button'));
let activeIndex = 0;

function showSlide(index) {
  slides.forEach((slide, i) => slide.classList.toggle('active', i === index));
  dots.forEach((dot, i) => dot.classList.toggle('active', i === index));
  activeIndex = index;
}

dots.forEach(dot => {
  dot.addEventListener('click', () => showSlide(Number(dot.dataset.index)));
});

if (slides.length > 1) {
  setInterval(() => showSlide((activeIndex + 1) % slides.length), 5000);
}

const emailAddress = 'leafandlightcontac@gmail.com';
const copyEmailBtn = document.getElementById('copyEmailBtn');
const contactForm = document.getElementById('contactForm');
const formNote = document.getElementById('formNote');
const contactCard = document.getElementById('contactCard');
const contactName = document.getElementById('contactName');
const contactEmail = document.getElementById('contactEmail');
const contactMessage = document.getElementById('contactMessage');
const submitButton = contactForm?.querySelector('.submit-btn');
const projectCards = Array.from(document.querySelectorAll('#projects .project-card--compact'));

function selectProjectCard(selectedCard, { playTheme = false } = {}) {
  projectCards.forEach(card => {
    const isSelected = card === selectedCard;
    card.classList.toggle('is-selected', isSelected);
    card.setAttribute('aria-selected', String(isSelected));
  });

  if (playTheme) playProjectTheme(projectCards.indexOf(selectedCard));
}

projectCards.forEach(card => {
  card.tabIndex = 0;
  card.addEventListener('click', event => {
    if (event.target.closest('a, iframe, button')) return;
    selectProjectCard(card, { playTheme: true });
  });
  card.addEventListener('focusin', () => selectProjectCard(card));
  card.addEventListener('keydown', event => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    selectProjectCard(card, { playTheme: true });
  });
});

if (projectCards.length) selectProjectCard(projectCards[0]);

// Talent solar system: every label follows one ellipse while its ring only floats.
const talentSystem = document.querySelector('.approach-visual');

if (talentSystem) {
  const talentRings = Array.from(talentSystem.querySelectorAll('.talent-orbit'));
  const reducedTalentMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const ringPeriods = [56000, 52500, 49500];
  const floatPeriods = [11200, 12800, 14500];
  const floatPhases = [0.3, 2.1, 4.2];
  let talentVisible = false;
  let talentRunning = false;
  let talentClock = 0;
  let talentLastFrame = 0;
  let talentFrameCount = 0;

  const orbitingTalents = talentRings.flatMap((ring, ringIndex) =>
    Array.from(ring.querySelectorAll('.orbit-node')).map(node => ({
      node,
      ring,
      ringIndex,
      baseAngle: Number(node.dataset.angle || 0),
      speed: Number(node.dataset.speed || 1),
      nudge: 0,
      nudgeTarget: 0
    }))
  );

  function visibleOrbitingTalents() {
    return orbitingTalents.filter(talent => getComputedStyle(talent.node).display !== 'none');
  }

  let talentHighlightCursor = 0;
  let talentHighlightPhase = 0;

  function highlightTalentGroup() {
    const visibleTalents = visibleOrbitingTalents();
    if (!visibleTalents.length) return;

    const groupSizes = [3, 2, 4];
    const groupSize = Math.min(groupSizes[talentHighlightPhase % groupSizes.length], visibleTalents.length);
    const activeNodes = new Set();

    for (let index = 0; index < groupSize; index += 1) {
      activeNodes.add(visibleTalents[(talentHighlightCursor + index * 2) % visibleTalents.length].node);
    }

    orbitingTalents.forEach(talent => talent.node.classList.toggle('is-active', activeNodes.has(talent.node)));
    talentHighlightCursor = (talentHighlightCursor + 3) % visibleTalents.length;
    talentHighlightPhase += 1;
  }

  highlightTalentGroup();
  window.setInterval(() => {
    if (!reducedTalentMotion.matches) highlightTalentGroup();
  }, 3600);

  function resolveTalentCollisions() {
    const visibleTalents = visibleOrbitingTalents();
    const rects = visibleTalents.map(talent => talent.node.getBoundingClientRect());

    for (let i = 0; i < visibleTalents.length; i += 1) {
      for (let j = i + 1; j < visibleTalents.length; j += 1) {
        const a = rects[i];
        const b = rects[j];
        const padding = 5;
        const overlaps = !(
          a.right + padding < b.left ||
          b.right + padding < a.left ||
          a.bottom + padding < b.top ||
          b.bottom + padding < a.top
        );

        if (!overlaps) continue;

        const sameRing = visibleTalents[i].ringIndex === visibleTalents[j].ringIndex;
        const correction = sameRing ? 0.028 : 0.018;
        visibleTalents[i].nudgeTarget = Math.max(-0.2, visibleTalents[i].nudgeTarget - correction * 0.7);
        visibleTalents[j].nudgeTarget = Math.min(0.2, visibleTalents[j].nudgeTarget + correction);
      }
    }
  }

  function renderTalentSystem(now) {
    if (!talentVisible) {
      talentRunning = false;
      talentLastFrame = 0;
      return;
    }

    if (!talentLastFrame) talentLastFrame = now;
    talentClock += Math.min(now - talentLastFrame, 50);
    talentLastFrame = now;

    talentRings.forEach((ring, ringIndex) => {
      const floatAngle = (talentClock / floatPeriods[ringIndex]) * Math.PI * 2 + floatPhases[ringIndex];
      const offsetX = Math.cos(floatAngle) * (ringIndex === 1 ? 3 : 4);
      const offsetY = Math.sin(floatAngle) * (ringIndex === 2 ? 2.5 : 3.5);
      ring.style.transform = `translate(-50%, -50%) translate(${offsetX.toFixed(2)}px, ${offsetY.toFixed(2)}px)`;
    });

    visibleOrbitingTalents().forEach(talent => {
      talent.nudge += (talent.nudgeTarget - talent.nudge) * 0.12;
      talent.nudgeTarget *= 0.994;

      const angle = talent.baseAngle +
        (talentClock / ringPeriods[talent.ringIndex]) * Math.PI * 2 * talent.speed +
        talent.nudge;
      const centerX = talent.ring.clientWidth * 0.5;
      const centerY = talent.ring.clientHeight * 0.5;
      const x = centerX + centerX * Math.cos(angle);
      const y = centerY + centerY * Math.sin(angle);
      const depth = (Math.sin(angle) + 1) * 0.5;

      talent.node.style.left = `${x.toFixed(2)}px`;
      talent.node.style.top = `${y.toFixed(2)}px`;
      talent.node.style.opacity = (0.78 + depth * 0.22).toFixed(3);
      talent.node.style.zIndex = String(2 + Math.round(depth * 3));
    });

    talentFrameCount += 1;
    if (talentFrameCount % 3 === 0) resolveTalentCollisions();

    if (!reducedTalentMotion.matches) {
      requestAnimationFrame(renderTalentSystem);
    } else {
      talentRunning = false;
    }
  }

  function startTalentSystem() {
    if (!talentVisible || talentRunning) return;
    talentRunning = true;
    talentLastFrame = 0;
    requestAnimationFrame(renderTalentSystem);
  }

  const talentVisibilityObserver = new IntersectionObserver(entries => {
    talentVisible = entries[0].isIntersecting;
    if (talentVisible) startTalentSystem();
  }, { rootMargin: '120px' });

  const talentResizeObserver = new ResizeObserver(() => {
    if (reducedTalentMotion.matches && talentVisible) startTalentSystem();
  });

  talentVisibilityObserver.observe(talentSystem);
  talentResizeObserver.observe(talentSystem);
  talentRings.forEach(ring => talentResizeObserver.observe(ring));
  reducedTalentMotion.addEventListener('change', startTalentSystem);
}

// Contact and hiring pipeline lives in assets/js/contact-pipeline.js.

// Portfolio interaction
const portfolioShots = document.querySelectorAll('.portfolio-reveal');

if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const portfolioObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        setTimeout(() => { entry.target.style.transitionDelay = '0ms'; }, 700);
        portfolioObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.16 });

  portfolioShots.forEach((shot, index) => {
    shot.style.transitionDelay = String(Math.min(index * 70, 280)) + 'ms';
    portfolioObserver.observe(shot);
  });
} else {
  portfolioShots.forEach(shot => shot.classList.add('is-visible'));
}

portfolioShots.forEach(shot => {
  shot.addEventListener('pointermove', event => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || window.innerWidth < 900) return;
    const rect = shot.getBoundingClientRect();
    const rotateX = ((event.clientY - rect.top) / rect.height - 0.5) * -3;
    const rotateY = ((event.clientX - rect.left) / rect.width - 0.5) * 3;
    shot.style.transform = 'perspective(900px) rotateX(' + rotateX + 'deg) rotateY(' + rotateY + 'deg) translateY(-4px)';
  });

  shot.addEventListener('pointerleave', () => {
    shot.style.transform = '';
  });
});

// Active section navigation
const sectionNavLinks = Array.from(document.querySelectorAll('.menu a[href^="#"]'));
const trackedSections = sectionNavLinks
  .map(link => ({
    id: link.getAttribute('href').slice(1),
    link,
    section: document.getElementById(link.getAttribute('href').slice(1))
  }))
  .filter(item => item.section);

let navTicking = false;

function updateActiveNavigation() {
  const marker = window.scrollY + window.innerHeight * 0.32;
  let activeId = '';

  trackedSections.forEach(item => {
    if (item.section.offsetTop <= marker) {
      activeId = item.id;
    }
  });

  trackedSections.forEach(item => {
    const isActive = item.id === activeId;
    item.link.classList.toggle('is-active', isActive);
    if (isActive) {
      item.link.setAttribute('aria-current', 'location');
    } else {
      item.link.removeAttribute('aria-current');
    }
  });

  navTicking = false;
}

window.addEventListener('scroll', () => {
  if (!navTicking) {
    navTicking = true;
    window.requestAnimationFrame(updateActiveNavigation);
  }
}, { passive: true });

window.addEventListener('resize', updateActiveNavigation);
updateActiveNavigation();
// Portfolio lightbox
const portfolioOpenButtons = Array.from(document.querySelectorAll('.portfolio-open'));
const portfolioLightbox = document.getElementById('portfolioLightbox');
const lightboxImage = document.getElementById('lightboxImage');
const lightboxLabel = document.getElementById('lightboxLabel');
const lightboxTitle = document.getElementById('lightboxTitle');
const lightboxClose = portfolioLightbox?.querySelector('.lightbox-close');
const lightboxPrevious = portfolioLightbox?.querySelector('.lightbox-prev');
const lightboxNext = portfolioLightbox?.querySelector('.lightbox-next');
let lightboxIndex = 0;
let lightboxTrigger = null;

function updateLightbox(index) {
  if (!portfolioOpenButtons.length || !lightboxImage) return;

  lightboxIndex = (index + portfolioOpenButtons.length) % portfolioOpenButtons.length;
  const trigger = portfolioOpenButtons[lightboxIndex];
  const figure = trigger.closest('.shot');
  const sourceImage = trigger.querySelector('img');
  const label = figure?.querySelector('figcaption span');
  const title = figure?.querySelector('figcaption strong');

  document.querySelectorAll('#portfolio .shot.is-selected').forEach(item => item.classList.remove('is-selected'));
  figure?.classList.add('is-selected');

  lightboxImage.src = sourceImage.src;
  lightboxImage.alt = sourceImage.alt;
  lightboxLabel.textContent = label?.textContent || '';
  lightboxTitle.textContent = title?.textContent || '';
}

function openLightbox(index, trigger) {
  if (!portfolioLightbox) return;

  lightboxTrigger = trigger;
  updateLightbox(index);
  portfolioLightbox.classList.add('is-open');
  portfolioLightbox.setAttribute('aria-hidden', 'false');
  document.body.classList.add('lightbox-open');
  lightboxClose?.focus();
}

function closeLightbox() {
  if (!portfolioLightbox) return;

  portfolioLightbox.classList.remove('is-open');
  portfolioLightbox.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('lightbox-open');
  lightboxTrigger?.focus();
}

portfolioOpenButtons.forEach((button, index) => {
  button.addEventListener('click', () => openLightbox(index, button));
});

lightboxClose?.addEventListener('click', closeLightbox);
lightboxPrevious?.addEventListener('click', () => updateLightbox(lightboxIndex - 1));
lightboxNext?.addEventListener('click', () => updateLightbox(lightboxIndex + 1));

portfolioLightbox?.addEventListener('click', event => {
  if (event.target === portfolioLightbox) closeLightbox();
});

document.addEventListener('keydown', event => {
  if (!portfolioLightbox?.classList.contains('is-open')) return;

  if (event.key === 'Escape') closeLightbox();
  if (event.key === 'ArrowLeft') updateLightbox(lightboxIndex - 1);
  if (event.key === 'ArrowRight') updateLightbox(lightboxIndex + 1);
});

// Project themes start only after an explicit user action.
const ambientToggle = document.querySelector('.ambient-toggle');
const ambientVolume = document.getElementById('ambientVolume');
const ambientTrack = document.getElementById('ambientTrack');
const ambientLabel = ambientToggle?.querySelector('.ambient-label');
const ambientTrackLabel = ambientToggle?.querySelector('.ambient-track');
const projectThemes = [
  { game: 'Car Crash Arena', title: 'Hard Luck Shine', src: 'assets/audio/hard-luck-shine-car-crash-arena.mp3', start: 106 },
  { game: "I'm Prisoner", title: 'Escape Route', src: 'assets/audio/escape-route-im-prisoner.mp3', start: 126 },
  { game: 'Infinity Climb', title: 'Rare Biome', src: 'assets/audio/rare-biome-infinity-climb.mp3', start: 0 }
];
const themePlayers = projectThemes.map(theme => {
  const player = new Audio(theme.src);
  player.loop = true;
  player.preload = 'metadata';
  player.volume = 0;
  return player;
});
const fadeFrames = new WeakMap();
const playingYouTubeVideos = new Set();
let activeThemeIndex = -1;
let musicEnabled = false;

function selectedVolume() {
  return Math.min(Number(ambientVolume?.value || 18) / 100, 0.55);
}

function effectiveVolume() {
  return playingYouTubeVideos.size ? selectedVolume() * 0.12 : selectedVolume();
}

function fadeAudio(player, target, duration = 480, onComplete) {
  if (!player) return;
  const previousFrame = fadeFrames.get(player);
  if (previousFrame) cancelAnimationFrame(previousFrame);

  const initial = player.volume;
  const startedAt = performance.now();
  const step = now => {
    const progress = Math.min((now - startedAt) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    player.volume = Math.max(0, Math.min(1, initial + (target - initial) * eased));
    if (progress < 1) {
      fadeFrames.set(player, requestAnimationFrame(step));
    } else {
      fadeFrames.delete(player);
      onComplete?.();
    }
  };
  fadeFrames.set(player, requestAnimationFrame(step));
}

function updateMusicUI() {
  const theme = projectThemes[activeThemeIndex];
  ambientToggle?.setAttribute('aria-pressed', String(musicEnabled));
  ambientToggle?.setAttribute('aria-label', musicEnabled ? 'Pause project theme music' : 'Play a project theme');
  if (ambientLabel) ambientLabel.textContent = musicEnabled ? 'Theme music' : 'Theme music';
  if (ambientTrackLabel) ambientTrackLabel.textContent = theme ? `${theme.title} · ${theme.game}` : 'Choose a project';
  if (ambientTrack) ambientTrack.dataset.activeTheme = theme?.title || '';
}

async function playProjectTheme(index) {
  const theme = projectThemes[index];
  const nextPlayer = themePlayers[index];
  if (!theme || !nextPlayer) return;

  const previousIndex = activeThemeIndex;
  const previousPlayer = themePlayers[previousIndex];
  activeThemeIndex = index;
  musicEnabled = true;

  if (previousPlayer && previousPlayer !== nextPlayer) {
    fadeAudio(previousPlayer, 0, 360, () => previousPlayer.pause());
  }

  if (nextPlayer.paused) {
    const seekToHighlight = () => {
      if (Number.isFinite(nextPlayer.duration) && theme.start < nextPlayer.duration) nextPlayer.currentTime = theme.start;
    };
    if (nextPlayer.readyState >= 1) seekToHighlight();
    else nextPlayer.addEventListener('loadedmetadata', seekToHighlight, { once: true });
    nextPlayer.volume = 0;
    try {
      await nextPlayer.play();
    } catch (error) {
      musicEnabled = false;
    }
  }

  if (musicEnabled) fadeAudio(nextPlayer, effectiveVolume(), 560);
  updateMusicUI();
}

function pauseThemeMusic() {
  musicEnabled = false;
  const player = themePlayers[activeThemeIndex];
  if (player) fadeAudio(player, 0, 320, () => player.pause());
  updateMusicUI();
}

ambientToggle?.addEventListener('click', () => {
  if (musicEnabled) {
    pauseThemeMusic();
    return;
  }
  const randomTheme = Math.random() < 0.5 ? 0 : 1;
  playProjectTheme(randomTheme);
  selectProjectCard(projectCards[randomTheme]);
});

ambientVolume?.addEventListener('input', () => {
  if (!musicEnabled) return;
  const player = themePlayers[activeThemeIndex];
  if (player) fadeAudio(player, effectiveVolume(), 180);
});

function updateThemePriority() {
  if (!musicEnabled) return;
  const player = themePlayers[activeThemeIndex];
  if (player) fadeAudio(player, effectiveVolume(), 260);
}

function setupYouTubePriority() {
  if (!window.YT?.Player) return;
  document.querySelectorAll('#projects .video-embed iframe').forEach((iframe, index) => {
    new window.YT.Player(iframe, {
      events: {
        onStateChange(event) {
          if (event.data === window.YT.PlayerState.PLAYING) playingYouTubeVideos.add(index);
          else playingYouTubeVideos.delete(index);
          updateThemePriority();
        }
      }
    });
  });
}

if (window.YT?.Player) setupYouTubePriority();
else window.onYouTubeIframeAPIReady = setupYouTubePriority;

updateMusicUI();

document.body.classList.add('miami-deco-theme');
document.body.dataset.theme = 'miami';
