import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CustomerService } from '../../core/services/customer.service';
import { CustomerDto, CreateCustomerRequest } from '../../core/models/models';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-customer-list',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent],
  template: `
    <app-header title="Customers" subtitle="Manage customer accounts"></app-header>
    <div class="page">
      <div class="page-header">
        <div><h1>Customers</h1><p class="page-subtitle">{{ total }} customers</p></div>
        <button class="btn btn-primary" (click)="openModal()">+ Add Customer</button>
      </div>
      <div class="filters-row">
        <div class="search-bar" style="flex:1;max-width:320px">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input class="form-control" placeholder="Search customers..." [(ngModel)]="search" (input)="load()"/>
        </div>
      </div>
      <div class="card" style="padding:0">
        <div class="table-wrapper" *ngIf="!loading">
          <table class="table" *ngIf="customers.length > 0; else empty">
            <thead><tr><th>Name</th><th>Phone</th><th>Email</th><th>GST</th><th>Credit Balance</th><th></th></tr></thead>
            <tbody>
              <tr *ngFor="let c of customers">
                <td class="font-semibold">{{ c.name }}</td>
                <td class="text-muted text-sm">{{ c.phone || '—' }}</td>
                <td class="text-muted text-sm">{{ c.email || '—' }}</td>
                <td class="text-muted text-sm">{{ c.gstNumber || '—' }}</td>
                <td [class.text-success]="c.creditBalance > 0">₹{{ c.creditBalance | number:'1.2-2' }}</td>
                <td>
                  <div style="display:flex;gap:4px">
                    <button class="btn btn-ghost btn-sm" (click)="openModal(c)">Edit</button>
                    <button class="btn btn-danger btn-sm" (click)="del(c.id)">Delete</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="pagination" *ngIf="totalPages > 1">
          <button class="btn btn-ghost btn-sm" [disabled]="page <= 1" (click)="changePage(page-1)">← Prev</button>
          <span class="text-sm text-muted">Page {{ page }} of {{ totalPages }}</span>
          <button class="btn btn-ghost btn-sm" [disabled]="page >= totalPages" (click)="changePage(page+1)">Next →</button>
        </div>
      </div>
    </div>
    <ng-template #empty><div class="empty-state"><h3>No customers found</h3></div></ng-template>

    <!-- Modal -->
    <div class="modal-overlay" *ngIf="showModal" (click)="showModal = false">
      <div class="modal" (click)="$event.stopPropagation()">
        <div class="modal-header"><h3>{{ editId ? 'Edit' : 'Add' }} Customer</h3><button class="btn btn-ghost btn-icon" (click)="showModal = false">✕</button></div>
        <div class="form-grid cols-2">
          <div class="form-group" style="grid-column:1/-1"><label>Name *</label><input class="form-control" [(ngModel)]="form.name" placeholder="Customer name"/></div>
          <div class="form-group"><label>Phone</label><input class="form-control" [(ngModel)]="form.phone" placeholder="+91 9999..."/></div>
          <div class="form-group"><label>Email</label><input class="form-control" [(ngModel)]="form.email" placeholder="email@..."/></div>
          <div class="form-group" style="grid-column:1/-1"><label>Address</label><textarea class="form-control" rows="2" [(ngModel)]="form.address"></textarea></div>
          <div class="form-group"><label>GST Number</label><input class="form-control" [(ngModel)]="form.gstNumber"/></div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" (click)="showModal = false">Cancel</button>
          <button class="btn btn-primary" (click)="save()" [disabled]="saving"><span *ngIf="saving" class="spinner"></span>Save</button>
        </div>
      </div>
    </div>
  `,
  styles: [`.pagination{display:flex;align-items:center;justify-content:center;gap:12px;padding:16px;border-top:1px solid var(--color-border)}`]
})
export class CustomerListComponent implements OnInit {
  customers: CustomerDto[] = []; total = 0; totalPages = 1; page = 1;
  search = ''; loading = true; showModal = false; editId: number | null = null;
  saving = false; form: any = {};

  constructor(private customerService: CustomerService, private toast: ToastService) {}
  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.customerService.getAll(this.page, 20, this.search || undefined).subscribe({
      next: r => { if (r.success && r.data) { this.customers = r.data.items; this.total = r.data.totalCount; this.totalPages = r.data.totalPages; } this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  changePage(p: number): void { this.page = p; this.load(); }

  openModal(c?: CustomerDto): void {
    this.editId = c?.id ?? null;
    this.form = c ? { ...c } : { name: '', phone: '', email: '', address: '', gstNumber: '' };
    this.showModal = true;
  }

  save(): void {
    this.saving = true;
    const obs = this.editId ? this.customerService.update(this.editId, this.form) : this.customerService.create(this.form);
    obs.subscribe({ next: r => { if (r.success) { this.toast.success('Saved!'); this.showModal = false; this.load(); } this.saving = false; }, error: () => { this.saving = false; } });
  }

  del(id: number): void {
    if (!confirm('Delete this customer?')) return;
    this.customerService.delete(id).subscribe(r => { if (r.success) { this.toast.success('Deleted!'); this.load(); } });
  }
}
