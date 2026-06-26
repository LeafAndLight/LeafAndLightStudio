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

const emailAddress = 'leafandlightstudio@gmail.com';
const copyEmailBtn = document.getElementById('copyEmailBtn');
const contactForm = document.getElementById('contactForm');
const formNote = document.getElementById('formNote');
const contactCard = document.getElementById('contactCard');

if (copyEmailBtn) {
  copyEmailBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(emailAddress);
      const originalText = copyEmailBtn.textContent;
      copyEmailBtn.textContent = 'Copied';
      setTimeout(() => { copyEmailBtn.textContent = originalText; }, 1600);
    } catch (error) {
      window.prompt('Copy this email:', emailAddress);
    }
  });
}

if (contactForm) {
  contactForm.addEventListener('submit', event => {
    event.preventDefault();

    const name = document.getElementById('contactName').value.trim();
    const email = document.getElementById('contactEmail').value.trim();
    const type = document.getElementById('contactType').value.trim();
    const message = document.getElementById('contactMessage').value.trim();

    const subject = `${type} inquiry from ${name}`;
    const body = [
      `Name: ${name}`,
      `Email: ${email}`,
      `Type: ${type}`,
      '',
      message
    ].join('\n');

    if (contactCard) {
      contactCard.classList.remove('launching');
      void contactCard.offsetWidth;
      contactCard.classList.add('launching');
      setTimeout(() => contactCard.classList.remove('launching'), 1500);
    }

    if (formNote) {
      formNote.textContent = 'Opening your email app with the message ready...';
      setTimeout(() => {
        formNote.textContent = 'This static site opens your email app with the message prefilled.';
      }, 2600);
    }

    const mailto = `mailto:${encodeURIComponent(emailAddress)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
  });
}
