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
  window.setInterval(() => showSlide((activeIndex + 1) % slides.length), 5000);
}
