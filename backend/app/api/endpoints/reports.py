from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import extract
from typing import List
from datetime import datetime

from app.core.database import get_db
from app.api import deps
from app.models.invoice import Invoice, InvoiceType, InvoiceStatus, FiscalSettings
from app.models.branch import Branch
from app.schemas.report import SalesBookResponse, SalesBookEntry

router = APIRouter()

@router.get("/sales-book", response_model=SalesBookResponse)
def get_sales_book(
    month: int,
    year: int,
    db: Session = Depends(get_db),
    current_branch: Branch = Depends(deps.get_current_branch)
):
    # Query all non-budget invoices for the month
    invoices = db.query(Invoice).filter(
        Invoice.branch_id == current_branch.id,
        Invoice.status == InvoiceStatus.EMITIDA,
        Invoice.type != InvoiceType.PRESUPUESTO,
        extract('month', Invoice.date) == month,
        extract('year', Invoice.date) == year
    ).order_by(Invoice.date.asc()).all()

    entries = []
    total_base = 0.0
    total_iva = 0.0
    total_igtf = 0.0
    total_general = 0.0

    for inv in invoices:
        # Determine type code for SENIAT
        type_code = "01-REG" # Regular
        if inv.type == InvoiceType.NOTA_CREDITO:
            type_code = "03-DEV" # Devolución
        elif inv.type == InvoiceType.NOTA_DEBITO:
            type_code = "02-AJU" # Ajuste
        
        # Load customer name/rif if not loaded
        cust_name = "CONTADO"
        cust_rif = "V-00000000"
        if inv.customer:
            cust_name = inv.customer.name
            cust_rif = inv.customer.document_id

        # Get related number
        rel_num = None
        if inv.related_invoice_id:
            rel_inv = db.query(Invoice).filter(Invoice.id == inv.related_invoice_id).first()
            if rel_inv:
                rel_num = rel_inv.invoice_number

        # In NC, amounts are negative for the book
        multiplier = -1.0 if inv.type == InvoiceType.NOTA_CREDITO else 1.0
        
        entry = SalesBookEntry(
            date=inv.date,
            customer_name=cust_name,
            customer_rif=cust_rif,
            invoice_number=inv.invoice_number,
            control_number=inv.control_number,
            related_number=rel_num,
            type=type_code,
            total_with_iva=(inv.subtotal + inv.iva_total) * multiplier,
            base_imponible=inv.subtotal * multiplier,
            iva_percentage=16.0, # Standard alicuota
            iva_amount=inv.iva_total * multiplier,
            igtf_amount=inv.igtf_total * multiplier,
            total_usd=inv.total_usd * multiplier
        )
        entries.append(entry)
        
        total_base += entry.base_imponible
        total_iva += entry.iva_amount
        total_igtf += entry.igtf_amount
        total_general += entry.total_with_iva

    return SalesBookResponse(
        month=month,
        year=year,
        branch_name=current_branch.name,
        branch_rif=current_branch.rif,
        entries=entries,
        summary={
            "total_base": total_base,
            "total_iva": total_iva,
            "total_igtf": total_igtf,
            "total_general": total_general
        }
    )

@router.get("/daily-summary")
def get_daily_summary(
    date: str, # ISO Format YYYY-MM-DD
    report_type: str = "X", # "X" or "Z"
    db: Session = Depends(get_db),
    current_branch: Branch = Depends(deps.get_current_branch)
):
    target_date = datetime.strptime(date, "%Y-%m-%d").date()
    
    invoices = db.query(Invoice).filter(
        Invoice.branch_id == current_branch.id,
        Invoice.type != InvoiceType.PRESUPUESTO,
        extract('day', Invoice.date) == target_date.day,
        extract('month', Invoice.date) == target_date.month,
        extract('year', Invoice.date) == target_date.year
    ).order_by(Invoice.id.asc()).all()

    total_base = 0.0
    total_iva = 0.0
    total_igtf = 0.0
    total_exento = 0.0
    count_facturas = 0
    count_nc = 0
    count_nd = 0
    count_anuladas = 0
    
    first_inv = ""
    last_inv = ""

    if invoices:
        first_inv = invoices[0].invoice_number
        last_inv = invoices[-1].invoice_number

    for inv in invoices:
        if inv.status == InvoiceStatus.ANULADA:
            count_anuladas += 1
            continue
            
        multiplier = -1.0 if inv.type == InvoiceType.NOTA_CREDITO else 1.0
        
        inv_exento = 0.0
        for item in inv.items:
            if item.iva_percentage == 0:
                inv_exento += item.subtotal
        
        total_exento += inv_exento * multiplier
        total_base += (inv.subtotal - inv_exento) * multiplier
        total_iva += inv.iva_total * multiplier
        total_igtf += inv.igtf_total * multiplier
        
        if inv.type == InvoiceType.FACTURA: count_facturas += 1
        elif inv.type == InvoiceType.NOTA_CREDITO: count_nc += 1
        elif inv.type == InvoiceType.NOTA_DEBITO: count_nd += 1

    # Get or Init fiscal settings to track Z number
    settings = db.query(FiscalSettings).filter(FiscalSettings.branch_id == current_branch.id).first()
    if not settings:
        settings = FiscalSettings(branch_id=current_branch.id)
        db.add(settings)
        db.flush()

    report_num = settings.next_z_report_number
    
    if report_type == "Z":
        settings.next_z_report_number += 1
        settings.last_z_report_date = datetime.now()
        db.commit()

    return {
        "numero": report_num,
        "type": report_type,
        "date": date,
        "time": datetime.now().strftime("%H:%M:%S"),
        "branch": {
            "name": current_branch.name,
            "rif": current_branch.rif,
            "address": current_branch.address,
            "phone": current_branch.phone,
            "fiscal_serial": current_branch.fiscal_serial
        },
        "range": {
            "first": first_inv,
            "last": last_inv
        },
        "summary": {
            "base": total_base,
            "exento": total_exento,
            "iva": total_iva,
            "igtf": total_igtf,
            "total": total_base + total_exento + total_iva + total_igtf,
            "counts": {
                "facturas": count_facturas,
                "notas_credito": count_nc,
                "notas_debito": count_nd,
                "anulaciones": count_anuladas
            }
        }
    }
