from flask import Flask, render_template
from database import init_db
from routes.verify   import verify_bp
from routes.recall   import recall_bp
from routes.complaint import complaint_bp
from routes.analytics import analytics_bp
from routes.admin    import admin_bp

app = Flask(__name__)
app.secret_key = 'mediverify-secret-2026'

# Register blueprints
app.register_blueprint(verify_bp)
app.register_blueprint(recall_bp)
app.register_blueprint(complaint_bp)
app.register_blueprint(analytics_bp)
app.register_blueprint(admin_bp)

@app.route('/')
def index():
    return render_template('index.html')

if __name__ == '__main__':
    init_db()
    app.run(debug=True)
