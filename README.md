# MediVerify – Medicine Quality Monitoring System

**Major Project:** Online Testing and Monitoring of Medicine Quality and Consumer Safety

## Objective 1 (Implemented): Verify Medicine Authenticity

- Verify medicines using batch number lookup
- Scan QR codes on medicine packaging
- Check manufacturing date and expiry date
- View full medicine details (manufacturer, dosage, storage, category)
- Detect counterfeit / unregistered medicines

## How to Run

```bash
# 1. Install Flask
pip install flask

# 2. Run the app
python app.py

# 3. Open browser
http://127.0.0.1:5000
```

## Sample Batch Numbers to Test

| Batch Number         | Medicine          | Status           |
|----------------------|-------------------|------------------|
| BATCH-2024-PCM-001   | Paracetamol 500mg | ✅ Genuine, Valid |
| BATCH-2025-AMX-112   | Amoxicillin 250mg | ✅ Genuine, Valid |
| BATCH-2023-MET-045   | Metformin 500mg   | ❌ Genuine, Expired |
| BATCH-2025-OMP-091   | Omeprazole 20mg   | ⚠️ Expiring Soon |
| BATCH-2026-CET-033   | Cetirizine 10mg   | ✅ Genuine, Valid |
| FAKE-9999-XYZ-000    | Unknown           | 🚨 COUNTERFEIT   |

## Project Structure

```
Major_Project/
├── app.py                  # Flask application
├── requirements.txt
├── data/
│   └── medicines.py        # Medicine database
├── templates/
│   └── index.html          # Main HTML template
└── static/
    ├── css/style.css
    └── js/app.js
```
