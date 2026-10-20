/* ===========================
   Analytics Page - analytics.js
   =========================== */

const COLORS = {
  genuine:  '#16a34a',
  fake:     '#dc2626',
  expired:  '#9ca3af',
  expiring: '#d97706',
  recalled: '#ea580c',
  pending:      '#d97706',
  under_review: '#2563eb',
  resolved:     '#16a34a',
  rejected:     '#9ca3af',
};

const TYPE_LABELS = {
  fake:        'Counterfeit',
  packaging:   'Packaging',
  quality:     'Quality',
  side_effect: 'Side Effect',
  wrong_label: 'Mislabelling',
  other:       'Other',
};

window.addEventListener('load', loadAnalytics);

async function loadAnalytics() {
  try {
    const res  = await fetch('/api/analytics');
    const data = await res.json();
    renderKPIs(data.summary);
    renderVerifChart(data.verification_results);
    renderMonthlyChart(data.monthly_scans);
    renderComplaintTypeChart(data.complaint_types);
    renderComplaintStatusChart(data.complaint_status);
    renderTopComplaints(data.top_complained);
    renderRecentVerif(data.recent_verifications);
  } catch (e) {
    console.error('Analytics load error', e);
  }
}

function renderKPIs(s) {
  document.getElementById('kpi-verif').textContent     = s.total_verifications;
  document.getElementById('kpi-genuine').textContent   = s.genuine_scans;
  document.getElementById('kpi-fake').textContent      = s.fake_scans + ` (${s.fake_rate}%)`;
  document.getElementById('kpi-complaints').textContent = s.total_complaints;
  document.getElementById('kpi-pending').textContent   = s.pending_complaints;
  document.getElementById('kpi-recalls').textContent   = s.total_recalls;
}

function renderVerifChart(rows) {
  const labels = rows.map(r => capitalize(r.result));
  const values = rows.map(r => r.count);
  const colors = rows.map(r => COLORS[r.result] || '#6b7280');
  new Chart(document.getElementById('chartVerif'), {
    type: 'doughnut',
    data: { labels, datasets: [{ data: values, backgroundColor: colors, borderWidth: 2 }] },
    options: { plugins: { legend: { position: 'bottom' } }, cutout: '60%' }
  });
}

function renderMonthlyChart(rows) {
  const labels = rows.map(r => r.month);
  const values = rows.map(r => r.count);
  new Chart(document.getElementById('chartMonthly'), {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Verifications',
        data: values,
        backgroundColor: '#3b82f6',
        borderRadius: 6,
      }]
    },
    options: {
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
    }
  });
}

function renderComplaintTypeChart(rows) {
  const labels = rows.map(r => TYPE_LABELS[r.issue_type] || capitalize(r.issue_type));
  const values = rows.map(r => r.count);
  const colors = ['#dc2626','#d97706','#2563eb','#16a34a','#ea580c','#9ca3af'];
  new Chart(document.getElementById('chartComplaintType'), {
    type: 'pie',
    data: { labels, datasets: [{ data: values, backgroundColor: colors, borderWidth: 2 }] },
    options: { plugins: { legend: { position: 'bottom' } } }
  });
}

function renderComplaintStatusChart(rows) {
  const labels = rows.map(r => capitalize(r.status.replace('_', ' ')));
  const values = rows.map(r => r.count);
  const colors = rows.map(r => COLORS[r.status] || '#6b7280');
  new Chart(document.getElementById('chartComplaintStatus'), {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Complaints',
        data: values,
        backgroundColor: colors,
        borderRadius: 6,
      }]
    },
    options: {
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
    }
  });
}

function renderTopComplaints(rows) {
  const max = rows[0]?.count || 1;
  const el  = document.getElementById('topComplaints');
  if (!rows.length) { el.innerHTML = '<p style="color:var(--gray-400);font-size:.9rem;">No data yet.</p>'; return; }
  el.innerHTML = rows.map(r => `
    <div class="bar-row">
      <div class="bar-label">${esc(r.medicine_name)}</div>
      <div class="bar-track"><div class="bar-fill" style="width:${Math.round(r.count/max*100)}%"></div></div>
      <div class="bar-count">${r.count}</div>
    </div>`).join('');
}

function renderRecentVerif(rows) {
  const el = document.getElementById('recentVerif');
  if (!rows.length) { el.innerHTML = '<p style="color:var(--gray-400);font-size:.9rem;">No scans yet.</p>'; return; }
  el.innerHTML = `<table class="recent-table">
    <thead><tr><th>Batch No</th><th>Result</th><th>Scanned On</th></tr></thead>
    <tbody>
      ${rows.map(r => `
        <tr>
          <td style="font-family:'Courier New',monospace;font-size:0.8rem;">${esc(r.batch_no)}</td>
          <td><span class="status-badge status-${r.result === 'genuine' ? 'resolved' :
               r.result === 'fake' ? 'rejected' :
               r.result === 'recalled' ? 'under_review' : 'pending'}">${capitalize(r.result)}</span></td>
          <td style="color:var(--gray-500);font-size:0.8rem;">${esc(r.scanned_on)}</td>
        </tr>`).join('')}
    </tbody>
  </table>`;
}

function capitalize(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }
function esc(s) {
  const d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML;
}
