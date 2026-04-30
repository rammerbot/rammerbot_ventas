import enum
from sqlalchemy import Column, Integer, String, Text, Enum, ForeignKey
from app.core.database import Base

class CustomerType(str, enum.Enum):
    NATURAL = "NATURAL"
    JURIDICA = "JURIDICA"

class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    customer_type = Column(Enum(CustomerType), default=CustomerType.NATURAL, nullable=False)
    document_id = Column(String, unique=True, index=True, nullable=False) # RIF o Cédula
    name = Column(String, nullable=False)
    address = Column(Text, nullable=False) # Dirección fiscal (obligatoria)
    phone = Column(String, nullable=True)
    email = Column(String, nullable=True)
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=False)
