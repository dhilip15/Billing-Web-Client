import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ProductService } from '../../core/services/product.service';
import { CustomerService } from '../../core/services/customer.service';
import { BillingService } from '../../core/services/billing.service';
import {
  ProductDto, CustomerDto, CreateBillRequest, PaymentMode
} from '../../core/models/models';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { ToastService } from '../../core/services/toast.service';

interface CartItem {
  productId: number;
  name: string;
  sku: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  taxPercent: number;
  discount: number;
  get taxAmount(): number;
  get total(): number;
}

@Component({
  selector: 'app-new-bill',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent],
  template: `
    <app-header title="New Bill" subtitle="Create a new sales invoice"></app-header>

    <div class="page">
      <div class="pos-layout">
        <!-- Left: Product Search + Cart -->
        <div class="pos-left">
          <!-- Customer selector -->
          <div class="card mb-4">
            <div class="form-group">
              <label>Customer (optional)</label>
              <select class="form-control" [(ngModel)]="selectedCustomerId">
                <option [value]="null">Walk-in Customer</option>
                <option *ngFor="let c of customers" [value]="c.id">{{ c.name }} ({{ c.phone }})</option>
              </select>
            </div>
          </div>

          <!-- Product search -->
          <div class="card mb-4">
            <div class="search-bar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input class="form-control" type="text" placeholder="Search products by name or SKU..."
                     [(ngModel)]="productSearch" (input)="filterProducts()"/>
            </div>
            <div class="product-grid mt-4" *ngIf="filteredProducts.length > 0">
              <button *ngFor="let p of filteredProducts.slice(0, 12)"
                      class="product-chip" (click)="addToCart(p)"
                      [disabled]="p.currentStock <= 0 && !p.allowNegativeStock">
                <div class="chip-name">{{ p.name }}</div>
                <div class="chip-meta">
                  <span class="chip-price">₹{{ p.sellingPrice | number:'1.2-2' }}</span>
                  <span class="chip-stock" [class.low]="p.currentStock <= p.reorderLevel">
                    {{ p.currentStock }} {{ p.unit }}
                  </span>
                </div>
              </button>
            </div>
          </div>

          <!-- Cart -->
          <div class="card">
            <h3 class="mb-4">Cart</h3>
            <div *ngIf="cart.length === 0" class="empty-state" style="padding:24px 0">
              <p>Add products from above to start billing</p>
            </div>
            <div class="cart-items" *ngIf="cart.length > 0">
              <div *ngFor="let item of cart; let i = index" class="cart-row">
                <div class="cart-item-info">
                  <div class="cart-name">{{ item.name }}</div>
                  <div class="cart-sku text-xs text-muted">{{ item.sku }} · ₹{{ item.unitPrice }}</div>
                </div>
                <div class="cart-controls">
                  <button class="qty-btn" (click)="decreaseQty(i)">−</button>
                  <input type="number" class="qty-input" [(ngModel)]="item.quantity" min="1" (change)="calcTotals()"/>
                  <button class="qty-btn" (click)="increaseQty(i)">+</button>
                </div>
                <div class="cart-total font-semibold">₹{{ getItemTotal(item) | number:'1.2-2' }}</div>
                <button class="btn btn-ghost btn-icon btn-sm" (click)="removeFromCart(i)">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            </div>

            <!-- Notes -->
            <div class="form-group mt-4" *ngIf="cart.length > 0">
              <label>Notes (optional)</label>
              <textarea class="form-control" rows="2" [(ngModel)]="notes" placeholder="Any special notes..."></textarea>
            </div>
          </div>
        </div>

        <!-- Right: Summary + Payment -->
        <div class="pos-right">
          <div class="card pos-summary">
            <h3 class="mb-4">Summary</h3>

            <div class="summary-row">
              <span>Subtotal</span>
              <span>₹{{ subTotal | number:'1.2-2' }}</span>
            </div>
            <div class="summary-row">
              <span>Tax (GST)</span>
              <span>₹{{ taxAmount | number:'1.2-2' }}</span>
            </div>
            <div class="divider"></div>
            <div class="summary-row total-row">
              <span>Total</span>
              <span>₹{{ totalAmount | number:'1.2-2' }}</span>
            </div>

            <!-- Payments -->
            <div class="mt-6">
              <div class="flex items-center justify-between mb-3">
                <h4>Payments</h4>
                <button class="btn btn-ghost btn-sm" (click)="addPayment()">+ Add</button>
              </div>

              <div *ngFor="let pmt of payments; let i = index" class="payment-row">
                <select class="form-control" [(ngModel)]="pmt.mode" style="flex:1">
                  <option [value]="1">Cash</option>
                  <option [value]="2">Card</option>
                  <option [value]="3">UPI</option>
                  <option [value]="4">Credit</option>
                </select>
                <input type="number" class="form-control" [(ngModel)]="pmt.amount" placeholder="Amount" style="width:120px" (change)="calcTotals()"/>
                <button class="btn btn-ghost btn-icon btn-sm" (click)="removePayment(i)">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>

              <div class="summary-row mt-3" *ngIf="payments.length > 0">
                <span>Total Paid</span>
                <span class="text-success font-semibold">₹{{ paidAmount | number:'1.2-2' }}</span>
              </div>
              <div class="summary-row" *ngIf="balanceDue > 0">
                <span>Balance Due</span>
                <span class="text-error font-semibold">₹{{ balanceDue | number:'1.2-2' }}</span>
              </div>
            </div>

            <!-- Actions -->
            <div class="pos-actions mt-6">
              <button class="btn btn-secondary w-full" (click)="saveDraft()" [disabled]="cart.length === 0 || saving">
                <span *ngIf="saving === 'draft'" class="spinner"></span>
                Save as Draft
              </button>
              <button class="btn btn-accent w-full" (click)="holdBill()" [disabled]="cart.length === 0 || saving">
                Hold
              </button>
              <button class="btn btn-primary w-full" (click)="finalizeBill()" [disabled]="cart.length === 0 || saving">
                <span *ngIf="saving === 'finalize'" class="spinner"></span>
                Finalize & Pay
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .pos-layout {
      display: grid;
      grid-template-columns: 1fr 360px;
      gap: 20px;
      align-items: start;
      @media (max-width: 900px) { grid-template-columns: 1fr; }
    }

    .pos-left { display: flex; flex-direction: column; }

    .product-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 10px;
    }

    .product-chip {
      background: var(--color-bg-elevated);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      padding: 10px 12px; cursor: pointer; text-align: left;
      transition: all var(--transition-fast);
      font-family: inherit;

      &:hover:not(:disabled) {
        border-color: var(--color-primary);
        background: var(--color-primary-bg);
      }
      &:disabled { opacity: 0.4; cursor: not-allowed; }
    }

    .chip-name { font-size: 0.8125rem; font-weight: 500; color: var(--color-text); margin-bottom: 4px; line-height: 1.3; }
    .chip-meta { display: flex; justify-content: space-between; align-items: center; }
    .chip-price { font-size: 0.75rem; font-weight: 600; color: var(--color-primary-light); }
    .chip-stock { font-size: 0.7rem; color: var(--color-text-muted); &.low { color: var(--color-warning); } }

    .cart-items { display: flex; flex-direction: column; gap: 8px; }
    .cart-row {
      display: flex; align-items: center; gap: 10px;
      padding: 8px 0; border-bottom: 1px solid var(--color-border-light);
      &:last-child { border-bottom: none; }
    }
    .cart-item-info { flex: 1; min-width: 0; }
    .cart-name { font-size: 0.875rem; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .cart-controls { display: flex; align-items: center; gap: 4px; }
    .qty-btn {
      width: 28px; height: 28px;
      background: var(--color-bg-elevated); border: 1px solid var(--color-border);
      border-radius: var(--radius-sm); cursor: pointer; color: var(--color-text);
      font-size: 1rem; line-height: 1;
      &:hover { border-color: var(--color-primary); color: var(--color-primary-light); }
    }
    .qty-input {
      width: 50px; padding: 4px 6px; text-align: center;
      background: var(--color-bg-elevated); border: 1px solid var(--color-border);
      border-radius: var(--radius-sm); color: var(--color-text); font-family: inherit; font-size: 0.875rem;
      outline: none;
    }
    .cart-total { font-size: 0.875rem; min-width: 80px; text-align: right; color: var(--color-text); }

    .pos-summary { position: sticky; top: calc(var(--header-height) + 16px); }
    .summary-row { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; font-size: 0.875rem; color: var(--color-text-secondary); }
    .total-row { font-size: 1.25rem; font-weight: 700; color: var(--color-text); }

    .payment-row { display: flex; gap: 8px; align-items: center; margin-bottom: 8px; }

    .pos-actions { display: flex; flex-direction: column; gap: 10px; }
  `]
})
export class NewBillComponent implements OnInit {
  products: ProductDto[] = [];
  filteredProducts: ProductDto[] = [];
  customers: CustomerDto[] = [];
  productSearch = '';
  selectedCustomerId: number | null = null;
  notes = '';
  cart: any[] = [];
  payments: { mode: PaymentMode; amount: number }[] = [];
  saving: string | false = false;

  subTotal = 0;
  taxAmount = 0;
  totalAmount = 0;
  paidAmount = 0;
  balanceDue = 0;

  constructor(
    private productService: ProductService,
    private customerService: CustomerService,
    private billingService: BillingService,
    private router: Router,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.productService.getAll().subscribe(r => {
      if (r.success) { this.products = r.data!; this.filteredProducts = this.products; }
    });
    this.customerService.getAll(1, 200).subscribe(r => {
      if (r.success) this.customers = r.data!.items;
    });
  }

  filterProducts(): void {
    const q = this.productSearch.toLowerCase();
    this.filteredProducts = q
      ? this.products.filter(p => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q))
      : this.products;
  }

  addToCart(product: ProductDto): void {
    const existing = this.cart.find((i: any) => i.productId === product.id);
    if (existing) { existing.quantity++; }
    else {
      this.cart.push({
        productId: product.id,
        name: product.name,
        sku: product.sku,
        unit: product.unit,
        quantity: 1,
        unitPrice: product.sellingPrice,
        taxPercent: product.taxPercent,
        discount: 0,
      });
    }
    this.calcTotals();
  }

  removeFromCart(i: number): void { this.cart.splice(i, 1); this.calcTotals(); }
  increaseQty(i: number): void { this.cart[i].quantity++; this.calcTotals(); }
  decreaseQty(i: number): void {
    if (this.cart[i].quantity > 1) { this.cart[i].quantity--; this.calcTotals(); }
    else this.removeFromCart(i);
  }

  getItemTotal(item: any): number {
    return item.quantity * item.unitPrice * (1 + item.taxPercent / 100) - item.discount;
  }

  calcTotals(): void {
    this.subTotal = this.cart.reduce((s: number, i: any) => s + i.quantity * i.unitPrice, 0);
    this.taxAmount = this.cart.reduce((s: number, i: any) => s + i.quantity * i.unitPrice * (i.taxPercent / 100), 0);
    this.totalAmount = this.subTotal + this.taxAmount;
    this.paidAmount = this.payments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
    this.balanceDue = Math.max(0, this.totalAmount - this.paidAmount);
  }

  addPayment(): void { this.payments.push({ mode: PaymentMode.Cash, amount: this.totalAmount - this.paidAmount }); this.calcTotals(); }
  removePayment(i: number): void { this.payments.splice(i, 1); this.calcTotals(); }

  buildRequest(): CreateBillRequest {
    return {
      customerId: this.selectedCustomerId ?? undefined,
      notes: this.notes || undefined,
      items: this.cart.map((i: any) => ({
        productId: i.productId, quantity: i.quantity,
        unitPrice: i.unitPrice, discount: i.discount
      })),
      payments: this.payments.map(p => ({ mode: p.mode, amount: p.amount }))
    };
  }

  saveDraft(): void {
    this.saving = 'draft';
    this.billingService.create(this.buildRequest()).subscribe({
      next: res => {
        if (res.success) { this.toast.success('Bill saved as draft!'); this.router.navigate(['/billing']); }
        this.saving = false;
      },
      error: () => { this.saving = false; }
    });
  }

  holdBill(): void {
    this.saving = 'hold';
    this.billingService.create(this.buildRequest()).subscribe({
      next: res => {
        if (res.success && res.data) {
          this.billingService.hold(res.data.id).subscribe(() => {
            this.toast.info('Bill placed on hold.'); this.router.navigate(['/billing']);
          });
        }
        this.saving = false;
      },
      error: () => { this.saving = false; }
    });
  }

  finalizeBill(): void {
    this.saving = 'finalize';
    this.billingService.create(this.buildRequest()).subscribe({
      next: res => {
        if (res.success && res.data) {
          this.billingService.finalize(res.data.id).subscribe(() => {
            this.toast.success('Bill finalized!'); this.router.navigate(['/billing']);
          });
        }
        this.saving = false;
      },
      error: () => { this.saving = false; }
    });
  }
}
