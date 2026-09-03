import sqlite3, os

for root, dirs, files in os.walk('.'):
    if 'node_modules' in root or '.git' in root:
        continue
    for file in files:
        if file.endswith(('.sqlite', '.db', '.sqlite3')):
            fp = os.path.join(root, file)
            print(f"=== Database File: {fp} ===")
            try:
                conn = sqlite3.connect(fp)
                cursor = conn.cursor()
                cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
                tables = [r[0] for r in cursor.fetchall() if not r[0].startswith('sqlite_')]
                for t in tables:
                    cursor.execute(f'SELECT count(*) FROM "{t}"')
                    cnt = cursor.fetchone()[0]
                    print(f"   - {t}: {cnt} rows")
            except Exception as e:
                print(f"   Error: {e}")
