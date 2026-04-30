from sqlalchemy import Column, Integer, String, Boolean
from app.core.database import Base

class Branch(Base):
    __tablename__ = "branches"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False) # Razón Social
    rif = Column(String, nullable=True) # RIF de la empresa
    address = Column(String, nullable=True) # Dirección Fiscal
    phone = Column(String, nullable=True)
    fiscal_message = Column(String, nullable=True) # Ej: "Contribuyente Especial"
    fiscal_serial = Column(String, nullable=True) # Serial de la impresora fiscal (si aplica)
    subdomain = Column(String, unique=True, index=True, nullable=False)
    is_active = Column(Boolean, default=True)
