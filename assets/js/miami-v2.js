document.documentElement.classList.add('reveal-ready');

document.addEventListener('DOMContentLoaded', () => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const sections = Array.from(document.querySelectorAll('.section'));

  if ('IntersectionObserver' in window && !reducedMotion) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-inview');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.08 });

    sections.forEach(section => observer.observe(section));
  } else {
    sections.forEach(section => section.classList.add('is-inview'));
  }

  const flow = document.getElementById('serviceFlow');
  const flowIntro = document.getElementById('serviceFlowIntro');
  const serviceCards = Array.from(document.querySelectorAll('.service-select-card'));
  const contact = document.getElementById('contact');
  const v2FlowIntros = {
    'full-cycle': 'A coordinated, accountable pipeline from creative direction to a stable release build.',
    'vr-worlds': 'Presence, comfort and performance move together through a headset-first production path.',
    prototypes: 'A focused validation cycle turns uncertainty into a confident, playable production decision.'
  };

  if (flow) {
    const bridge = document.createElement('div');
    bridge.className = 'journey-bridge';
    bridge.innerHTML = `
      <div class="journey-progress" aria-label="Production journey progress">
        <strong>Route selected</strong><i></i><span>Brief prepared</span><i></i><span>Studio contact</span>
      </div>
      <a class="journey-cta" href="#contact">Continue with this route →</a>`;
    flow.appendChild(bridge);

    serviceCards.forEach(card => {
      card.addEventListener('click', () => {
        const serviceName = card.dataset.service || 'Selected service';
        bridge.querySelector('strong').textContent = serviceName;
        contact?.setAttribute('data-selected-service', card.dataset.flow || 'selected');
        window.setTimeout(() => {
          if (flowIntro && v2FlowIntros[card.dataset.flow]) {
            flowIntro.textContent = v2FlowIntros[card.dataset.flow];
          }
        }, 0);
      });
    });
  }

  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', () => {
      if (link.classList.contains('journey-cta')) {
        const message = document.getElementById('contactMessage');
        window.setTimeout(() => message?.focus({ preventScroll: true }), reducedMotion ? 0 : 550);
      }
    });
  });
});
