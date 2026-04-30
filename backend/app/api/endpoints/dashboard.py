from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from datetime import datetime, timedelta
from typing import List

from app.core.database import get_db
from app.api import deps
from app.models.invoice import Invoice, InvoiceStatus, InvoiceType, InvoiceItem
from app.models.product import Product
from app.models.branch import Branch

router = APIRouter()

@router.get("/summary")
def get_dashboard_summary(
    db: Session = Depends(get_db),
    current_branch: Branch = Depends(deps.get_current_branch)
):
    today = datetime.now().date()
    yesterday = today - timedelta(days=1)
    seven_days_ago = today - timedelta(days=7)

    # 1. Today's Sales
    today_total = db.query(func.sum(Invoice.total_ves)).filter(
        Invoice.branch_id == current_branch.id,
        Invoice.status == InvoiceStatus.EMITIDA,
        Invoice.type != InvoiceType.PRESUPUESTO,
        extract('day', Invoice.date) == today.day,
        extract('month', Invoice.date) == today.month,
        extract('year', Invoice.date) == today.year
    ).scalar() or 0.0

    # 2. Yesterday's Sales for Comparison
    yesterday_total = db.query(func.sum(Invoice.total_ves)).filter(
        Invoice.branch_id == current_branch.id,
        Invoice.status == InvoiceStatus.EMITIDA,
        Invoice.type != InvoiceType.PRESUPUESTO,
        extract('day', Invoice.date) == yesterday.day,
        extract('month', Invoice.date) == yesterday.month,
        extract('year', Invoice.date) == yesterday.year
    ).scalar() or 0.0

    # 3. Low Stock Alert (Stock < 10)
    low_stock_items = db.query(Product).filter(
        Product.branch_id == current_branch.id,
        Product.stock <= 10
    ).all()

    # 4. Weekly Sales Trend (Last 7 days)
    trend_data = []
    for i in range(7):
        day = today - timedelta(days=i)
        day_total = db.query(func.sum(Invoice.total_ves)).filter(
            Invoice.branch_id == current_branch.id,
            Invoice.status == InvoiceStatus.EMITIDA,
            Invoice.type != InvoiceType.PRESUPUESTO,
            extract('day', Invoice.date) == day.day,
            extract('month', Invoice.date) == day.month,
            extract('year', Invoice.date) == day.year
        ).scalar() or 0.0
        trend_data.append({
            "date": day.strftime("%d/%m"),
            "total": day_total
        })
    trend_data.reverse()

    # 5. Top Selling Products (Last 30 days)
    top_products = db.query(
        Product.name,
        func.sum(InvoiceItem.quantity).label("total_sold")
    ).join(InvoiceItem, InvoiceItem.product_id == Product.id)\
     .join(Invoice, Invoice.id == InvoiceItem.invoice_id)\
     .filter(
        Product.branch_id == current_branch.id,
        Invoice.status == InvoiceStatus.EMITIDA,
        Invoice.date >= (today - timedelta(days=30))
    ).group_by(Product.id).order_by(func.sum(InvoiceItem.quantity).desc()).limit(5).all()

    # 6. Top Suppliers (By purchase volume)
    # Import Supplier from models to join
    from app.models.supplier import Supplier
    from app.models.purchase import Purchase
    top_suppliers = db.query(
        Supplier.name,
        func.sum(Purchase.total_amount).label("total_purchased")
    ).join(Purchase, Purchase.supplier_id == Supplier.id)\
     .filter(Purchase.branch_id == current_branch.id)\
     .group_by(Supplier.id).order_by(func.sum(Purchase.total_amount).desc()).limit(5).all()

    # 7. Recommendations / Alerts
    recommendations = []
    if low_stock_items:
        recommendations.append({
            "type": "warning",
            "message": f"Tienes {len(low_stock_items)} productos con stock crítico. Revisa el inventario."
        })
    
    if today_total > yesterday_total and yesterday_total > 0:
        growth = ((today_total - yesterday_total) / yesterday_total) * 100
        recommendations.append({
            "type": "success",
            "message": f"¡Buen trabajo! Las ventas de hoy han crecido un {growth:.1f}% respecto a ayer."
        })
    
    if not recommendations:
        recommendations.append({
            "type": "info",
            "message": "Operación estable. Mantén el monitoreo del inventario."
        })

    return {
        "today_total": today_total,
        "yesterday_total": yesterday_total,
        "low_stock_count": len(low_stock_items),
        "low_stock_items": [
            {"id": p.id, "name": p.name, "stock": p.stock} for p in low_stock_items[:5]
        ],
        "top_products": [
            {"name": p[0], "total_sold": p[1]} for p in top_products
        ],
        "top_suppliers": [
            {"name": s[0], "total_purchased": s[1]} for s in top_suppliers
        ],
        "trend": trend_data,
        "recommendations": recommendations
    }
