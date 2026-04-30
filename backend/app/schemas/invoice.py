from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from app.models.invoice import InvoiceType, InvoiceStatus

class InvoiceItemBase(BaseModel):
    product_id: int
    quantity: int
    unit_price: float
    iva_percentage: float = 16.0

class InvoiceItemCreate(InvoiceItemBase):
    pass

class InvoiceItemResponse(InvoiceItemBase):
    id: int
    iva_amount: float
    subtotal: float
    product_name: Optional[str] = None

    class Config:
        from_attributes = True

class InvoiceCreate(BaseModel):
    customer_id: int
    currency: str = "VES" # VES or USD
    payment_method: str = "EFECTIVO" # To determine IGTF
    items: List[InvoiceItemCreate]
    related_invoice_id: Optional[int] = None
    reason: Optional[str] = None
    type: InvoiceType = InvoiceType.FACTURA

class InvoiceResponse(BaseModel):
    id: int
    invoice_number: str
    control_number: str
    date: datetime
    type: InvoiceType
    status: InvoiceStatus
    subtotal: float
    iva_total: float
    igtf_total: float
    total_ves: float
    total_usd: float
    exchange_rate: float
    customer_id: int
    user_id: int
    branch_id: int
    customer_name: Optional[str] = None
    customer_document: Optional[str] = None
    customer_address: Optional[str] = None
    branch_name: Optional[str] = None
    related_invoice_number: Optional[str] = None
    reason: Optional[str] = None
    items: List[InvoiceItemResponse]

    class Config:
        from_attributes = True

class FiscalSettingsResponse(BaseModel):
    usd_rate: float
    igtf_percentage: float
    iva_general: float
    next_invoice_number: int
    
    class Config:
        from_attributes = True

class USDUpdate(BaseModel):
    rate: float
