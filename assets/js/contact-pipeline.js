const CONTACT_ENDPOINT = 'https://script.google.com/macros/s/AKfycbzmE6Zm1eD4ajMjQVW6_KqD-t0XdxyB341gvDZ8beWkA3EZEvieblkq1BZ53y6gqnp4/exec';
const MIN_SUBMIT_DELAY_MS = 2500;
const MAX_FIELD_LENGTHS = {
  name: 120,
  email: 180,
  subject: 160,
  message: 4000,
  country: 120,
  timeZone: 80,
  roleTitle: 140,
  url: 500
};

const contactType = document.getElementById('contactType');
const contactSubject = document.getElementById('contactSubject');
const contactCompany = document.getElementById('contactCompany');
const companyField = document.getElementById('companyField');
const subjectField = document.getElementById('subjectField');
const contactWebsite = document.getElementById('contactWebsite');
const formOpenedAt = document.getElementById('formOpenedAt');
const hiringFields = document.getElementById('hiringFields');
const timeZoneOptions = document.getElementById('timeZoneOptions');
const inquiryChoiceCards = Array.from(document.querySelectorAll('[data-inquiry-choice]'));
const inquiryDetailLabel = document.getElementById('inquiryDetailLabel');
const inquiryDetailTitle = document.getElementById('inquiryDetailTitle');
const inquiryDetailCopy = document.getElementById('inquiryDetailCopy');
const serviceCards = Array.from(document.querySelectorAll('.service-select-card'));
const serviceSelectionStatus = document.getElementById('serviceSelectionStatus');
const serviceFlow = document.getElementById('serviceFlow');
const serviceFlowTitle = document.getElementById('serviceFlowTitle');
const serviceFlowIntro = document.getElementById('serviceFlowIntro');
const serviceFlowSteps = document.getElementById('serviceFlowSteps');
const serviceFlowNote = document.getElementById('serviceFlowNote');
const contactChoiceTriggers = Array.from(document.querySelectorAll('[data-contact-choice]'));

const serviceFlows = Object.freeze({
  prototypes: {
    title: 'Concepts and Prototypes',
    intro: 'A short production cycle that turns an idea into something playable, testable and easier to plan.',
    steps: [
      ['Define', 'Clarify the goal, audience, platform and the main question the prototype must answer.'],
      ['Build', 'Create the smallest playable version using only the systems and content needed to test the idea.'],
      ['Test', 'Review the core experience, identify risks and improve the strongest parts.'],
      ['Next Step', 'Deliver the prototype with findings, scope options and a practical recommendation for what comes next.']
    ],
    note: 'The prototype can remain a standalone result or move into VR production or full-cycle development.'
  },
  'vr-worlds': {
    title: 'VR Worlds and Experiences',
    intro: 'An interactive VR production focused on purpose, presence, comfort and real device performance.',
    steps: [
      ['Experience Brief', 'Define the purpose, audience, target headset, comfort rules and interaction goals.'],
      ['Interaction Prototype', 'Test locomotion, hands, scale, feedback and usability directly inside the headset.'],
      ['World Production', 'Build the environment, interactions, visual language and supporting systems.'],
      ['Optimize and Deliver', 'Measure performance, refine the experience and prepare the final device build.']
    ]
  },
  'full-cycle': {
    title: 'Full-Cycle Game Development',
    intro: 'One connected production path from the first plan to a complete, stable build.',
    steps: [
      ['Scope and Direction', 'Define the audience, core loop, platform, production limits and release goals.'],
      ['Prototype and Validate', 'Build and test the highest-risk mechanics before committing to full production.'],
      ['Production', 'Create the systems, worlds, art and content through focused milestones.'],
      ['Optimize and Deliver', 'Profile, polish, test and prepare a stable build with a practical project handoff.']
    ]
  }
});
const inquiryDetails = Object.freeze({
  Business: {
    label: 'Business inquiry',
    title: 'Bring a game, prototype or production challenge.',
    copy: 'Share the project stage, target platform and the support you need. We will reply with a focused next step.'
  },
  Partnership: {
    label: 'Partnership inquiry',
    title: 'Combine strengths around a clear opportunity.',
    copy: 'Tell us what you are building, what you bring to the table and what a strong partnership would unlock.'
  },
  Hiring: {
    label: 'Hiring profile',
    title: 'Show us the work you want to be known for.',
    copy: 'Add your role, location, availability, rate and strongest professional links. Your profile stays structured and easy to review.'
  },
  General: {
    label: 'General message',
    title: 'Start with the part that matters most.',
    copy: 'Use this path for studio questions, press, community messages or anything that does not fit the other options.'
  }
});
const hiringInputs = {
  country: document.getElementById('hiringCountry'),
  timeZone: document.getElementById('hiringTimeZone'),
  roleCategory: document.getElementById('hiringRoleCategory'),
  roleTitle: document.getElementById('hiringRoleTitle'),
  seniority: document.getElementById('hiringSeniority'),
  availability: document.getElementById('hiringAvailability'),
  hourlyRate: document.getElementById('hiringHourlyRate'),
  currency: document.getElementById('hiringCurrency'),
  portfolioUrl: document.getElementById('hiringPortfolioUrl'),
  linkedinUrl: document.getElementById('hiringLinkedinUrl'),
  resumeUrl: document.getElementById('hiringResumeUrl'),
  consent: document.getElementById('hiringConsent')
};

let selectedService = '';
let lastAutoGeneratedSubject = '';
let subjectWasManuallyEdited = false;
let subjectInternalUpdate = false;
let isSubmitting = false;

function setFormOpenedAt() {
  if (formOpenedAt) formOpenedAt.value = String(Date.now());
}

setFormOpenedAt();
function initializeTimeZones() {
  const fallbackTimeZones = [
    'America/Sao_Paulo',
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Berlin',
    'Asia/Tokyo',
    'Australia/Sydney',
    'UTC'
  ];
  let timeZones = fallbackTimeZones;

  if (typeof Intl.supportedValuesOf === 'function') {
    try {
      timeZones = Intl.supportedValuesOf('timeZone');
    } catch (error) {
      timeZones = fallbackTimeZones;
    }
  }

  if (timeZoneOptions) {
    timeZoneOptions.replaceChildren(...timeZones.map(timeZone => {
      const option = document.createElement('option');
      option.value = timeZone;
      return option;
    }));
  }

  if (hiringInputs.timeZone && !fieldValue(hiringInputs.timeZone)) {
    hiringInputs.timeZone.value = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
  }
}

initializeTimeZones();

function hasMessage(value) {
  return value.trim().length > 0;
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
}

function isValidUrl(value) {
  const trimmed = value.trim();
  if (!trimmed) return true;
  try {
    const url = new URL(trimmed);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch (error) {
    return false;
  }
}

function fieldValue(field) {
  return field?.value?.trim() || '';
}

function isHiringMode() {
  return contactType?.value === 'Hiring';
}

function needsCompany() {
  return contactType?.value === 'Business' || contactType?.value === 'Partnership';
}

function syncInquiryChoiceCards() {
  const type = contactType?.value || 'Business';
  const detail = inquiryDetails[type] || inquiryDetails.Business;

  inquiryChoiceCards.forEach(card => {
    const isActive = card.dataset.inquiryChoice === type;
    card.classList.toggle('is-selected', isActive);
    card.setAttribute('aria-pressed', String(isActive));
  });

  if (inquiryDetailLabel) inquiryDetailLabel.textContent = detail.label;
  if (inquiryDetailTitle) inquiryDetailTitle.textContent = detail.title;
  if (inquiryDetailCopy) inquiryDetailCopy.textContent = detail.copy;
  if (contactForm) contactForm.dataset.inquiry = type.toLowerCase();
}

function setNote(message, state = '') {
  if (!formNote) return;
  formNote.textContent = message;
  formNote.classList.toggle('is-error', state === 'error');
  formNote.classList.toggle('is-success', state === 'success');
  formNote.classList.toggle('is-loading', state === 'loading');
}

function markInvalid(field, message) {
  field?.classList.add('field-invalid');
  if (field && message) field.setCustomValidity(message);
}

function clearInvalidStates() {
  contactForm?.querySelectorAll('.field-invalid').forEach(field => field.classList.remove('field-invalid'));
  contactForm?.querySelectorAll('input, textarea, select').forEach(field => field.setCustomValidity(''));
}

function buildAutoSubject() {
  const type = contactType?.value || 'Business';
  if (type === 'Hiring') {
    return 'Specialist Network Application';
  }

  if (type === 'Partnership') return 'Partnership Inquiry';
  if (type === 'General') return 'General Inquiry';

  const typeLabel = 'Business Inquiry';
  return selectedService ? `${typeLabel}: ${selectedService}` : typeLabel;
}

function applyAutoSubject({ force = false } = {}) {
  if (!contactSubject) return;
  const current = contactSubject.value;
  const canUpdate = force || (!subjectWasManuallyEdited && (current === '' || current === lastAutoGeneratedSubject));
  if (!canUpdate) return;

  const nextSubject = buildAutoSubject();
  subjectInternalUpdate = true;
  contactSubject.value = nextSubject;
  lastAutoGeneratedSubject = nextSubject;
  subjectInternalUpdate = false;
}

function renderServiceFlow(card) {
  const flow = serviceFlows[card.dataset.flow];
  if (!flow || !serviceFlow || !serviceFlowSteps) return;

  serviceFlowTitle.textContent = flow.title;
  serviceFlowIntro.textContent = flow.intro;
  serviceFlowSteps.replaceChildren(...flow.steps.map(([title, description], index) => {
    const step = document.createElement('div');
    step.className = `flow-step${index === flow.steps.length - 1 ? ' flow-step--final' : ''}`;

    const number = document.createElement('span');
    number.textContent = String(index + 1).padStart(2, '0');
    const heading = document.createElement('strong');
    heading.textContent = title;
    const copy = document.createElement('p');
    copy.textContent = description;

    step.append(number, heading, copy);
    return step;
  }));

  if (serviceFlowNote) {
    serviceFlowNote.textContent = flow.note || '';
    serviceFlowNote.hidden = !flow.note;
  }

  serviceFlow.hidden = false;
  serviceFlow.classList.remove('is-visible');
  requestAnimationFrame(() => serviceFlow.classList.add('is-visible'));
}

function selectService(card) {
  selectedService = card.dataset.service || '';
  serviceCards.forEach(serviceCard => {
    const isActive = serviceCard === card;
    serviceCard.setAttribute('aria-pressed', String(isActive));
    serviceCard.classList.toggle('is-selected', isActive);
  });

  renderServiceFlow(card);
  applyAutoSubject();
  updateContactFormState();

  if (serviceSelectionStatus) {
    serviceSelectionStatus.textContent = `${selectedService} selected. Your project email is prepared below. Continue whenever you are ready.`;
    serviceSelectionStatus.hidden = false;
  }
}

serviceCards.forEach(card => {
  card.addEventListener('click', () => selectService(card));
});

inquiryChoiceCards.forEach(card => {
  card.addEventListener('click', () => {
    if (!contactType) return;
    contactType.value = card.dataset.inquiryChoice || 'Business';
    contactType.dispatchEvent(new Event('change', { bubbles: true }));
  });
});

contactChoiceTriggers.forEach(trigger => {
  trigger.addEventListener('click', () => {
    if (!contactType) return;
    contactType.value = trigger.dataset.contactChoice || 'Business';
    contactType.dispatchEvent(new Event('change', { bubbles: true }));
  });
});

if (contactSubject) {
  contactSubject.addEventListener('input', () => {
    if (subjectInternalUpdate) return;
    subjectWasManuallyEdited = true;
    updateContactFormState();
  });
}

function syncInquiryVisibility() {
  const hiring = isHiringMode();
  syncInquiryChoiceCards();
  if (hiringFields) hiringFields.hidden = !hiring;
  contactForm?.classList.toggle('is-hiring', hiring);
  if (subjectField) subjectField.hidden = hiring;
  if (companyField) companyField.hidden = !needsCompany();
  if (contactCompany) contactCompany.required = needsCompany();
  if (hiring) subjectWasManuallyEdited = false;
  applyAutoSubject({ force: hiring });
  updateContactFormState();
}

contactType?.addEventListener('change', syncInquiryVisibility);
Object.values(hiringInputs).forEach(field => {
  field?.addEventListener('input', () => {
    applyAutoSubject();
    updateContactFormState();
  });
  field?.addEventListener('change', () => {
    applyAutoSubject();
    updateContactFormState();
  });
});

function validateVisibleForm({ focusFirst = false } = {}) {
  clearInvalidStates();
  const invalid = [];
  const openedAt = Number(formOpenedAt?.value || 0);
  const tooFast = focusFirst && openedAt && Date.now() - openedAt < MIN_SUBMIT_DELAY_MS;

  if (fieldValue(contactWebsite)) invalid.push([contactWebsite, 'Please leave this field empty.']);
  if (tooFast) invalid.push([contactMessage, 'Please wait a moment before sending.']);
  if (!fieldValue(contactName)) invalid.push([contactName, 'Enter your name.']);
  if (fieldValue(contactName).length > MAX_FIELD_LENGTHS.name) invalid.push([contactName, 'Name is too long.']);
  if (!isValidEmail(fieldValue(contactEmail))) invalid.push([contactEmail, 'Enter a valid email.']);
  if (needsCompany() && !fieldValue(contactCompany)) invalid.push([contactCompany, 'Enter your company or organization.']);
  if (fieldValue(contactCompany).length > MAX_FIELD_LENGTHS.name) invalid.push([contactCompany, 'Company / Organization is too long.']);
  if (!fieldValue(contactSubject)) invalid.push([contactSubject, 'Add a subject.']);
  if (fieldValue(contactSubject).length > MAX_FIELD_LENGTHS.subject) invalid.push([contactSubject, 'Subject is too long.']);

  if (isHiringMode()) {
    ['country', 'roleCategory', 'roleTitle', 'seniority', 'currency', 'portfolioUrl'].forEach(key => {
      if (!fieldValue(hiringInputs[key])) invalid.push([hiringInputs[key], 'This field is required for hiring.']);
    });

    const hourlyRate = Number(fieldValue(hiringInputs.hourlyRate));
    if (!hourlyRate || hourlyRate <= 0) invalid.push([hiringInputs.hourlyRate, 'Enter a positive hourly rate.']);
    if (!isValidUrl(fieldValue(hiringInputs.portfolioUrl))) invalid.push([hiringInputs.portfolioUrl, 'Enter a valid portfolio URL.']);
    if (!isValidUrl(fieldValue(hiringInputs.linkedinUrl))) invalid.push([hiringInputs.linkedinUrl, 'Enter a valid LinkedIn URL.']);
    if (!isValidUrl(fieldValue(hiringInputs.resumeUrl))) invalid.push([hiringInputs.resumeUrl, 'Enter a valid Resume / CV URL.']);
    if (!hiringInputs.consent?.checked) invalid.push([hiringInputs.consent, 'Consent is required for hiring.']);
  } else if (!hasMessage(contactMessage?.value || '')) {
    invalid.push([contactMessage, 'Enter at least one short sentence.']);
  }

  if (fieldValue(contactMessage).length > MAX_FIELD_LENGTHS.message) invalid.push([contactMessage, 'Message is too long.']);

  if (focusFirst) invalid.forEach(([field, message]) => markInvalid(field, message));
  if (invalid.length && focusFirst) {
    const firstField = invalid[0][0];
    firstField?.focus({ preventScroll: false });
    setNote(invalid[0][1], 'error');
  }

  return invalid.length === 0;
}

function updateContactFormState() {
  if (!submitButton) return;
  const isReady = validateVisibleForm({ focusFirst: false });
  submitButton.disabled = !isReady || isSubmitting;
  submitButton.setAttribute('aria-disabled', String(!isReady || isSubmitting));
  submitButton.classList.toggle('is-ready', isReady && !isSubmitting);
}

function buildPayload() {
  const payload = {
    submissionType: isHiringMode() ? 'Hiring' : 'General',
    name: fieldValue(contactName),
    email: fieldValue(contactEmail),
    type: contactType?.value || 'Business',
    company: needsCompany() ? fieldValue(contactCompany) : '',
    subject: fieldValue(contactSubject),
    message: fieldValue(contactMessage),
    selectedService,
    sourceUrl: window.location.href,
    openedAt: formOpenedAt?.value || ''
  };

  if (isHiringMode()) {
    const hourlyRate = Number(fieldValue(hiringInputs.hourlyRate));
    payload.hiring = {
      country: fieldValue(hiringInputs.country),
      timeZone: fieldValue(hiringInputs.timeZone),
      roleCategory: fieldValue(hiringInputs.roleCategory),
      roleTitle: fieldValue(hiringInputs.roleTitle),
      seniority: fieldValue(hiringInputs.seniority),
      workType: 'Freelance',
      availability: fieldValue(hiringInputs.availability),
      hourlyRate,
      rateMin: hourlyRate,
      rateMax: '',
      currency: fieldValue(hiringInputs.currency),
      rateBasis: 'Per hour',
      portfolioUrl: fieldValue(hiringInputs.portfolioUrl),
      linkedinUrl: fieldValue(hiringInputs.linkedinUrl),
      resumeUrl: fieldValue(hiringInputs.resumeUrl),
      consent: Boolean(hiringInputs.consent?.checked)
    };
  }

  return payload;
}

function isEndpointConfigured() {
  return /^https:\/\/script\.google\.com\/macros\/s\/.+\/exec$/.test(CONTACT_ENDPOINT);
}

async function submitToContactEndpoint(payload) {
  if (!isEndpointConfigured()) {
    throw new Error('Contact endpoint is not configured yet.');
  }

  const response = await fetch(CONTACT_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload),
    redirect: 'follow'
  });

  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch (error) {
    throw new Error('The contact service returned an unreadable response.');
  }

  if (!response.ok || data.ok !== true) {
    throw new Error(data.error || 'The contact service rejected the request.');
  }

  return data;
}

[contactName, contactEmail, contactMessage, contactSubject, contactCompany, contactType].forEach(field => {
  field?.addEventListener('input', updateContactFormState);
  field?.addEventListener('change', updateContactFormState);
});

updateContactFormState();
syncInquiryVisibility();

if (copyEmailBtn) {
  const copyIconMarkup = copyEmailBtn.innerHTML;
  const copiedIconMarkup = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.2 16.3 4.9 12l-1.4 1.4 5.7 5.7L21 7.3 19.6 6 9.2 16.3Z" fill="currentColor"/></svg>';

  copyEmailBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(emailAddress);
      copyEmailBtn.classList.add('copied');
      copyEmailBtn.innerHTML = copiedIconMarkup;
      copyEmailBtn.title = 'Copied';
      copyEmailBtn.setAttribute('aria-label', 'Email copied');
      setTimeout(() => {
        copyEmailBtn.classList.remove('copied');
        copyEmailBtn.innerHTML = copyIconMarkup;
        copyEmailBtn.title = 'Copy email';
        copyEmailBtn.setAttribute('aria-label', 'Copy email address');
      }, 1500);
    } catch (error) {
      window.prompt('Copy this email:', emailAddress);
    }
  });
}

if (contactForm) {
  contactForm.addEventListener('submit', async event => {
    event.preventDefault();
    if (isSubmitting) return;

    if (!validateVisibleForm({ focusFirst: true })) {
      updateContactFormState();
      return;
    }

    const originalText = submitButton.innerHTML;
    isSubmitting = true;
    submitButton.disabled = true;
    submitButton.innerHTML = '<span>Sending...</span>';
    setNote('Sending your message to the studio inbox...', 'loading');

    if (contactCard) {
      contactCard.classList.remove('launching');
      void contactCard.offsetWidth;
      contactCard.classList.add('launching');
      setTimeout(() => contactCard.classList.remove('launching'), 1500);
    }

    try {
      await submitToContactEndpoint(buildPayload());
      contactForm.reset();
      subjectWasManuallyEdited = false;
      lastAutoGeneratedSubject = '';
      setFormOpenedAt();
      initializeTimeZones();
      syncInquiryVisibility();
      applyAutoSubject();
      setNote('Message sent successfully.', 'success');
    } catch (error) {
      setNote(error.message || 'Could not send automatically right now. Please try again.', 'error');
    } finally {
      isSubmitting = false;
      submitButton.innerHTML = originalText;
      updateContactFormState();
    }
  });
}
