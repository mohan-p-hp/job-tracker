const BACKEND = 'http://localhost:5000';

async function extractJobFromPage() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const url = tab.url || '';
  const pageTitle = tab.title || '';

  let job_title = '';
  let company_name = '';
  let platform = 'Other';

  // Check if we're on a job page at all
  const isJobPage = url.includes('linkedin.com/jobs') ||
    url.includes('indeed.com/viewjob') ||
    url.includes('naukri.com/job-listings') ||
    url.includes('naukri.com/');

  if (!isJobPage) return null;

  // Parse from page title
  // Naukri:   "Job Title - Company - Naukri.com"
  // LinkedIn: "Job Title - Company | LinkedIn"
  // Indeed:   "Job Title - Company - Indeed"
  if (pageTitle) {
    const cleaned = pageTitle
      .replace('| LinkedIn', '')
      .replace('- Naukri.com', '')
      .replace('- Indeed', '')
      .trim();

    const parts = cleaned.split(' - ');
    if (parts.length >= 2) {
      job_title = parts[0].trim();
      company_name = parts[1].trim();
    } else if (parts.length === 1) {
      job_title = parts[0].trim();
    }
  }

  if (url.includes('linkedin.com')) platform = 'LinkedIn';
  else if (url.includes('indeed.com')) platform = 'Indeed';
  else if (url.includes('naukri.com')) platform = 'Naukri';

  return { job_title, company_name, job_url: url, platform };
}

async function init() {
  // Always clear old stored data first
  await chrome.storage.local.remove('capturedJob');

  // Always extract fresh from current tab
  const job = await extractJobFromPage();

  if (!job || !job.job_title) {
    document.getElementById('form-area').style.display = 'none';
    document.getElementById('no-job').style.display = 'block';
    return;
  }

  document.getElementById('company').value = job.company_name || '';
  document.getElementById('title').value = job.job_title || '';

  const platformSelect = document.getElementById('platform');
  for (let i = 0; i < platformSelect.options.length; i++) {
    if (platformSelect.options[i].value === job.platform) {
      platformSelect.selectedIndex = i;
      break;
    }
  }

  // Store for save button to use
  window._currentJob = job;
}

init();

document.getElementById('save-btn').addEventListener('click', async () => {
  const btn = document.getElementById('save-btn');
  const statusEl = document.getElementById('status-msg');

  const company = document.getElementById('company').value.trim();
  const title = document.getElementById('title').value.trim();

  if (!company || !title) {
    statusEl.className = 'status error';
    statusEl.textContent = 'Company and job title are required';
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Saving...';

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    const response = await fetch(`${BACKEND}/jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        company_name: company,
        job_title: title,
        job_url: tab.url,
        platform: document.getElementById('platform').value,
        status: document.getElementById('status').value,
        applied_at: new Date().toISOString().split('T')[0],
      }),
    });

    if (!response.ok) throw new Error('Server error');

    statusEl.className = 'status success';
    statusEl.textContent = 'Job saved to JobTracker!';
    btn.textContent = 'Saved!';

  } catch (err) {
    statusEl.className = 'status error';
    statusEl.textContent = 'Failed to save. Is your backend running?';
    btn.disabled = false;
    btn.textContent = 'Save to JobTracker';
  }
});