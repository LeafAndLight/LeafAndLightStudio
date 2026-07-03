// Leaf & Light CRM — simplified freelance hiring + acknowledgement emails
const CANDIDATE_STATUS_OPTIONS = ['New', 'Reviewing', 'Shortlisted', 'Contacted', 'Interview', 'Hired', 'Rejected', 'Archived'];
const INQUIRY_STATUS_OPTIONS = ['New', 'Reviewing', 'Replied', 'Follow-up', 'Meeting', 'Proposal Sent', 'Negotiating', 'Won', 'Lost', 'Archived'];

const CANDIDATE_HEADERS = [
  'Submitted At UTC', 'Candidate ID', 'Status', 'Full Name', 'Email', 'Country / Region', 'Time Zone',
  'Role Category', 'Role Title', 'Seniority', 'Work Type', 'Availability', 'Rate Min', 'Rate Max',
  'Currency', 'Rate Basis', 'Portfolio URL', 'LinkedIn URL', 'Resume / CV URL', 'Subject', 'Message',
  'Selected Service', 'Source URL', 'Consent', 'Internal Notes', 'AI Tags', 'AI Score'
];

const INQUIRY_HEADERS = [
  'Submitted At UTC', 'Inquiry ID', 'Status', 'Inquiry Type', 'Selected Service', 'Full Name', 'Email',
  'Company', 'Subject', 'Message', 'Source URL'
];

// Short, human-friendly labels for the two raw lists. The internal schema above
// remains stable so dashboards, formulas and existing submissions keep working.
const CANDIDATE_DISPLAY_HEADERS = [
  'Date', 'ID', 'Stage', 'Name', 'Email', 'Country / Region', 'Time Zone',
  'Discipline', 'Role', 'Experience', 'Work Type', 'Availability', 'Rate', 'Rate Max',
  'Currency', 'Rate Basis', 'Portfolio', 'LinkedIn', 'Resume / CV', 'Subject', 'Candidate Message',
  'Service', 'Source', 'Consent', 'Internal Notes', 'AI Tags', 'AI Score'
];
const INQUIRY_DISPLAY_HEADERS = [
  'Date', 'ID', 'Stage', 'Type', 'Service', 'Name', 'Email', 'Company', 'Subject', 'Contact Message', 'Source'
];

const ROLE_CATEGORIES = ['Programming', '3D Art', '2D / Concept Art', 'Animation / Rigging', 'Technical Art / VFX', 'UI / UX', 'Game Design', 'Audio', 'Production / QA', 'Other'];
const SENIORITIES = ['Junior', 'Mid-level', 'Senior', 'Lead', 'Specialist'];
const WORK_TYPES = ['Freelance'];
const AVAILABILITIES = ['', 'Immediately', 'Within 2 weeks', 'Within 1 month', 'More than 1 month', 'To be discussed'];
const CURRENCIES = ['USD', 'EUR', 'BRL', 'GBP', 'CAD', 'AUD', 'Other'];
const RATE_BASES = ['Per hour'];
const MAX_LENGTHS = { short: 180, subject: 160, message: 4000, url: 500 };
const REQUIRE_COMPANY_FOR_BUSINESS = true;

const SHEET_NAMES = {
  hiringDashboard: 'Hiring Dashboard',
  businessDashboard: 'Business Dashboard',
  dashboardData: 'Dashboard Data',
  candidateView: 'Candidate View',
  contactView: 'Contact View',
  candidates: 'Candidates',
  inquiries: 'General Inquiries'
};

const THEME = {
  background: '#0B1220',
  panel: '#111827',
  panelAlt: '#172033',
  border: '#273449',
  text: '#F8FAFC',
  muted: '#94A3B8',
  blue: '#60A5FA',
  purple: '#A78BFA',
  orange: '#FB923C',
  green: '#4ADE80',
  cyan: '#22D3EE',
  red: '#F87171',
  yellow: '#FBBF24',
  grey: '#64748B',
  rowA: '#F8FAFC',
  rowB: '#EEF2F7',
  rawHeader: '#111827',
  rawHeaderText: '#FFFFFF',
  label: '#7DD3FC',
  valuePanel: '#18263A'
};

const CANDIDATE_STATUS_STYLES = {
  New:         { background: '#2563EB', font: '#FFFFFF' },
  Reviewing:   { background: '#FBBF24', font: '#111827' },
  Shortlisted: { background: '#7C3AED', font: '#FFFFFF' },
  Contacted:   { background: '#22D3EE', font: '#082F49' },
  Interview:   { background: '#FB923C', font: '#111827' },
  Hired:       { background: '#4ADE80', font: '#052E16' },
  Rejected:    { background: '#DC2626', font: '#FFFFFF' },
  Archived:    { background: '#64748B', font: '#FFFFFF' }
};

const INQUIRY_STATUS_STYLES = {
  New:           { background: '#2563EB', font: '#FFFFFF' },
  Reviewing:     { background: '#FBBF24', font: '#111827' },
  Replied:       { background: '#22D3EE', font: '#082F49' },
  'Follow-up':   { background: '#A78BFA', font: '#111827' },
  Meeting:       { background: '#FB923C', font: '#111827' },
  'Proposal Sent': { background: '#8B5CF6', font: '#FFFFFF' },
  Negotiating:   { background: '#F97316', font: '#FFFFFF' },
  Won:           { background: '#4ADE80', font: '#052E16' },
  Lost:          { background: '#DC2626', font: '#FFFFFF' },
  Archived:      { background: '#64748B', font: '#FFFFFF' }
};

const CANDIDATE_COLUMN_WIDTHS = [
  82, 190, 105, 185, 215, 145, 100, 145, 185, 95, 105, 125, 82, 82,
  75, 105, 145, 145, 145, 260, 240, 185, 160, 85, 280, 180, 80
];
const INQUIRY_COLUMN_WIDTHS = [82, 190, 105, 110, 175, 185, 215, 185, 260, 240, 150];

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Leaf & Light')
    .addItem('Setup / Repair CRM', 'setupSpreadsheet')
    .addSeparator()
    .addItem('Refresh All Dashboards', 'refreshAllDashboards')
    .addItem('Refresh Hiring Dashboard', 'refreshHiringDashboard')
    .addItem('Refresh Business Dashboard', 'refreshBusinessDashboard')
    .addItem('Rebuild All Charts', 'rebuildAllCharts')
    .addSeparator()
    .addItem('Open Candidate Profile', 'openCandidateView')
    .addItem('Open Contact Details', 'openContactView')
    .addItem('Apply Database Formatting', 'applySpreadsheetFormatting')
    .addToUi();
}

function onEdit(event) {
  try {
    if (!event || !event.range || !event.source) return;
    const range = event.range;
    const sheetName = range.getSheet().getName();
    if ((sheetName === SHEET_NAMES.candidates || sheetName === SHEET_NAMES.inquiries) && event.range.getColumn() === 3) {
      refreshAllDashboards_(event.source);
      return;
    }
    if (sheetName === SHEET_NAMES.candidateView && range.getRow() === 1 && range.getColumn() === 3) {
      const candidateId = candidateIdFromSelectorLabel_(range.getSheet(), event.value);
      syncCandidateViewStatus_(event.source, candidateId);
      return;
    }
    if (sheetName === SHEET_NAMES.candidateView && range.getRow() === 7 && range.getColumn() <= 2) {
      updateCandidateStatusFromView_(event.source, event.value);
    }
  } catch (error) {
    console.error('Dashboard refresh after edit failed: ' + error.message);
  }
}

function setupSpreadsheet() {
  const spreadsheet = getSpreadsheet_();
  migrateLegacyDashboard_(spreadsheet);

  prepareSheet_(spreadsheet, SHEET_NAMES.candidates, CANDIDATE_HEADERS, CANDIDATE_STATUS_OPTIONS, CANDIDATE_DISPLAY_HEADERS);
  prepareSheet_(spreadsheet, SHEET_NAMES.inquiries, INQUIRY_HEADERS, INQUIRY_STATUS_OPTIONS, INQUIRY_DISPLAY_HEADERS);
  migrateInquiryStatuses_(spreadsheet.getSheetByName(SHEET_NAMES.inquiries));
  normalizeSubmissionDates_(spreadsheet.getSheetByName(SHEET_NAMES.candidates));
  normalizeSubmissionDates_(spreadsheet.getSheetByName(SHEET_NAMES.inquiries));
  applySpreadsheetFormatting_(spreadsheet);

  setupDashboardData_(spreadsheet);
  setupHiringDashboardStructure_(spreadsheet);
  setupBusinessDashboardStructure_(spreadsheet);
  setupCandidateView_(spreadsheet);
  setupContactView_(spreadsheet);
  refreshAllDashboards_(spreadsheet);
  rebuildAllCharts_(spreadsheet);
  orderSheets_(spreadsheet);

  const dataSheet = spreadsheet.getSheetByName(SHEET_NAMES.dashboardData);
  if (dataSheet && !dataSheet.isSheetHidden()) dataSheet.hideSheet();

  spreadsheet.setActiveSheet(spreadsheet.getSheetByName(SHEET_NAMES.hiringDashboard));
  spreadsheet.toast('Hiring and Business CRM are ready.', 'Leaf & Light', 5);
}

function refreshAllDashboards() {
  const spreadsheet = getSpreadsheet_();
  refreshAllDashboards_(spreadsheet);
  spreadsheet.toast('Both dashboards refreshed.', 'Leaf & Light', 4);
}

function refreshHiringDashboard() {
  const spreadsheet = getSpreadsheet_();
  refreshAllDashboards_(spreadsheet);
  spreadsheet.setActiveSheet(spreadsheet.getSheetByName(SHEET_NAMES.hiringDashboard));
  spreadsheet.toast('Hiring Dashboard refreshed.', 'Leaf & Light', 4);
}

function refreshBusinessDashboard() {
  const spreadsheet = getSpreadsheet_();
  refreshAllDashboards_(spreadsheet);
  spreadsheet.setActiveSheet(spreadsheet.getSheetByName(SHEET_NAMES.businessDashboard));
  spreadsheet.toast('Business Dashboard refreshed.', 'Leaf & Light', 4);
}

function rebuildAllCharts() {
  const spreadsheet = getSpreadsheet_();
  rebuildAllCharts_(spreadsheet);
  spreadsheet.toast('All charts rebuilt.', 'Leaf & Light', 4);
}

function applySpreadsheetFormatting() {
  const spreadsheet = getSpreadsheet_();
  applySpreadsheetFormatting_(spreadsheet);
  spreadsheet.toast('Database formatting applied.', 'Leaf & Light', 4);
}

function openCandidateView() {
  const spreadsheet = getSpreadsheet_();
  if (!spreadsheet.getSheetByName(SHEET_NAMES.candidateView)) {
    setupCandidateView_(spreadsheet);
  } else {
    refreshCandidateSelector_(spreadsheet);
  }
  spreadsheet.setActiveSheet(spreadsheet.getSheetByName(SHEET_NAMES.candidateView));
}

function openContactView() {
  const spreadsheet = getSpreadsheet_();
  if (!spreadsheet.getSheetByName(SHEET_NAMES.contactView)) setupContactView_(spreadsheet);
  spreadsheet.setActiveSheet(spreadsheet.getSheetByName(SHEET_NAMES.contactView));
}

function doPost(event) {
  try {
    const payload = parsePayload_(event);
    const spreadsheet = getSpreadsheet_();
    const config = getConfig_();
    const submittedAt = new Date();

    if (payload.submissionType === 'Hiring' || payload.type === 'Hiring') {
      const candidate = validateCandidate_(payload);
      const candidateId = makeId_('CAND');
      const row = [
        submittedAt, candidateId, 'New', candidate.name, candidate.email, candidate.hiring.country,
        candidate.hiring.timeZone, candidate.hiring.roleCategory, candidate.hiring.roleTitle,
        candidate.hiring.seniority, candidate.hiring.workType, candidate.hiring.availability,
        candidate.hiring.rateMin, candidate.hiring.rateMax, candidate.hiring.currency,
        candidate.hiring.rateBasis, candidate.hiring.portfolioUrl, candidate.hiring.linkedinUrl,
        candidate.hiring.resumeUrl, candidate.subject, candidate.message, candidate.selectedService,
        candidate.sourceUrl, candidate.hiring.consent ? 'Yes' : 'No', '', '', ''
      ];
      appendSafeRow_(spreadsheet.getSheetByName(SHEET_NAMES.candidates), row);
      sendHiringEmail_(candidate, candidateId, config);
      trySendAcknowledgement_('Hiring', candidate, candidateId, config);
      tryRefreshDashboards_(spreadsheet);
      return json_({ ok: true, id: candidateId, type: 'Hiring' });
    }

    const inquiry = validateInquiry_(payload);
    const inquiryId = makeId_('INQ');
    appendSafeRow_(spreadsheet.getSheetByName(SHEET_NAMES.inquiries), [
      submittedAt, inquiryId, 'New', inquiry.type, inquiry.selectedService, inquiry.name, inquiry.email,
      inquiry.company || '', inquiry.subject, inquiry.message, inquiry.sourceUrl
    ]);
    sendInquiryEmail_(inquiry, inquiryId, config);
    trySendAcknowledgement_(inquiry.type, inquiry, inquiryId, config);
    tryRefreshDashboards_(spreadsheet);
    return json_({ ok: true, id: inquiryId, type: 'General' });
  } catch (error) {
    return json_({ ok: false, error: error.message || 'Invalid request' });
  }
}

function tryRefreshDashboards_(spreadsheet) {
  try {
    refreshAllDashboards_(spreadsheet);
  } catch (dashboardError) {
    console.error('Submission was saved, but dashboard refresh failed: ' + dashboardError.message);
  }
}

function parsePayload_(event) {
  if (!event || !event.postData || !event.postData.contents) throw new Error('Missing request body.');
  let payload;
  try {
    payload = JSON.parse(event.postData.contents);
  } catch (error) {
    throw new Error('Request body must be valid JSON.');
  }
  if (payload.website) throw new Error('Spam check failed.');
  if (payload.openedAt && Date.now() - Number(payload.openedAt) < 2500) throw new Error('Please wait before submitting.');
  return payload;
}

function getConfig_() {
  const props = PropertiesService.getScriptProperties().getProperties();
  const required = ['SPREADSHEET_ID', 'SPREADSHEET_URL', 'CAREERS_EMAIL', 'GENERAL_EMAIL'];
  required.forEach(function(key) {
    if (!props[key]) throw new Error('Missing Script Property: ' + key);
  });
  // Optional branding / acknowledgement settings. Missing values keep the CRM working.
  props.AUTO_REPLY_ENABLED = String(props.AUTO_REPLY_ENABLED || 'true').toLowerCase();
  props.BRAND_NAME = props.BRAND_NAME || 'Leaf & Light Studio';
  props.BRAND_LOGO_URL = props.BRAND_LOGO_URL || '';
  props.WEBSITE_URL = props.WEBSITE_URL || '';
  props.LINKEDIN_URL = props.LINKEDIN_URL || '';
  props.ARTSTATION_URL = props.ARTSTATION_URL || '';
  return props;
}

function getSpreadsheet_() {
  const props = PropertiesService.getScriptProperties().getProperties();
  if (!props.SPREADSHEET_ID) throw new Error('Missing Script Property: SPREADSHEET_ID');
  return SpreadsheetApp.openById(props.SPREADSHEET_ID);
}

function migrateLegacyDashboard_(spreadsheet) {
  const legacy = spreadsheet.getSheetByName('Dashboard');
  const hiring = spreadsheet.getSheetByName(SHEET_NAMES.hiringDashboard);
  if (legacy && !hiring) legacy.setName(SHEET_NAMES.hiringDashboard);
}

function prepareSheet_(spreadsheet, name, headers, statusOptions, displayHeaders) {
  let sheet = spreadsheet.getSheetByName(name);
  if (!sheet) sheet = spreadsheet.insertSheet(name);

  ensureSheetSize_(sheet, Math.max(sheet.getMaxRows(), 1000), headers.length);
  sheet.getRange(1, 1, 1, headers.length).setValues([displayHeaders || headers]);
  sheet.setFrozenRows(1);

  if (!sheet.getFilter()) {
    sheet.getRange(1, 1, sheet.getMaxRows(), headers.length).createFilter();
  }

  const statusRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(statusOptions, true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange(2, 3, Math.max(sheet.getMaxRows() - 1, 1), 1).setDataValidation(statusRule);
}

function normalizeSubmissionDates_(sheet) {
  if (!sheet || sheet.getLastRow() < 2) return;
  const range = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1);
  const values = range.getValues();
  let changed = false;
  values.forEach(function(row) {
    if (row[0] instanceof Date || !row[0]) return;
    const parsed = parseSubmissionDate_(row[0]);
    if (parsed) {
      row[0] = parsed;
      changed = true;
    }
  });
  if (changed) range.setValues(values);
}

function migrateInquiryStatuses_(sheet) {
  if (!sheet || sheet.getLastRow() < 2) return;
  const range = sheet.getRange(2, 3, sheet.getLastRow() - 1, 1);
  const values = range.getValues();
  const map = {
    Review: 'Reviewing',
    Shortlisted: 'Reviewing',
    Contacted: 'Replied',
    Interview: 'Meeting',
    Hired: 'Won',
    Rejected: 'Lost'
  };
  let changed = false;
  values.forEach(function(row) {
    const current = String(row[0] || '');
    if (map[current]) {
      row[0] = map[current];
      changed = true;
    }
  });
  if (changed) range.setValues(values);
}

function ensureSheetSize_(sheet, requiredRows, requiredColumns) {
  if (sheet.getMaxRows() < requiredRows) {
    sheet.insertRowsAfter(sheet.getMaxRows(), requiredRows - sheet.getMaxRows());
  }
  if (sheet.getMaxColumns() < requiredColumns) {
    sheet.insertColumnsAfter(sheet.getMaxColumns(), requiredColumns - sheet.getMaxColumns());
  }
}

function applySpreadsheetFormatting_(spreadsheet) {
  const candidates = spreadsheet.getSheetByName(SHEET_NAMES.candidates);
  const inquiries = spreadsheet.getSheetByName(SHEET_NAMES.inquiries);
  if (candidates) formatDatabaseSheet_(candidates, CANDIDATE_HEADERS, CANDIDATE_COLUMN_WIDTHS, CANDIDATE_STATUS_OPTIONS, CANDIDATE_STATUS_STYLES, THEME.purple, [25, 26], [17, 18, 19, 21, 23]);
  if (inquiries) formatDatabaseSheet_(inquiries, INQUIRY_HEADERS, INQUIRY_COLUMN_WIDTHS, INQUIRY_STATUS_OPTIONS, INQUIRY_STATUS_STYLES, THEME.blue, [9], [10, 11]);
}

function formatDatabaseSheet_(sheet, headers, widths, statuses, styles, tabColor, wrapColumns, clipColumns) {
  const maxRows = sheet.getMaxRows();
  const columns = headers.length;
  ensureSheetSize_(sheet, maxRows, columns);

  sheet.setHiddenGridlines(true);
  sheet.setFrozenRows(1);
  sheet.showColumns(1, columns);
  sheet.setFrozenColumns(5);
  sheet.setTabColor(tabColor);
  sheet.setRowHeight(1, 38);

  sheet.getRange(1, 1, 1, columns)
    .setBackground(THEME.rawHeader)
    .setFontColor(THEME.rawHeaderText)
    .setFontWeight('bold')
    .setFontFamily('Roboto')
    .setFontSize(10)
    .setVerticalAlignment('middle')
    .setHorizontalAlignment('left');

  sheet.getRange(2, 1, Math.max(maxRows - 1, 1), columns)
    .setFontFamily('Roboto')
    .setFontSize(10)
    .setFontColor('#111827')
    .setVerticalAlignment('middle')
    .setWrapStrategy(SpreadsheetApp.WrapStrategy.CLIP);

  removeBandings_(sheet);
  const banding = sheet.getRange(1, 1, maxRows, columns).applyRowBanding();
  banding.setHeaderRowColor(THEME.rawHeader);
  banding.setFirstRowColor(THEME.rowA);
  banding.setSecondRowColor(THEME.rowB);

  widths.forEach(function(width, index) { sheet.setColumnWidth(index + 1, width); });
  sheet.getRange(2, 1, Math.max(maxRows - 1, 1), 3).setHorizontalAlignment('center');
  sheet.getRange(2, 1, Math.max(maxRows - 1, 1), 1)
    .setNumberFormat('dd/MM/yy')
    .setFontSize(9)
    .setHorizontalAlignment('center');

  wrapColumns.forEach(function(column) {
    sheet.getRange(2, column, Math.max(maxRows - 1, 1), 1).setWrapStrategy(SpreadsheetApp.WrapStrategy.WRAP);
  });
  clipColumns.forEach(function(column) {
    sheet.getRange(2, column, Math.max(maxRows - 1, 1), 1).setWrapStrategy(SpreadsheetApp.WrapStrategy.CLIP);
  });
  sheet.setRowHeightsForced(2, Math.max(maxRows - 1, 1), 28);

  if (sheet.getName() === SHEET_NAMES.candidates) {
    sheet.getRange(2, 4, Math.max(maxRows - 1, 1), 1).setFontWeight('bold');
    sheet.getRange(2, 5, Math.max(maxRows - 1, 1), 1).setFontColor('#1D4ED8');
    [7, 10, 11, 12, 13, 14, 15, 16, 24, 27].forEach(function(column) {
      sheet.getRange(2, column, Math.max(maxRows - 1, 1), 1).setHorizontalAlignment('center');
    });
    sheet.getRange(2, 13, Math.max(maxRows - 1, 1), 2).setNumberFormat('#,##0.00');
  } else {
    sheet.getRange(2, 6, Math.max(maxRows - 1, 1), 1).setFontWeight('bold');
    sheet.getRange(2, 7, Math.max(maxRows - 1, 1), 1).setFontColor('#1D4ED8');
    sheet.getRange(2, 8, Math.max(maxRows - 1, 1), 1).setFontWeight('bold');
    sheet.getRange(2, 4, Math.max(maxRows - 1, 1), 2).setHorizontalAlignment('center');
  }

  applyStatusConditionalFormatting_(sheet, statuses, styles);
  sheet.hideColumns(2);
}

function removeBandings_(sheet) {
  sheet.getBandings().forEach(function(banding) { banding.remove(); });
}

function applyStatusConditionalFormatting_(sheet, statuses, styles) {
  const existingRules = sheet.getConditionalFormatRules().filter(function(rule) {
    return !rule.getRanges().some(function(range) {
      return range.getColumn() <= 3 && range.getLastColumn() >= 3;
    });
  });

  const statusRange = sheet.getRange(2, 3, Math.max(sheet.getMaxRows() - 1, 1), 1);
  const newRules = statuses.map(function(status) {
    const style = styles[status];
    return SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo(status)
      .setBackground(style.background)
      .setFontColor(style.font)
      .setBold(true)
      .setRanges([statusRange])
      .build();
  });
  sheet.setConditionalFormatRules(existingRules.concat(newRules));
}

function setupDashboardData_(spreadsheet) {
  let sheet = spreadsheet.getSheetByName(SHEET_NAMES.dashboardData);
  if (!sheet) sheet = spreadsheet.insertSheet(SHEET_NAMES.dashboardData);
  ensureSheetSize_(sheet, 150, 50);
  sheet.clear();
  sheet.setHiddenGridlines(true);
  sheet.setTabColor(THEME.grey);
}

function setupHiringDashboardStructure_(spreadsheet) {
  let sheet = spreadsheet.getSheetByName(SHEET_NAMES.hiringDashboard);
  if (!sheet) sheet = spreadsheet.insertSheet(SHEET_NAMES.hiringDashboard);
  prepareDashboardCanvas_(sheet, 170, THEME.purple);

  createDashboardTitle_(sheet, 'Leaf & Light — Hiring Dashboard', 'Talent pool, availability and hiring pipeline', 'M3:P3');

  const cards = [
    ['A5:D8', 'total', 'TOTAL CANDIDATES', THEME.blue],
    ['E5:H8', 'available', 'AVAILABLE NOW', THEME.green],
    ['I5:L8', 'new', 'NEW', CANDIDATE_STATUS_STYLES.New.background],
    ['M5:P8', 'reviewing', 'REVIEWING', CANDIDATE_STATUS_STYLES.Reviewing.background],
    ['A10:D13', 'shortlisted', 'SHORTLISTED', CANDIDATE_STATUS_STYLES.Shortlisted.background],
    ['E10:H13', 'interview', 'INTERVIEW', CANDIDATE_STATUS_STYLES.Interview.background],
    ['I10:L13', 'hired', 'HIRED', CANDIDATE_STATUS_STYLES.Hired.background],
    ['M10:P13', 'active', 'ACTIVE TALENT', THEME.cyan],
    ['A15:D18', 'last7', 'LAST 7 DAYS', THEME.cyan],
    ['E15:H18', 'last30', 'LAST 30 DAYS', THEME.purple],
    ['I15:L18', 'countries', 'COUNTRIES / REGIONS', THEME.orange],
    ['M15:P18', 'roles', 'ROLE CATEGORIES', THEME.yellow]
  ];
  cards.forEach(function(card) { createMetricCard_(sheet, card[0], card[1], card[2], card[3]); });

  createSectionTitle_(sheet, 'A20:H20', 'Talent Pipeline');
  createSectionTitle_(sheet, 'I20:P20', 'Talent Snapshot');
  styleSectionHeader_(sheet.getRange('A22:C22'), ['Stage', 'Candidates', '% of total']);
  styleSectionHeader_(sheet.getRange('E22:G22'), ['Availability', 'Candidates', '% active']);
  styleSectionHeader_(sheet.getRange('I22:M22'), ['Currency', 'Rate Basis', 'Candidates', 'Median Rate', 'Highest Rate']);

  createSectionTitle_(sheet, 'A31:H31', 'Latest Candidates');
  createSectionTitle_(sheet, 'I31:P31', 'Available Talent');
  styleSectionHeader_(sheet.getRange('A33:H33'), ['Date', 'Name', 'Role', 'Experience', 'Availability', 'Expected Rate', 'Status', 'Portfolio']);
  styleSectionHeader_(sheet.getRange('I33:O33'), ['Name', 'Role', 'Experience', 'Country', 'Expected Rate', 'Status', 'Portfolio']);

  createSectionTitle_(sheet, 'A45:P45', 'Hiring Analytics');
  sheet.getRange('A46:P46').merge().setValue('Hiring-only charts. Business contacts are shown on the separate Business Dashboard.')
    .setFontSize(10).setFontColor(THEME.muted);
}

function setupBusinessDashboardStructure_(spreadsheet) {
  let sheet = spreadsheet.getSheetByName(SHEET_NAMES.businessDashboard);
  if (!sheet) sheet = spreadsheet.insertSheet(SHEET_NAMES.businessDashboard);
  prepareDashboardCanvas_(sheet, 145, THEME.blue);

  createDashboardTitle_(sheet, 'Leaf & Light — Business Dashboard', 'Business contacts, partnerships and project opportunities', 'M3:P3');

  const cards = [
    ['A5:D8', 'total', 'TOTAL CONTACTS', THEME.blue],
    ['E5:H8', 'new', 'NEW', INQUIRY_STATUS_STYLES.New.background],
    ['I5:L8', 'reviewing', 'REVIEWING', INQUIRY_STATUS_STYLES.Reviewing.background],
    ['M5:P8', 'followup', 'FOLLOW-UP', INQUIRY_STATUS_STYLES['Follow-up'].background],
    ['A10:D13', 'meeting', 'MEETINGS', INQUIRY_STATUS_STYLES.Meeting.background],
    ['E10:H13', 'proposal', 'PROPOSALS', INQUIRY_STATUS_STYLES['Proposal Sent'].background],
    ['I10:L13', 'negotiating', 'NEGOTIATING', INQUIRY_STATUS_STYLES.Negotiating.background],
    ['M10:P13', 'won', 'WON', INQUIRY_STATUS_STYLES.Won.background],
    ['A15:D18', 'last7', 'LAST 7 DAYS', THEME.cyan],
    ['E15:H18', 'last30', 'LAST 30 DAYS', THEME.purple],
    ['I15:L18', 'companies', 'COMPANIES', THEME.orange],
    ['M15:P18', 'active', 'ACTIVE OPPORTUNITIES', THEME.green]
  ];
  cards.forEach(function(card) { createMetricCard_(sheet, card[0], card[1], card[2], card[3]); });

  createSectionTitle_(sheet, 'A20:H20', 'Business Pipeline');
  createSectionTitle_(sheet, 'I20:P20', 'Contact Breakdown');
  styleSectionHeader_(sheet.getRange('A22:C22'), ['Status', 'Contacts', '% of total']);
  styleSectionHeader_(sheet.getRange('E22:G22'), ['Activity', 'Count', 'Period']);
  styleSectionHeader_(sheet.getRange('I22:K22'), ['Inquiry Type', 'Contacts', '%']);
  styleSectionHeader_(sheet.getRange('M22:O22'), ['Selected Service', 'Contacts', '%']);

  createSectionTitle_(sheet, 'A33:P33', 'Latest Business Contacts');
  styleSectionHeader_(sheet.getRange('A35:J35'), ['Date', 'Company / Contact', 'Contact Person', 'Type', 'Interest', 'Subject', 'Status', 'Email', 'Source', 'Ref.']);

  createSectionTitle_(sheet, 'A48:P48', 'Business Analytics');
  sheet.getRange('A49:P49').merge().setValue('Business-only charts. Candidates and hiring data remain on the separate Hiring Dashboard.')
    .setFontSize(10).setFontColor(THEME.muted);
}

function prepareDashboardCanvas_(sheet, rows, tabColor) {
  ensureSheetSize_(sheet, rows, 16);
  sheet.getCharts().forEach(function(chart) { sheet.removeChart(chart); });
  sheet.getRange(1, 1, sheet.getMaxRows(), sheet.getMaxColumns()).breakApart();
  sheet.clear();
  sheet.setHiddenGridlines(true);
  sheet.setFrozenRows(3);
  sheet.setTabColor(tabColor);
  for (let column = 1; column <= 16; column++) sheet.setColumnWidth(column, 88);
  sheet.getRange(1, 1, rows, 16).setBackground(THEME.background).setFontFamily('Roboto').setFontColor(THEME.text);
}

function createDashboardTitle_(sheet, title, subtitle, updatedRange) {
  sheet.getRange('A1:P2').merge().setValue(title)
    .setFontSize(24).setFontWeight('bold').setFontColor(THEME.text)
    .setHorizontalAlignment('left').setVerticalAlignment('middle');
  sheet.getRange('A3:L3').merge().setValue(subtitle)
    .setFontSize(11).setFontColor(THEME.muted).setVerticalAlignment('middle');
  sheet.getRange(updatedRange).merge().setValue('Last updated: —')
    .setFontSize(10).setFontColor(THEME.muted).setHorizontalAlignment('right');
}

function createMetricCard_(sheet, rangeA1, key, label, accent) {
  const range = sheet.getRange(rangeA1);
  range.merge();
  range.setBackground(THEME.panel)
    .setBorder(true, true, true, true, false, false, THEME.border, SpreadsheetApp.BorderStyle.SOLID);
  const topLeft = range.getCell(1, 1);
  topLeft.setNote(key);
  styleCardRichText_(topLeft, label, '—', accent);
}

function styleCardRichText_(cell, label, value, accent) {
  const text = label + '\n' + value;
  const rich = SpreadsheetApp.newRichTextValue()
    .setText(text)
    .setTextStyle(0, label.length, SpreadsheetApp.newTextStyle().setFontSize(9).setBold(true).setForegroundColor(THEME.muted).build())
    .setTextStyle(label.length + 1, text.length, SpreadsheetApp.newTextStyle().setFontSize(24).setBold(true).setForegroundColor(accent).build())
    .build();
  cell.setRichTextValue(rich).setVerticalAlignment('middle').setHorizontalAlignment('left').setWrap(true);
}

function createSectionTitle_(sheet, rangeA1, title) {
  sheet.getRange(rangeA1).merge().setValue(title).setFontSize(15).setFontWeight('bold').setFontColor(THEME.text);
}

function styleSectionHeader_(range, values) {
  range.setValues([values])
    .setBackground(THEME.panelAlt)
    .setFontColor(THEME.muted)
    .setFontWeight('bold')
    .setFontSize(9)
    .setVerticalAlignment('middle');
}

function refreshAllDashboards_(spreadsheet) {
  let hiring = spreadsheet.getSheetByName(SHEET_NAMES.hiringDashboard);
  let business = spreadsheet.getSheetByName(SHEET_NAMES.businessDashboard);
  let dataSheet = spreadsheet.getSheetByName(SHEET_NAMES.dashboardData);
  if (!hiring) { setupHiringDashboardStructure_(spreadsheet); hiring = spreadsheet.getSheetByName(SHEET_NAMES.hiringDashboard); }
  if (!business) { setupBusinessDashboardStructure_(spreadsheet); business = spreadsheet.getSheetByName(SHEET_NAMES.businessDashboard); }
  if (!dataSheet) { setupDashboardData_(spreadsheet); dataSheet = spreadsheet.getSheetByName(SHEET_NAMES.dashboardData); }

  const candidates = readObjects_(spreadsheet.getSheetByName(SHEET_NAMES.candidates), CANDIDATE_HEADERS);
  const inquiries = readObjects_(spreadsheet.getSheetByName(SHEET_NAMES.inquiries), INQUIRY_HEADERS);
  const now = new Date();

  refreshHiringDashboard_(hiring, candidates, now);
  refreshBusinessDashboard_(business, inquiries, now);
  writeDashboardData_(dataSheet, candidates, inquiries, now);
  refreshCandidateSelector_(spreadsheet, candidates);
  refreshContactSelector_(spreadsheet, inquiries);
  SpreadsheetApp.flush();
}

function refreshHiringDashboard_(sheet, candidates, now) {
  const counts = countBy_(candidates, 'Status');
  const active = candidates.filter(isActiveCandidate_);
  const available = active.filter(function(item) { return String(item.Availability || '') === 'Immediately'; });
  const metrics = {
    total: candidates.length,
    available: available.length,
    new: counts.New || 0,
    reviewing: counts.Reviewing || 0,
    shortlisted: counts.Shortlisted || 0,
    interview: counts.Interview || 0,
    hired: counts.Hired || 0,
    active: active.length,
    last7: countSince_(candidates, 'Submitted At UTC', daysAgo_(now, 7)),
    last30: countSince_(candidates, 'Submitted At UTC', daysAgo_(now, 30)),
    countries: uniqueNonBlankCount_(candidates, 'Country / Region'),
    roles: uniqueNonBlankCount_(candidates, 'Role Category')
  };

  const cards = {
    A5: ['TOTAL CANDIDATES', metrics.total, THEME.blue],
    E5: ['AVAILABLE NOW', metrics.available, THEME.green],
    I5: ['NEW', metrics.new, CANDIDATE_STATUS_STYLES.New.background],
    M5: ['REVIEWING', metrics.reviewing, CANDIDATE_STATUS_STYLES.Reviewing.background],
    A10: ['SHORTLISTED', metrics.shortlisted, CANDIDATE_STATUS_STYLES.Shortlisted.background],
    E10: ['INTERVIEW', metrics.interview, CANDIDATE_STATUS_STYLES.Interview.background],
    I10: ['HIRED', metrics.hired, CANDIDATE_STATUS_STYLES.Hired.background],
    M10: ['ACTIVE TALENT', metrics.active, THEME.cyan],
    A15: ['LAST 7 DAYS', metrics.last7, THEME.cyan],
    E15: ['LAST 30 DAYS', metrics.last30, THEME.purple],
    I15: ['COUNTRIES / REGIONS', metrics.countries, THEME.orange],
    M15: ['ROLE CATEGORIES', metrics.roles, THEME.yellow]
  };
  writeCardMap_(sheet, cards);
  sheet.getRange('M3:P3').setValue('Last updated: ' + Utilities.formatDate(now, Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm'));

  writeStatusSummary_(sheet, 23, 1, CANDIDATE_STATUS_OPTIONS, counts, candidates.length, CANDIDATE_STATUS_STYLES);
  writeAvailabilitySummary_(sheet, active);
  writeRateOverview_(sheet, buildRateOverview_(candidates));
  writeLatestCandidates_(sheet, candidates);
  writeAvailableTalent_(sheet, available);
}

function refreshBusinessDashboard_(sheet, inquiries, now) {
  const counts = countBy_(inquiries, 'Status');
  const activeStatuses = ['New', 'Reviewing', 'Replied', 'Follow-up', 'Meeting', 'Proposal Sent', 'Negotiating'];
  const active = inquiries.filter(function(item) { return activeStatuses.indexOf(String(item.Status || '')) !== -1; });
  const companies = uniqueNonBlankCount_(inquiries, 'Company');
  const metrics = {
    total: inquiries.length,
    new: counts.New || 0,
    reviewing: counts.Reviewing || 0,
    followup: counts['Follow-up'] || 0,
    meeting: counts.Meeting || 0,
    proposal: counts['Proposal Sent'] || 0,
    negotiating: counts.Negotiating || 0,
    won: counts.Won || 0,
    last7: countSince_(inquiries, 'Submitted At UTC', daysAgo_(now, 7)),
    last30: countSince_(inquiries, 'Submitted At UTC', daysAgo_(now, 30)),
    companies: companies,
    active: active.length
  };

  const cards = {
    A5: ['TOTAL CONTACTS', metrics.total, THEME.blue],
    E5: ['NEW', metrics.new, INQUIRY_STATUS_STYLES.New.background],
    I5: ['REVIEWING', metrics.reviewing, INQUIRY_STATUS_STYLES.Reviewing.background],
    M5: ['FOLLOW-UP', metrics.followup, INQUIRY_STATUS_STYLES['Follow-up'].background],
    A10: ['MEETINGS', metrics.meeting, INQUIRY_STATUS_STYLES.Meeting.background],
    E10: ['PROPOSALS', metrics.proposal, INQUIRY_STATUS_STYLES['Proposal Sent'].background],
    I10: ['NEGOTIATING', metrics.negotiating, INQUIRY_STATUS_STYLES.Negotiating.background],
    M10: ['WON', metrics.won, INQUIRY_STATUS_STYLES.Won.background],
    A15: ['LAST 7 DAYS', metrics.last7, THEME.cyan],
    E15: ['LAST 30 DAYS', metrics.last30, THEME.purple],
    I15: ['COMPANIES', metrics.companies, THEME.orange],
    M15: ['ACTIVE OPPORTUNITIES', metrics.active, THEME.green]
  };
  writeCardMap_(sheet, cards);
  sheet.getRange('M3:P3').setValue('Last updated: ' + Utilities.formatDate(now, Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm'));

  writeStatusSummary_(sheet, 23, 1, INQUIRY_STATUS_OPTIONS, counts, inquiries.length, INQUIRY_STATUS_STYLES);
  writeBusinessActivity_(sheet, inquiries, now);
  writeBreakdownSummary_(sheet, 23, 9, inquiries, 'Inquiry Type', 8);
  writeBreakdownSummary_(sheet, 23, 13, inquiries, 'Selected Service', 8);
  writeLatestBusinessContacts_(sheet, inquiries);
}

function writeCardMap_(sheet, cardMap) {
  Object.keys(cardMap).forEach(function(address) {
    const item = cardMap[address];
    styleCardRichText_(sheet.getRange(address), item[0], String(item[1]), item[2]);
  });
}

function isActiveCandidate_(candidate) {
  return ['Rejected', 'Archived', 'Hired'].indexOf(String(candidate.Status || '')) === -1;
}

function uniqueNonBlankCount_(records, key) {
  const values = {};
  records.forEach(function(record) {
    const value = String(record[key] || '').trim();
    if (value) values[value] = true;
  });
  return Object.keys(values).length;
}

function writeStatusSummary_(sheet, startRow, startColumn, statuses, counts, total, styles) {
  const rows = statuses.map(function(status) {
    const count = counts[status] || 0;
    return [status, count, total ? count / total : 0];
  });
  const range = sheet.getRange(startRow, startColumn, statuses.length, 3);
  range.clearContent().setValues(rows).setBackground(THEME.panel).setFontColor(THEME.text);
  sheet.getRange(startRow, startColumn + 2, statuses.length, 1).setNumberFormat('0.0%');
  statuses.forEach(function(status, index) {
    const style = styles[status];
    sheet.getRange(startRow + index, startColumn).setBackground(style.background).setFontColor(style.font).setFontWeight('bold');
  });
}

function writeAvailabilitySummary_(sheet, activeCandidates) {
  const counts = countBy_(activeCandidates, 'Availability');
  const entries = sortedCountEntries_(counts, 8);
  const total = activeCandidates.length;
  sheet.getRange('E23:G30').clearContent().setBackground(THEME.panel).setFontColor(THEME.text);
  if (!entries.length) {
    sheet.getRange('E23:G23').setValues([['No active candidates', 0, 0]]);
    return;
  }
  const rows = entries.map(function(item) { return [item[0], item[1], total ? item[1] / total : 0]; });
  sheet.getRange(23, 5, rows.length, 3).setValues(rows).setBackground(THEME.panel).setFontColor(THEME.text);
  sheet.getRange(23, 7, rows.length, 1).setNumberFormat('0.0%');
}

function writeBusinessActivity_(sheet, inquiries, now) {
  const today = startOfDay_(now);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const rows = [
    ['Today', countSince_(inquiries, 'Submitted At UTC', today), Utilities.formatDate(today, Session.getScriptTimeZone(), 'yyyy-MM-dd')],
    ['Last 7 days', countSince_(inquiries, 'Submitted At UTC', daysAgo_(now, 7)), 'rolling'],
    ['Last 30 days', countSince_(inquiries, 'Submitted At UTC', daysAgo_(now, 30)), 'rolling'],
    ['Current month', inquiries.filter(function(item) { const d = parseSubmissionDate_(item['Submitted At UTC']); return d && d >= monthStart; }).length, Utilities.formatDate(monthStart, Session.getScriptTimeZone(), 'MMM yyyy')],
    ['Previous month', inquiries.filter(function(item) { const d = parseSubmissionDate_(item['Submitted At UTC']); return d && d >= previousMonthStart && d < monthStart; }).length, Utilities.formatDate(previousMonthStart, Session.getScriptTimeZone(), 'MMM yyyy')]
  ];
  sheet.getRange(23, 5, 8, 3).clearContent().setBackground(THEME.panel).setFontColor(THEME.text);
  sheet.getRange(23, 5, rows.length, 3).setValues(rows).setBackground(THEME.panel).setFontColor(THEME.text);
}

function writeBreakdownSummary_(sheet, row, column, records, key, limit) {
  const entries = sortedCountEntries_(countBy_(records, key), limit);
  const total = records.length;
  sheet.getRange(row, column, 8, 3).clearContent().setBackground(THEME.panel).setFontColor(THEME.text);
  if (!entries.length) {
    sheet.getRange(row, column, 1, 3).setValues([['No data', 0, 0]]);
    return;
  }
  const rows = entries.map(function(item) { return [item[0], item[1], total ? item[1] / total : 0]; });
  sheet.getRange(row, column, rows.length, 3).setValues(rows).setBackground(THEME.panel).setFontColor(THEME.text);
  sheet.getRange(row, column + 2, rows.length, 1).setNumberFormat('0.0%');
}

function buildRateOverview_(candidates) {
  const groups = {};
  candidates.forEach(function(candidate) {
    const currency = String(candidate.Currency || '').trim();
    const basis = String(candidate['Rate Basis'] || '').trim();
    const min = Number(candidate['Rate Min']);
    const maxRaw = candidate['Rate Max'];
    const max = maxRaw === '' || maxRaw === null ? min : Number(maxRaw);
    if (!currency || !basis || !isFinite(min) || min <= 0) return;
    const key = currency + '||' + basis;
    if (!groups[key]) groups[key] = { currency: currency, basis: basis, mins: [], maxes: [] };
    groups[key].mins.push(min);
    groups[key].maxes.push(isFinite(max) && max > 0 ? max : min);
  });
  return Object.keys(groups).map(function(key) {
    const group = groups[key];
    return {
      currency: group.currency,
      basis: group.basis,
      count: group.mins.length,
      typicalMin: median_(group.mins),
      highestMax: Math.max.apply(null, group.maxes)
    };
  }).sort(function(a, b) {
    return b.count - a.count || (a.currency + a.basis).localeCompare(b.currency + b.basis);
  });
}

function writeRateOverview_(sheet, rateOverview) {
  sheet.getRange('I23:M29').clearContent().setBackground(THEME.panel).setFontColor(THEME.text);
  if (!rateOverview.length) {
    sheet.getRange('I23:M23').setValues([['No rate data yet', '', '', '', '']]);
    return;
  }
  const rows = rateOverview.slice(0, 7).map(function(item) {
    return [item.currency, item.basis, item.count, item.typicalMin, item.highestMax];
  });
  sheet.getRange(23, 9, rows.length, 5).setValues(rows).setBackground(THEME.panel).setFontColor(THEME.text);
  sheet.getRange(23, 12, rows.length, 2).setNumberFormat('#,##0.00');
}

function writeLatestCandidates_(sheet, candidates) {
  const sorted = sortByNewest_(candidates).slice(0, 8);
  sheet.getRange('A34:H41').clearContent().setBackground(THEME.panel).setFontColor(THEME.text);
  if (!sorted.length) {
    sheet.getRange('A34:H34').setValues([['No candidates yet', '', '', '', '', '', '', '']]);
    return;
  }
  const rows = sorted.map(function(candidate) {
    return [
      formatShortDate_(candidate['Submitted At UTC']), candidate['Full Name'], candidate['Role Title'],
      candidate.Seniority, candidate.Availability, formatCandidateRate_(candidate), candidate.Status,
      candidate['Portfolio URL'] ? 'Open portfolio' : ''
    ];
  });
  sheet.getRange(34, 1, rows.length, 8).setValues(rows).setBackground(THEME.panel).setFontColor(THEME.text);
  sorted.forEach(function(candidate, index) {
    addLinkToCell_(sheet.getRange(34 + index, 8), candidate['Portfolio URL'], 'Open portfolio');
    applySingleStatusStyle_(sheet.getRange(34 + index, 7), candidate.Status, CANDIDATE_STATUS_STYLES);
  });
}

function writeAvailableTalent_(sheet, candidates) {
  const sorted = candidates.slice().sort(function(a, b) {
    const seniorityOrder = { Lead: 5, Specialist: 5, Senior: 4, 'Mid-level': 3, Junior: 2 };
    return (seniorityOrder[String(b.Seniority || '')] || 0) - (seniorityOrder[String(a.Seniority || '')] || 0);
  }).slice(0, 8);
  sheet.getRange('I34:O41').clearContent().setBackground(THEME.panel).setFontColor(THEME.text);
  if (!sorted.length) {
    sheet.getRange('I34:O34').setValues([['No immediately available talent', '', '', '', '', '', '']]);
    return;
  }
  const rows = sorted.map(function(candidate) {
    return [candidate['Full Name'], candidate['Role Title'], candidate.Seniority, candidate['Country / Region'], formatCandidateRate_(candidate), candidate.Status, candidate['Portfolio URL'] ? 'Open portfolio' : ''];
  });
  sheet.getRange(34, 9, rows.length, 7).setValues(rows).setBackground(THEME.panel).setFontColor(THEME.text);
  sorted.forEach(function(candidate, index) {
    addLinkToCell_(sheet.getRange(34 + index, 15), candidate['Portfolio URL'], 'Open portfolio');
    applySingleStatusStyle_(sheet.getRange(34 + index, 14), candidate.Status, CANDIDATE_STATUS_STYLES);
  });
}

function writeLatestBusinessContacts_(sheet, inquiries) {
  const sorted = sortByNewest_(inquiries).slice(0, 10);
  sheet.getRange('A36:J45').clearContent().setBackground(THEME.panel).setFontColor(THEME.text);
  if (!sorted.length) {
    sheet.getRange('A36:J36').setValues([['No business contacts yet', '', '', '', '', '', '', '', '', '']]);
    return;
  }
  const rows = sorted.map(function(item) {
    const primary = item.Company || item['Full Name'];
    const typeLabel = '[' + inquiryTypeCode_(String(item['Inquiry Type'] || 'General')) + '] ' + String(item['Inquiry Type'] || 'General');
    return [
      formatShortDate_(item['Submitted At UTC']), primary, item['Full Name'], typeLabel,
      compactInquiryInterest_(item), item.Subject, item.Status, item.Email,
      item['Source URL'] ? 'Open source' : '', String(item['Inquiry ID'] || '').slice(-8)
    ];
  });
  sheet.getRange(36, 1, rows.length, 10).setValues(rows).setBackground(THEME.panel).setFontColor(THEME.text);
  sorted.forEach(function(item, index) {
    addLinkToCell_(sheet.getRange(36 + index, 9), item['Source URL'], 'Open source');
    applySingleStatusStyle_(sheet.getRange(36 + index, 7), item.Status, INQUIRY_STATUS_STYLES);
  });
}

function addLinkToCell_(cell, url, label) {
  const safeUrl = String(url || '').trim();
  if (!safeUrl) return;
  cell.setRichTextValue(SpreadsheetApp.newRichTextValue().setText(label).setLinkUrl(safeUrl).build())
    .setFontColor(THEME.blue).setFontWeight('bold');
}

function applySingleStatusStyle_(cell, status, styleMap) {
  const style = styleMap[String(status || '')];
  if (!style) {
    cell.setBackground(THEME.panelAlt).setFontColor(THEME.text);
    return;
  }
  cell.setBackground(style.background).setFontColor(style.font).setFontWeight('bold').setHorizontalAlignment('center');
}

function readObjects_(sheet, headers) {
  if (!sheet || sheet.getLastRow() < 2) return [];
  const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, headers.length).getValues();
  return rows.filter(function(row) {
    return row.some(function(value) { return value !== '' && value !== null; });
  }).map(function(row) {
    const object = {};
    headers.forEach(function(header, index) { object[header] = row[index]; });
    return object;
  });
}

function countBy_(records, key) {
  const counts = {};
  records.forEach(function(record) {
    const value = String(record[key] || 'Not specified').trim() || 'Not specified';
    counts[value] = (counts[value] || 0) + 1;
  });
  return counts;
}

function sortedCountEntries_(counts, limit) {
  const entries = Object.keys(counts).map(function(key) { return [key, counts[key]]; });
  entries.sort(function(a, b) { return b[1] - a[1] || String(a[0]).localeCompare(String(b[0])); });
  return typeof limit === 'number' ? entries.slice(0, limit) : entries;
}

function parseSubmissionDate_(value) {
  if (value instanceof Date && !isNaN(value.getTime())) return value;
  if (!value) return null;
  const parsed = new Date(String(value));
  return isNaN(parsed.getTime()) ? null : parsed;
}

function sortByNewest_(records) {
  return records.slice().sort(function(a, b) {
    const dateA = parseSubmissionDate_(a['Submitted At UTC']);
    const dateB = parseSubmissionDate_(b['Submitted At UTC']);
    return (dateB ? dateB.getTime() : 0) - (dateA ? dateA.getTime() : 0);
  });
}

function daysAgo_(date, days) {
  const result = new Date(date.getTime());
  result.setDate(result.getDate() - days);
  return result;
}

function startOfDay_(date) {
  const result = new Date(date.getTime());
  result.setHours(0, 0, 0, 0);
  return result;
}

function countSince_(records, dateKey, threshold) {
  return records.filter(function(record) {
    const date = parseSubmissionDate_(record[dateKey]);
    return date && date >= threshold;
  }).length;
}

function median_(values) {
  if (!values.length) return '';
  const sorted = values.slice().sort(function(a, b) { return a - b; });
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function formatShortDate_(value) {
  const date = parseSubmissionDate_(value);
  return date ? Utilities.formatDate(date, Session.getScriptTimeZone(), 'dd/MM/yy') : String(value || '');
}

function formatCandidateRate_(candidate) {
  const currency = String(candidate.Currency || '').trim();
  const min = candidate['Rate Min'];
  const max = candidate['Rate Max'];
  const basis = emailRateBasis_(String(candidate['Rate Basis'] || ''));
  if (!currency || min === '' || min === null) return 'Not specified';
  return max !== '' && max !== null
    ? currency + ' ' + formatNumber_(min) + '–' + formatNumber_(max) + ' / ' + basis
    : currency + ' ' + formatNumber_(min) + ' / ' + basis;
}

function formatNumber_(value) {
  const number = Number(value);
  if (!isFinite(number)) return String(value || '');
  return number.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

function writeDashboardData_(sheet, candidates, inquiries, now) {
  sheet.clearContents();
  const candidateCounts = countBy_(candidates, 'Status');
  const inquiryCounts = countBy_(inquiries, 'Status');

  writeSummaryTableFixed_(sheet, 1, 1, 'Candidate Status', 'Candidates', CANDIDATE_STATUS_OPTIONS.map(function(status) { return [status, candidateCounts[status] || 0]; }), 10);
  writeSummaryTableFixed_(sheet, 1, 4, 'Role Category', 'Candidates', sortedCountEntries_(countBy_(candidates, 'Role Category'), 12), 12);
  writeSummaryTableFixed_(sheet, 1, 7, 'Seniority', 'Candidates', sortedCountEntries_(countBy_(candidates, 'Seniority'), 8), 8);
  writeSummaryTableFixed_(sheet, 1, 10, 'Country / Region', 'Candidates', sortedCountEntries_(countBy_(candidates, 'Country / Region'), 12), 12);
  writeSummaryTableFixed_(sheet, 1, 13, 'Work Type', 'Candidates', sortedCountEntries_(countBy_(candidates, 'Work Type'), 8), 8);
  writeSummaryTableFixed_(sheet, 1, 16, 'Availability', 'Candidates', sortedCountEntries_(countBy_(candidates, 'Availability'), 8), 8);
  writeDailySubmissions_(sheet, candidates, now, 1, 19, 'Hiring Date', 'Hiring Submissions');

  const rateOverview = buildRateOverview_(candidates);
  const rateRows = rateOverview.length ? rateOverview.map(function(item) {
    return [item.currency + ' / ' + item.basis, item.count];
  }) : [['No data', 0]];
  writeSummaryTableFixed_(sheet, 1, 22, 'Rate Group', 'Candidates', rateRows, 12);

  writeSummaryTableFixed_(sheet, 1, 28, 'Business Status', 'Contacts', INQUIRY_STATUS_OPTIONS.map(function(status) { return [status, inquiryCounts[status] || 0]; }), 12);
  writeSummaryTableFixed_(sheet, 1, 31, 'Inquiry Type', 'Contacts', sortedCountEntries_(countBy_(inquiries, 'Inquiry Type'), 12), 12);
  writeSummaryTableFixed_(sheet, 1, 34, 'Selected Service', 'Contacts', sortedCountEntries_(countBy_(inquiries, 'Selected Service'), 12), 12);
  writeSummaryTableFixed_(sheet, 1, 37, 'Company', 'Contacts', sortedCountEntries_(countBy_(inquiries, 'Company'), 12), 12);
  writeDailySubmissions_(sheet, inquiries, now, 1, 40, 'Business Date', 'Business Contacts');

  sheet.getRange(1, 1, 150, 50).setFontFamily('Roboto').setFontSize(9);
}

function writeSummaryTableFixed_(sheet, row, column, labelHeader, countHeader, rows, capacity) {
  sheet.getRange(row, column, capacity + 1, 2).clearContent();
  sheet.getRange(row, column, 1, 2).setValues([[labelHeader, countHeader]]);
  const safeRows = rows.length ? rows.slice(0, capacity) : [['No data', 0]];
  sheet.getRange(row + 1, column, safeRows.length, 2).setValues(safeRows);
}

function writeDailySubmissions_(sheet, records, now, row, column, dateHeader, countHeader) {
  const counts = {};
  records.forEach(function(record) {
    const date = parseSubmissionDate_(record['Submitted At UTC']);
    if (!date) return;
    const key = Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyy-MM-dd');
    counts[key] = (counts[key] || 0) + 1;
  });
  const rows = [];
  for (let offset = 29; offset >= 0; offset--) {
    const day = daysAgo_(now, offset);
    const key = Utilities.formatDate(day, Session.getScriptTimeZone(), 'yyyy-MM-dd');
    rows.push([key, counts[key] || 0]);
  }
  sheet.getRange(row, column, 31, 2).clearContent();
  sheet.getRange(row, column, 1, 2).setValues([[dateHeader, countHeader]]);
  sheet.getRange(row + 1, column, rows.length, 2).setValues(rows);
}

function rebuildAllCharts_(spreadsheet) {
  const hiring = spreadsheet.getSheetByName(SHEET_NAMES.hiringDashboard);
  const business = spreadsheet.getSheetByName(SHEET_NAMES.businessDashboard);
  const data = spreadsheet.getSheetByName(SHEET_NAMES.dashboardData);
  if (!hiring || !business || !data) {
    setupHiringDashboardStructure_(spreadsheet);
    setupBusinessDashboardStructure_(spreadsheet);
    setupDashboardData_(spreadsheet);
    refreshAllDashboards_(spreadsheet);
  }
  rebuildHiringCharts_(spreadsheet.getSheetByName(SHEET_NAMES.hiringDashboard), spreadsheet.getSheetByName(SHEET_NAMES.dashboardData));
  rebuildBusinessCharts_(spreadsheet.getSheetByName(SHEET_NAMES.businessDashboard), spreadsheet.getSheetByName(SHEET_NAMES.dashboardData));
  const dataSheet = spreadsheet.getSheetByName(SHEET_NAMES.dashboardData);
  if (!dataSheet.isSheetHidden()) dataSheet.hideSheet();
}

function rebuildHiringCharts_(dashboard, data) {
  dashboard.getCharts().forEach(function(chart) { dashboard.removeChart(chart); });
  const specs = [
    [Charts.ChartType.PIE, data.getRange('A1:B9'), 48, 1, 'Candidates by Status', { pieHole: 0.55 }],
    [Charts.ChartType.LINE, data.getRange('S1:T31'), 48, 9, 'Hiring Submissions — Last 30 Days', { legend: { position: 'none' } }],
    [Charts.ChartType.BAR, data.getRange('D1:E13'), 68, 1, 'Candidates by Role Category', { legend: { position: 'none' } }],
    [Charts.ChartType.COLUMN, data.getRange('G1:H9'), 68, 9, 'Candidates by Experience', { legend: { position: 'none' } }],
    [Charts.ChartType.BAR, data.getRange('J1:K13'), 88, 1, 'Top Countries / Regions', { legend: { position: 'none' } }],
    [Charts.ChartType.PIE, data.getRange('M1:N9'), 88, 9, 'Candidates by Work Type', { pieHole: 0.48 }],
    [Charts.ChartType.BAR, data.getRange('P1:Q9'), 108, 1, 'Candidates by Availability', { legend: { position: 'none' } }],
    [Charts.ChartType.COLUMN, data.getRange('V1:W13'), 108, 9, 'Candidates by Rate Group', { legend: { position: 'none' } }]
  ];
  specs.forEach(function(spec) { insertStyledChart_(dashboard, spec); });
}

function rebuildBusinessCharts_(dashboard, data) {
  dashboard.getCharts().forEach(function(chart) { dashboard.removeChart(chart); });
  const specs = [
    [Charts.ChartType.PIE, data.getRange('AB1:AC11'), 51, 1, 'Business Contacts by Status', { pieHole: 0.55 }],
    [Charts.ChartType.LINE, data.getRange('AN1:AO31'), 51, 9, 'Business Contacts — Last 30 Days', { legend: { position: 'none' } }],
    [Charts.ChartType.BAR, data.getRange('AE1:AF13'), 71, 1, 'Contacts by Inquiry Type', { legend: { position: 'none' } }],
    [Charts.ChartType.BAR, data.getRange('AH1:AI13'), 71, 9, 'Contacts by Selected Service', { legend: { position: 'none' } }],
    [Charts.ChartType.BAR, data.getRange('AK1:AL13'), 91, 1, 'Top Companies', { legend: { position: 'none' } }]
  ];
  specs.forEach(function(spec) { insertStyledChart_(dashboard, spec); });
}

function insertStyledChart_(dashboard, spec) {
  let builder = dashboard.newChart()
    .setChartType(spec[0])
    .addRange(spec[1])
    .setPosition(spec[2], spec[3], 0, 0)
    .setOption('title', spec[4])
    .setOption('width', 630)
    .setOption('height', 340)
    .setOption('backgroundColor', THEME.panel)
    .setOption('chartArea', { left: 80, top: 55, width: '72%', height: '70%' })
    .setOption('titleTextStyle', { color: THEME.text, fontSize: 16, bold: true })
    .setOption('legend', { position: 'right', textStyle: { color: THEME.muted, fontSize: 10 } })
    .setOption('colors', [THEME.blue, THEME.purple, THEME.orange, THEME.green, THEME.cyan, THEME.yellow, THEME.red, THEME.grey])
    .setOption('hAxis', { textStyle: { color: THEME.muted }, gridlines: { color: THEME.border }, baselineColor: THEME.border })
    .setOption('vAxis', { textStyle: { color: THEME.muted }, gridlines: { color: THEME.border }, baselineColor: THEME.border });
  const options = spec[5] || {};
  Object.keys(options).forEach(function(key) { builder = builder.setOption(key, options[key]); });
  dashboard.insertChart(builder.build());
}

function setupCandidateView_(spreadsheet) {
  let sheet = spreadsheet.getSheetByName(SHEET_NAMES.candidateView);
  if (!sheet) sheet = spreadsheet.insertSheet(SHEET_NAMES.candidateView);

  ensureSheetSize_(sheet, 55, 10);
  sheet.getRange(1, 1, sheet.getMaxRows(), sheet.getMaxColumns()).breakApart();
  sheet.clear();
  sheet.setConditionalFormatRules([]);
  sheet.setHiddenGridlines(true);
  sheet.setFrozenRows(2);
  sheet.setTabColor(THEME.orange);

  const visibleWidths = [150, 150, 170, 170, 170, 150, 150, 150];
  visibleWidths.forEach(function(width, index) { sheet.setColumnWidth(index + 1, width); });
  sheet.getRange(1, 1, 55, 8)
    .setBackground(THEME.background)
    .setFontFamily('Roboto')
    .setFontColor(THEME.text);

  sheet.setRowHeights(1, 2, 30);
  sheet.getRange('A1:B2').merge().setValue('CANDIDATE PROFILE')
    .setFontSize(13).setFontWeight('bold').setFontColor(THEME.muted)
    .setVerticalAlignment('middle');
  sheet.getRange('C1:E2').merge()
    .setBackground(THEME.panelAlt).setFontColor(THEME.text).setFontWeight('bold')
    .setVerticalAlignment('middle');
  sheet.getRange('F1:H2').merge().setValue('Search by candidate name, role and experience')
    .setFontColor(THEME.muted).setFontSize(9)
    .setHorizontalAlignment('right').setVerticalAlignment('middle');

  // Hidden helper columns: I contains readable dropdown labels, J contains the real Candidate ID.
  sheet.getRange('J1').setFormula('=IF($C$1="","",IFERROR(INDEX($J$2:$J,MATCH($C$1,$I$2:$I,0)),""))');

  sheet.getRange('A4:H5').merge().setFormula(candidateFormula_('Full Name'))
    .setFontSize(26).setFontWeight('bold').setFontColor(THEME.text)
    .setVerticalAlignment('bottom');
  sheet.getRange('A6:H6').merge().setFormula(candidateRoleExperienceFormula_())
    .setFontSize(15).setFontWeight('bold').setFontColor(THEME.blue)
    .setVerticalAlignment('middle');
  const candidateStatusRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(CANDIDATE_STATUS_OPTIONS, true)
    .setAllowInvalid(false)
    .setHelpText('Change the candidate status here. The Candidates table and dashboards update automatically.')
    .build();
  sheet.getRange('A7:B7').merge()
    .setHorizontalAlignment('center').setFontWeight('bold')
    .setDataValidation(candidateStatusRule);
  sheet.getRange('C7:E7').merge().setFormula(candidatePrefixedFormula_('Availability', 'Availability: '))
    .setBackground(THEME.panelAlt).setHorizontalAlignment('center');
  sheet.getRange('F7:H7').merge().setFormula(candidatePrefixedFormula_('Work Type', 'Work type: '))
    .setBackground(THEME.panelAlt).setHorizontalAlignment('center');

  createViewSection_(sheet, 'A9:D9', 'Contact & Location');
  createViewSection_(sheet, 'E9:H9', 'Professional Profile');
  createLabelValuePair_(sheet, 'A10', 'B10:D10', 'Email', candidateFormula_('Email'));
  createLabelValuePair_(sheet, 'A11', 'B11:D11', 'Country / Region', candidateFormula_('Country / Region'));
  createLabelValuePair_(sheet, 'A12', 'B12:D12', 'Time Zone', candidateFormula_('Time Zone'));
  createLabelValuePair_(sheet, 'A13', 'B13:D13', 'Date', candidateDateFormula_());
  createLabelValuePair_(sheet, 'E10', 'F10:H10', 'Role Category', candidateFormula_('Role Category'));
  createLabelValuePair_(sheet, 'E11', 'F11:H11', 'Role Title', candidateFormula_('Role Title'));
  createLabelValuePair_(sheet, 'E12', 'F12:H12', 'Experience', candidateFormula_('Seniority'));
  createLabelValuePair_(sheet, 'E13', 'F13:H13', 'Work Type', candidateFormula_('Work Type'));

  createViewSection_(sheet, 'A15:D15', 'Hourly Rate');
  createViewSection_(sheet, 'E15:H15', 'Links');
  sheet.getRange('A16').setValue('Rate per hour')
    .setFontColor(THEME.muted).setFontWeight('bold').setVerticalAlignment('middle');
  sheet.getRange('B16:D18').merge().setFormula(candidateHourlyRateFormula_())
    .setBackground(THEME.panel).setFontColor(THEME.text).setFontSize(20).setFontWeight('bold')
    .setBorder(true, true, true, true, false, false, THEME.border, SpreadsheetApp.BorderStyle.SOLID)
    .setHorizontalAlignment('center').setVerticalAlignment('middle');
  sheet.getRange('A17:A18').clearContent();
  createLabelValuePair_(sheet, 'A19', 'B19:D19', 'Engagement', candidateFormula_('Work Type'));
  createLabelValuePair_(sheet, 'E16', 'F16:H16', 'Portfolio', candidateLinkFormula_('Portfolio URL', 'Open Portfolio'));
  createLabelValuePair_(sheet, 'E17', 'F17:H17', 'LinkedIn', candidateLinkFormula_('LinkedIn URL', 'Open LinkedIn'));
  createLabelValuePair_(sheet, 'E18', 'F18:H18', 'Resume / CV', candidateLinkFormula_('Resume / CV URL', 'Open Resume'));
  createLabelValuePair_(sheet, 'E19', 'F19:H19', 'Source URL', candidateLinkFormula_('Source URL', 'Open Source Page'));

  createViewSection_(sheet, 'A21:H21', 'Application');
  createLabelValuePair_(sheet, 'A22', 'B22:H22', 'Subject', candidateFormula_('Subject'));
  createLabelValuePair_(sheet, 'A23', 'B23:H23', 'Selected Service', candidateFormula_('Selected Service'));
  createLabelValuePair_(sheet, 'A24', 'B24:H35', 'Message', candidateFormula_('Message'));
  createLabelValuePair_(sheet, 'A36', 'B36:H36', 'Consent', candidateFormula_('Consent'));

  createViewSection_(sheet, 'A38:H38', 'Internal');
  createLabelValuePair_(sheet, 'A39', 'B39:H43', 'Internal Notes', candidateFormula_('Internal Notes'));
  createLabelValuePair_(sheet, 'A44', 'B44:H46', 'AI Tags', candidateFormula_('AI Tags'));
  createLabelValuePair_(sheet, 'A47', 'B47:H47', 'AI Score', candidateFormula_('AI Score'));

  sheet.getRange('F16:H19').setFontColor(THEME.blue).setFontWeight('bold');
  sheet.getRange('B24:H35').setWrapStrategy(SpreadsheetApp.WrapStrategy.WRAP).setVerticalAlignment('top');
  sheet.getRange('B39:H46').setWrapStrategy(SpreadsheetApp.WrapStrategy.WRAP).setVerticalAlignment('top');
  sheet.setRowHeights(24, 12, 34);
  sheet.setRowHeights(39, 5, 34);
  applyViewStatusRules_(sheet, sheet.getRange('A7:B7'), CANDIDATE_STATUS_OPTIONS, CANDIDATE_STATUS_STYLES);

  refreshCandidateSelector_(spreadsheet);
  sheet.hideColumns(9, 2);
}

function refreshCandidateSelector_(spreadsheet, candidateObjects) {
  const sheet = spreadsheet.getSheetByName(SHEET_NAMES.candidateView);
  const source = spreadsheet.getSheetByName(SHEET_NAMES.candidates);
  if (!sheet || !source) return;

  ensureSheetSize_(sheet, Math.max(55, source.getMaxRows() + 2), 10);
  const currentId = String(sheet.getRange('J1').getDisplayValue() || '');
  const candidates = candidateObjects || readObjects_(source, CANDIDATE_HEADERS);
  const sorted = sortByNewest_(candidates);

  const options = sorted.map(function(item) {
    return [buildCandidateSelectorLabel_(item), String(item['Candidate ID'] || '')];
  }).filter(function(row) { return row[1]; });

  const helperRows = Math.max(sheet.getMaxRows() - 1, 1);
  sheet.getRange(2, 9, helperRows, 2).clearContent();
  if (options.length) sheet.getRange(2, 9, options.length, 2).setValues(options);

  const validationRange = sheet.getRange(2, 9, Math.max(options.length, 1), 1);
  const rule = SpreadsheetApp.newDataValidation()
    .requireValueInRange(validationRange, true)
    .setAllowInvalid(false)
    .setHelpText('Choose a candidate by name, role, experience, status or country.')
    .build();
  sheet.getRange('C1').setDataValidation(rule);

  let selectedLabel = '';
  if (currentId) {
    const match = options.find(function(row) { return row[1] === currentId; });
    if (match) selectedLabel = match[0];
  }
  if (!selectedLabel && options.length) selectedLabel = options[0][0];
  sheet.getRange('C1').setValue(selectedLabel);
  const selectedOption = options.find(function(row) { return row[0] === selectedLabel; });
  syncCandidateViewStatus_(spreadsheet, selectedOption ? selectedOption[1] : '', candidates);
  sheet.getRange('J1').setFormula('=IF($C$1="","",IFERROR(INDEX($J$2:$J,MATCH($C$1,$I$2:$I,0)),""))');
  sheet.hideColumns(9, 2);
}

function syncCandidateViewStatus_(spreadsheet, candidateId, candidateObjects) {
  const view = spreadsheet.getSheetByName(SHEET_NAMES.candidateView);
  const source = spreadsheet.getSheetByName(SHEET_NAMES.candidates);
  if (!view || !source) return;

  const selectedId = String(candidateId || selectedCandidateIdFromView_(view) || '');
  const candidates = candidateObjects || readObjects_(source, CANDIDATE_HEADERS);
  const selected = candidates.find(function(item) {
    return String(item['Candidate ID'] || '') === selectedId;
  });
  view.getRange('A7').setValue(selected ? String(selected.Status || 'New') : '');
}

function selectedCandidateIdFromView_(view) {
  const formulaId = String(view.getRange('J1').getDisplayValue() || '');
  if (formulaId) return formulaId;

  return candidateIdFromSelectorLabel_(view, view.getRange('C1').getDisplayValue());
}

function candidateIdFromSelectorLabel_(view, label) {
  const selectedLabel = String(label || '');
  if (!selectedLabel || view.getLastRow() < 2) return '';
  const options = view.getRange(2, 9, view.getLastRow() - 1, 2).getDisplayValues();
  const match = options.find(function(row) { return row[0] === selectedLabel; });
  return match ? String(match[1] || '') : '';
}

function updateCandidateStatusFromView_(spreadsheet, editedStatus) {
  const view = spreadsheet.getSheetByName(SHEET_NAMES.candidateView);
  const source = spreadsheet.getSheetByName(SHEET_NAMES.candidates);
  if (!view || !source) return;

  const status = String(editedStatus || view.getRange('A7').getDisplayValue() || '').trim();
  const candidateId = selectedCandidateIdFromView_(view);
  if (CANDIDATE_STATUS_OPTIONS.indexOf(status) === -1 || !candidateId || source.getLastRow() < 2) {
    syncCandidateViewStatus_(spreadsheet, candidateId);
    return;
  }

  const ids = source.getRange(2, 2, source.getLastRow() - 1, 1).getDisplayValues();
  const index = ids.findIndex(function(row) { return String(row[0] || '') === candidateId; });
  if (index === -1) {
    syncCandidateViewStatus_(spreadsheet, candidateId);
    return;
  }

  source.getRange(index + 2, 3).setValue(status);
  refreshAllDashboards_(spreadsheet);
  spreadsheet.toast('Candidate status updated to ' + status + '.', 'Leaf & Light', 4);
}

function buildCandidateSelectorLabel_(item) {
  const name = String(item['Full Name'] || 'Unnamed candidate').trim();
  const role = String(item['Role Title'] || item['Role Category'] || '').trim();
  const experience = String(item.Seniority || '').trim();
  const status = String(item.Status || 'New').trim();
  const statusIcon = candidateStatusIcon_(status);
  const country = String(item['Country / Region'] || '').trim();
  const dateLabel = formatSelectorDate_(item['Submitted At UTC']);
  const idSuffix = String(item['Candidate ID'] || '').slice(-4);

  let label = name;
  if (role) label += ' — ' + role;
  if (experience) label += ' — ' + experience;
  label += ' — ' + statusIcon + ' ' + status;
  if (country) label += ' · ' + country;
  if (dateLabel) label += ' · ' + dateLabel;
  if (idSuffix) label += ' · ' + idSuffix;
  return truncateLabel_(label, 180);
}

function candidateStatusIcon_(status) {
  const map = {
    New: '🔵', Reviewing: '🟡', Shortlisted: '🟣', Contacted: '🔷',
    Interview: '🟠', Hired: '🟢', Rejected: '🔴', Archived: '⚪'
  };
  return map[status] || '•';
}

function setupContactView_(spreadsheet) {
  let sheet = spreadsheet.getSheetByName(SHEET_NAMES.contactView);
  if (!sheet) sheet = spreadsheet.insertSheet(SHEET_NAMES.contactView);
  ensureSheetSize_(sheet, 38, 10);
  sheet.getRange(1, 1, sheet.getMaxRows(), sheet.getMaxColumns()).breakApart();
  sheet.clear();
  sheet.setHiddenGridlines(true);
  sheet.setFrozenRows(2);
  sheet.setTabColor(THEME.cyan);
  for (let column = 1; column <= 8; column++) sheet.setColumnWidth(column, 140);
  sheet.getRange(1, 1, 38, 8).setBackground(THEME.background).setFontFamily('Roboto').setFontColor(THEME.text);

  sheet.getRange('A1:B2').merge().setValue('BUSINESS CONTACT')
    .setFontSize(13).setFontWeight('bold').setFontColor(THEME.muted).setVerticalAlignment('middle');
  sheet.getRange('C1:E2').merge().setBackground(THEME.panelAlt).setFontColor(THEME.text).setFontWeight('bold');
  sheet.getRange('F1:H2').merge().setValue('Search by company or person  •  [B] Business  [P] Partnership  [G] General')
    .setFontColor(THEME.muted).setFontSize(9).setHorizontalAlignment('right').setVerticalAlignment('middle');

  // Hidden helper columns: I contains readable dropdown labels, J contains the matching Inquiry ID.
  sheet.getRange('J1').setFormula('=IF($C$1="","",IFERROR(INDEX($J$2:$J,MATCH($C$1,$I$2:$I,0)),""))');

  sheet.getRange('A4:H5').merge().setFormula(inquiryPrimaryNameFormula_())
    .setFontSize(26).setFontWeight('bold').setFontColor(THEME.text).setVerticalAlignment('bottom');
  sheet.getRange('A6:H6').merge().setFormula(inquiryContactContextFormula_())
    .setFontSize(15).setFontWeight('bold').setFontColor(THEME.blue).setVerticalAlignment('middle');
  sheet.getRange('A7:B7').merge().setFormula(inquiryFormula_('Status')).setHorizontalAlignment('center').setFontWeight('bold');
  sheet.getRange('C7:H7').merge().setFormula(inquiryInterestFormula_())
    .setBackground(THEME.panelAlt).setHorizontalAlignment('center').setFontColor(THEME.muted);

  createViewSection_(sheet, 'A9:D9', 'Contact');
  createViewSection_(sheet, 'E9:H9', 'Opportunity');
  createLabelValuePair_(sheet, 'A10', 'B10:D10', 'Full Name', inquiryFormula_('Full Name'));
  createLabelValuePair_(sheet, 'A11', 'B11:D11', 'Email', inquiryFormula_('Email'));
  createLabelValuePair_(sheet, 'A12', 'B12:D12', 'Company', inquiryFormula_('Company'));
  createLabelValuePair_(sheet, 'A13', 'B13:D13', 'Date', inquiryDateFormula_());
  createLabelValuePair_(sheet, 'A14', 'B14:D14', 'Reference', inquiryShortIdFormula_());
  createLabelValuePair_(sheet, 'E10', 'F10:H10', 'Inquiry Type', inquiryFormula_('Inquiry Type'));
  createLabelValuePair_(sheet, 'E11', 'F11:H11', 'Selected Service', inquiryFormula_('Selected Service'));
  createLabelValuePair_(sheet, 'E12', 'F12:H12', 'Status', inquiryFormula_('Status'));
  createLabelValuePair_(sheet, 'E13', 'F13:H13', 'Subject', inquiryFormula_('Subject'));
  createLabelValuePair_(sheet, 'E14', 'F14:H14', 'Source', inquiryLinkFormula_('Source URL', 'Open Source Page'));

  createViewSection_(sheet, 'A16:H16', 'Message');
  createLabelValuePair_(sheet, 'A17', 'B17:H24', 'Message', inquiryFormula_('Message'));
  sheet.getRange('B17:H24').setWrapStrategy(SpreadsheetApp.WrapStrategy.WRAP).setVerticalAlignment('top');
  sheet.setRowHeights(17, 8, 34);
  sheet.getRange('F14:H14').setFontColor(THEME.blue).setFontWeight('bold');
  applyViewStatusRules_(sheet, sheet.getRange('A7:B7'), INQUIRY_STATUS_OPTIONS, INQUIRY_STATUS_STYLES);

  refreshContactSelector_(spreadsheet);
  sheet.hideColumns(9, 2);
}

function refreshContactSelector_(spreadsheet, inquiryObjects) {
  const sheet = spreadsheet.getSheetByName(SHEET_NAMES.contactView);
  const source = spreadsheet.getSheetByName(SHEET_NAMES.inquiries);
  if (!sheet || !source) return;

  ensureSheetSize_(sheet, Math.max(38, source.getMaxRows() + 2), 10);
  const currentId = String(sheet.getRange('J1').getDisplayValue() || '');
  const inquiries = inquiryObjects || readObjects_(source, INQUIRY_HEADERS);
  const sorted = inquiries.slice().sort(function(a, b) {
    const dateA = parseSubmissionDate_(a['Submitted At UTC']);
    const dateB = parseSubmissionDate_(b['Submitted At UTC']);
    return (dateB ? dateB.getTime() : 0) - (dateA ? dateA.getTime() : 0);
  });

  const options = sorted.map(function(item) {
    return [buildInquirySelectorLabel_(item), String(item['Inquiry ID'] || '')];
  }).filter(function(row) { return row[1]; });

  const helperRows = Math.max(sheet.getMaxRows() - 1, 1);
  sheet.getRange(2, 9, helperRows, 2).clearContent();
  if (options.length) sheet.getRange(2, 9, options.length, 2).setValues(options);

  const validationRange = sheet.getRange(2, 9, Math.max(options.length, 1), 1);
  const rule = SpreadsheetApp.newDataValidation()
    .requireValueInRange(validationRange, true)
    .setAllowInvalid(false)
    .setHelpText('Choose a contact by company or person. The label also previews type, interest and status.')
    .build();
  sheet.getRange('C1').setDataValidation(rule);

  let selectedLabel = '';
  if (currentId) {
    const match = options.find(function(row) { return row[1] === currentId; });
    if (match) selectedLabel = match[0];
  }
  if (!selectedLabel && options.length) selectedLabel = options[0][0];
  sheet.getRange('C1').setValue(selectedLabel);
  sheet.getRange('J1').setFormula('=IF($C$1="","",IFERROR(INDEX($J$2:$J,MATCH($C$1,$I$2:$I,0)),""))');
  sheet.hideColumns(9, 2);
}

function buildInquirySelectorLabel_(item) {
  const type = String(item['Inquiry Type'] || 'General');
  const code = inquiryTypeCode_(type);
  const primary = String(item.Company || item['Full Name'] || 'Unnamed contact').trim();
  const interest = compactInquiryInterest_(item);
  const status = String(item.Status || 'New');
  const statusIcon = inquiryStatusIcon_(status);
  const dateLabel = formatSelectorDate_(item['Submitted At UTC']);
  const idSuffix = String(item['Inquiry ID'] || '').slice(-4);
  return '[' + code + '] ' + primary + ' — ' + interest + ' — ' + statusIcon + ' ' + status +
    (dateLabel ? ' · ' + dateLabel : '') + (idSuffix ? ' · ' + idSuffix : '');
}

function inquiryTypeCode_(type) {
  const map = { Business: 'B', Partnership: 'P', General: 'G' };
  return map[type] || String(type || 'G').charAt(0).toUpperCase();
}

function compactInquiryInterest_(item) {
  const service = String(item['Selected Service'] || '').trim();
  if (service) {
    const map = {
      'Full-Cycle Game Development': 'Full-Cycle',
      'VR Worlds and Experiences': 'VR Worlds',
      'Concepts and Prototypes': 'Prototypes'
    };
    return map[service] || truncateLabel_(service, 28);
  }
  return String(item['Inquiry Type'] || 'General');
}

function inquiryStatusIcon_(status) {
  const map = {
    New: '🔵', Reviewing: '🟡', Replied: '🔷', 'Follow-up': '🟣', Meeting: '🟠',
    'Proposal Sent': '🟪', Negotiating: '🟧', Won: '🟢', Lost: '🔴', Archived: '⚪'
  };
  return map[status] || '•';
}

function formatSelectorDate_(value) {
  const date = parseSubmissionDate_(value);
  if (!date) return '';
  return Utilities.formatDate(date, Session.getScriptTimeZone() || 'UTC', 'dd/MM/yy');
}

function truncateLabel_(value, maxLength) {
  const text = String(value || '');
  return text.length <= maxLength ? text : text.slice(0, maxLength - 1) + '…';
}

function createViewSection_(sheet, rangeA1, title) {
  sheet.getRange(rangeA1).merge().setValue(title)
    .setBackground(THEME.panelAlt).setFontColor(THEME.text).setFontSize(13).setFontWeight('bold')
    .setVerticalAlignment('middle')
    .setBorder(true, true, true, true, false, false, THEME.border, SpreadsheetApp.BorderStyle.SOLID);
}

function createLabelValuePair_(sheet, labelCell, valueRange, label, formula) {
  sheet.getRange(labelCell).setValue(label.toUpperCase())
    .setFontColor(THEME.label).setFontSize(9).setFontWeight('bold').setVerticalAlignment('middle');
  const value = sheet.getRange(valueRange);
  value.merge().setBackground(THEME.valuePanel).setFontColor(THEME.text).setFontSize(11)
    .setBorder(true, true, true, true, false, false, THEME.border, SpreadsheetApp.BorderStyle.SOLID)
    .setVerticalAlignment('middle');
  value.getCell(1, 1).setFormula(formula);
}

function selectedCandidateIdReference_() {
  return '$J$1';
}

function candidateFormula_(header) {
  const column = CANDIDATE_HEADERS.indexOf(header) + 1;
  const id = selectedCandidateIdReference_();
  return '=IF(' + id + '="","",IFERROR(INDEX(Candidates!$A:$AA,MATCH(' + id + ',Candidates!$B:$B,0),' + column + '),""))';
}

function candidateDateFormula_() {
  const column = CANDIDATE_HEADERS.indexOf('Submitted At UTC') + 1;
  const id = selectedCandidateIdReference_();
  return '=IF(' + id + '="","",IFERROR(TEXT(INDEX(Candidates!$A:$AA,MATCH(' + id + ',Candidates!$B:$B,0),' + column + '),"dd/MM/yy"),""))';
}

function candidateLinkFormula_(header, label) {
  const column = CANDIDATE_HEADERS.indexOf(header) + 1;
  const id = selectedCandidateIdReference_();
  return '=IF(' + id + '="","",IFERROR(IF(INDEX(Candidates!$A:$AA,MATCH(' + id + ',Candidates!$B:$B,0),' + column + ')="","",HYPERLINK(INDEX(Candidates!$A:$AA,MATCH(' + id + ',Candidates!$B:$B,0),' + column + '),"' + label + '")),""))';
}

function candidateRoleExperienceFormula_() {
  const role = CANDIDATE_HEADERS.indexOf('Role Title') + 1;
  const seniority = CANDIDATE_HEADERS.indexOf('Seniority') + 1;
  const id = selectedCandidateIdReference_();
  return '=IF(' + id + '="","",IFERROR(TEXTJOIN("  •  ",TRUE,INDEX(Candidates!$A:$AA,MATCH(' + id + ',Candidates!$B:$B,0),' + role + '),INDEX(Candidates!$A:$AA,MATCH(' + id + ',Candidates!$B:$B,0),' + seniority + ')),""))';
}

function candidatePrefixedFormula_(header, prefix) {
  const column = CANDIDATE_HEADERS.indexOf(header) + 1;
  const id = selectedCandidateIdReference_();
  return '=IF(' + id + '="","",IFERROR("' + prefix + '"&INDEX(Candidates!$A:$AA,MATCH(' + id + ',Candidates!$B:$B,0),' + column + '),""))';
}

function candidateHourlyRateFormula_() {
  const rate = CANDIDATE_HEADERS.indexOf('Rate Min') + 1;
  const currency = CANDIDATE_HEADERS.indexOf('Currency') + 1;
  const id = selectedCandidateIdReference_();
  return '=IF(' + id + '="","",IFERROR(INDEX(Candidates!$A:$AA,MATCH(' + id + ',Candidates!$B:$B,0),' + currency + ')&" "&TEXT(INDEX(Candidates!$A:$AA,MATCH(' + id + ',Candidates!$B:$B,0),' + rate + '),"#,##0.##")&" / hour",""))';
}

function selectedInquiryIdReference_() {
  return '$J$1';
}

function inquiryFormula_(header) {
  const column = INQUIRY_HEADERS.indexOf(header) + 1;
  return '=IF(' + selectedInquiryIdReference_() + '="","",IFERROR(INDEX(\'General Inquiries\'!$A:$K,MATCH(' + selectedInquiryIdReference_() + ',\'General Inquiries\'!$B:$B,0),' + column + '),""))';
}

function inquiryDateFormula_() {
  const column = INQUIRY_HEADERS.indexOf('Submitted At UTC') + 1;
  const id = selectedInquiryIdReference_();
  return '=IF(' + id + '="","",IFERROR(TEXT(INDEX(\'General Inquiries\'!$A:$K,MATCH(' + id + ',\'General Inquiries\'!$B:$B,0),' + column + '),"dd/MM/yy"),""))';
}

function inquiryShortIdFormula_() {
  const column = INQUIRY_HEADERS.indexOf('Inquiry ID') + 1;
  const id = selectedInquiryIdReference_();
  return '=IF(' + id + '="","",IFERROR("…"&RIGHT(INDEX(\'General Inquiries\'!$A:$K,MATCH(' + id + ',\'General Inquiries\'!$B:$B,0),' + column + '),8),""))';
}

function inquiryLinkFormula_(header, label) {
  const column = INQUIRY_HEADERS.indexOf(header) + 1;
  return '=IF(' + selectedInquiryIdReference_() + '="","",IFERROR(IF(INDEX(\'General Inquiries\'!$A:$K,MATCH(' + selectedInquiryIdReference_() + ',\'General Inquiries\'!$B:$B,0),' + column + ')="","",HYPERLINK(INDEX(\'General Inquiries\'!$A:$K,MATCH(' + selectedInquiryIdReference_() + ',\'General Inquiries\'!$B:$B,0),' + column + '),"' + label + '")),""))';
}

function inquiryPrimaryNameFormula_() {
  const company = INQUIRY_HEADERS.indexOf('Company') + 1;
  const name = INQUIRY_HEADERS.indexOf('Full Name') + 1;
  const id = selectedInquiryIdReference_();
  return '=IF(' + id + '="","",IFERROR(IF(INDEX(\'General Inquiries\'!$A:$K,MATCH(' + id + ',\'General Inquiries\'!$B:$B,0),' + company + ')="",INDEX(\'General Inquiries\'!$A:$K,MATCH(' + id + ',\'General Inquiries\'!$B:$B,0),' + name + '),INDEX(\'General Inquiries\'!$A:$K,MATCH(' + id + ',\'General Inquiries\'!$B:$B,0),' + company + ')),""))';
}

function inquiryContactContextFormula_() {
  const name = INQUIRY_HEADERS.indexOf('Full Name') + 1;
  const type = INQUIRY_HEADERS.indexOf('Inquiry Type') + 1;
  const service = INQUIRY_HEADERS.indexOf('Selected Service') + 1;
  const id = selectedInquiryIdReference_();
  return '=IF(' + id + '="","",IFERROR(INDEX(\'General Inquiries\'!$A:$K,MATCH(' + id + ',\'General Inquiries\'!$B:$B,0),' + name + ')&"  •  ["&LEFT(INDEX(\'General Inquiries\'!$A:$K,MATCH(' + id + ',\'General Inquiries\'!$B:$B,0),' + type + '),1)&"] "&INDEX(\'General Inquiries\'!$A:$K,MATCH(' + id + ',\'General Inquiries\'!$B:$B,0),' + type + ')&IF(INDEX(\'General Inquiries\'!$A:$K,MATCH(' + id + ',\'General Inquiries\'!$B:$B,0),' + service + ')="","","  •  "&INDEX(\'General Inquiries\'!$A:$K,MATCH(' + id + ',\'General Inquiries\'!$B:$B,0),' + service + ')),""))';
}

function inquiryInterestFormula_() {
  const service = INQUIRY_HEADERS.indexOf('Selected Service') + 1;
  const type = INQUIRY_HEADERS.indexOf('Inquiry Type') + 1;
  const id = selectedInquiryIdReference_();
  return '=IF(' + id + '="","",IFERROR("Interest: "&IF(INDEX(\'General Inquiries\'!$A:$K,MATCH(' + id + ',\'General Inquiries\'!$B:$B,0),' + service + ')="",INDEX(\'General Inquiries\'!$A:$K,MATCH(' + id + ',\'General Inquiries\'!$B:$B,0),' + type + '),INDEX(\'General Inquiries\'!$A:$K,MATCH(' + id + ',\'General Inquiries\'!$B:$B,0),' + service + ')),""))';
}

function inquiryPrefixedFormula_(header, prefix) {
  const column = INQUIRY_HEADERS.indexOf(header) + 1;
  const id = selectedInquiryIdReference_();
  return '=IF(' + id + '="","",IFERROR("' + prefix + '"&INDEX(\'General Inquiries\'!$A:$K,MATCH(' + id + ',\'General Inquiries\'!$B:$B,0),' + column + '),""))';
}

function applyViewStatusRules_(sheet, range, statuses, styles) {
  const existing = sheet.getConditionalFormatRules().filter(function(rule) {
    return !rule.getRanges().some(function(ruleRange) { return ruleRange.getA1Notation() === range.getA1Notation(); });
  });
  const rules = statuses.map(function(status) {
    const style = styles[status];
    return SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo(status).setBackground(style.background).setFontColor(style.font).setBold(true).setRanges([range]).build();
  });
  sheet.setConditionalFormatRules(existing.concat(rules));
}

function orderSheets_(spreadsheet) {
  const order = [
    SHEET_NAMES.hiringDashboard, SHEET_NAMES.candidateView, SHEET_NAMES.candidates,
    SHEET_NAMES.businessDashboard, SHEET_NAMES.contactView, SHEET_NAMES.inquiries, SHEET_NAMES.dashboardData
  ];
  order.forEach(function(name, index) {
    const sheet = spreadsheet.getSheetByName(name);
    if (!sheet) return;
    spreadsheet.setActiveSheet(sheet);
    spreadsheet.moveActiveSheet(index + 1);
  });
}

function validateInquiry_(payload) {
  const inquiry = {
    type: cleanText_(payload.type || 'General', MAX_LENGTHS.short),
    selectedService: cleanText_(payload.selectedService || '', MAX_LENGTHS.short),
    name: cleanText_(payload.name, MAX_LENGTHS.short),
    email: cleanEmail_(payload.email),
    company: cleanText_(payload.company || '', MAX_LENGTHS.short),
    subject: cleanText_(payload.subject, MAX_LENGTHS.subject),
    message: cleanText_(payload.message, MAX_LENGTHS.message),
    sourceUrl: cleanUrl_(payload.sourceUrl || '', false)
  };
  if (!inquiry.name) throw new Error('Name is required.');
  if (REQUIRE_COMPANY_FOR_BUSINESS && (inquiry.type === 'Business' || inquiry.type === 'Partnership') && !inquiry.company) {
    throw new Error('Company is required for Business and Partnership inquiries.');
  }
  if (!inquiry.subject) throw new Error('Subject is required.');
  if (!inquiry.message) throw new Error('Message is required.');
  return inquiry;
}

function validateCandidate_(payload) {
  const hiring = payload.hiring || {};
  const candidate = {
    name: cleanText_(payload.name, MAX_LENGTHS.short),
    email: cleanEmail_(payload.email),
    subject: cleanText_(payload.subject, MAX_LENGTHS.subject),
    message: cleanText_(payload.message || '', MAX_LENGTHS.message),
    selectedService: cleanText_(payload.selectedService || '', MAX_LENGTHS.short),
    sourceUrl: cleanUrl_(payload.sourceUrl || '', false),
    hiring: {
      country: cleanText_(hiring.country, MAX_LENGTHS.short),
      timeZone: cleanText_(hiring.timeZone || '', 80),
      roleCategory: oneOf_(hiring.roleCategory, ROLE_CATEGORIES, 'Role Category'),
      roleTitle: cleanText_(hiring.roleTitle, MAX_LENGTHS.short),
      seniority: oneOf_(hiring.seniority, SENIORITIES, 'Seniority'),
      // Hiring is currently freelance-only. Keep the legacy columns populated for compatibility.
      workType: 'Freelance',
      availability: oneOf_(hiring.availability || '', AVAILABILITIES, 'Availability'),
      rateMin: cleanPositiveNumber_(
        hiring.hourlyRate !== undefined && hiring.hourlyRate !== '' ? hiring.hourlyRate : hiring.rateMin,
        'Hourly Rate'
      ),
      rateMax: '',
      currency: oneOf_(hiring.currency, CURRENCIES, 'Currency'),
      rateBasis: 'Per hour',
      portfolioUrl: cleanUrl_(hiring.portfolioUrl, true),
      linkedinUrl: cleanUrl_(hiring.linkedinUrl || '', false),
      resumeUrl: cleanUrl_(hiring.resumeUrl || '', false),
      consent: hiring.consent === true
    }
  };
  if (!candidate.name) throw new Error('Name is required.');
  if (!candidate.subject) throw new Error('Subject is required.');
  if (!candidate.hiring.country) throw new Error('Country / Region is required.');
  if (!candidate.hiring.roleTitle) throw new Error('Role Title is required.');
  if (!candidate.hiring.consent) throw new Error('Consent is required.');
  return candidate;
}

function cleanText_(value, maxLength) {
  if (value === undefined || value === null) return '';
  const text = String(value).trim();
  if (text.length > maxLength) throw new Error('A field is too long.');
  return text;
}

function cleanEmail_(value) {
  const email = cleanText_(value, MAX_LENGTHS.short).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) throw new Error('Invalid email.');
  return email;
}

function cleanUrl_(value, required) {
  const url = cleanText_(value, MAX_LENGTHS.url);
  if (!url) {
    if (required) throw new Error('A required URL is missing.');
    return '';
  }
  if (!/^https?:\/\//i.test(url)) throw new Error('Invalid URL.');
  return url;
}

function cleanPositiveNumber_(value, label) {
  const number = Number(value);
  if (!isFinite(number) || number <= 0) throw new Error(label + ' must be a positive number.');
  return number;
}

function oneOf_(value, options, label) {
  const clean = cleanText_(value, MAX_LENGTHS.short);
  if (options.indexOf(clean) === -1) throw new Error('Invalid ' + label + '.');
  return clean;
}

function appendSafeRow_(sheet, values) {
  sheet.appendRow(values.map(safeSheetValue_));
}

function safeSheetValue_(value) {
  if (value === undefined || value === null) return '';
  if (value instanceof Date || typeof value === 'number' || typeof value === 'boolean') return value;
  const text = String(value);
  return /^[=+\-@]/.test(text) ? "'" + text : text;
}

function makeId_(prefix) {
  const stamp = Utilities.formatDate(new Date(), 'UTC', 'yyyyMMddHHmmss');
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return prefix + '-' + stamp + '-' + random;
}

function sendHiringEmail_(candidate, candidateId, config) {
  const h = candidate.hiring;
  const rate = `${h.currency} ${h.rateMin}/hour`;
  const subject = `[HIRING] ${h.seniority} ${h.roleTitle} | ${h.country} | ${rate} | ${candidate.name}`;
  const html = [
    section_('Candidate', [['ID', candidateId], ['Name', candidate.name], ['Email', candidate.email]]),
    section_('Role', [['Category', h.roleCategory], ['Title', h.roleTitle], ['Seniority', h.seniority], ['Work Type', h.workType]]),
    section_('Location', [['Country / Region', h.country], ['Time Zone', h.timeZone]]),
    section_('Availability', [['Availability', h.availability || 'Not specified']]),
    section_('Expected Rate', [['Rate', rate]]),
    section_('Portfolio Links', [['Portfolio', link_(h.portfolioUrl)], ['LinkedIn', link_(h.linkedinUrl)], ['Resume / CV', link_(h.resumeUrl)]]),
    section_('Message', [['Message', candidate.message || 'No message provided.']]),
    `<p><a href="${escapeHtml_(config.SPREADSHEET_URL)}">Open hiring spreadsheet</a></p>`
  ].join('');
  MailApp.sendEmail({ to: config.CAREERS_EMAIL, replyTo: candidate.email, subject: subject, htmlBody: html, name: 'Leaf & Light Studio' });
}

function sendInquiryEmail_(inquiry, inquiryId, config) {
  const subject = inquiry.subject || `[CONTACT] ${inquiry.type} | ${inquiry.name}`;
  const html = [
    section_('Inquiry', [['ID', inquiryId], ['Type of inquiry', inquiry.type], ['Selected service', inquiry.selectedService || 'None'], ['Company', inquiry.company || '']]),
    section_('Visitor', [['Name', inquiry.name], ['Email', inquiry.email]]),
    section_('Message', [['Subject', inquiry.subject], ['Message', inquiry.message]]),
    section_('Source', [['Source URL', link_(inquiry.sourceUrl)]])
  ].join('');
  MailApp.sendEmail({ to: config.GENERAL_EMAIL, replyTo: inquiry.email, subject: subject, htmlBody: html, name: 'Leaf & Light Studio' });
}


function trySendAcknowledgement_(submissionType, record, submissionId, config) {
  try {
    if (String(config.AUTO_REPLY_ENABLED || 'true').toLowerCase() === 'false') return;
    if (MailApp.getRemainingDailyQuota() < 1) {
      console.warn('Acknowledgement skipped because the daily email quota is exhausted.');
      return;
    }
    sendAcknowledgementEmail_(submissionType, record, submissionId, config);
  } catch (error) {
    // A confirmation email must never make a valid form submission fail.
    console.error('Acknowledgement email failed: ' + error.message);
  }
}

function sendAcknowledgementEmail_(submissionType, record, submissionId, config) {
  const type = String(submissionType || 'General');
  const isHiring = type === 'Hiring';
  const template = acknowledgementTemplate_(type, record);
  const replyTo = isHiring ? config.CAREERS_EMAIL : config.GENERAL_EMAIL;
  const brandName = config.BRAND_NAME || 'Leaf & Light Studio';

  MailApp.sendEmail({
    to: record.email,
    replyTo: replyTo,
    subject: template.subject,
    body: template.plainText + '\n\nReference: ' + submissionId,
    htmlBody: acknowledgementHtml_(template, record, submissionId, config),
    name: brandName
  });
}

function acknowledgementTemplate_(type, record) {
  const name = escapeHtml_(record.name || 'there');
  const templates = {
    Hiring: {
      subject: 'Application received — Leaf & Light Studio',
      eyebrow: 'HIRING APPLICATION',
      title: 'Thank you for applying, ' + name + '.',
      message: 'Your application was received successfully. We will review your experience, portfolio and availability when a matching opportunity appears.',
      nextStep: 'There is no need to submit the same application again. If your profile matches a current need, we will contact you directly.',
      plainText: 'Thank you for applying to Leaf & Light Studio. Your application was received successfully. We will contact you if your profile matches an opportunity.'
    },
    Business: {
      subject: 'Business inquiry received — Leaf & Light Studio',
      eyebrow: 'BUSINESS INQUIRY',
      title: 'Thank you for reaching out, ' + name + '.',
      message: 'Your business inquiry was received successfully. We will review the project context and respond through the contact information you provided.',
      nextStep: 'You may reply to this confirmation if you need to add an important detail.',
      plainText: 'Thank you for contacting Leaf & Light Studio. Your business inquiry was received successfully and will be reviewed.'
    },
    Partnership: {
      subject: 'Partnership inquiry received — Leaf & Light Studio',
      eyebrow: 'PARTNERSHIP',
      title: 'Thank you for considering Leaf & Light, ' + name + '.',
      message: 'Your partnership inquiry was received successfully. We will review the possible alignment and get back to you when appropriate.',
      nextStep: 'You may reply to this confirmation if you need to add an important detail.',
      plainText: 'Thank you for contacting Leaf & Light Studio about a partnership. Your message was received successfully.'
    },
    General: {
      subject: 'Message received — Leaf & Light Studio',
      eyebrow: 'GENERAL CONTACT',
      title: 'Thank you for your message, ' + name + '.',
      message: 'Your message was received successfully and is now in our contact system.',
      nextStep: 'You may reply to this confirmation if you need to add an important detail.',
      plainText: 'Thank you for contacting Leaf & Light Studio. Your message was received successfully.'
    }
  };
  return templates[type] || templates.General;
}

function acknowledgementHtml_(template, record, submissionId, config) {
  const brandName = escapeHtml_(config.BRAND_NAME || 'Leaf & Light Studio');
  const logo = validPublicUrl_(config.BRAND_LOGO_URL)
    ? '<img src="' + escapeHtml_(config.BRAND_LOGO_URL) + '" alt="' + brandName + '" width="72" style="display:block;width:72px;height:auto;border:0;margin:0 auto 18px;">'
    : '<div style="font-size:22px;font-weight:800;letter-spacing:-0.4px;color:#f8fafc;text-align:center;margin-bottom:18px;">' + brandName + '</div>';

  const buttons = socialButtonsHtml_(config);
  const summary = acknowledgementSummaryHtml_(record);
  return [
    '<!doctype html><html><body style="margin:0;padding:0;background:#07101b;font-family:Arial,Helvetica,sans-serif;color:#e5edf7;">',
    '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#07101b;padding:28px 12px;"><tr><td align="center">',
    '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#111c29;border:1px solid #26364a;border-radius:20px;overflow:hidden;">',
    '<tr><td style="padding:34px 34px 12px;text-align:center;">', logo,
    '<div style="font-size:11px;font-weight:800;letter-spacing:1.8px;color:#7db5ff;">', escapeHtml_(template.eyebrow), '</div>',
    '<h1 style="margin:12px 0 12px;font-size:28px;line-height:1.15;color:#ffffff;">', template.title, '</h1>',
    '<p style="margin:0 auto;max-width:510px;font-size:15px;line-height:1.7;color:#b7c5d8;">', escapeHtml_(template.message), '</p>',
    '</td></tr>',
    '<tr><td style="padding:18px 34px 6px;">', summary, '</td></tr>',
    '<tr><td style="padding:16px 34px 8px;">',
    '<div style="background:#0c1622;border:1px solid #26364a;border-radius:14px;padding:16px 18px;">',
    '<div style="font-size:12px;font-weight:700;color:#8fa3bb;margin-bottom:5px;">REFERENCE</div>',
    '<div style="font-size:14px;font-weight:700;color:#ffffff;">', escapeHtml_(submissionId), '</div>',
    '</div></td></tr>',
    '<tr><td style="padding:14px 34px 4px;text-align:center;">',
    '<p style="margin:0;font-size:14px;line-height:1.6;color:#9fb0c5;">', escapeHtml_(template.nextStep), '</p>',
    '</td></tr>',
    buttons ? '<tr><td style="padding:22px 34px 8px;text-align:center;">' + buttons + '</td></tr>' : '',
    '<tr><td style="padding:22px 34px 30px;text-align:center;">',
    '<div style="height:1px;background:#26364a;margin-bottom:18px;"></div>',
    '<p style="margin:0;font-size:11px;line-height:1.5;color:#6f8299;">Automatic confirmation from ' + brandName + '.</p>',
    '</td></tr></table></td></tr></table></body></html>'
  ].join('');
}

function acknowledgementSummaryHtml_(record) {
  const rows = [];
  if (record.subject) rows.push(['Subject', record.subject]);
  if (record.hiring) {
    rows.push(['Role', [record.hiring.seniority, record.hiring.roleTitle].filter(Boolean).join(' ')]);
    rows.push(['Rate', record.hiring.currency + ' ' + record.hiring.rateMin + ' / hour']);
  } else {
    rows.push(['Type', record.type || 'General']);
    if (record.company) rows.push(['Company', record.company]);
  }
  const body = rows.filter(function(row) { return row[1]; }).map(function(row) {
    return '<tr><td style="padding:6px 12px 6px 0;color:#8fa3bb;font-size:12px;font-weight:700;white-space:nowrap;">' +
      escapeHtml_(row[0]) + '</td><td style="padding:6px 0;color:#f8fafc;font-size:13px;">' +
      escapeHtml_(row[1]) + '</td></tr>';
  }).join('');
  return body
    ? '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0c1622;border:1px solid #26364a;border-radius:14px;padding:10px 16px;">' + body + '</table>'
    : '';
}

function socialButtonsHtml_(config) {
  const links = [
    ['Website', config.WEBSITE_URL],
    ['LinkedIn', config.LINKEDIN_URL],
    ['ArtStation', config.ARTSTATION_URL]
  ].filter(function(item) { return validPublicUrl_(item[1]); });

  if (!links.length) return '';
  return links.map(function(item) {
    return '<a href="' + escapeHtml_(item[1]) + '" style="display:inline-block;margin:4px 5px;padding:11px 16px;border-radius:999px;background:#eaf2ff;color:#0b1220;text-decoration:none;font-size:13px;font-weight:800;">' +
      escapeHtml_(item[0]) + '</a>';
  }).join('');
}

function validPublicUrl_(value) {
  return /^https?:\/\//i.test(String(value || '').trim());
}

function emailRateBasis_(basis) {
  return { 'Per hour': 'hour', 'Per day': 'day', 'Per month': 'month', 'Fixed project': 'project' }[basis] || 'rate';
}

function section_(title, rows) {
  const body = rows.map(function(row) {
    return `<tr><th align="left" style="padding:4px 12px 4px 0;">${escapeHtml_(row[0])}</th><td style="padding:4px 0;">${row[1] || ''}</td></tr>`;
  }).join('');
  return `<h2>${escapeHtml_(title)}</h2><table>${body}</table>`;
}

function link_(url) {
  if (!url) return '';
  const safe = escapeHtml_(url);
  return `<a href="${safe}">${safe}</a>`;
}

function escapeHtml_(value) {
  return String(value || '').replace(/[&<>'"]/g, function(char) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char];
  });
}

function json_(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
