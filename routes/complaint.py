from flask import Blueprint, render_template, request, jsonify
from datetime import datetime
from database import get_db

complaint_bp = Blueprint('complaint', __name__)

@complaint_bp.route('/report')
def report():
    return render_template('report.html')

@complaint_bp.route('/api/complaint', methods=['POST'])
def submit_complaint():
    data = request.get_json()

    required = ['batch_no', 'medicine_name', 'issue_type', 'description',
                'consumer_name', 'consumer_email', 'location']
    for field in required:
        if not data.get(field, '').strip():
            return jsonify({'success': False, 'message': f'Field "{field}" is required.'})

    db = get_db()
    db.execute('''
        INSERT INTO complaints
        (batch_no, medicine_name, issue_type, description,
         consumer_name, consumer_email, consumer_phone, location,
         status, submitted_on)
        VALUES (?,?,?,?,?,?,?,?,?,?)
    ''', (
        data['batch_no'].strip().upper(),
        data['medicine_name'].strip(),
        data['issue_type'].strip(),
        data['description'].strip(),
        data['consumer_name'].strip(),
        data['consumer_email'].strip(),
        data.get('consumer_phone', '').strip(),
        data['location'].strip(),
        'pending',
        datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    ))
    db.commit()
    db.close()
    return jsonify({'success': True, 'message': 'Your complaint has been submitted successfully. Reference will be sent to your email.'})

@complaint_bp.route('/api/complaints/status/<batch_no>')
def complaint_status(batch_no):
    db = get_db()
    rows = db.execute(
        'SELECT id, medicine_name, issue_type, status, submitted_on FROM complaints WHERE batch_no = ?',
        (batch_no.upper(),)
    ).fetchall()
    db.close()
    return jsonify([dict(r) for r in rows])
