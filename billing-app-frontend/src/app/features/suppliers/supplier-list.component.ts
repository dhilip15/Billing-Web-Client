import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupplierService } from '../../core/services/supplier.service';
import { SupplierDto } from '../../core/models/models';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-supplier-list',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent],
  template: `
    <app-header title="Suppliers" subtitle="Manage your suppliers"></app-header>
    <div class="page">
      <div class="page-header">
        <div><h1>Suppliers</h1><p class="page-subtitle">{{ suppliers.length }} suppliers</p></div>
        <button class="btn btn-primary" (click)="openModal()">+ Add Supplier</button>
      </div>
      <div class="card" style="padding:0">
        <div class="table-wrapper">
          <table class="table" *ngIf="suppliers.length > 0; else empty">
            <thead><tr><th>Name</th><th>Phone</th><th>Email</th><th>GST</th><th>Address</th><th></th></tr></thead>
            <tbody>
              <tr *ngFor="let s of suppliers">
                <td class="font-semibold">{{ s.name }}</td>
                <td class="text-muted text-sm">{{ s.phone || '—' }}</td>
                <td class="text-muted text-sm">{{ s.email || '—' }}</td>
                <td class="text-muted text-sm">{{ s.gstNumber || '—' }}</td>
                <td class="text-muted text-sm">{{ s.address || '—' }}</td>
                <td><div style="display:flex;gap:4px">
                  <button class="btn btn-ghost btn-sm" (click)="openModal(s)">Edit</button>
                  <button class="btn btn-danger btn-sm" (click)="del(s.id)">Delete</button>
                </div></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
    <ng-template #empty><div class="empty-state"><h3>No suppliers yet</h3></div></ng-template>

    <div class="modal-overlay" *ngIf="showModal" (click)="showModal = false">
      <div class="modal" (click)="$event.stopPropagation()">
        <div class="modal-header"><h3>{{ editId ? 'Edit' : 'Add' }} Supplier</h3><button class="btn btn-ghost btn-icon" (click)="showModal = false">✕</button></div>
        <div class="form-grid cols-2">
          <div class="form-group" style="grid-column:1/-1"><label>Name *</label><input class="form-control" [(ngModel)]="form.name"/></div>
          <div class="form-group"><label>Phone</label><input class="form-control" [(ngModel)]="form.phone"/></div>
          <div class="form-group"><label>Email</label><input class="form-control" [(ngModel)]="form.email"/></div>
          <div class="form-group"><label>GST Number</label><input class="form-control" [(ngModel)]="form.gstNumber"/></div>
          <div class="form-group" style="grid-column:1/-1"><label>Address</label><textarea class="form-control" rows="2" [(ngModel)]="form.address"></textarea></div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" (click)="showModal = false">Cancel</button>
          <button class="btn btn-primary" (click)="save()" [disabled]="saving"><span *ngIf="saving" class="spinner"></span>Save</button>
        </div>
      </div>
    </div>
  `, styles: []
})
export class SupplierListComponent implements OnInit {
  suppliers: SupplierDto[] = []; loading = true; showModal = false; editId: number | null = null; saving = false; form: any = {};
  constructor(private supplierService: SupplierService, private toast: ToastService) {}
  ngOnInit(): void { this.load(); }
  load(): void {
    this.loading = true;
    this.supplierService.getAll().subscribe({
      next: (r: any) => {
        if (Array.isArray(r)) {
          this.suppliers = r;
        } else if (r?.data?.items && Array.isArray(r.data.items)) {
          this.suppliers = r.data.items;
        } else if (r?.data && Array.isArray(r.data)) {
          this.suppliers = r.data;
        } else if (r?.Data?.items && Array.isArray(r.Data.items)) {
          this.suppliers = r.Data.items;
        } else if (r?.Data && Array.isArray(r.Data)) {
          this.suppliers = r.Data;
        } else {
          this.suppliers = [];
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading suppliers:', err);
        this.suppliers = [];
        this.loading = false;
      }
    });
  }
  openModal(s?: SupplierDto): void { this.editId = s?.id ?? null; this.form = s ? { ...s } : { name: '', phone: '', email: '', address: '', gstNumber: '' }; this.showModal = true; }
  save(): void {
    if (!this.form.name?.trim()) {
      this.toast.error('Supplier name is required');
      return;
    }
    this.saving = true;
    const obs = this.editId ? this.supplierService.update(this.editId, this.form) : this.supplierService.create(this.form);
    obs.subscribe({ next: r => { if (r.success) { this.toast.success('Saved!'); this.showModal = false; this.load(); } else { this.toast.error(r.message || 'Failed to save'); } this.saving = false; }, error: () => { this.saving = false; } });
  }
  del(id: number): void { if (!confirm('Delete?')) return; this.supplierService.delete(id).subscribe(r => { if (r.success) { this.toast.success('Deleted!'); this.load(); } }); }
}

