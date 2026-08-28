import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PurchaseService } from '../../core/services/purchase.service';
import { SupplierService } from '../../core/services/supplier.service';
import { ProductService } from '../../core/services/product.service';
import { PurchaseDto, SupplierDto, ProductDto, CreatePurchaseRequest } from '../../core/models/models';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { ToastService } from '../../core/services/toast.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-purchase-list',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent],
  template: `
    <app-header title="Purchases" subtitle="Record stock purchases from suppliers"></app-header>
    <div class="page">
      <div class="page-header">
        <div><h1>Purchases</h1><p class="page-subtitle">{{ purchases.length }} records</p></div>
        <button class="btn btn-primary" (click)="openModal()">+ New Purchase</button>
      </div>
      <div class="card" style="padding:0">
        <div class="table-wrapper">
          <table class="table" *ngIf="purchases.length > 0; else empty">
            <thead><tr><th>Date</th><th>Supplier</th><th>Invoice</th><th>Total</th><th class="text-right">Actions</th></tr></thead>
            <tbody>
              <tr *ngFor="let p of purchases">
                <td class="text-sm text-muted">{{ (!p.purchaseDate || p.purchaseDate.startsWith('0001')) ? '—' : (p.purchaseDate | date:'dd MMM yyyy') }}</td>
                <td class="font-semibold">{{ p.supplierName || '—' }}</td>
                <td class="text-muted text-sm">{{ p.invoiceReference || '—' }}</td>
                <td class="font-semibold text-success">₹{{ p.totalAmount | number:'1.2-2' }}</td>
                <td class="text-right">
                  <div class="flex items-center justify-end" style="gap: 4px;">
                    <button class="btn btn-ghost btn-sm text-primary font-medium" (click)="editPurchase(p)">Edit</button>
                    <button class="btn btn-sm" style="background-color: #fee2e2; color: #dc2626; border: none; font-weight: 500;" (click)="deletePurchase(p)">Del</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
    <ng-template #empty><div class="empty-state" style="padding:48px"><h3>No purchases yet</h3></div></ng-template>

    <!-- New Purchase Modal -->
    <div class="modal-overlay" *ngIf="showModal" (click)="showModal = false">
      <div class="modal" (click)="$event.stopPropagation()" style="width:min(680px,calc(100vw - 40px))">
        <div class="modal-header"><h3>{{ editingId ? 'Edit' : 'New' }} Purchase</h3><button class="btn btn-ghost btn-icon" (click)="showModal = false">✕</button></div>
        <div class="form-grid cols-2">
          <div class="form-group"><label>Supplier</label>
            <select class="form-control" [(ngModel)]="form.supplierId">
              <option [ngValue]="null">None</option>
              <option *ngFor="let s of suppliers" [ngValue]="s.id">{{ s.name }}</option>
            </select>
            <small *ngIf="suppliers.length === 0" class="text-muted" style="font-size: 0.75rem; color: var(--color-warning);">
              No suppliers added yet. You can add them in the Suppliers menu.
            </small>
          </div>
          <div class="form-group"><label>Date</label><input type="date" class="form-control" [(ngModel)]="form.purchaseDate"/></div>
          <div class="form-group"><label>Invoice Ref</label><input class="form-control" [(ngModel)]="form.invoiceReference" placeholder="Optional"/></div>
          <div class="form-group" style="grid-column:1/-1"><label>Notes</label><textarea class="form-control" rows="2" [(ngModel)]="form.notes"></textarea></div>
        </div>

        <div class="divider"></div>
        <div class="flex items-center justify-between mb-3">
          <h4>Items</h4>
          <button class="btn btn-ghost btn-sm" (click)="addItem()">+ Add Item</button>
        </div>
        <div *ngIf="form.items.length === 0" class="text-muted text-sm mb-3">Click "+ Add Item" to add products to this purchase.</div>
        <div *ngFor="let item of form.items; let i = index" class="purchase-item-row">
          <select class="form-control" [(ngModel)]="item.productId" style="flex:2">
            <option [ngValue]="null">Select product...</option>
            <option *ngFor="let p of products" [ngValue]="p.id">{{ p.name }} ({{ p.sku }})</option>
          </select>
          <div class="form-group" style="flex:1;margin:0"><input class="form-control" type="number" [(ngModel)]="item.quantity" placeholder="Qty" min="1"/></div>
          <div class="form-group" style="flex:1;margin:0"><input class="form-control" type="number" [(ngModel)]="item.unitPrice" placeholder="Cost"/></div>
          <button class="btn btn-danger btn-icon btn-sm" (click)="removeItem(i)">✕</button>
        </div>

        <div class="modal-footer">
          <button class="btn btn-ghost" (click)="showModal = false">Cancel</button>
          <button class="btn btn-primary" (click)="save()" [disabled]="saving"><span *ngIf="saving" class="spinner"></span>{{ editingId ? 'Update' : 'Record' }} Purchase</button>
        </div>
      </div>
    </div>
  `,
  styles: [`.purchase-item-row{display:flex;gap:8px;align-items:center;margin-bottom:8px}`]
})
export class PurchaseListComponent implements OnInit {
  purchases: PurchaseDto[] = [];
  suppliers: SupplierDto[] = [];
  products: ProductDto[] = [];
  showModal = false;
  saving = false;
  editingId: number | null = null;
  form: CreatePurchaseRequest & { items: any[] } = { supplierId: undefined, purchaseDate: new Date().toISOString().substring(0, 10), invoiceReference: '', notes: '', items: [] };

  constructor(
    private purchaseService: PurchaseService,
    private supplierService: SupplierService,
    private productService: ProductService,
    private toast: ToastService
  ) { }

  ngOnInit(): void {
    this.loadPurchases();
    this.loadSuppliers();
    this.loadProducts();
  }

  loadPurchases(): void {
    this.purchaseService.getAll().subscribe({
      next: (r: any) => {
        if (Array.isArray(r)) {
          this.purchases = r;
        } else if (r?.data?.items && Array.isArray(r.data.items)) {
          this.purchases = r.data.items;
        } else if (r?.data && Array.isArray(r.data)) {
          this.purchases = r.data;
        } else if (r?.Data?.items && Array.isArray(r.Data.items)) {
          this.purchases = r.Data.items;
        } else if (r?.Data && Array.isArray(r.Data)) {
          this.purchases = r.Data;
        }
      },
      error: (err) => console.error('Error loading purchases:', err)
    });
  }

  loadSuppliers(): void {
    this.supplierService.getAll().subscribe({
      next: (r: any) => {
        if (r.success && Array.isArray(r.data)) {
          this.suppliers = r.data;
          console.log(this.suppliers, 'ssss');
        }
      },
      error: (err) => {
        console.error('Error loading suppliers:', err);
      }
    });
  }

  loadProducts(): void {
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
        }
      },
      error: (err) => console.error('Error loading products:', err)
    });
  }

  openModal(): void {
    this.editingId = null;
    this.form = { supplierId: undefined, purchaseDate: new Date().toISOString().substring(0, 10), invoiceReference: '', notes: '', items: [] };
    this.loadSuppliers();
    this.loadProducts();
    this.showModal = true;
  }

  addItem(): void {
    this.form.items.push({ productId: null, quantity: 1, unitPrice: 0 });
  }

  removeItem(i: number): void {
    this.form.items.splice(i, 1);
  }

  save(): void {
    if (this.form.items.length === 0) {
      this.toast.error('Please add at least one item');
      return;
    }

    const hasInvalidItem = this.form.items.some(item => !item.productId || !item.quantity || item.quantity <= 0);
    if (hasInvalidItem) {
      this.toast.error('Please select a product and enter a valid quantity for all items');
      return;
    }

    const payload: CreatePurchaseRequest = {
      supplierId: this.form.supplierId ? Number(this.form.supplierId) : undefined,
      purchaseDate: this.form.purchaseDate || new Date().toISOString().substring(0, 10),
      invoiceReference: this.form.invoiceReference?.trim() || undefined,
      notes: this.form.notes?.trim() || undefined,
      items: this.form.items.map(item => ({
        productId: Number(item.productId),
        quantity: Number(item.quantity) || 1,
        unitPrice: Number(item.unitPrice) || 0,
        taxPercent: 0
      }))
    };

    this.saving = true;
    const requestPayload = this.editingId 
      ? this.purchaseService.update(this.editingId, payload) 
      : this.purchaseService.create(payload);

    requestPayload.subscribe({
      next: (r: any) => {
        // Assume success if no success flag exists but no error thrown
        if (r.success !== false) {
          this.toast.success(`Purchase ${this.editingId ? 'updated' : 'recorded'} successfully!`);
          this.showModal = false;
          this.loadPurchases();
        } else {
          this.toast.error(r.message || `Failed to ${this.editingId ? 'update' : 'record'} purchase`);
        }
        this.saving = false;
      },
      error: (err) => {
        console.error('Purchase save error:', err);
        this.toast.error(`Failed to ${this.editingId ? 'update' : 'record'} purchase`);
        this.saving = false;
      }
    });
  }

  editPurchase(p: PurchaseDto): void {
    this.editingId = p.id;
    this.purchaseService.getById(p.id).subscribe({
      next: (r: any) => {
        const data = r.data || r;
        
        // Fix for timezone issue: Get today's local date string for fallback
        const today = new Date();
        const localToday = new Date(today.getTime() - (today.getTimezoneOffset() * 60000)).toISOString().substring(0, 10);
        
        this.form = {
          supplierId: data.supplierId,
          purchaseDate: data.purchaseDate ? data.purchaseDate.substring(0, 10) : localToday,
          invoiceReference: data.invoiceReference || '',
          notes: data.notes || '',
          items: data.items ? data.items.map((i: any) => ({
            productId: i.productId,
            quantity: i.quantity,
            unitPrice: i.unitCost || i.unitPrice || 0,
            taxPercent: 0
          })) : []
        };
        this.loadSuppliers();
        this.loadProducts();
        this.showModal = true;
      },
      error: () => this.toast.error('Failed to load purchase details')
    });
  }

  deletePurchase(purchase: PurchaseDto): void {
    if (confirm('Are you sure you want to delete this purchase? This may affect stock ledgers.')) {
      this.purchaseService.delete(purchase.id).subscribe({
        next: (r: any) => {
          if (r?.success !== false) {
            this.toast.success('Purchase deleted successfully');
            this.loadPurchases();
          } else {
            this.toast.error(r?.message || 'Failed to delete purchase');
          }
        },
        error: () => this.toast.error('Failed to delete purchase')
      });
    }
  }
}

