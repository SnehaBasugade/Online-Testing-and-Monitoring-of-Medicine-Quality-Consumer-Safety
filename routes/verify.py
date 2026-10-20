from flask import Blueprint, request, jsonify
from datetime import datetime
from database import get_db

verify_bp = Blueprint('verify', __name__)

@verify_bp.route('/verify', methods=['POST'])
def verify():
    data = request.get_json()
    batch_no = data.get('batch_number', '').strip().upper()

    if not batch_no:
        return jsonify({'status': 'error', 'message': 'Please enter a batch number.'})

    db = get_db()
    medicine = db.execute(
        'SELECT * FROM medicines WHERE batch_no = ?', (batch_no,)
    ).fetchone()

    # Log the scan
    scanned_on = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

    if not medicine:
        db.execute(
            'INSERT INTO verifications (batch_no, result, scanned_on) VALUES (?,?,?)',
            (batch_no, 'fake', scanned_on)
        )
        db.commit()
        db.close()
        return jsonify({
            'status': 'fake',
            'batch_number': batch_no,
            'message': 'Batch number NOT found in database. This medicine may be counterfeit.',
        })

    # Check recall
    recall = db.execute(
        'SELECT * FROM recalls WHERE batch_no = ?', (batch_no,)
    ).fetchone()

    today    = datetime.today().date()
    exp_date = datetime.strptime(medicine['exp_date'], '%Y-%m-%d').date()
    days_left = (exp_date - today).days

    if recall or medicine['is_recalled']:
        result_status = 'recalled'
    elif days_left < 0:
        result_status = 'expired'
    elif days_left <= 30:
        result_status = 'expiring'
    else:
        result_status = 'genuine'

    db.execute(
        'INSERT INTO verifications (batch_no, result, scanned_on) VALUES (?,?,?)',
        (batch_no, result_status, scanned_on)
    )
    db.commit()

    recall_info = None
    if recall:
        recall_info = {
            'reason':    recall['reason'],
            'severity':  recall['severity'],
            'issued_on': recall['issued_on'],
            'issued_by': recall['issued_by'],
        }

    db.close()
    return jsonify({
        'status':        result_status,
        'batch_number':  medicine['batch_no'],
        'medicine_name': medicine['name'],
        'generic_name':  medicine['generic'],
        'manufacturer':  medicine['manufacturer'],
        'category':      medicine['category'],
        'dosage':        medicine['dosage'],
        'storage':       medicine['storage'],
        'mfg_date':      datetime.strptime(medicine['mfg_date'], '%Y-%m-%d').strftime('%d %B %Y'),
        'exp_date':      datetime.strptime(medicine['exp_date'], '%Y-%m-%d').strftime('%d %B %Y'),
        'days_left':     days_left,
        'recall_info':   recall_info,
    })
