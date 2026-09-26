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

    <!-- Add/Edit Modal -->
    <div class="modal-overlay" *ngIf="showModal" (click)="showModal = false">
      <div class="modal" (click)="$event.stopPropagation()" style="width: min(640px, calc(100vw - 40px))">
        <div class="modal-header">
          <h3>{{ editId ? 'Edit' : 'Add' }} Product</h3>
          <button class="btn btn-ghost btn-icon" (click)="showModal = false">âœ•</button>
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

  constructor(
    private productService: ProductService,
    private categoryService: CategoryService,
    private supplierService: SupplierService,
    private toast: ToastService,
    public settingsService: SettingsService
  ) { }

  ngOnInit(): void {
    this.load();
    this.settingsService.load().subscribe();
    this.categoryService.getAll().subscribe(r => {
      if (r.success) {
        this.categories = r.data!;
        if (!this.editId && this.form.categoryId === 0 && this.categories.length > 0) {
          this.form.categoryId = this.categories[0].id;
        }
      }
    });
    this.supplierService.getAll().subscribe(r => { if (r.success) this.suppliers = r.data!; });
  }

  load(): void {
    this.loading = true;

    const catId = this.catFilter ? Number(this.catFilter) : undefined;
    this.productService.getAll(this.currentPage, this.pageSize, this.search, catId).subscribe({
      next: (r: any) => {
        const data = r?.data || r?.Data;
        if (data && (Array.isArray(data.items) || Array.isArray(data.Items))) {
          const items = data.items || data.Items || [];
          this.products = items;
          this.totalItems = data.totalCount ?? data.TotalCount ?? data.totalItems ?? items.length;
          this.totalPages = data.totalPages ?? data.TotalPages ?? 1;
          this.currentPage = data.page ?? data.Page ?? 1;
        } else if (Array.isArray(r)) {
          this.products = r;
          this.totalItems = r.length;
          this.totalPages = 1;
        } else if (data && Array.isArray(data)) {
          this.products = data;
          this.totalItems = data.length;
          this.totalPages = 1;
        } else {
          this.products = [];
          this.totalItems = 0;
          this.totalPages = 1;
        }
        this.filter();
        this.loading = false;
      },

      error: (err) => {
        console.error('API Error:', err);
        this.products = [];
        this.filtered = [];
        this.loading = false;
      }
    });
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.load();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.load();
    }
  }

  filter(): void {
    let list = this.products || [];
    if (this.search) {
      const q = this.search.toLowerCase().trim();
      list = list.filter(p =>
        (p.name ? p.name.toLowerCase() : '').includes(q) ||
        (p.sku ? p.sku.toLowerCase() : '').includes(q) ||
        (p.barcode ? p.barcode.toLowerCase() : '').includes(q)
      );
    }
    if (this.catFilter) {
      list = list.filter(p => p.categoryId === Number(this.catFilter));
    }
    if (this.lowStockOnly) {
      list = list.filter(p => (p.currentStock || 0) <= (p.reorderLevel || 0));
    }
    this.filtered = list;
  }

  openModal(p?: ProductDto): void {
    this.editId = p?.id ?? null;
    this.form = p ? { ...p } : this.defaultForm();
    if (!this.editId && this.categories.length > 0 && (!this.form.categoryId || this.form.categoryId === 0)) {
      this.form.categoryId = this.categories[0].id;
    }
    this.showModal = true;
  }

  save(): void {
    if (!this.form.name || !this.form.name.toString().trim()) {
      this.toast.error('Product name is required');
      return;
    }
    if (!this.form.sku || !this.form.sku.toString().trim()) {
      this.toast.error('SKU is required');
      return;
    }
    const catId = Number(this.form.categoryId);
    if (!catId || catId <= 0) {
      this.toast.error('Please select a Category. (Create a category first if none exists)');
      return;
    }

    const payload: CreateProductRequest = {
      name: this.form.name.toString().trim(),
      sku: this.form.sku.toString().trim(),
      barcode: this.form.barcode?.toString().trim() || undefined,
      unit: this.form.unit?.toString().trim() || 'pcs',
      categoryId: catId,
      supplierId: this.form.supplierId && this.form.supplierId !== 'null' && Number(this.form.supplierId) > 0
        ? Number(this.form.supplierId)
        : undefined,
      purchasePrice: Number(this.form.purchasePrice) || 0,
      sellingPrice: Number(this.form.sellingPrice) || 0,
      taxPercent: Number(this.form.taxPercent) || 0,
      reorderLevel: Number(this.form.reorderLevel) || 0,
      mrp: Number(this.form.mrp) || 0,
      description: this.form.description?.toString().trim() || undefined,
      allowNegativeStock: !!this.form.allowNegativeStock,
      manufactureDate: this.form.manufactureDate || undefined,
      expiryDate: this.form.expiryDate || undefined
    };

    this.saving = true;
    const obs = this.editId
      ? this.productService.update(this.editId, payload)
      : this.productService.create(payload);
    obs.subscribe({
      next: r => {
        if (r.success) {
          this.toast.success(this.editId ? 'Product updated!' : 'Product added!');
          this.showModal = false;
          this.load();
        } else {
          this.toast.error(r.message || 'Failed to save product');
        }
        this.saving = false;
      },
      error: () => {
        this.saving = false;
      }
    });
  }

  deleteProduct(id: number): void {
    if (!confirm('Delete this product?')) return;
    this.productService.delete(id).subscribe(r => {
      if (r.success) { this.toast.success('Deleted!'); this.load(); }
    });
  }

  getStockClass(p: ProductDto): string {
    const stock = p.currentStock || 0;
    const reorder = p.reorderLevel || 0;
    if (stock <= 0) return 'out';
    if (stock <= reorder) return 'low';
    return 'ok';
  }

  printBarcode(p: ProductDto): void {
    if (!p.barcode) {
      this.toast.error('This product does not have a barcode. Please edit and add one first.');
      return;
    }
    this.doPrintBarcode(p);
  }

  private async doPrintBarcode(p: ProductDto): Promise<void> {
    const apiUrl = `${environment.apiUrl}/products/barcode-image/${encodeURIComponent(p.barcode!)}`;
    let imgSrc = '';
    try {
      const res = await fetch(apiUrl);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const blob = await res.blob();
      imgSrc = await new Promise<string>((rs, rj) => {
        const r = new FileReader();
        r.onload = () => rs(r.result as string);
        r.onerror = rj;
        r.readAsDataURL(blob);
      });
    } catch {
      this.toast.error('Could not load barcode image. Is the backend running?');
      return;
    }
    const price = p.mrp || p.sellingPrice;
    const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : '';
    const mfg = fmtDate((p as any).manufactureDate);
    const exp = fmtDate((p as any).expiryDate);
    const mfgExp = (mfg || exp) ? `<div class="dates">${mfg ? 'MFG: ' + mfg : ''}${mfg && exp ? ' | ' : ''}${exp ? 'EXP: ' + exp : ''}</div>` : '';
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0';
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow!.document;
    doc.open();
    doc.write(`<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
@page {
  size: 76mm 25mm;
  margin: 0;
}
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body {
  width: 76mm;
  height: 25mm;
  background: white;
  font-family: Arial, Helvetica, sans-serif;
  -webkit-print-color-adjust: exact;
}
.sheet {
  width: 76mm;
  height: 25mm;
  display: flex;
  flex-direction: row;
}
.lbl {
  width: 38mm;
  height: 25mm;
  padding: 1.5mm 2mm;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  overflow: hidden;
}
.store { font-size: 6px; font-weight: bold; letter-spacing: 0.3px; line-height: 1.1; margin-bottom: 0.5mm; }
.name { font-size: 7.5px; font-weight: bold; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 34mm; line-height: 1.2; }
.price { font-size: 7px; font-weight: bold; margin: 0.3mm 0; }
.sku { font-size: 5.5px; color: #555; }
.dates { font-size: 5.5px; color: #333; display: flex; gap: 4px; justify-content: center; }
img { max-height: 10mm; max-width: 34mm; margin: 0.3mm 0; }
</style></head>
<body>
<div class="sheet">
  <div class="lbl">
    <div class="store">${this.settingsService.storeName}</div>
    <div class="name">${p.name}</div>
    ${price ? '<div class="price">MRP: &#8377;' + price + '</div>' : ''}
    <img src="${imgSrc}"/>
    <div class="sku">${p.sku || ''}</div>
    ${mfgExp}
  </div>
  <div class="lbl">
    <div class="store">${this.settingsService.storeName}</div>
    <div class="name">${p.name}</div>
    ${price ? '<div class="price">MRP: &#8377;' + price + '</div>' : ''}
    <img src="${imgSrc}"/>
    <div class="sku">${p.sku || ''}</div>
    ${mfgExp}
  </div>
</div>
</body></html>`);
    doc.close();
    setTimeout(() => {
      iframe.contentWindow!.print();
      setTimeout(() => document.body.removeChild(iframe), 1000);
    }, 500);
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
}
