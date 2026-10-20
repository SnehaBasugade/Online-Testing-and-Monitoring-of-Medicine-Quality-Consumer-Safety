/* ===========================
   Admin Dashboard - admin.js
   =========================== */

// ── Tab switching ──────────────────────────────────────────────
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const t = btn.dataset.tab;
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-' + t).classList.add('active');
    // Auto-load data on tab switch
    if (t === 'complaints-tab') loadComplaints();
    if (t === 'recalls-tab')    loadRecalls();
    if (t === 'medicines-tab')  loadMedicines();
  });
});

// Load complaints on page open
window.addEventListener('load', loadComplaints);

// ── Complaints ─────────────────────────────────────────────────
async function loadComplaints() {
  const el     = document.getElementById('complaintsTable');
  const filter = document.getElementById('statusFilter').value;
  el.innerHTML = '<p class="loading-text">Loading…</p>';
  try {
    const res  = await fetch('/api/admin/complaints');
    let rows   = await res.json();
    if (filter) rows = rows.filter(r => r.status === filter);
    if (!rows.length) {
      el.innerHTML = '<p class="loading-text">No complaints found.</p>';
      return;
    }
    el.innerHTML = `<table>
      <thead><tr>
        <th>#</th><th>Medicine</th><th>Batch No</th>
        <th>Issue</th><th>Consumer</th><th>Location</th>
        <th>Date</th><th>Status</th><th>Action</th>
      </tr></thead>
      <tbody>${rows.map(r => `
        <tr>
          <td>${r.id}</td>
          <td>${esc(r.medicine_name)}</td>
          <td style="font-family:'Courier New',monospace;font-size:0.78rem;">${esc(r.batch_no)}</td>
          <td>${issueLabel(r.issue_type)}</td>
          <td>${esc(r.consumer_name)}<br/><span style="font-size:0.75rem;color:var(--gray-500);">${esc(r.consumer_email)}</span></td>
          <td>${esc(r.location)}</td>
          <td style="font-size:0.78rem;color:var(--gray-500);">${esc(r.submitted_on ? r.submitted_on.slice(0,10) : '')}</td>
          <td><span class="status-badge status-${r.status}">${statusLabel(r.status)}</span></td>
          <td>
            <select onchange="changeStatus(${r.id}, this.value)" style="font-size:0.78rem;padding:0.25rem 0.5rem;border:1px solid var(--gray-200);border-radius:6px;">
              <option value="">Update…</option>
              <option value="pending">Pending</option>
              <option value="under_review">Under Review</option>
              <option value="resolved">Resolved</option>
              <option value="rejected">Rejected</option>
            </select>
          </td>
        </tr>`).join('')}
      </tbody>
    </table>`;
  } catch {
    el.innerHTML = '<p class="loading-text" style="color:var(--danger);">Failed to load.</p>';
  }
}

async function changeStatus(id, status) {
  if (!status) return;
  await fetch(`/api/admin/complaint/${id}/status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });
  loadComplaints();
}

// ── Recalls ────────────────────────────────────────────────────
async function loadRecalls() {
  const el = document.getElementById('recallsTable');
  el.innerHTML = '<p class="loading-text">Loading…</p>';
  try {
    const res  = await fetch('/api/admin/recalls');
    const rows = await res.json();
    if (!rows.length) { el.innerHTML = '<p class="loading-text">No recalls issued yet.</p>'; return; }
    el.innerHTML = `<table>
      <thead><tr><th>Batch No</th><th>Medicine</th><th>Reason</th><th>Severity</th><th>Issued On</th><th>Issued By</th></tr></thead>
      <tbody>${rows.map(r => `
        <tr>
          <td style="font-family:'Courier New',monospace;font-size:0.8rem;">${esc(r.batch_no)}</td>
          <td>${esc(r.medicine_name || '-')}</td>
          <td style="max-width:220px;font-size:0.82rem;">${esc(r.reason)}</td>
          <td><span class="status-badge ${r.severity==='high'?'status-rejected':r.severity==='medium'?'status-pending':'status-resolved'}">${esc(r.severity?.toUpperCase())}</span></td>
          <td style="font-size:0.8rem;">${esc(r.issued_on)}</td>
          <td style="font-size:0.8rem;">${esc(r.issued_by)}</td>
        </tr>`).join('')}
      </tbody>
    </table>`;
  } catch {
    el.innerHTML = '<p class="loading-text" style="color:var(--danger);">Failed to load.</p>';
  }
}

async function issueRecall() {
  const alert = document.getElementById('recallAlert');
  const payload = {
    batch_no:  document.getElementById('r_batch').value,
    reason:    document.getElementById('r_reason').value,
    severity:  document.getElementById('r_severity').value,
    issued_by: document.getElementById('r_issuedby').value,
  };
  alert.style.display = 'none';
  try {
    const res  = await fetch('/admin/recalls/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    alert.style.display = 'block';
    alert.className  = `form-alert ${data.success ? 'success' : 'error'}`;
    alert.textContent = (data.success ? '✅ ' : '❌ ') + data.message;
    if (data.success) {
      document.getElementById('r_batch').value  = '';
      document.getElementById('r_reason').value = '';
      loadRecalls();
    }
  } catch {
    alert.style.display = 'block';
    alert.className = 'form-alert error';
    alert.textContent = '❌ Network error.';
  }
}

// ── Medicines ──────────────────────────────────────────────────
async function loadMedicines() {
  const el = document.getElementById('medicinesTable');
  el.innerHTML = '<p class="loading-text">Loading…</p>';
  try {
    const res  = await fetch('/api/admin/medicines');
    const rows = await res.json();
    el.innerHTML = `<table>
      <thead><tr><th>Batch No</th><th>Name</th><th>Manufacturer</th><th>Category</th><th>Mfg Date</th><th>Exp Date</th><th>Recalled</th></tr></thead>
      <tbody>${rows.map(r => `
        <tr>
          <td style="font-family:'Courier New',monospace;font-size:0.78rem;">${esc(r.batch_no)}</td>
          <td>${esc(r.name)}</td>
          <td style="font-size:0.82rem;">${esc(r.manufacturer)}</td>
          <td style="font-size:0.82rem;">${esc(r.category || '-')}</td>
          <td style="font-size:0.8rem;">${esc(r.mfg_date)}</td>
          <td style="font-size:0.8rem;">${esc(r.exp_date)}</td>
          <td>${r.is_recalled ? '<span class="status-badge status-rejected">YES</span>' : '<span class="status-badge status-resolved">No</span>'}</td>
        </tr>`).join('')}
      </tbody>
    </table>`;
  } catch {
    el.innerHTML = '<p class="loading-text" style="color:var(--danger);">Failed to load.</p>';
  }
}

async function addMedicine() {
  const alert = document.getElementById('addMedAlert');
  const payload = {
    batch_no:    document.getElementById('m_batch').value,
    name:        document.getElementById('m_name').value,
    generic:     document.getElementById('m_generic').value,
    manufacturer:document.getElementById('m_mfr').value,
    category:    document.getElementById('m_cat').value,
    dosage:      document.getElementById('m_dose').value,
    mfg_date:    document.getElementById('m_mfg').value,
    exp_date:    document.getElementById('m_exp').value,
    storage:     document.getElementById('m_storage').value,
  };
  alert.style.display = 'none';
  try {
    const res  = await fetch('/api/admin/medicines/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    alert.style.display = 'block';
    alert.className  = `form-alert ${data.success ? 'success' : 'error'}`;
    alert.textContent = (data.success ? '✅ ' : '❌ ') + data.message;
  } catch {
    alert.style.display = 'block';
    alert.className = 'form-alert error';
    alert.textContent = '❌ Network error.';
  }
}

// ── Helpers ────────────────────────────────────────────────────
function esc(s) {
  const d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML;
}
function issueLabel(t) {
  const m = { fake:'🚨 Fake', packaging:'📦 Packaging', quality:'⚠️ Quality',
    side_effect:'💊 Side Effect', wrong_label:'🏷 Mislabelling', other:'📋 Other' };
  return m[t] || t;
}
function statusLabel(s) {
  const m = { pending:'⏳ Pending', under_review:'🔍 Under Review',
    resolved:'✅ Resolved', rejected:'❌ Rejected' };
  return m[s] || s;
}
