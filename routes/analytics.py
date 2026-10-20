from flask import Blueprint, render_template, jsonify
from database import get_db

analytics_bp = Blueprint('analytics', __name__)

@analytics_bp.route('/analytics')
def analytics():
    return render_template('analytics.html')

@analytics_bp.route('/api/analytics')
def api_analytics():
    db = get_db()

    # ── Summary counts ──────────────────────────────────────
    total_verifications = db.execute('SELECT COUNT(*) FROM verifications').fetchone()[0]
    total_complaints    = db.execute('SELECT COUNT(*) FROM complaints').fetchone()[0]
    total_recalls       = db.execute('SELECT COUNT(*) FROM recalls').fetchone()[0]
    total_medicines     = db.execute('SELECT COUNT(*) FROM medicines').fetchone()[0]
    fake_scans          = db.execute("SELECT COUNT(*) FROM verifications WHERE result='fake'").fetchone()[0]
    genuine_scans       = db.execute("SELECT COUNT(*) FROM verifications WHERE result='genuine'").fetchone()[0]
    pending_complaints  = db.execute("SELECT COUNT(*) FROM complaints WHERE status='pending'").fetchone()[0]

    # ── Verification results breakdown ──────────────────────
    verification_results = db.execute('''
        SELECT result, COUNT(*) as count
        FROM verifications GROUP BY result
    ''').fetchall()

    # ── Complaint types breakdown ────────────────────────────
    complaint_types = db.execute('''
        SELECT issue_type, COUNT(*) as count
        FROM complaints GROUP BY issue_type ORDER BY count DESC
    ''').fetchall()

    # ── Complaint status breakdown ───────────────────────────
    complaint_status = db.execute('''
        SELECT status, COUNT(*) as count
        FROM complaints GROUP BY status
    ''').fetchall()

    # ── Monthly verifications (last 6 months) ────────────────
    monthly_scans = db.execute('''
        SELECT strftime('%Y-%m', scanned_on) as month, COUNT(*) as count
        FROM verifications
        GROUP BY month ORDER BY month DESC LIMIT 6
    ''').fetchall()

    # ── Top complained medicines ──────────────────────────────
    top_complained = db.execute('''
        SELECT medicine_name, COUNT(*) as count
        FROM complaints GROUP BY medicine_name ORDER BY count DESC LIMIT 5
    ''').fetchall()

    # ── Recall severity breakdown ─────────────────────────────
    recall_severity = db.execute('''
        SELECT severity, COUNT(*) as count
        FROM recalls GROUP BY severity
    ''').fetchall()

    # ── Recent verifications ──────────────────────────────────
    recent_verifications = db.execute('''
        SELECT batch_no, result, scanned_on
        FROM verifications ORDER BY scanned_on DESC LIMIT 10
    ''').fetchall()

    db.close()

    return jsonify({
        'summary': {
            'total_verifications': total_verifications,
            'total_complaints':    total_complaints,
            'total_recalls':       total_recalls,
            'total_medicines':     total_medicines,
            'fake_scans':          fake_scans,
            'genuine_scans':       genuine_scans,
            'pending_complaints':  pending_complaints,
            'fake_rate': round((fake_scans / total_verifications * 100), 1) if total_verifications else 0,
        },
        'verification_results': [dict(r) for r in verification_results],
        'complaint_types':      [dict(r) for r in complaint_types],
        'complaint_status':     [dict(r) for r in complaint_status],
        'monthly_scans':        [dict(r) for r in reversed(monthly_scans)],
        'top_complained':       [dict(r) for r in top_complained],
        'recall_severity':      [dict(r) for r in recall_severity],
        'recent_verifications': [dict(r) for r in recent_verifications],
    })
