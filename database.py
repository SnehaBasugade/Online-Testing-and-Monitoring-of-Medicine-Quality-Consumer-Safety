import sqlite3, os
from datetime import datetime

# Use persistent disk on Render (/data), fallback to local for development
DATA_DIR = '/data' if os.path.exists('/data') else os.path.dirname(__file__)
DB_PATH = os.path.join(DATA_DIR, 'mediverify.db')

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    c = conn.cursor()

    # ── Medicines ──────────────────────────────────────────────
    c.execute('''CREATE TABLE IF NOT EXISTS medicines (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        batch_no    TEXT UNIQUE NOT NULL,
        name        TEXT NOT NULL,
        generic     TEXT,
        manufacturer TEXT,
        category    TEXT,
        dosage      TEXT,
        storage     TEXT,
        mfg_date    TEXT,
        exp_date    TEXT,
        is_recalled INTEGER DEFAULT 0
    )''')

    # ── Recalls ────────────────────────────────────────────────
    c.execute('''CREATE TABLE IF NOT EXISTS recalls (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        batch_no    TEXT NOT NULL,
        reason      TEXT,
        severity    TEXT DEFAULT 'medium',
        issued_on   TEXT,
        issued_by   TEXT
    )''')

    # ── Complaints ─────────────────────────────────────────────
    c.execute('''CREATE TABLE IF NOT EXISTS complaints (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        batch_no      TEXT,
        medicine_name TEXT,
        issue_type    TEXT,
        description   TEXT,
        consumer_name TEXT,
        consumer_email TEXT,
        consumer_phone TEXT,
        location      TEXT,
        status        TEXT DEFAULT 'pending',
        submitted_on  TEXT
    )''')

    # ── Verification logs ──────────────────────────────────────
    c.execute('''CREATE TABLE IF NOT EXISTS verifications (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        batch_no   TEXT,
        result     TEXT,
        scanned_on TEXT
    )''')

    conn.commit()
    _seed_data(conn)
    conn.close()

def _seed_data(conn):
    c = conn.cursor()
    c.execute("SELECT COUNT(*) FROM medicines")
    if c.fetchone()[0] > 0:
        return  # already seeded

    medicines = [
        ('BATCH-2024-PCM-001','Paracetamol 500mg Tablets','Paracetamol (Acetaminophen)',
         'Sun Pharmaceutical Industries Ltd.','Analgesic / Antipyretic',
         '500mg - 1-2 tablets every 4-6 hours','Store below 25 degreesC, away from moisture.',
         '2024-01-15','2027-01-14', 0),
        ('BATCH-2025-AMX-112','Amoxicillin 250mg Capsules','Amoxicillin Trihydrate',
         'Cipla Ltd.','Antibiotic (Penicillin)',
         '250mg - 1 capsule three times daily','Store in cool dry place below 30 degreesC.',
         '2025-03-10','2027-03-09', 0),
        ('BATCH-2023-MET-045','Metformin 500mg Tablets','Metformin Hydrochloride',
         "Dr. Reddy's Laboratories",'Antidiabetic',
         '500mg - 1 tablet twice daily with meals','Store below 30 degreesC in original packaging.',
         '2023-06-01','2025-05-31', 0),
        ('BATCH-2025-ATV-078','Atorvastatin 10mg Tablets','Atorvastatin Calcium',
         'Lupin Pharmaceuticals','Lipid-Lowering (Statin)',
         '10mg - 1 tablet once daily at bedtime','Store below 25 degreesC, keep away from light.',
         '2025-01-20','2028-01-19', 0),
        ('BATCH-2026-CET-033','Cetirizine 10mg Tablets','Cetirizine Dihydrochloride',
         'Abbott India Ltd.','Antihistamine',
         '10mg - 1 tablet once daily','Store below 30 degreesC in a dry place.',
         '2026-02-05','2028-02-04', 0),
        ('BATCH-2025-OMP-091','Omeprazole 20mg Capsules','Omeprazole',
         'Mankind Pharma Ltd.','Proton Pump Inhibitor',
         '20mg - 1 capsule 30 min before meal','Store below 25 degrees C in sealed packaging.',
         '2025-07-01','2026-09-15', 0),
        ('BATCH-2024-AZI-055','Azithromycin 500mg Tablets','Azithromycin Dihydrate',
         'Zydus Cadila','Antibiotic (Macrolide)',
         '500mg - 1 tablet once daily for 3 days','Store below 30 degreesC away from moisture.',
         '2024-11-01','2026-10-31', 1),  # recalled
        ('BATCH-2025-IBU-019','Ibuprofen 400mg Tablets','Ibuprofen',
         'Alkem Laboratories','NSAID / Analgesic',
         '400mg - 1 tablet three times daily after food','Store below 30 degreesC.',
         '2025-05-01','2028-04-30', 0),
    ]
    c.executemany('''INSERT INTO medicines
        (batch_no,name,generic,manufacturer,category,dosage,storage,mfg_date,exp_date,is_recalled)
        VALUES (?,?,?,?,?,?,?,?,?,?)''', medicines)

    recalls = [
        ('BATCH-2024-AZI-055',
         'Contamination detected - substandard dissolution rate found during QC audit.',
         'high','2026-07-10','Central Drugs Standard Control Organisation (CDSCO)'),
    ]
    c.executemany('''INSERT INTO recalls (batch_no,reason,severity,issued_on,issued_by)
        VALUES (?,?,?,?,?)''', recalls)

    # Seed some sample complaints
    complaints = [
        ('BATCH-2024-PCM-001','Paracetamol 500mg Tablets','packaging',
         'The blister pack seal was broken when purchased.','Ravi Kumar',
         'ravi@example.com','9876543210','Mumbai, Maharashtra','resolved',
         '2026-08-01'),
        ('BATCH-2024-AZI-055','Azithromycin 500mg Tablets','fake',
         'Tablets look different from original, no hologram on strip.','Priya Singh',
         'priya@example.com','9123456789','Delhi','under_review',
         '2026-08-15'),
        ('BATCH-2025-AMX-112','Amoxicillin 250mg Capsules','side_effect',
         'Severe allergic reaction after first dose.','Amit Sharma',
         'amit@example.com','9000011111','Pune, Maharashtra','pending',
         '2026-09-01'),
        ('FAKE-XXXX-001','Unknown Medicine','fake',
         'Medicine purchased from roadside vendor, no batch number visible.','Sunita Devi',
         'sunita@example.com','8888877777','Jaipur, Rajasthan','pending',
         '2026-09-10'),
        ('BATCH-2026-CET-033','Cetirizine 10mg Tablets','quality',
         'Tablets are crumbling and discoloured.','Mohammed Ali',
         'mali@example.com','7777766666','Hyderabad, Telangana','under_review',
         '2026-09-18'),
    ]
    c.executemany('''INSERT INTO complaints
        (batch_no,medicine_name,issue_type,description,consumer_name,
         consumer_email,consumer_phone,location,status,submitted_on)
        VALUES (?,?,?,?,?,?,?,?,?,?)''', complaints)

    # Seed some verification logs
    logs = [
        ('BATCH-2024-PCM-001','genuine','2026-09-01 10:23:00'),
        ('BATCH-2025-AMX-112','genuine','2026-09-05 14:11:00'),
        ('FAKE-9999-XYZ-000','fake','2026-09-06 09:30:00'),
        ('BATCH-2023-MET-045','expired','2026-09-10 16:45:00'),
        ('BATCH-2024-AZI-055','recalled','2026-09-12 11:00:00'),
        ('BATCH-2024-PCM-001','genuine','2026-09-14 08:22:00'),
        ('BATCH-2026-CET-033','genuine','2026-09-15 13:55:00'),
        ('FAKE-0001-BAD-999','fake','2026-09-16 17:30:00'),
        ('BATCH-2025-IBU-019','genuine','2026-09-17 12:00:00'),
        ('BATCH-2025-OMP-091','expiring','2026-09-20 10:10:00'),
    ]
    c.executemany('''INSERT INTO verifications (batch_no,result,scanned_on)
        VALUES (?,?,?)''', logs)

    conn.commit()
