from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.api import deps
from app.models.user import User
from app.models.branch import Branch
from app.models.customer import Customer
from app.models.product import Product
from app.models.invoice import Invoice, InvoiceItem, FiscalSettings, InvoiceType, InvoiceStatus
from app.schemas.invoice import InvoiceCreate, InvoiceResponse, FiscalSettingsResponse, USDUpdate

router = APIRouter()

@router.get("/settings", response_model=FiscalSettingsResponse)
def get_fiscal_settings(
    db: Session = Depends(get_db),
    current_branch: Branch = Depends(deps.get_current_branch)
):
    settings = db.query(FiscalSettings).filter(FiscalSettings.branch_id == current_branch.id).first()
    if not settings:
        # Initialize if not exists
        settings = FiscalSettings(branch_id=current_branch.id)
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings

@router.put("/settings/usd-rate")
def update_usd_rate(
    rate_in: USDUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
    current_branch: Branch = Depends(deps.get_current_branch)
):
    settings = db.query(FiscalSettings).filter(FiscalSettings.branch_id == current_branch.id).first()
    if not settings:
        raise HTTPException(status_code=404, detail="Configuración fiscal no encontrada")
    
    settings.usd_rate = rate_in.rate
    db.commit()
    return {"ok": True, "new_rate": settings.usd_rate}

@router.post("/", response_model=InvoiceResponse)
def create_invoice(
    invoice_in: InvoiceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
    current_branch: Branch = Depends(deps.get_current_branch)
):
    # 1. Get Settings
    settings = db.query(FiscalSettings).filter(FiscalSettings.branch_id == current_branch.id).with_for_update().first()
    if not settings:
        raise HTTPException(status_code=400, detail="Debe configurar los parámetros fiscales de la sucursal")

    # Check for daily closure (Z report)
    if settings.last_z_report_date:
        today = datetime.now().date()
        if settings.last_z_report_date.date() == today:
            raise HTTPException(status_code=403, detail="Cierre diario finalizado. No se permiten más ventas hoy.")

    # 2. Validate Customer
    customer = db.query(Customer).filter(Customer.id == invoice_in.customer_id, Customer.branch_id == current_branch.id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    # 3. Process Invoice
    prefix = settings.invoice_prefix
    inv_number = ""
    con_number = ""
    
    if invoice_in.type == InvoiceType.NOTA_CREDITO:
        prefix = "NC"
        inv_number = f"{prefix}-{str(settings.next_invoice_number).zfill(6)}"
        con_number = str(settings.next_control_number).zfill(8)
    elif invoice_in.type == InvoiceType.NOTA_DEBITO:
        prefix = "ND"
        inv_number = f"{prefix}-{str(settings.next_invoice_number).zfill(6)}"
        con_number = str(settings.next_control_number).zfill(8)
    elif invoice_in.type == InvoiceType.PRESUPUESTO:
        prefix = "PP"
        inv_number = f"{prefix}-{str(settings.next_quote_number).zfill(6)}"
        con_number = "NO-FISCAL"
        settings.next_quote_number += 1
    else: # FACTURA
        inv_number = f"{prefix}-{str(settings.next_invoice_number).zfill(6)}"
        con_number = str(settings.next_control_number).zfill(8)
    
    invoice = Invoice(
        invoice_number=inv_number,
        control_number=con_number,
        type=invoice_in.type,
        customer_id=customer.id,
        user_id=current_user.id,
        branch_id=current_branch.id,
        exchange_rate=settings.usd_rate,
        related_invoice_id=invoice_in.related_invoice_id,
        reason=invoice_in.reason
    )
    db.add(invoice)
    db.flush()

    total_subtotal = 0.0
    total_iva = 0.0

    # 3.5. Over-return Validation (Only for NC)
    if invoice_in.type == InvoiceType.NOTA_CREDITO and invoice_in.related_invoice_id:
        original_inv = db.query(Invoice).filter(Invoice.id == invoice_in.related_invoice_id).first()
        if original_inv:
            original_qtys = {item.product_id: item.quantity for item in original_inv.items}
            previous_ncs = db.query(Invoice).filter(
                Invoice.related_invoice_id == original_inv.id,
                Invoice.type == InvoiceType.NOTA_CREDITO,
                Invoice.status == InvoiceStatus.EMITIDA
            ).all()
            already_returned = {}
            for nc in previous_ncs:
                for item in nc.items:
                    already_returned[item.product_id] = already_returned.get(item.product_id, 0) + item.quantity
            
            for item_in in invoice_in.items:
                orig_qty = original_qtys.get(item_in.product_id, 0)
                ret_qty = already_returned.get(item_in.product_id, 0)
                available = orig_qty - ret_qty
                if item_in.quantity > available:
                    db.rollback()
                    raise HTTPException(status_code=400, detail=f"Cantidad excedida para {item_in.product_id}. Disponible: {available}")

    for item_in in invoice_in.items:
        product = db.query(Product).filter(Product.id == item_in.product_id, Product.branch_id == current_branch.id).with_for_update().first()
        if not product:
            db.rollback()
            raise HTTPException(status_code=404, detail=f"Producto {item_in.product_id} no encontrado")
        
        # STOCK IMPACT: Presupuesto y Nota de Débito NO AFECTAN inventario según requerimiento
        if invoice_in.type == InvoiceType.FACTURA:
            if product.stock < item_in.quantity:
                db.rollback()
                raise HTTPException(status_code=400, detail=f"Stock insuficiente para {product.name}")
            product.stock -= item_in.quantity
        elif invoice_in.type == InvoiceType.NOTA_CREDITO:
            product.stock += item_in.quantity
        # NOTA_DEBITO and PRESUPUESTO don't decrease stock here (ND might, but user said PRESUPUESTO doesn't)

        # Calculations per item (IVA INCLUDED)
        item_total_price = item_in.quantity * item_in.unit_price
        item_base = item_total_price / (1 + item_in.iva_percentage / 100)
        item_iva_amount = item_total_price - item_base
        
        total_subtotal += item_base
        total_iva += item_iva_amount

        item = InvoiceItem(
            invoice_id=invoice.id,
            product_id=product.id,
            quantity=item_in.quantity,
            unit_price=item_in.unit_price,
            iva_percentage=item_in.iva_percentage,
            iva_amount=item_iva_amount,
            subtotal=item_base
        )
        db.add(item)

    # IGTF Calculation (3% if currency is USD)
    igtf = 0.0
    if invoice_in.currency == "USD":
        igtf = (total_subtotal + total_iva) * (settings.igtf_percentage / 100)

    invoice.subtotal = total_subtotal
    invoice.iva_total = total_iva
    invoice.igtf_total = igtf
    
    final_total = total_subtotal + total_iva + igtf
    
    if invoice_in.currency == "VES":
        invoice.total_ves = final_total
        invoice.total_usd = final_total / settings.usd_rate
    else:
        invoice.total_usd = final_total
        invoice.total_ves = final_total * settings.usd_rate

    # Update Sequential Numbers (Only for Fiscal Documents)
    if invoice_in.type != InvoiceType.PRESUPUESTO:
        settings.next_invoice_number += 1
        settings.next_control_number += 1

    db.commit()
    db.refresh(invoice)
    
    invoice.customer_name = invoice.customer.name
    invoice.customer_document = invoice.customer.document_id
    invoice.customer_address = invoice.customer.address
    
    if invoice.related_invoice_id:
        rel_inv = db.query(Invoice).filter(Invoice.id == invoice.related_invoice_id).first()
        if rel_inv:
            invoice.related_invoice_number = rel_inv.invoice_number
    
    # Enrich items with product names for the ticket
    for item in invoice.items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if product:
            item.product_name = product.name

    return invoice

@router.get("/search/{invoice_number}/", response_model=InvoiceResponse)
def search_invoice_by_number(
    invoice_number: str,
    db: Session = Depends(get_db),
    current_branch: Branch = Depends(deps.get_current_branch)
):
    invoice = db.query(Invoice).filter(
        Invoice.invoice_number == invoice_number,
        Invoice.branch_id == current_branch.id
    ).first()
    
    if not invoice:
        raise HTTPException(status_code=404, detail="Factura no encontrada")
    
    if invoice.customer:
        invoice.customer_name = invoice.customer.name
        invoice.customer_document = invoice.customer.document_id
        invoice.customer_address = invoice.customer.address
        
    return invoice

@router.get("/", response_model=List[InvoiceResponse])
def read_invoices(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_branch: Branch = Depends(deps.get_current_branch)
):
    invoices = db.query(Invoice).filter(Invoice.branch_id == current_branch.id).order_by(Invoice.date.desc()).offset(skip).limit(limit).all()
    for inv in invoices:
        if inv.customer:
            inv.customer_name = inv.customer.name
            inv.customer_document = inv.customer.document_id
            inv.customer_address = inv.customer.address
        
        if inv.related_invoice_id:
            rel_inv = db.query(Invoice).filter(Invoice.id == inv.related_invoice_id).first()
            if rel_inv:
                inv.related_invoice_number = rel_inv.invoice_number
    return invoices

@router.post("/{invoice_id}/void")
def void_invoice(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
    current_branch: Branch = Depends(deps.get_current_branch)
):
    # 1. Authorization: Only ADMIN or SUPERVISOR can void
    if current_user.role not in ["ADMINISTRADOR", "SUPERVISOR"]:
        raise HTTPException(status_code=403, detail="No tiene permisos para anular documentos")

    # 2. Get Invoice
    invoice = db.query(Invoice).filter(
        Invoice.id == invoice_id,
        Invoice.branch_id == current_branch.id
    ).with_for_update().first()

    if not invoice:
        raise HTTPException(status_code=404, detail="Factura no encontrada")

    if invoice.status == InvoiceStatus.ANULADA:
        raise HTTPException(status_code=400, detail="Esta factura ya se encuentra anulada")

    # 3. Check for daily closure (Z report)
    settings = db.query(FiscalSettings).filter(FiscalSettings.branch_id == current_branch.id).first()
    if settings and settings.last_z_report_date:
        if settings.last_z_report_date.date() == invoice.date.date():
            raise HTTPException(status_code=403, detail="No se puede anular un documento de un día con cierre Z finalizado")

    # 4. Revert Stock Impact
    for item in invoice.items:
        product = db.query(Product).filter(Product.id == item.product_id).with_for_update().first()
        if product:
            if invoice.type == InvoiceType.FACTURA:
                product.stock += item.quantity  # Restore stock
            elif invoice.type == InvoiceType.NOTA_CREDITO:
                product.stock -= item.quantity  # Re-deduct stock

    # 5. Update Status
    invoice.status = InvoiceStatus.ANULADA
    db.commit()

    return {"ok": True, "message": "Documento anulado correctamente"}
