import sqlite3
import os

db_path = "rammerbot_local.db"

if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    print("Actualizando base de datos...")
    
    try:
        # Update branches table
        cursor.execute("ALTER TABLE branches ADD COLUMN fiscal_serial TEXT")
        print("- Columna 'fiscal_serial' añadida a 'branches'")
    except sqlite3.OperationalError:
        print("- La columna 'fiscal_serial' ya existe en 'branches' o la tabla no existe")

    try:
        # Update fiscal_settings table
        cursor.execute("ALTER TABLE fiscal_settings ADD COLUMN next_z_report_number INTEGER DEFAULT 1")
        print("- Columna 'next_z_report_number' añadida a 'fiscal_settings'")
    except sqlite3.OperationalError:
        print("- La columna 'next_z_report_number' ya existe")

    try:
        cursor.execute("ALTER TABLE fiscal_settings ADD COLUMN last_z_report_date DATETIME")
        print("- Columna 'last_z_report_date' añadida a 'fiscal_settings'")
    except sqlite3.OperationalError:
        print("- La columna 'last_z_report_date' ya existe")

    conn.commit()
    conn.close()
    print("Actualización completada.")
else:
    print(f"No se encontró la base de datos en {db_path}")
