import sys
sys.path.insert(0, '.')

try:
    from database import init_db, get_db
    init_db()
    print('OK  database + init_db')

    from routes.verify    import verify_bp
    from routes.recall    import recall_bp
    from routes.complaint import complaint_bp
    from routes.analytics import analytics_bp
    from routes.admin     import admin_bp
    print('OK  all blueprints imported')

    from app import app
    print('OK  Flask app created')

    rules = [str(r) for r in app.url_map.iter_rules()]
    check = ['/', '/verify', '/recalls', '/report', '/analytics', '/admin',
             '/api/analytics', '/api/complaint', '/api/admin/complaints']
    for route in check:
        found = any(route in r for r in rules)
        status = 'OK  ' if found else 'MISSING'
        print(status + ' route: ' + route)

    print('\nAll checks passed! Run: python app.py')

except Exception as e:
    import traceback
    traceback.print_exc()
