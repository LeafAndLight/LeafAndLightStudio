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
const contactName = document.getElementById('contactName');
const contactEmail = document.getElementById('contactEmail');
const contactMessage = document.getElementById('contactMessage');
const submitButton = contactForm?.querySelector('.submit-btn');

function hasMessage(value) {
  return value.trim().length > 0;
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
}

function updateContactFormState() {
  if (!submitButton) return;

  const isReady = Boolean(
    contactName?.value.trim() &&
    contactEmail?.validity.valid &&
    isValidEmail(contactEmail.value) &&
    hasMessage(contactMessage?.value || '')
  );

  submitButton.disabled = !isReady;
  submitButton.setAttribute('aria-disabled', String(!isReady));
  submitButton.classList.toggle('is-ready', isReady);
}

[contactName, contactEmail, contactMessage].forEach(field => {
  field?.addEventListener('input', updateContactFormState);
});

updateContactFormState();

if (copyEmailBtn) {
  copyEmailBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(emailAddress);
      copyEmailBtn.classList.add('copied');
      copyEmailBtn.title = 'Copied';
      setTimeout(() => {
        copyEmailBtn.classList.remove('copied');
        copyEmailBtn.title = 'Copy email';
      }, 1500);
    } catch (error) {
      window.prompt('Copy this email:', emailAddress);
    }
  });
}

async function submitToFormSubmit({ name, email, type, message }) {
  const response = await fetch(`https://formsubmit.co/ajax/${emailAddress}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      _captcha: 'false',
      _template: 'table',
      _subject: `${type} inquiry from ${name}`,
      name,
      email,
      type,
      message
    })
  });
  return response.json();
}

if (contactForm) {
  contactForm.addEventListener('submit', async event => {
    event.preventDefault();

    const name = contactName.value.trim();
    const email = contactEmail.value.trim();
    const type = document.getElementById('contactType').value.trim();
    const message = contactMessage.value.trim();

    if (!name || !contactEmail.validity.valid || !isValidEmail(email) || !hasMessage(message)) {
      updateContactFormState();
      if (formNote) {
        formNote.textContent = 'Enter your name, a valid email and a short message.';
      }
      return;
    }
    const originalText = submitButton.innerHTML;
    submitButton.disabled = true;
    submitButton.innerHTML = '<span>Sending...</span>';

    if (contactCard) {
      contactCard.classList.remove('launching');
      void contactCard.offsetWidth;
      contactCard.classList.add('launching');
      setTimeout(() => contactCard.classList.remove('launching'), 1500);
    }

    if (formNote) {
      formNote.textContent = 'Sending your message to the studio inbox...';
    }

    try {
      const data = await submitToFormSubmit({ name, email, type, message });
      if (data.success === 'true' || data.success === true) {
        formNote.textContent = 'Message sent successfully.';
        contactForm.reset();
        updateContactFormState();
      } else {
        formNote.textContent = 'The form service needs to be activated first from the studio email inbox.';
      }
    } catch (error) {
      formNote.textContent = 'Could not send automatically right now. Activate the form service first or try again.';
    } finally {
      submitButton.innerHTML = originalText;
      updateContactFormState();
    }
  });
}

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