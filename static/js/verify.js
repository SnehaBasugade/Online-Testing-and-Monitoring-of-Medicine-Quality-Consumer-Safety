/* ===========================
   Verify Page - verify.js
   =========================== */

// ── Tab switching ──────────────────────────────────────────────
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const t = btn.dataset.tab;
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-' + t).classList.add('active');
  });
});

// Enter key
document.getElementById('batchInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') verifyMedicine();
});

// Quick verify (sample chips)
function quickVerify(batch) {
  document.getElementById('batchInput').value = batch;
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  document.querySelector('[data-tab="batch"]').classList.add('active');
  document.getElementById('tab-batch').classList.add('active');
  verifyMedicine();
}

// ── Main verify ────────────────────────────────────────────────
async function verifyMedicine() {
  const input = document.getElementById('batchInput');
  const btn   = document.getElementById('verifyBtn');
  const batch = input.value.trim();

  if (!batch) { showError('Please enter a batch number.'); input.focus(); return; }

  btn.innerHTML = '<span class="loader"></span> Verifying…';
  btn.disabled  = true;

  try {
    const res  = await fetch('/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ batch_number: batch })
    });
    const data = await res.json();
    displayResult(data);
  } catch {
    showError('Network error. Please try again.');
  } finally {
    btn.innerHTML = '🔍 Verify';
    btn.disabled  = false;
  }
}

// ── Display result ─────────────────────────────────────────────
function displayResult(data) {
  const wrapper = document.getElementById('resultWrapper');
  const card    = document.getElementById('resultCard');
  wrapper.style.display = 'block';
  setTimeout(() => wrapper.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);

  if (data.status === 'error') {
    card.className = 'result-card error';
    card.innerHTML = `<div class="result-header"><div class="result-icon">⚠️</div>
      <div><div class="result-title">Input Error</div>
      <div class="result-sub">${esc(data.message)}</div></div></div>`;
    return;
  }

  if (data.status === 'fake') {
    card.className = 'result-card fake';
    card.innerHTML = `
      <div class="result-header">
        <div class="result-icon">🚨</div>
        <div>
          <div class="result-title">COUNTERFEIT / UNREGISTERED MEDICINE</div>
          <div class="result-sub">Batch: ${esc(data.batch_number)}</div>
        </div>
      </div>
      <div class="result-grid">
        <div class="result-field" style="grid-column:1/-1;">
          <div class="fl">Warning</div>
          <div class="fv" style="color:var(--danger);">${esc(data.message)}</div>
        </div>
      </div>
      <div class="result-alert danger">🛑 Do NOT consume this medicine. Report it immediately.</div>
      <a href="/report?batch=${encodeURIComponent(data.batch_number)}" class="report-link-btn">📝 Report This Medicine</a>`;
    return;
  }

  // Genuine (with possible expired/expiring/recalled sub-status)
  const cfg = {
    genuine:  { cls: 'genuine',  icon: '✅', title: 'GENUINE - VERIFIED',      alert: 'success' },
    expiring: { cls: 'expiring', icon: '⚠️', title: 'GENUINE - EXPIRING SOON', alert: 'warning' },
    expired:  { cls: 'expired',  icon: '❌', title: 'GENUINE - BUT EXPIRED',   alert: 'danger'  },
    recalled: { cls: 'recalled', icon: '🔔', title: 'GENUINE - UNDER RECALL',  alert: 'orange'  },
  };
  const c = cfg[data.status] || cfg.genuine;

  let alertMsg = '';
  if (data.status === 'genuine')  alertMsg = `✅ This medicine is valid. Expires in <strong>${data.days_left}</strong> days (${esc(data.exp_date)}).`;
  if (data.status === 'expiring') alertMsg = `⚠️ Expires in <strong>${data.days_left}</strong> days - use soon or consult a pharmacist.`;
  if (data.status === 'expired')  alertMsg = `🛑 This medicine expired on ${esc(data.exp_date)}. Do NOT consume it.`;
  if (data.status === 'recalled') alertMsg = `🔔 This batch has been recalled. Stop using it immediately. <a href="/recalls" style="color:inherit;text-decoration:underline;">View recall details</a>.`;

  let recallBlock = '';
  if (data.recall_info) {
    const r = data.recall_info;
    recallBlock = `
      <div class="result-field" style="grid-column:1/-1;background:rgba(234,88,12,0.08);">
        <div class="fl">🔔 Recall Reason</div>
        <div class="fv">${esc(r.reason)}</div>
        <div style="font-size:0.8rem;color:var(--gray-600);margin-top:0.3rem;">
          Issued: ${esc(r.issued_on)} by ${esc(r.issued_by)} - Severity: <strong>${esc(r.severity).toUpperCase()}</strong>
        </div>
      </div>`;
  }

  card.className = `result-card ${c.cls}`;
  card.innerHTML = `
    <div class="result-header">
      <div class="result-icon">${c.icon}</div>
      <div>
        <div class="result-title">${c.title}</div>
        <div class="result-sub">Verification successful - found in database</div>
      </div>
    </div>
    <div class="result-grid">
      <div class="result-field">
        <div class="fl">Medicine Name</div>
        <div class="fv">${esc(data.medicine_name)}</div>
      </div>
      <div class="result-field">
        <div class="fl">Generic Name</div>
        <div class="fv">${esc(data.generic_name)}</div>
      </div>
      <div class="result-field">
        <div class="fl">Batch Number</div>
        <div class="fv" style="font-family:'Courier New',monospace;">${esc(data.batch_number)}</div>
      </div>
      <div class="result-field">
        <div class="fl">Manufacturer</div>
        <div class="fv">${esc(data.manufacturer)}</div>
      </div>
      <div class="result-field">
        <div class="fl">📅 Manufacturing Date</div>
        <div class="fv">${esc(data.mfg_date)}</div>
      </div>
      <div class="result-field">
        <div class="fl">⏰ Expiry Date</div>
        <div class="fv">${esc(data.exp_date)}</div>
      </div>
      <div class="result-field">
        <div class="fl">Category</div>
        <div class="fv">${esc(data.category)}</div>
      </div>
      <div class="result-field">
        <div class="fl">Dosage</div>
        <div class="fv">${esc(data.dosage)}</div>
      </div>
      <div class="result-field" style="grid-column:1/-1;">
        <div class="fl">Storage</div>
        <div class="fv">${esc(data.storage)}</div>
      </div>
      ${recallBlock}
    </div>
    <div class="result-alert ${c.alert}">${alertMsg}</div>
    ${data.status !== 'genuine' ? `<a href="/report?batch=${encodeURIComponent(data.batch_number)}" class="report-link-btn" style="margin-top:0.75rem;display:inline-block;">📝 Report an Issue</a>` : ''}
  `;
}

function showError(msg) {
  const wrapper = document.getElementById('resultWrapper');
  const card    = document.getElementById('resultCard');
  wrapper.style.display = 'block';
  card.className = 'result-card error';
  card.innerHTML = `<div class="result-header"><div class="result-icon">⚠️</div>
    <div><div class="result-title">Error</div>
    <div class="result-sub">${esc(msg)}</div></div></div>`;
  wrapper.scrollIntoView({ behavior: 'smooth' });
}

function esc(s) {
  const d = document.createElement('div');
  d.textContent = s || '';
  return d.innerHTML;
}

/* ── QR Scanner ─────────────────────────────────────────────── */
let qrInstance = null;

function startQRScan() {
  document.getElementById('startScanBtn').style.display = 'none';
  document.getElementById('stopScanBtn').style.display  = 'inline-flex';
  qrInstance = new Html5Qrcode('qr-reader');
  qrInstance.start(
    { facingMode: 'environment' },
    { fps: 10, qrbox: { width: 270, height: 270 } },
    decoded => {
      const el = document.getElementById('qr-scanned-value');
      el.style.display = 'block';
      el.textContent   = '📷 Scanned: ' + decoded;
      stopQRScan();
      quickVerify(decoded);
    },
    () => {}
  ).catch(() => {
    stopQRScan();
    alert('Camera not available. Use the Batch Number tab instead.');
  });
}

function stopQRScan() {
  if (qrInstance && qrInstance.isScanning) qrInstance.stop().catch(() => {});
  document.getElementById('startScanBtn').style.display = 'inline-flex';
  document.getElementById('stopScanBtn').style.display  = 'none';
}

/* ── Demo QR Codes ─────────────────────────────────────────── */
const DEMO = [
  { batch: 'BATCH-2024-PCM-001', name: 'Paracetamol 500mg',   badge: 'genuine',  label: 'Genuine & Valid'   },
  { batch: 'BATCH-2025-AMX-112', name: 'Amoxicillin 250mg',   badge: 'genuine',  label: 'Genuine & Valid'   },
  { batch: 'BATCH-2023-MET-045', name: 'Metformin 500mg',     badge: 'expired',  label: 'Expired'           },
  { batch: 'BATCH-2024-AZI-055', name: 'Azithromycin 500mg',  badge: 'recalled', label: 'Recalled'          },
  { batch: 'BATCH-2025-OMP-091', name: 'Omeprazole 20mg',     badge: 'expiring', label: 'Expiring Soon'     },
  { batch: 'FAKE-9999-XYZ-000',  name: 'Unknown Product',     badge: 'fake',     label: 'FAKE'              },
];

window.addEventListener('load', () => {
  const grid = document.getElementById('demoGrid');
  if (!grid) return;
  DEMO.forEach(m => {
    const item = document.createElement('div');
    item.className = 'demo-item';
    item.onclick   = () => quickVerify(m.batch);
    const qDiv = document.createElement('div');
    qDiv.id = 'q-' + m.batch.replace(/\W/g, '-');
    item.innerHTML = `<h4>${esc(m.name)}</h4><p>${esc(m.batch)}</p>
      <span class="demo-badge badge-${m.badge}">${esc(m.label)}</span>`;
    item.insertBefore(qDiv, item.firstChild);
    grid.appendChild(item);
    try {
      new QRCode(qDiv, { text: m.batch, width: 110, height: 110,
        colorDark: '#1f2937', colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.M });
    } catch { qDiv.textContent = '[QR]'; }
  });

  // Pre-fill batch from query param (e.g., from report link)
  const params = new URLSearchParams(window.location.search);
  const b = params.get('batch');
  if (b) {
    document.getElementById('batchInput').value = b;
    verifyMedicine();
  }
});
