from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class SalesBookEntry(BaseModel):
    date: datetime
    customer_name: str
    customer_rif: str
    invoice_number: str
    control_number: str
    related_number: Optional[str] = None
    type: str # REG, DEV, AJU
    total_with_iva: float
    base_imponible: float
    iva_percentage: float
    iva_amount: float
    igtf_amount: float
    total_usd: float

class SalesBookResponse(BaseModel):
    month: int
    year: int
    branch_name: str
    branch_rif: str
    entries: List[SalesBookEntry]
    summary: dict # Totals of base, iva, igtf
