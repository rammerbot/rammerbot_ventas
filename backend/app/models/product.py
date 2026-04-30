from sqlalchemy import Column, Integer, String, Float, ForeignKey
from app.core.database import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, index=True, nullable=False)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    price_buy = Column(Float, default=0.0)
    price_sell = Column(Float, default=0.0)
    stock = Column(Integer, default=0)
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=False)
