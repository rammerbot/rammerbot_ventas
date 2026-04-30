from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import enum

class InvoiceType(str, enum.Enum):
    FACTURA = "FACTURA"
    NOTA_CREDITO = "NOTA_CREDITO"
    NOTA_DEBITO = "NOTA_DEBITO"
    PRESUPUESTO = "PRESUPUESTO"

class InvoiceStatus(str, enum.Enum):
    EMITIDA = "EMITIDA"
    ANULADA = "ANULADA"

class FiscalSettings(Base):
    __tablename__ = "fiscal_settings"
    
    id = Column(Integer, primary_key=True, index=True)
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=False, unique=True)
    next_invoice_number = Column(Integer, default=1)
    next_control_number = Column(Integer, default=1)
    next_quote_number = Column(Integer, default=1)
    next_z_report_number = Column(Integer, default=1)
    usd_rate = Column(Float, default=1.0)
    igtf_percentage = Column(Float, default=3.0)
    iva_general = Column(Float, default=16.0)
    last_z_report_date = Column(DateTime(timezone=True), nullable=True)
    
    # Prefix for invoice number (e.g., F001)
    invoice_prefix = Column(String, default="F")

class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, index=True)
    invoice_number = Column(String, nullable=False, index=True)
    control_number = Column(String, nullable=False, index=True)
    date = Column(DateTime(timezone=True), server_default=func.now())
    
    type = Column(Enum(InvoiceType), default=InvoiceType.FACTURA)
    status = Column(Enum(InvoiceStatus), default=InvoiceStatus.EMITIDA)
    
    # Financials
    subtotal = Column(Float, default=0.0)
    iva_total = Column(Float, default=0.0)
    igtf_total = Column(Float, default=0.0) # Tax for payments in USD
    total_ves = Column(Float, default=0.0)
    total_usd = Column(Float, default=0.0)
    exchange_rate = Column(Float, default=1.0)
    
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=False)

    # Reference for Credit Notes
    related_invoice_id = Column(Integer, ForeignKey("invoices.id"), nullable=True)
    reason = Column(String, nullable=True) # Motivo de la NC/ND

    # Relationships
    customer = relationship("Customer")
    user = relationship("User")
    branch = relationship("Branch")
    items = relationship("InvoiceItem", back_populates="invoice")

class InvoiceItem(Base):
    __tablename__ = "invoice_items"

    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Float, nullable=False) # Price at time of sale
    iva_percentage = Column(Float, default=16.0)
    iva_amount = Column(Float, default=0.0)
    subtotal = Column(Float, default=0.0)

    invoice = relationship("Invoice", back_populates="items")
    product = relationship("Product")
