import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../core/services/product.service';
import { CategoryService } from '../../core/services/category.service';
import { SupplierService } from '../../core/services/supplier.service';
import { ProductDto, CategoryDto, SupplierDto, CreateProductRequest } from '../../core/models/models';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { ToastService } from '../../core/services/toast.service';
import { SettingsService } from '../../core/services/settings.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, HeaderComponent],
  template: `
    <app-header title="Products" subtitle="Manage your product catalogue"></app-header>

    <div class="page">
      <div class="page-header">
        <div>
          <h1>Products</h1>
          <p class="page-subtitle">{{ filtered.length }} items visible (Total: {{ totalItems }})</p>
        </div>
        <button class="btn btn-primary" (click)="openModal()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Product
        </button>
      </div>

      <!-- Filters -->
      <div class="filters-row">
        <div class="search-bar" style="flex:1; max-width: 320px">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input class="form-control" type="text" placeholder="Search by name or SKU..." [(ngModel)]="search" (input)="onFilterChange()"/>
        </div>
        <select class="form-control" style="width:180px" [(ngModel)]="catFilter" (change)="onFilterChange()">
          <option value="">All Categories</option>
          <option *ngFor="let c of categories" [value]="c.id">{{ c.name }}</option>
        </select>
        <label class="flex items-center gap-2 text-sm text-muted" style="cursor:pointer">
          <input type="checkbox" [(ngModel)]="lowStockOnly" (change)="filter()"/> Low Stock Only
        </label>
      </div>

      <!-- Grid view -->
      <div class="product-cards" *ngIf="!loading">
        <div *ngFor="let p of filtered" class="product-card">
          <div class="pc-header">
            <div class="pc-badge">{{ p.categoryName }}</div>
            <div class="stock-indicator" [class]="getStockClass(p)">
              {{ p.currentStock }} {{ p.unit }}
            </div>
          </div>
          <h4 class="pc-name">{{ p.name }}</h4>
          <div class="pc-sku text-xs text-muted">SKU: {{ p.sku }}</div>
          <div class="pc-prices">
            <div><div class="text-xs text-muted">Buy</div><div class="font-semibold">&#8377;{{ p.purchasePrice }}</div></div>
            <div><div class="text-xs text-muted">Sell</div><div class="font-semibold text-primary">&#8377;{{ p.sellingPrice }}</div></div>
            <div><div class="text-xs text-muted">GST</div><div class="font-semibold">{{ p.taxPercent }}%</div></div>
          </div>
          <div class="stock-bar-bg">
            <div class="stock-bar" [style.width.%]="getStockPct(p)" [style.background]="getStockColor(p)"></div>
          </div>
          <div class="pc-actions">
            <button class="btn btn-ghost btn-sm" (click)="openModal(p)">Edit</button>
            <button class="btn btn-ghost btn-sm" (click)="printBarcode(p)">Print Barcode</button>
            <button class="btn btn-danger btn-sm" (click)="deleteProduct(p.id)">Delete</button>
          </div>
        </div>

        <!-- Empty -->
        <div class="empty-state" *ngIf="filtered.length === 0">
          <div class="empty-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg></div>
          <h3>No products found</h3>
          <p>Add your first product to get started.</p>
        </div>
      </div>

      <!-- Pagination -->
      <div class="pagination-controls" *ngIf="totalPages > 1 && !loading" style="display: flex; justify-content: center; gap: 8px; margin-top: 20px;">
        <button class="btn btn-ghost btn-sm" [disabled]="currentPage === 1" (click)="goToPage(currentPage - 1)">Previous</button>
        <span style="display: flex; align-items: center; font-size: 0.9rem;">Page {{currentPage}} of {{totalPages}}</span>
        <button class="btn btn-ghost btn-sm" [disabled]="currentPage === totalPages" (click)="goToPage(currentPage + 1)">Next</button>
      </div>

      <!-- Loading -->
      <div class="product-cards" *ngIf="loading">
        <div *ngFor="let i of [1,2,3,4,5,6]" class="product-card skeleton-card">
          <div class="skeleton" style="height:20px;width:60%;margin-bottom:8px"></div>
          <div class="skeleton" style="height:16px;width:40%;margin-bottom:16px"></div>
          <div class="skeleton" style="height:40px"></div>
        </div>
      </div>
    </div>

    <!-- Add/Edit Product Modal -->
    <div class="modal-overlay" *ngIf="showModal" (click)="showModal = false">
      <div class="modal" (click)="$event.stopPropagation()" style="width: min(640px, calc(100vw - 40px))">
        <div class="modal-header">
          <h3>{{ editId ? 'Edit' : 'Add' }} Product</h3>
          <button class="btn btn-ghost btn-icon" (click)="showModal = false">✕</button>
        </div>
        <div class="form-grid cols-2" style="max-height: 65vh; overflow-y: auto; padding-right: 8px;">
          <div class="form-group"><label>Name *</label><input class="form-control" [(ngModel)]="form.name" placeholder="Product name"/></div>
          <div class="form-group"><label>SKU *</label><input class="form-control" [(ngModel)]="form.sku" placeholder="SKU-001"/></div>
          <div class="form-group"><label>Barcode</label><input class="form-control" [(ngModel)]="form.barcode" placeholder="Optional"/></div>
          <div class="form-group"><label>Unit</label><input class="form-control" [(ngModel)]="form.unit" placeholder="pcs"/></div>
          <div class="form-group"><label>Category *</label>
            <select class="form-control" [(ngModel)]="form.categoryId">
              <option [ngValue]="0" disabled>-- Select Category --</option>
              <option *ngFor="let c of categories" [ngValue]="c.id">{{ c.name }}</option>
            </select>
          </div>
          <div class="form-group"><label>Supplier</label>
            <select class="form-control" [(ngModel)]="form.supplierId">
              <option [ngValue]="null">None</option>
              <option *ngFor="let s of suppliers" [ngValue]="s.id">{{ s.name }}</option>
            </select>
          </div>
          <div class="form-group"><label>Purchase Price (&#8377;) *</label><input class="form-control" type="number" [(ngModel)]="form.purchasePrice"/></div>
          <div class="form-group"><label>Selling Price (&#8377;) *</label><input class="form-control" type="number" [(ngModel)]="form.sellingPrice"/></div>
          <div class="form-group"><label>MRP</label><input class="form-control" type="number" [(ngModel)]="form.mrp"/></div>
          <div class="form-group"><label>GST %</label><input class="form-control" type="number" [(ngModel)]="form.taxPercent"/></div>
          <div class="form-group"><label>Reorder Level</label><input class="form-control" type="number" [(ngModel)]="form.reorderLevel"/></div>
          <div class="form-group flex items-center gap-2">
            <label for="neg" style="margin-top: 35px;">
              <input type="checkbox" id="neg" [(ngModel)]="form.allowNegativeStock"/>
              Allow negative stock</label>
          </div>
          <div class="form-group"><label>Manufacture Date</label><input class="form-control" type="date" [(ngModel)]="form.manufactureDate"/></div>
          <div class="form-group"><label>Expiry Date</label><input class="form-control" type="date" [(ngModel)]="form.expiryDate"/></div>
          <div class="form-group" style="grid-column: 1 / -1;"><label>Description</label><textarea class="form-control" rows="2" [(ngModel)]="form.description"></textarea></div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" (click)="showModal = false">Cancel</button>
          <button class="btn btn-primary" (click)="save()" [disabled]="saving">
            <span *ngIf="saving" class="spinner"></span> Save
          </button>
        </div>
      </div>
    </div>

    <!-- Simple Barcode Print Modal -->
    <div class="modal-overlay" *ngIf="showBarcodeModal" (click)="showBarcodeModal = false">
      <div class="modal barcode-modal" (click)="$event.stopPropagation()" style="width: min(440px, calc(100vw - 32px))">
        <div class="modal-header">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 1.25rem;">🏷️</span>
            <h3 style="margin:0; font-size: 1.1rem; font-weight: 700;">Print Barcode Labels</h3>
          </div>
          <button class="btn btn-ghost btn-icon" (click)="showBarcodeModal = false">✕</button>
        </div>

        <div class="modal-body" style="padding: 20px; display: flex; flex-direction: column; gap: 16px;">
          <!-- Product Info -->
          <div style="background: var(--color-bg-elevated); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 12px 16px;">
            <div style="font-weight: 700; font-size: 1rem;">{{ barcodeProduct?.name }}</div>
            <div style="font-size: 0.825rem; color: var(--color-text-muted); display: flex; flex-wrap: wrap; gap: 14px; margin-top: 4px;">
              <span>SKU: <strong>{{ barcodeProduct?.sku }}</strong></span>
              <span>Barcode: <strong>{{ barcodeProduct?.barcode }}</strong></span>
              <span>MRP: <strong>₹{{ barcodeProduct?.mrp || barcodeProduct?.sellingPrice }}</strong></span>
            </div>
            <div *ngIf="barcodePreviewImg" style="margin-top: 8px; text-align: center;">
              <img [src]="barcodePreviewImg" style="max-height: 36px; max-width: 80%; object-fit: contain;" />
            </div>
          </div>

          <!-- Quantity -->
          <div class="form-group">
            <label style="font-weight: 600; font-size: 0.875rem; margin-bottom: 6px; display: block;">Number of Labels</label>
            <div style="display: flex; align-items: center; gap: 10px;">
              <input class="form-control" type="number" min="1" max="500" [(ngModel)]="barcodeQuantity" style="width: 100px; font-weight: 600; text-align: center;" />
              <div style="display: flex; gap: 6px;">
                <button class="btn btn-ghost btn-sm" (click)="barcodeQuantity = 2">2</button>
                <button class="btn btn-ghost btn-sm" (click)="barcodeQuantity = 10">10</button>
                <button class="btn btn-ghost btn-sm" (click)="barcodeQuantity = 50">50</button>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer" style="padding: 14px 20px; border-top: 1px solid var(--color-border); display: flex; justify-content: flex-end; gap: 10px;">
          <button class="btn btn-ghost" (click)="showBarcodeModal = false">Cancel</button>
          <button class="btn btn-primary" (click)="executePrintBarcode()" [disabled]="printingBarcode">
            <span *ngIf="printingBarcode" class="spinner"></span> 🖨️ Print {{ barcodeQuantity }} Label(s)
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .product-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 16px; }
    .product-card {
      background: var(--color-bg-card); border: 1px solid var(--color-border);
      border-radius: var(--radius-lg); padding: 20px;
      transition: all var(--transition-base); display: flex; flex-direction: column; gap: 8px;
      &:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); border-color: var(--color-primary); }
    }
    .pc-header { display: flex; justify-content: space-between; align-items: center; }
    .pc-badge { font-size: 0.7rem; font-weight: 600; padding: 2px 8px; background: var(--color-primary-bg); color: var(--color-primary-light); border-radius: var(--radius-full); }
    .stock-indicator { font-size: 0.75rem; font-weight: 600;
      &.ok { color: var(--color-success); }
      &.low { color: var(--color-warning); }
      &.out { color: var(--color-error); }
    }
    .pc-name { font-size: 0.9375rem; font-weight: 600; }
    .pc-prices { display: flex; gap: 12px; padding: 8px 0; }
    .stock-bar-bg { height: 4px; background: var(--color-bg-elevated); border-radius: 2px; overflow: hidden; }
    .stock-bar { height: 100%; border-radius: 2px; transition: width 0.5s; }
    .pc-actions { display: flex; gap: 8px; margin-top: 4px; }
    .skeleton-card { min-height: 180px; }
  `]
})
export class ProductListComponent implements OnInit {
  products: ProductDto[] = [];
  filtered: ProductDto[] = [];
  categories: CategoryDto[] = [];
  suppliers: SupplierDto[] = [];
  loading = true;
  search = '';
  catFilter = '';
  lowStockOnly = false;
  showModal = false;
  editId: number | null = null;
  saving = false;
  form: any = this.defaultForm();
  
  currentPage = 1;
  pageSize = 20;
  totalPages = 1;
  totalItems = 0;

  // Barcode Printing State
  showBarcodeModal = false;
  barcodeProduct: ProductDto | null = null;
  barcodeQuantity = 2;
  barcodePreviewImg = '';
  printingBarcode = false;

  constructor(
    private productService: ProductService,
    private categoryService: CategoryService,
    private supplierService: SupplierService,
    private toast: ToastService,
    public settingsService: SettingsService
  ) {}

  ngOnInit(): void {
    this.load();
    this.settingsService.load().subscribe();
    this.categoryService.getAll().subscribe(r => {
      if (r.success && r.data) this.categories = r.data;
    });
    this.supplierService.getAll().subscribe(r => {
      if (r.success && r.data) this.suppliers = r.data;
    });
  }

  async printBarcode(p: ProductDto): Promise<void> {
    if (!p.barcode) {
      this.toast.error('This product does not have a barcode. Please edit and add one first.');
      return;
    }

    this.barcodeProduct = p;
    this.barcodeQuantity = 2; // Default to 2 labels (1 row of 2-up)
    this.barcodePreviewImg = '';

    const apiUrl = `${environment.apiUrl}/products/barcode-image/${encodeURIComponent(p.barcode)}`;
    try {
      const res = await fetch(apiUrl);
      if (res.ok) {
        const blob = await res.blob();
        this.barcodePreviewImg = await new Promise<string>((rs, rj) => {
          const r = new FileReader();
          r.onload = () => rs(r.result as string);
          r.onerror = rj;
          r.readAsDataURL(blob);
        });
      }
    } catch {}

    this.showBarcodeModal = true;
  }

  getFormattedMfgExp(p: ProductDto | null): string {
    if (!p) return '';
    const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : '';
    const mfg = fmtDate((p as any).manufactureDate);
    const exp = fmtDate((p as any).expiryDate);
    if (!mfg && !exp) return '';
    return `${mfg ? 'MFG:' + mfg : ''}${mfg && exp ? ' | ' : ''}${exp ? 'EXP:' + exp : ''}`;
  }

  async executePrintBarcode(): Promise<void> {
    if (!this.barcodeProduct || !this.barcodePreviewImg) {
      this.toast.error('Barcode preview image not ready');
      return;
    }

    this.printingBarcode = true;
    const p = this.barcodeProduct;
    const price = p.mrp || p.sellingPrice;
    const mfgExpText = this.getFormattedMfgExp(p);

    // TVS LP 46 NEO: Force landscape so Chrome rotates the "2 x 4" paper
    // to ~4" wide × 2" tall, matching the 102mm roll width.
    // Simple horizontal layout: 2 labels side by side, NO rotation.

    const singleLabelHtml = `
      <div class="lbl">
        <div class="store">${this.settingsService.storeName}</div>
        <div class="name">${p.name}</div>
        ${price ? `<div class="price">MRP: &#8377;${price}</div>` : ''}
        <img src="${this.barcodePreviewImg}"/>
        ${p.sku ? `<div class="sku">${p.sku}</div>` : ''}
        ${mfgExpText ? `<div class="dates">${mfgExpText}</div>` : ''}
      </div>
    `;

    const totalQty = Math.max(1, this.barcodeQuantity);
    const rowCount = Math.ceil(totalQty / 2);
    let sheetsHtml = '';

    let itemsPrinted = 0;
    for (let r = 0; r < rowCount; r++) {
      let rowLabels = '';
      for (let c = 0; c < 2; c++) {
        if (itemsPrinted < totalQty) {
          rowLabels += singleLabelHtml;
          itemsPrinted++;
        } else {
          rowLabels += `<div class="lbl" style="visibility:hidden"></div>`;
        }
      }
      sheetsHtml += `<div class="sheet">${rowLabels}</div>`;
    }

    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0';
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow!.document;
    doc.open();
    doc.write(`<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
@page {
  size: 102mm 25mm;
  margin: 0;
}
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body {
  margin: 0;
  padding: 0;
  background: white;
  font-family: Arial, Helvetica, sans-serif;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.sheet {
  width: 100%;
  height: 25mm;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 0 1mm;
  box-sizing: border-box;
  page-break-after: always;
  break-after: page;
  overflow: hidden;
}
.lbl {
  width: 48%;
  height: 24mm;
  padding: 0.5mm 1mm;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  overflow: hidden;
  box-sizing: border-box;
}
.store {
  font-size: 7pt;
  font-weight: bold;
  letter-spacing: 0.2px;
  line-height: 1.1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  margin-bottom: 0.3mm;
}
.name {
  font-size: 8pt;
  font-weight: bold;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  line-height: 1.1;
}
.price {
  font-size: 7.5pt;
  font-weight: bold;
  white-space: nowrap;
  margin: 0.3mm 0;
}
.sku {
  font-size: 6pt;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}
.dates {
  font-size: 5.5pt;
  color: #333;
  white-space: nowrap;
}
img {
  max-height: 10mm;
  max-width: 90%;
  object-fit: contain;
  margin: 0.3mm auto;
  display: block;
}
</style></head>
<body>
${sheetsHtml}
</body></html>`);
    doc.close();

    setTimeout(() => {
      this.printingBarcode = false;
      this.showBarcodeModal = false;
      iframe.contentWindow!.print();
      setTimeout(() => document.body.removeChild(iframe), 1500);
      this.toast.success(`Printing ${totalQty} barcode label(s)`);
    }, 400);
  }

  getStockClass(p: ProductDto): string {
    const stock = p.currentStock || 0;
    const reorder = p.reorderLevel || 0;
    if (stock <= 0) return 'out';
    if (stock <= reorder) return 'low';
    return 'ok';
  }

  getStockPct(p: ProductDto): number {
    const stock = p.currentStock || 0;
    const reorder = p.reorderLevel || 5;
    const max = reorder > 0 ? reorder * 3 : 15;
    return Math.min(100, Math.max(0, Math.round((stock / max) * 100)));
  }

  getStockColor(p: ProductDto): string {
    const stock = p.currentStock || 0;
    const reorder = p.reorderLevel || 0;
    if (stock <= 0) return 'var(--color-error)';
    if (stock <= reorder) return 'var(--color-warning)';
    return 'var(--color-success)';
  }

  private defaultForm(): CreateProductRequest {
    return {
      name: '',
      sku: '',
      barcode: '',
      categoryId: this.categories.length > 0 ? this.categories[0].id : 0,
      unit: 'pcs',
      purchasePrice: 0,
      sellingPrice: 0,
      taxPercent: 0,
      reorderLevel: 5,
      supplierId: undefined,
      description: '',
      allowNegativeStock: false,
      manufactureDate: undefined,
      expiryDate: undefined
    };
  }

  load(): void {
    this.loading = true;
    this.productService.getAll().subscribe({
      next: (res: any) => {
        let items: ProductDto[] = [];
        if (Array.isArray(res)) {
          items = res;
        } else if (res?.data?.items && Array.isArray(res.data.items)) {
          items = res.data.items;
          this.totalItems = res.data.totalCount ?? items.length;
          this.totalPages = res.data.totalPages ?? Math.ceil(this.totalItems / this.pageSize);
        } else if (res?.data && Array.isArray(res.data)) {
          items = res.data;
        } else if (res?.Data?.items && Array.isArray(res.Data.items)) {
          items = res.Data.items;
          this.totalItems = res.Data.totalCount ?? items.length;
          this.totalPages = res.Data.totalPages ?? Math.ceil(this.totalItems / this.pageSize);
        } else if (res?.Data && Array.isArray(res.Data)) {
          items = res.Data;
        }
        this.products = items;
        this.filter();
        this.loading = false;
      },
      error: () => {
        this.products = [];
        this.filter();
        this.toast.error('Failed to load products');
        this.loading = false;
      }
    });
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.filter();
  }

  filter(): void {
    const list = Array.isArray(this.products) ? this.products : [];
    let result = [...list];
    if (this.search) {
      const s = this.search.toLowerCase();
      result = result.filter(p => (p.name && p.name.toLowerCase().includes(s)) || (p.sku && p.sku.toLowerCase().includes(s)));
    }
    if (this.catFilter) {
      result = result.filter(p => p.categoryId === +this.catFilter);
    }
    if (this.lowStockOnly) {
      result = result.filter(p => (p.currentStock || 0) <= (p.reorderLevel || 0));
    }
    this.totalItems = result.length;
    this.totalPages = Math.ceil(this.totalItems / this.pageSize) || 1;
    const start = (this.currentPage - 1) * this.pageSize;
    this.filtered = result.slice(start, start + this.pageSize);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.filter();
    }
  }

  openModal(p?: ProductDto): void {
    if (p) {
      this.editId = p.id;
      this.form = { ...p };
    } else {
      this.editId = null;
      this.form = this.defaultForm();
    }
    this.showModal = true;
  }

  save(): void {
    if (!this.form.name || !this.form.sku) {
      this.toast.error('Name and SKU are required');
      return;
    }
    this.saving = true;
    const req = { ...this.form };
    if (this.editId) {
      this.productService.update(this.editId, req).subscribe({
        next: (res) => {
          if (res.success) {
            this.toast.success('Product updated');
            this.showModal = false;
            this.load();
          }
          this.saving = false;
        },
        error: () => {
          this.toast.error('Failed to update product');
          this.saving = false;
        }
      });
    } else {
      this.productService.create(req).subscribe({
        next: (res) => {
          if (res.success) {
            this.toast.success('Product created');
            this.showModal = false;
            this.load();
          }
          this.saving = false;
        },
        error: () => {
          this.toast.error('Failed to create product');
          this.saving = false;
        }
      });
    }
  }

  deleteProduct(id: number): void {
    if (confirm('Are you sure you want to delete this product?')) {
      this.productService.delete(id).subscribe({
        next: (res) => {
          if (res.success) {
            this.toast.success('Product deleted');
            this.load();
          }
        },
        error: () => this.toast.error('Failed to delete product')
      });
    }
  }
}
