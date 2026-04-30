from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.api import deps
from app.models.user import User
from app.models.branch import Branch
from app.models.purchase import Purchase, PurchaseItem
from app.models.product import Product
from app.schemas.purchase import PurchaseCreate, PurchaseResponse

router = APIRouter()

@router.get("/", response_model=List[PurchaseResponse])
def read_purchases(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
    current_branch: Branch = Depends(deps.get_current_branch)
):
    purchases = db.query(Purchase).filter(Purchase.branch_id == current_branch.id).offset(skip).limit(limit).all()
    for p in purchases:
        if p.supplier:
            p.supplier_name = p.supplier.name
            p.supplier_rif = p.supplier.rif
    return purchases

@router.post("/", response_model=PurchaseResponse)
def create_purchase(
    purchase_in: PurchaseCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
    current_branch: Branch = Depends(deps.get_current_branch)
):
    # 1. Initialize totals
    p_subtotal = 0.0
    p_iva_total = 0.0
    p_discount_total = 0.0
    
    # 2. Create Purchase record (temp values)
    purchase = Purchase(
        invoice_number=purchase_in.invoice_number,
        supplier_id=purchase_in.supplier_id,
        user_id=current_user.id,
        branch_id=current_branch.id
    )
    db.add(purchase)
    db.flush()

    # 3. Process items and update stock
    for item_in in purchase_in.items:
        # Calculations per item (IVA INCLUDED logic)
        # item_in.unit_cost is the price WITH IVA
        item_total_price = item_in.quantity * item_in.unit_cost
        item_base = item_total_price / (1 + item_in.iva_percentage / 100)
        item_iva_amount = item_total_price - item_base
        
        # Update purchase totals
        p_subtotal += item_base
        p_iva_total += item_iva_amount
        p_discount_total += item_in.discount_amount # Discount is usually off the total or base? User said discount per product.

        # Create item record
        item = PurchaseItem(
            purchase_id=purchase.id,
            product_id=item_in.product_id,
            quantity=item_in.quantity,
            unit_cost=item_in.unit_cost, # We keep the entered price
            discount_amount=item_in.discount_amount,
            iva_percentage=item_in.iva_percentage,
            iva_amount=item_iva_amount,
            subtotal=item_base
        )
        db.add(item)

        # Update product stock
        product = db.query(Product).filter(
            Product.id == item_in.product_id,
            Product.branch_id == current_branch.id
        ).first()
        
        if not product:
            db.rollback()
            raise HTTPException(status_code=404, detail=f"Producto con ID {item_in.product_id} no encontrado")
        
        product.stock += item_in.quantity
        product.price_buy = item_in.unit_cost

    # 4. Finalize Purchase totals
    purchase.subtotal = p_subtotal
    purchase.iva_total = p_iva_total
    purchase.discount_total = p_discount_total
    purchase.global_discount = purchase_in.global_discount
    purchase.total_amount = (p_subtotal + p_iva_total) - purchase_in.global_discount

    db.commit()
    db.refresh(purchase)
    return purchase
