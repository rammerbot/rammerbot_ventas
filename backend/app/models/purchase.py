from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base

class Purchase(Base):
    __tablename__ = "purchases"

    id = Column(Integer, primary_key=True, index=True)
    invoice_number = Column(String, nullable=False)
    date = Column(DateTime(timezone=True), server_default=func.now())
    subtotal = Column(Float, default=0.0)
    iva_total = Column(Float, default=0.0)
    discount_total = Column(Float, default=0.0) # Sum of per-item discounts
    global_discount = Column(Float, default=0.0) # Additional discount at footer
    total_amount = Column(Float, default=0.0)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=False)

    supplier = relationship("Supplier")
    items = relationship("PurchaseItem", back_populates="purchase")

class PurchaseItem(Base):
    __tablename__ = "purchase_items"

    id = Column(Integer, primary_key=True, index=True)
    purchase_id = Column(Integer, ForeignKey("purchases.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_cost = Column(Float, nullable=False)
    discount_amount = Column(Float, default=0.0)
    iva_percentage = Column(Float, default=16.0)
    iva_amount = Column(Float, default=0.0)
    subtotal = Column(Float, default=0.0)

    purchase = relationship("Purchase", back_populates="items")
