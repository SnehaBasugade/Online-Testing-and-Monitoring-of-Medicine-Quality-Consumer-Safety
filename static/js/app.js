/* ===========================
   MediVerify – Frontend Logic
   =========================== */

// ---- Tab Switching ----
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const target = btn.dataset.tab;
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-' + target).classList.add('active');
  });
});

// ---- Enter key to verify ----
document.getElementById('batchInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') verifyMedicine();
});

// ---- Quick fill & verify ----
function quickVerify(batch) {
  document.getElementById('batchInput').value = batch;
  // Switch to batch tab
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  document.querySelector('[data-tab="batch"]').classList.add('active');
  document.getElementById('tab-batch').classList.add('active');
  verifyMedicine();
}

// ---- Main Verify Function ----
async function verifyMedicine() {
  const input = document.getElementById('batchInput');
  const btn   = document.getElementById('verifyBtn');
  const batch  = input.value.trim();

  if (!batch) {
    showError('Please enter a batch number.');
    input.focus();
    return;
  }

  // Loading state
  btn.innerHTML = '<span class="loader"></span> Verifying...';
  btn.disabled  = true;

  try {
    const response = await fetch('/verify', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ batch_number: batch })
    });

    const data = await response.json();
    displayResult(data);
  } catch (err) {
    showError('Network error. Please try again.');
  } finally {
    btn.innerHTML = '🔍 Verify';
    btn.disabled  = false;
  }
}

// ---- Display Result ----
function displayResult(data) {
  const wrapper = document.getElementById('resultWrapper');
  const card    = document.getElementById('resultCard');

  // Scroll to result
  wrapper.style.display = 'block';
  setTimeout(() => wrapper.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);

  if (data.status === 'error') {
    card.className = 'result-card error';
    card.innerHTML = `
      <div class="result-header">
        <div class="result-icon">⚠️</div>
        <div>
          <div class="result-title">Input Error</div>
          <div class="result-subtitle">${escHtml(data.message)}</div>
        </div>
      </div>`;
    return;
  }

  if (data.status === 'fake') {
    card.className = 'result-card fake';
    card.innerHTML = `
      <div class="result-header">
        <div class="result-icon">🚨</div>
        <div>
          <div class="result-title">COUNTERFEIT MEDICINE DETECTED</div>
          <div class="result-subtitle">Batch Number: ${escHtml(data.batch_number)}</div>
        </div>
      </div>
      <div class="result-grid">
        <div class="result-field" style="grid-column:1/-1;">
          <div class="field-label">⚠️ Warning</div>
          <div class="field-value" style="color:#dc2626;">${escHtml(data.message)}</div>
        </div>
      </div>
      <div class="result-date-warning danger">
        🛑 Do NOT consume this medicine. Report it to your nearest drug regulatory authority immediately.
      </div>`;
    return;
  }

  // Genuine medicine
  const cardClass = data.date_status === 'valid'
    ? 'genuine'
    : data.date_status === 'expiring_soon'
    ? 'expiring'
    : 'expired';

  const headerIcon = data.date_status === 'valid'
    ? '✅'
    : data.date_status === 'expiring_soon'
    ? '⚠️'
    : '❌';

  const headerTitle = data.date_status === 'valid'
    ? 'GENUINE MEDICINE – VERIFIED'
    : data.date_status === 'expiring_soon'
    ? 'GENUINE – EXPIRING SOON'
    : 'GENUINE – BUT EXPIRED';

  const warningClass = data.date_status === 'valid'
    ? 'success'
    : data.date_status === 'expiring_soon'
    ? 'warning'
    : 'danger';

  card.className = `result-card ${cardClass}`;
  card.innerHTML = `
    <div class="result-header">
      <div class="result-icon">${headerIcon}</div>
      <div>
        <div class="result-title">${headerTitle}</div>
        <div class="result-subtitle">Verification successful — database record found</div>
      </div>
    </div>

    <div class="result-grid">
      <div class="result-field">
        <div class="field-label">Medicine Name</div>
        <div class="field-value">${escHtml(data.medicine_name)}</div>
      </div>
      <div class="result-field">
        <div class="field-label">Generic Name</div>
        <div class="field-value">${escHtml(data.generic_name)}</div>
      </div>
      <div class="result-field">
        <div class="field-label">Batch Number</div>
        <div class="field-value" style="font-family:'Courier New',monospace;">${escHtml(data.batch_number)}</div>
      </div>
      <div class="result-field">
        <div class="field-label">Manufacturer</div>
        <div class="field-value">${escHtml(data.manufacturer)}</div>
      </div>
      <div class="result-field">
        <div class="field-label">📅 Manufacturing Date</div>
        <div class="field-value">${escHtml(data.mfg_date)}</div>
      </div>
      <div class="result-field">
        <div class="field-label">⏰ Expiry Date</div>
        <div class="field-value">${escHtml(data.exp_date)}</div>
      </div>
      <div class="result-field">
        <div class="field-label">Dosage</div>
        <div class="field-value">${escHtml(data.dosage)}</div>
      </div>
      <div class="result-field">
        <div class="field-label">Category</div>
        <div class="field-value">${escHtml(data.category)}</div>
      </div>
      <div class="result-field" style="grid-column:1/-1;">
        <div class="field-label">Storage Instructions</div>
        <div class="field-value">${escHtml(data.storage)}</div>
      </div>
    </div>

    <div class="result-date-warning ${warningClass}">
      ${data.date_status === 'valid' ? '✅' : data.date_status === 'expiring_soon' ? '⚠️' : '🛑'}
      ${escHtml(data.date_message)}
    </div>`;
}

// ---- Show error ----
function showError(msg) {
  const wrapper = document.getElementById('resultWrapper');
  const card    = document.getElementById('resultCard');
  wrapper.style.display = 'block';
  card.className  = 'result-card error';
  card.innerHTML  = `
    <div class="result-header">
      <div class="result-icon">⚠️</div>
      <div><div class="result-title">Error</div>
      <div class="result-subtitle">${escHtml(msg)}</div></div>
    </div>`;
  wrapper.scrollIntoView({ behavior: 'smooth' });
}

// ---- Escape HTML ----
function escHtml(str) {
  const d = document.createElement('div');
  d.textContent = str || '';
  return d.innerHTML;
}

/* ============================================================
   QR Scanner
   ============================================================ */
let html5QrCode = null;

function startQRScan() {
  document.getElementById('startScanBtn').style.display = 'none';
  document.getElementById('stopScanBtn').style.display  = 'inline-flex';

  html5QrCode = new Html5Qrcode('qr-reader');
  html5QrCode.start(
    { facingMode: 'environment' },
    { fps: 10, qrbox: { width: 280, height: 280 } },
    qrCodeMessage => {
      // Success
      document.getElementById('qr-scanned-value').style.display = 'block';
      document.getElementById('qr-scanned-value').textContent = '📷 Scanned: ' + qrCodeMessage;
      stopQRScan();
      // Use scanned value as batch number
      document.getElementById('batchInput').value = qrCodeMessage;
      // Switch to batch tab and verify
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      document.querySelector('[data-tab="batch"]').classList.add('active');
      document.getElementById('tab-batch').classList.add('active');
      verifyMedicine();
    },
    () => {} // ignore per-frame errors
  ).catch(err => {
    console.error('QR scan error:', err);
    stopQRScan();
    alert('Camera access denied or not available. Please use batch number entry instead.');
  });
}

function stopQRScan() {
  if (html5QrCode && html5QrCode.isScanning) {
    html5QrCode.stop().catch(() => {});
  }
  document.getElementById('startScanBtn').style.display = 'inline-flex';
  document.getElementById('stopScanBtn').style.display  = 'none';
}

/* ============================================================
   Demo QR Codes (generated on page load)
   ============================================================ */
const DEMO_MEDICINES = [
  { batch: 'BATCH-2024-PCM-001', name: 'Paracetamol 500mg',     badge: 'genuine',  label: 'Genuine & Valid' },
  { batch: 'BATCH-2025-AMX-112', name: 'Amoxicillin 250mg',     badge: 'genuine',  label: 'Genuine & Valid' },
  { batch: 'BATCH-2023-MET-045', name: 'Metformin 500mg',       badge: 'expired',  label: 'Genuine – Expired' },
  { batch: 'BATCH-2025-OMP-091', name: 'Omeprazole 20mg',       badge: 'expiring', label: 'Expiring Soon' },
  { batch: 'BATCH-2026-CET-033', name: 'Cetirizine 10mg',       badge: 'genuine',  label: 'Genuine & Valid' },
  { batch: 'FAKE-9999-XYZ-000',  name: 'Unknown Product',       badge: 'fake',     label: 'FAKE / Counterfeit' },
];

const BADGE_LABELS = {
  genuine:  'badge-genuine',
  expired:  'badge-expired',
  expiring: 'badge-expiring',
  fake:     'badge-fake',
};

function buildDemoQR() {
  const grid = document.getElementById('demoGrid');
  if (!grid) return;
  grid.innerHTML = '';

  DEMO_MEDICINES.forEach(med => {
    const item = document.createElement('div');
    item.className = 'demo-item';
    item.title = `Click to verify: ${med.batch}`;
    item.onclick = () => quickVerify(med.batch);

    const qrDiv = document.createElement('div');
    qrDiv.id = 'qr-' + med.batch.replace(/[^a-zA-Z0-9]/g, '-');

    item.innerHTML = `
      <h4>${escHtml(med.name)}</h4>
      <p>${escHtml(med.batch)}</p>
      <span class="demo-badge ${BADGE_LABELS[med.badge]}">${escHtml(med.label)}</span>
    `;
    item.insertBefore(qrDiv, item.firstChild);
    grid.appendChild(item);

    // Generate QR code
    try {
      new QRCode(qrDiv, {
        text:   med.batch,
        width:  120,
        height: 120,
        colorDark:  '#1f2937',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.M
      });
    } catch (e) {
      qrDiv.textContent = '[ QR ]';
    }
  });
}

// Build demo QR on load
window.addEventListener('load', buildDemoQR);
