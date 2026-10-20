/* ===========================
   Report Page - report.js
   =========================== */

// Pre-fill batch from query param
window.addEventListener('load', () => {
  const params = new URLSearchParams(window.location.search);
  const b = params.get('batch');
  if (b) document.getElementById('f_batch').value = b;
});

async function submitComplaint(e) {
  e.preventDefault();
  const btn   = document.getElementById('submitBtn');
  const alert = document.getElementById('formAlert');

  const payload = {
    batch_no:       document.getElementById('f_batch').value.trim(),
    medicine_name:  document.getElementById('f_medicine').value.trim(),
    issue_type:     document.getElementById('f_issue').value.trim(),
    description:    document.getElementById('f_desc').value.trim(),
    consumer_name:  document.getElementById('f_name').value.trim(),
    consumer_email: document.getElementById('f_email').value.trim(),
    consumer_phone: document.getElementById('f_phone').value.trim(),
    location:       document.getElementById('f_location').value.trim(),
  };

  btn.innerHTML = '<span class="loader"></span> Submitting…';
  btn.disabled  = true;
  alert.style.display = 'none';

  try {
    const res  = await fetch('/api/complaint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    alert.style.display = 'block';
    if (data.success) {
      alert.className = 'form-alert success';
      alert.textContent = '✅ ' + data.message;
      document.getElementById('complaintForm').reset();
    } else {
      alert.className = 'form-alert error';
      alert.textContent = '❌ ' + data.message;
    }
  } catch {
    alert.style.display = 'block';
    alert.className = 'form-alert error';
    alert.textContent = '❌ Network error. Please try again.';
  } finally {
    btn.innerHTML = '📤 Submit Complaint';
    btn.disabled  = false;
    alert.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}
