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
          <p class="page-subtitle">{{ filtered.length }} of {{ products.length }} products</p>
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
          <input class="form-control" type="text" placeholder="Search by name or SKU..." [(ngModel)]="search" (input)="filter()"/>
        </div>
        <select class="form-control" style="width:180px" [(ngModel)]="catFilter" (change)="filter()">
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
            <div><div class="text-xs text-muted">Buy</div><div class="font-semibold">₹{{ p.purchasePrice }}</div></div>
            <div><div class="text-xs text-muted">Sell</div><div class="font-semibold text-primary">₹{{ p.sellingPrice }}</div></div>
            <div><div class="text-xs text-muted">GST</div><div class="font-semibold">{{ p.taxPercent }}%</div></div>
          </div>
          <div class="stock-bar-bg">
            <div class="stock-bar" [style.width.%]="getStockPct(p)" [style.background]="getStockColor(p)"></div>
          </div>
          <div class="pc-actions">
            <button class="btn btn-ghost btn-sm" (click)="openModal(p)">Edit</button>
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
          <div class="form-group"><label>Purchase Price (₹) *</label><input class="form-control" type="number" [(ngModel)]="form.purchasePrice"/></div>
          <div class="form-group"><label>Selling Price (₹) *</label><input class="form-control" type="number" [(ngModel)]="form.sellingPrice"/></div>
          <div class="form-group"><label>GST %</label><input class="form-control" type="number" [(ngModel)]="form.taxPercent"/></div>
          <div class="form-group"><label>Reorder Level</label><input class="form-control" type="number" [(ngModel)]="form.reorderLevel"/></div>
          <div class="form-group" style="grid-column: 1 / -1;"><label>Description</label><textarea class="form-control" rows="2" [(ngModel)]="form.description"></textarea></div>
          <div class="form-group flex items-center gap-2">
            <input type="checkbox" id="neg" [(ngModel)]="form.allowNegativeStock"/>
            <label for="neg" style="margin:0">Allow negative stock</label>
          </div>
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

  constructor(
    private productService: ProductService,
    private categoryService: CategoryService,
    private supplierService: SupplierService,
    private toast: ToastService
  ) { }

  ngOnInit(): void {
    this.load();
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

    this.productService.getAll().subscribe({
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
      description: this.form.description?.toString().trim() || undefined,
      allowNegativeStock: !!this.form.allowNegativeStock
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
      allowNegativeStock: false
    };
  }
}
