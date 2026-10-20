from flask import Blueprint, render_template, request, jsonify, redirect, url_for
from datetime import datetime
from database import get_db

recall_bp = Blueprint('recall', __name__)

@recall_bp.route('/recalls')
def recalls():
    db = get_db()
    rows = db.execute('''
        SELECT r.*, m.name as medicine_name, m.manufacturer
        FROM recalls r
        LEFT JOIN medicines m ON r.batch_no = m.batch_no
        ORDER BY r.issued_on DESC
    ''').fetchall()
    db.close()
    return render_template('recalls.html', recalls=rows)

@recall_bp.route('/api/recalls')
def api_recalls():
    db = get_db()
    rows = db.execute('''
        SELECT r.*, m.name as medicine_name, m.manufacturer
        FROM recalls r
        LEFT JOIN medicines m ON r.batch_no = m.batch_no
        ORDER BY r.issued_on DESC
    ''').fetchall()
    db.close()
    return jsonify([dict(r) for r in rows])

@recall_bp.route('/admin/recalls/add', methods=['POST'])
def add_recall():
    data = request.get_json()
    batch_no   = data.get('batch_no', '').strip().upper()
    reason     = data.get('reason', '').strip()
    severity   = data.get('severity', 'medium')
    issued_by  = data.get('issued_by', 'Admin').strip()
    issued_on  = datetime.now().strftime('%Y-%m-%d')

    if not batch_no or not reason:
        return jsonify({'success': False, 'message': 'Batch number and reason are required.'})

    db = get_db()
    db.execute(
        'INSERT INTO recalls (batch_no, reason, severity, issued_on, issued_by) VALUES (?,?,?,?,?)',
        (batch_no, reason, severity, issued_on, issued_by)
    )
    db.execute('UPDATE medicines SET is_recalled = 1 WHERE batch_no = ?', (batch_no,))
    db.commit()
    db.close()
    return jsonify({'success': True, 'message': f'Recall issued for {batch_no}.'})
