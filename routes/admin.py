from flask import Blueprint, render_template, request, jsonify
from database import get_db

admin_bp = Blueprint('admin', __name__)

@admin_bp.route('/admin')
def admin():
    return render_template('admin.html')

# ── All complaints ────────────────────────────────────────────
@admin_bp.route('/api/admin/complaints')
def get_complaints():
    db = get_db()
    rows = db.execute(
        'SELECT * FROM complaints ORDER BY submitted_on DESC'
    ).fetchall()
    db.close()
    return jsonify([dict(r) for r in rows])

# ── Update complaint status ───────────────────────────────────
@admin_bp.route('/api/admin/complaint/<int:cid>/status', methods=['POST'])
def update_status(cid):
    data   = request.get_json()
    status = data.get('status', '').strip()
    if status not in ('pending', 'under_review', 'resolved', 'rejected'):
        return jsonify({'success': False, 'message': 'Invalid status.'})
    db = get_db()
    db.execute('UPDATE complaints SET status = ? WHERE id = ?', (status, cid))
    db.commit()
    db.close()
    return jsonify({'success': True})

# ── All recalls ───────────────────────────────────────────────
@admin_bp.route('/api/admin/recalls')
def get_recalls():
    db = get_db()
    rows = db.execute('''
        SELECT r.*, m.name as medicine_name
        FROM recalls r LEFT JOIN medicines m ON r.batch_no = m.batch_no
        ORDER BY r.issued_on DESC
    ''').fetchall()
    db.close()
    return jsonify([dict(r) for r in rows])

# ── All medicines ─────────────────────────────────────────────
@admin_bp.route('/api/admin/medicines')
def get_medicines():
    db = get_db()
    rows = db.execute('SELECT * FROM medicines ORDER BY name').fetchall()
    db.close()
    return jsonify([dict(r) for r in rows])

# ── Add medicine ──────────────────────────────────────────────
@admin_bp.route('/api/admin/medicines/add', methods=['POST'])
def add_medicine():
    d = request.get_json()
    required = ['batch_no','name','manufacturer','mfg_date','exp_date']
    for f in required:
        if not d.get(f,'').strip():
            return jsonify({'success': False, 'message': f'{f} is required.'})
    db = get_db()
    try:
        db.execute('''INSERT INTO medicines
            (batch_no,name,generic,manufacturer,category,dosage,storage,mfg_date,exp_date)
            VALUES (?,?,?,?,?,?,?,?,?)''', (
            d['batch_no'].strip().upper(), d['name'].strip(),
            d.get('generic',''), d['manufacturer'].strip(),
            d.get('category',''), d.get('dosage',''),
            d.get('storage',''), d['mfg_date'], d['exp_date']
        ))
        db.commit()
        return jsonify({'success': True, 'message': 'Medicine added successfully.'})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})
    finally:
        db.close()
