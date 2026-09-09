import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService } from '../../core/services/product.service';
import { CustomerService } from '../../core/services/customer.service';
import { CategoryService } from '../../core/services/category.service';
import { BillingService } from '../../core/services/billing.service';
import {
  ProductDto, CustomerDto, CategoryDto, CreateBillRequest, PaymentMode
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
              <label>Customer Mobile No. (optional)</label>
              <div class="flex gap-2">
                <input class="form-control" type="text" placeholder="Enter 10-digit mobile..."
                       [(ngModel)]="customerPhone" (ngModelChange)="onPhoneChange()"/>
              </div>
              <div class="text-sm mt-1" [ngClass]="selectedCustomerId ? 'text-success' : 'text-muted'">
                {{ selectedCustomerId ? '✓ Linked: ' + customerName : (customerPhone ? 'New customer will be created' : 'Walk-in Customer') }}
              </div>
            </div>
          </div>

          <!-- Product search & Category filter -->
          <div class="card mb-4">
            <div class="flex gap-3 items-center flex-wrap">
              <div class="search-bar" style="flex: 1; min-width: 200px;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input #searchInput class="form-control" type="text" placeholder="Scan barcode or search by name / SKU..."
                       [(ngModel)]="productSearch" (input)="filterProducts()" (keydown.enter)="onSearchEnter($event)"/>
              </div>
              <select class="form-control" style="width: 170px;" [(ngModel)]="selectedCategoryId" (change)="filterProducts()">
                <option [value]="0">All Categories</option>
                <option *ngFor="let c of categories" [value]="c.id">{{ c.name }}</option>
              </select>
            </div>

            <div class="product-grid mt-4" *ngIf="paginatedProducts.length > 0">
              <button *ngFor="let p of paginatedProducts"
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
            <div *ngIf="products.length === 0" class="text-muted text-sm mt-3">
              No products found in catalogue. Please add products first.
            </div>
            <div *ngIf="products.length > 0 && filteredProducts.length === 0" class="text-muted text-sm mt-3 text-center py-2">
              No products match the selected search/category.
            </div>

            <!-- Pagination controls -->
            <div class="flex items-center justify-between mt-4 pt-3" style="border-top: 1px solid var(--color-border-light);" *ngIf="filteredProducts.length > 0">
              <span class="text-xs text-muted">
                Showing {{ (posPage - 1) * posPageSize + 1 }} - {{ minProductIndex }} of {{ filteredProducts.length }} items
              </span>
              <div class="flex items-center gap-2">
                <button class="btn btn-ghost btn-sm" (click)="goToPosPage(posPage - 1)" [disabled]="posPage <= 1">
                  Previous
                </button>
                <span class="text-xs font-semibold px-2">Page {{ posPage }} of {{ posTotalPages }}</span>
                <button class="btn btn-ghost btn-sm" (click)="goToPosPage(posPage + 1)" [disabled]="posPage >= posTotalPages">
                  Next
                </button>
              </div>
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
                  <input type="number" class="qty-input" [(ngModel)]="item.quantity" min="0.001" step="any" (change)="calcTotals()"/>
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
                  <option [ngValue]="1">Cash</option>
                  <option [ngValue]="2">Card</option>
                  <option [ngValue]="3">UPI</option>
                  <option [ngValue]="4">Credit</option>
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
export class NewBillComponent implements OnInit, AfterViewInit {
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;
  products: ProductDto[] = [];
  filteredProducts: ProductDto[] = [];
  categories: CategoryDto[] = [];
  selectedCategoryId: number = 0;
  posPage = 1;
  posPageSize = 12;
  customers: CustomerDto[] = [];
  productSearch = '';
  customerPhone = '';
  customerName = '';
  selectedCustomerId: number | null = null;
  recalledBillId: number | null = null;
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
    private categoryService: CategoryService,
    private customerService: CustomerService,
    private billingService: BillingService,
    private route: ActivatedRoute,
    private router: Router,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.categoryService.getAll().subscribe({
      next: (r: any) => {
        const data = r?.data || r?.Data || r;
        if (Array.isArray(data)) {
          this.categories = data;
        }
      },
      error: (err) => console.error('Error loading categories for billing:', err)
    });

    this.productService.getAll(1, 1000).subscribe({
      next: (r: any) => {
        if (Array.isArray(r)) {
          this.products = r;
        } else if (r?.data?.items && Array.isArray(r.data.items)) {
          this.products = r.data.items;
        } else if (r?.data && Array.isArray(r.data)) {
          this.products = r.data;
        } else if (r?.Data?.items && Array.isArray(r.Data.items)) {
          this.products = r.Data.items;
        } else if (r?.Data && Array.isArray(r.Data)) {
          this.products = r.Data;
        } else {
          this.products = [];
        }
        this.filterProducts();
      },
      error: (err) => console.error('Error loading products for billing:', err)
    });

    this.customerService.getAll(1, 200).subscribe({
      next: (r: any) => {
        if (Array.isArray(r)) {
          this.customers = r;
        } else if (r?.data?.items && Array.isArray(r.data.items)) {
          this.customers = r.data.items;
        } else if (r?.data && Array.isArray(r.data)) {
          this.customers = r.data;
        } else if (r?.Data?.items && Array.isArray(r.Data.items)) {
          this.customers = r.Data.items;
        } else if (r?.Data && Array.isArray(r.Data)) {
          this.customers = r.Data;
        } else {
          this.customers = [];
        }

        // Check if recalling an existing bill
        const recallIdParam = this.route.snapshot.queryParamMap.get('recallId');
        if (recallIdParam) {
          this.loadRecalledBill(Number(recallIdParam));
        }
      },
      error: (err) => console.error('Error loading customers for billing:', err)
    });
  }

  loadRecalledBill(id: number): void {
    this.recalledBillId = id;
    this.billingService.getById(id).subscribe({
      next: (r: any) => {
        const bill = r?.data || r?.Data || r;
        if (bill) {
          if (bill.customerId) {
            this.selectedCustomerId = bill.customerId;
            this.customerName = bill.customerName || '';
            const matched = this.customers.find(c => c.id === bill.customerId);
            if (matched && matched.phone) {
              this.customerPhone = matched.phone;
            }
          }
          if (bill.notes) this.notes = bill.notes;

          const items = bill.billItems || bill.items || [];
          this.cart = items.map((i: any) => ({
            productId: i.productId,
            name: i.productName || i.name,
            sku: i.sku || '',
            unit: i.unit || '',
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            taxPercent: i.taxPercent,
            discount: i.discountAmount || i.discount || 0
          }));

          if (bill.payments && bill.payments.length > 0) {
            this.payments = bill.payments.map((p: any) => ({
              mode: typeof p.mode === 'string' ? (PaymentMode as any)[p.mode] || PaymentMode.Cash : p.mode,
              amount: p.amount
            }));
          }

          this.calcTotals();
          this.toast.info(`Recalled bill #${bill.invoiceNo || id} to POS cart.`);
        }
      },
      error: (err) => {
        console.error('Error recalling bill:', err);
        this.toast.error('Failed to recall bill');
      }
    });
  }

  onPhoneChange(): void {
    const phone = this.customerPhone?.trim();
    if (!phone) {
      this.selectedCustomerId = null;
      this.customerName = '';
      return;
    }
    
    const matched = this.customers.find(c => c.phone === phone);
    if (matched) {
      this.selectedCustomerId = matched.id;
      this.customerName = matched.name;
    } else {
      this.selectedCustomerId = null;
      this.customerName = '';
    }
  }

  ensureCustomerAndExecute(action: () => void): void {
    if (this.cart.length === 0) {
      this.toast.error('Cart is empty');
      return;
    }

    const phone = this.customerPhone?.trim();
    if (phone && !this.selectedCustomerId) {
      this.saving = 'creating_customer';
      this.customerService.create({ name: 'Customer - ' + phone, phone: phone }).subscribe({
        next: (res: any) => {
          const custData = res?.data || res?.Data || res;
          if (custData && custData.id) {
            this.selectedCustomerId = custData.id;
            this.customers.push(custData); // optionally add to local list
            action();
          } else {
            this.toast.error('Failed to auto-create customer record');
            this.saving = false;
          }
        },
        error: (err) => {
          console.error('Error creating customer:', err);
          this.toast.error('Failed to auto-create customer');
          this.saving = false;
        }
      });
    } else {
      action();
    }
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.searchInput?.nativeElement?.focus();
    }, 300);
  }

  get posTotalPages(): number {
    return Math.ceil((this.filteredProducts?.length || 0) / this.posPageSize) || 1;
  }

  get paginatedProducts(): ProductDto[] {
    const start = (this.posPage - 1) * this.posPageSize;
    return (this.filteredProducts || []).slice(start, start + this.posPageSize);
  }

  get minProductIndex(): number {
    return Math.min(this.posPage * this.posPageSize, this.filteredProducts?.length || 0);
  }

  goToPosPage(page: number): void {
    if (page >= 1 && page <= this.posTotalPages) {
      this.posPage = page;
    }
  }

  filterProducts(): void {
    this.posPage = 1;
    let list = this.products || [];
    if (this.selectedCategoryId && Number(this.selectedCategoryId) !== 0) {
      const catId = Number(this.selectedCategoryId);
      list = list.filter(p => p.categoryId === catId);
    }
    const q = this.productSearch.toLowerCase().trim();
    if (q) {
      list = list.filter(p =>
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.sku && p.sku.toLowerCase().includes(q)) ||
        (p.barcode && p.barcode.toLowerCase().includes(q))
      );
    }
    this.filteredProducts = list;
  }

  onSearchEnter(event: Event): void {
    event.preventDefault();
    const q = this.productSearch.trim().toLowerCase();
    if (!q) return;

    // 1. Try exact barcode match
    let matched = this.products.find(p => p.barcode && p.barcode.trim().toLowerCase() === q);

    // 2. Try exact SKU match
    if (!matched) {
      matched = this.products.find(p => p.sku && p.sku.trim().toLowerCase() === q);
    }

    // 3. Try exact Name match or single filtered item
    if (!matched) {
      matched = this.products.find(p => p.name && p.name.trim().toLowerCase() === q);
    }

    if (!matched && this.filteredProducts.length === 1) {
      matched = this.filteredProducts[0];
    }

    if (matched) {
      if (matched.currentStock <= 0 && !matched.allowNegativeStock) {
        this.toast.error(`"${matched.name}" is out of stock!`);
      } else {
        this.addToCart(matched);
        this.toast.success(`Added "${matched.name}" to cart`);
      }
      this.productSearch = '';
      this.filterProducts();
      this.searchInput?.nativeElement?.focus();
    } else {
      this.toast.error(`No product found for barcode/query: "${this.productSearch}"`);
    }
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
    const qty = Number(item.quantity) || 0;
    const price = Number(item.unitPrice) || 0;
    const disc = Number(item.discount) || 0;
    return (qty * price) - disc;
  }

  calcTotals(): void {
    // Total should not add tax if unitPrice is already MRP
    this.totalAmount = this.cart.reduce((s: number, i: any) => s + ((Number(i.quantity) || 0) * (Number(i.unitPrice) || 0) - (Number(i.discount) || 0)), 0);
    
    // Tax amount calculated directly on the MRP as per user expectation
    this.taxAmount = this.cart.reduce((s: number, i: any) => s + ((Number(i.quantity) || 0) * (Number(i.unitPrice) || 0) * ((Number(i.taxPercent) || 0) / 100)), 0);
    
    // Subtotal is Total minus Tax to balance the bill mathematically
    this.subTotal = this.totalAmount - this.taxAmount;
    
    this.paidAmount = this.payments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
    this.balanceDue = Math.max(0, this.totalAmount - this.paidAmount);
  }

  addPayment(): void { this.payments.push({ mode: PaymentMode.Cash, amount: this.totalAmount - this.paidAmount }); this.calcTotals(); }
  removePayment(i: number): void { this.payments.splice(i, 1); this.calcTotals(); }

  buildRequest(): CreateBillRequest {
    const custId = this.selectedCustomerId && (this.selectedCustomerId as any) !== 'null' ? Number(this.selectedCustomerId) : undefined;
    return {
      customerId: custId,
      notes: this.notes?.trim() || undefined,
      items: this.cart.map((i: any) => ({
        productId: Number(i.productId),
        quantity: Number(i.quantity) || 1,
        unitPrice: Number(i.unitPrice) || 0,
        taxPercent: Number(i.taxPercent) || 0,
        discountPercent: Number(i.discount) || 0,
        discount: Number(i.discount) || 0
      })),
      payments: this.payments.map(p => ({
        mode: Number(p.mode),
        amount: Number(p.amount) || 0
      }))
    };
  }

  saveDraft(): void {
    this.ensureCustomerAndExecute(() => {
      this.saving = 'draft';
      this.billingService.create(this.buildRequest()).subscribe({
        next: res => {
          if (res.success) {
            this.toast.success('Bill saved as draft!');
            this.router.navigate(['/billing']);
          } else {
            this.toast.error(res.message || 'Failed to save bill');
          }
          this.saving = false;
        },
        error: (err) => {
          console.error('Error saving draft:', err);
          this.toast.error('Failed to save bill draft');
          this.saving = false;
        }
      });
    });
  }

  holdBill(): void {
    this.ensureCustomerAndExecute(() => {
      this.saving = 'hold';
      this.billingService.create(this.buildRequest()).subscribe({
        next: res => {
          const billData = res?.data || (res as any)?.Data;
          if (res.success && billData) {
            this.billingService.hold(billData.id).subscribe({
              next: () => {
                this.toast.info('Bill placed on hold.');
                this.router.navigate(['/billing']);
              },
              error: () => { this.saving = false; }
            });
          } else {
            this.toast.error(res.message || 'Failed to create bill');
            this.saving = false;
          }
        },
        error: (err) => {
          console.error('Error holding bill:', err);
          this.toast.error('Failed to place bill on hold');
          this.saving = false;
        }
      });
    });
  }

  finalizeBill(): void {
    if (this.payments.length === 0) {
      this.payments.push({ mode: PaymentMode.Cash, amount: this.totalAmount });
      this.calcTotals();
    }
    
    this.ensureCustomerAndExecute(() => {
      this.saving = 'finalize';
      if (this.recalledBillId) {
        this.billingService.finalize(this.recalledBillId).subscribe({
          next: res => {
            const billData = res?.data || (res as any)?.Data;
            if (res.success && billData) {
              this.toast.success('Bill finalized!');
              this.router.navigate(['/billing', billData.id], { queryParams: { print: 'true' } });
            } else {
              this.toast.error(res.message || 'Failed to finalize bill');
              this.saving = false;
            }
          },
          error: (err) => {
            console.error('Error finalizing bill:', err);
            this.toast.error('Failed to finalize bill');
            this.saving = false;
          }
        });
      } else {
        this.billingService.create(this.buildRequest()).subscribe({
          next: res => {
            const billData = res?.data || (res as any)?.Data;
            if (res.success && billData) {
              this.toast.success('Bill created and finalized!');
              this.router.navigate(['/billing', billData.id], { queryParams: { print: 'true' } });
            } else {
              this.toast.error(res.message || 'Failed to finalize bill');
              this.saving = false;
            }
          },
          error: (err) => {
            console.error('Error finalizing bill:', err);
            this.toast.error('Failed to finalize bill');
            this.saving = false;
          }
        });
      }
    });
  }
}
