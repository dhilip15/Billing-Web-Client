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
            <thead><tr><th>Date</th><th>Supplier</th><th>Invoice</th><th>Items</th><th>Total</th><th>Created By</th></tr></thead>
            <tbody>
              <tr *ngFor="let p of purchases">
                <td class="text-sm text-muted">{{ p.purchaseDate | date:'dd MMM yyyy' }}</td>
                <td class="font-semibold">{{ p.supplierName || '—' }}</td>
                <td class="text-muted text-sm">{{ p.invoiceNo || '—' }}</td>
                <td class="text-muted text-sm">{{ p.items.length }}</td>
                <td class="font-semibold text-success">₹{{ p.totalAmount | number:'1.2-2' }}</td>
                <td class="text-muted text-sm">{{ p.createdByName }}</td>
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
        <div class="modal-header"><h3>New Purchase</h3><button class="btn btn-ghost btn-icon" (click)="showModal = false">✕</button></div>
        <div class="form-grid cols-2">
          <div class="form-group"><label>Supplier</label>
            <select class="form-control" [(ngModel)]="form.supplierId">
              <option [value]="null">None</option>
              <option *ngFor="let s of suppliers" [value]="s.id">{{ s.name }}</option>
            </select>
          </div>
          <div class="form-group"><label>Invoice No</label><input class="form-control" [(ngModel)]="form.invoiceNo" placeholder="Optional"/></div>
          <div class="form-group" style="grid-column:1/-1"><label>Notes</label><textarea class="form-control" rows="2" [(ngModel)]="form.notes"></textarea></div>
        </div>

        <div class="divider"></div>
        <div class="flex items-center justify-between mb-3">
          <h4>Items</h4>
          <button class="btn btn-ghost btn-sm" (click)="addItem()">+ Add Item</button>
        </div>
        <div *ngFor="let item of form.items; let i = index" class="purchase-item-row">
          <select class="form-control" [(ngModel)]="item.productId" style="flex:2">
            <option [value]="null">Select product...</option>
            <option *ngFor="let p of products" [value]="p.id">{{ p.name }} ({{ p.sku }})</option>
          </select>
          <div class="form-group" style="flex:1;margin:0"><input class="form-control" type="number" [(ngModel)]="item.quantity" placeholder="Qty" min="1"/></div>
          <div class="form-group" style="flex:1;margin:0"><input class="form-control" type="number" [(ngModel)]="item.unitCost" placeholder="Cost"/></div>
          <button class="btn btn-danger btn-icon btn-sm" (click)="removeItem(i)">✕</button>
        </div>

        <div class="modal-footer">
          <button class="btn btn-ghost" (click)="showModal = false">Cancel</button>
          <button class="btn btn-primary" (click)="save()" [disabled]="saving"><span *ngIf="saving" class="spinner"></span>Record Purchase</button>
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
  form: CreatePurchaseRequest & { items: any[] } = { supplierId: undefined, invoiceNo: '', notes: '', items: [] };

  constructor(private purchaseService: PurchaseService, private supplierService: SupplierService, private productService: ProductService, private toast: ToastService) { }

  ngOnInit(): void {
    this.purchaseService.getAll().subscribe(r => { if (r.success) this.purchases = r.data!; });
    this.supplierService.getAll().subscribe(r => { if (r.success) this.suppliers = r.data!; });
    this.productService.getAll().subscribe((r: any) => { if (r.success) { this.products = r.data.items; } });
  }

  openModal(): void { this.form = { supplierId: undefined, invoiceNo: '', notes: '', items: [] }; this.showModal = true; }
  addItem(): void { this.form.items.push({ productId: null, quantity: 1, unitCost: 0 }); }
  removeItem(i: number): void { this.form.items.splice(i, 1); }

  save(): void {
    this.saving = true;
    this.purchaseService.create(this.form).subscribe({
      next: r => { if (r.success) { this.toast.success('Purchase recorded, stock updated!'); this.showModal = false; this.ngOnInit(); } this.saving = false; },
      error: () => { this.saving = false; }
    });
  }
}
