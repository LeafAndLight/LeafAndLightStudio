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

const modal = document.getElementById('videoModal');
const modalTitle = document.getElementById('videoModalTitle');
const youtubeFrame = document.getElementById('youtubeFrame');
let lastFocusedElement = null;

function buildYouTubeEmbed(videoId, title) {
  const iframe = document.createElement('iframe');
  const params = new URLSearchParams({
    autoplay: '1',
    rel: '0',
    playsinline: '1'
  });

  iframe.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?${params.toString()}`;
  iframe.title = title || 'Official game trailer';
  iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
  iframe.referrerPolicy = 'strict-origin-when-cross-origin';
  iframe.allowFullscreen = true;
  return iframe;
}

function openTrailer(button) {
  const videoId = button.dataset.youtubeId;
  if (!videoId) return;

  lastFocusedElement = document.activeElement;
  const title = button.dataset.title || 'Official trailer';
  modalTitle.textContent = title;
  youtubeFrame.replaceChildren(buildYouTubeEmbed(videoId, title));
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
  modal.querySelector('.video-modal-close').focus();
}

function closeTrailer() {
  youtubeFrame.replaceChildren();
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
  if (lastFocusedElement) lastFocusedElement.focus();
}

document.querySelectorAll('.youtube-preview').forEach(button => {
  button.addEventListener('click', () => openTrailer(button));
});

document.querySelectorAll('[data-close-video]').forEach(element => {
  element.addEventListener('click', closeTrailer);
});

document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && modal.classList.contains('open')) closeTrailer();
});

// If a video has no max-resolution thumbnail, use YouTube's reliable HQ fallback.
document.querySelectorAll('.youtube-preview-media img[data-fallback]').forEach(image => {
  image.addEventListener('error', () => {
    if (image.src !== image.dataset.fallback) image.src = image.dataset.fallback;
  }, { once: true });
});
