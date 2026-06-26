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

    const name = document.getElementById('contactName').value.trim();
    const email = document.getElementById('contactEmail').value.trim();
    const type = document.getElementById('contactType').value.trim();
    const message = document.getElementById('contactMessage').value.trim();

    const submitButton = contactForm.querySelector('.submit-btn');
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
      } else {
        formNote.textContent = 'The form service needs to be activated first from the studio email inbox.';
      }
    } catch (error) {
      formNote.textContent = 'Could not send automatically right now. Activate the form service first or try again.';
    } finally {
      submitButton.disabled = false;
      submitButton.innerHTML = originalText;
    }
  });
}
