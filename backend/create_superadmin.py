import sys
import os

# Añadir el directorio actual al path para importar app
sys.path.append(os.getcwd())

from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.user import User, RoleEnum
from app.models.branch import Branch
from app.models.invoice import Invoice, InvoiceItem, FiscalSettings
from app.models.product import Product
from app.models.customer import Customer
from app.models.supplier import Supplier
from app.models.purchase import Purchase, PurchaseItem
from app.core import security

def create_superadmin(username, password):
    db = SessionLocal()
    try:
        # Verificar si ya existe
        existing = db.query(User).filter(User.username == username).first()
        if existing:
            print(f"El usuario {username} ya existe.")
            return

        new_admin = User(
            username=username,
            hashed_password=security.get_password_hash(password),
            role=RoleEnum.SUPERADMIN,
            branch_id=None, # Global
            is_active=True
        )
        db.add(new_admin)
        db.commit()
        print(f"SuperAdmin '{username}' creado exitosamente.")
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Uso: python create_superadmin.py <usuario> <contraseña>")
    else:
        create_superadmin(sys.argv[1], sys.argv[2])
