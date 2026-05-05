function extractLinkedIn() {
  let title = '';
  let company = '';

  const titleSelectors = [
    'h1.t-24',
    'h1.job-details-jobs-unified-top-card__job-title',
    '.job-details-jobs-unified-top-card__job-title h1',
    '.jobs-unified-top-card__job-title h1',
    'h1',
  ];
  for (const sel of titleSelectors) {
    const el = document.querySelector(sel);
    if (el && el.innerText.trim()) { title = el.innerText.trim(); break; }
  }

  const companySelectors = [
    '.job-details-jobs-unified-top-card__company-name a',
    '.job-details-jobs-unified-top-card__company-name',
    '.jobs-unified-top-card__company-name a',
    '.jobs-unified-top-card__company-name',
  ];
  for (const sel of companySelectors) {
    const el = document.querySelector(sel);
    if (el && el.innerText.trim()) { company = el.innerText.trim(); break; }
  }

  // Fallback to page title
  if (!title) {
    const parts = document.title.split(' - ');
    if (parts.length >= 2) {
      title = parts[0].trim();
      company = parts[1].replace(' | LinkedIn', '').trim();
    }
  }

  return { job_title: title, company_name: company, job_url: window.location.href, platform: 'LinkedIn' };
}

function extractIndeed() {
  let title = '';
  let company = '';

  const titleEl = document.querySelector('h1.jobsearch-JobInfoHeader-title')
    || document.querySelector('[data-testid="jobsearch-JobInfoHeader-title"]')
    || document.querySelector('h1');
  if (titleEl) title = titleEl.innerText.trim();

  const companyEl = document.querySelector('[data-testid="inlineHeader-companyName"]')
    || document.querySelector('[data-testid="company-name"]');
  if (companyEl) company = companyEl.innerText.trim();

  return { job_title: title, company_name: company, job_url: window.location.href, platform: 'Indeed' };
}

function extractNaukri() {
  let title = '';
  let company = '';

  // Naukri job title selectors
  const titleSelectors = [
    'h1.styles_jd-header-title__rZwM1',
    '.styles_jd-header-title__rZwM1',
    'h1.title',
    '.jd-header-title',
    'h1',
  ];
  for (const sel of titleSelectors) {
    const el = document.querySelector(sel);
    if (el && el.innerText.trim()) { title = el.innerText.trim(); break; }
  }

  // Naukri company name selectors
  const companySelectors = [
    'a.styles_jd-header-comp-name__MvqAI',
    '.styles_jd-header-comp-name__MvqAI',
    '.jd-header-comp-name',
    'a.comp-name',
    '.comp-name',
  ];
  for (const sel of companySelectors) {
    const el = document.querySelector(sel);
    if (el && el.innerText.trim()) { company = el.innerText.trim(); break; }
  }

  // Fallback to page title — Naukri sets it to "Job Title - Company Name - Naukri.com"
  if (!title || !company) {
    const parts = document.title.split(' - ');
    if (parts.length >= 2) {
      if (!title) title = parts[0].trim();
      if (!company) company = parts[1].replace('Naukri.com', '').trim();
    }
  }

  return { job_title: title, company_name: company, job_url: window.location.href, platform: 'Naukri' };
}

// Detect which platform we're on
const url = window.location.href;
let jobData = null;

if (url.includes('linkedin.com')) jobData = extractLinkedIn();
else if (url.includes('indeed.com')) jobData = extractIndeed();
else if (url.includes('naukri.com')) jobData = extractNaukri();

if (jobData && (jobData.job_title || jobData.company_name)) {
  chrome.storage.local.set({ capturedJob: jobData });
}