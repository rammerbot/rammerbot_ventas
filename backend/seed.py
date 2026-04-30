import os
from app.core.database import SessionLocal, Base, engine
from app.models.branch import Branch
from app.models.user import User, RoleEnum
from app.models.customer import Customer
from app.models.supplier import Supplier
from app.models.product import Product
from app.models.purchase import Purchase, PurchaseItem
from app.models.invoice import FiscalSettings, Invoice, InvoiceItem
from app.models.document import Quote, DeliveryNote
from app.core.security import get_password_hash

def init_db():
    # Eliminar la base de datos local para forzar la creación con las nuevas columnas
    db_path = "./rammerbot_local.db"
    if os.path.exists(db_path):
        os.remove(db_path)
        print("Base de datos anterior eliminada.")

    # Crear tablas
    Base.metadata.create_all(bind=engine)
    print("Nuevas tablas creadas.")

    db = SessionLocal()
    try:
        # Crear Sucursal 1
        branch1 = Branch(name="Sede Principal", subdomain="sucursal1")
        db.add(branch1)
        
        # Crear Sucursal 2 (para probar multi-tenant)
        branch2 = Branch(name="Sede Norte", subdomain="sucursal2")
        db.add(branch2)
        
        db.commit()
        db.refresh(branch1)
        db.refresh(branch2)
        print(f"Sucursales creadas: {branch1.subdomain}, {branch2.subdomain}")

        # Crear Usuario Admin para sucursal 1
        admin1 = User(
            username="admin1",
            hashed_password=get_password_hash("admin123"),
            role=RoleEnum.ADMINISTRADOR,
            branch_id=branch1.id
        )
        db.add(admin1)

        # Crear Usuario Vendedor para sucursal 1
        vend1 = User(
            username="vendedor1",
            hashed_password=get_password_hash("vend123"),
            role=RoleEnum.VENDEDOR,
            branch_id=branch1.id
        )
        db.add(vend1)

        # Crear Usuario Admin para sucursal 2
        admin2 = User(
            username="admin2",
            hashed_password=get_password_hash("admin123"),
            role=RoleEnum.ADMINISTRADOR,
            branch_id=branch2.id
        )
        db.add(admin2)

        db.commit()
        print("Usuarios creados exitosamente.")

    except Exception as e:
        print(f"Error al inicializar la base de datos: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    init_db()
