const headerToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelectorAll('.site-nav a');
const cursorGlow = document.querySelector('.cursor-glow');
const year = document.querySelector('#year');
const copyButton = document.querySelector('.copy-email');
const filterButtons = document.querySelectorAll('[data-filter]');
const portfolioItems = document.querySelectorAll('.portfolio-item');

if (year) year.textContent = new Date().getFullYear();

if (headerToggle) {
  headerToggle.addEventListener('click', () => {
    const isOpen = document.body.classList.toggle('menu-open');
    headerToggle.setAttribute('aria-expanded', String(isOpen));
  });
}

navLinks.forEach((link) => {
  link.addEventListener('click', () => {
    document.body.classList.remove('menu-open');
    if (headerToggle) headerToggle.setAttribute('aria-expanded', 'false');
  });
});

window.addEventListener('mousemove', (event) => {
  if (!cursorGlow) return;
  cursorGlow.style.left = `${event.clientX}px`;
  cursorGlow.style.top = `${event.clientY}px`;
});

if (copyButton) {
  copyButton.addEventListener('click', async () => {
    const email = copyButton.dataset.email;
    try {
      await navigator.clipboard.writeText(email);
      const previous = copyButton.textContent;
      copyButton.textContent = 'Email copied';
      setTimeout(() => { copyButton.textContent = previous; }, 1400);
    } catch {
      window.location.href = `mailto:${email}`;
    }
  });
}

filterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    filterButtons.forEach((b) => b.classList.remove('active'));
    button.classList.add('active');
    const filter = button.dataset.filter;
    portfolioItems.forEach((item) => {
      const shouldShow = filter === 'all' || item.dataset.kind === filter;
      item.classList.toggle('hidden', !shouldShow);
    });
  });
});

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.animate([
        { opacity: 0, transform: 'translateY(18px)' },
        { opacity: 1, transform: 'translateY(0)' }
      ], { duration: 520, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'both' });
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.service-card, .work-card, .portfolio-item, .timeline li, .founder-card, .contact-panel').forEach((el) => {
  revealObserver.observe(el);
});
