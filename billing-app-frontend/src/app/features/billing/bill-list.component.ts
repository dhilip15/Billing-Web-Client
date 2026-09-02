import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BillingService } from '../../core/services/billing.service';
import { BillListDto, BillStatus, PagedResult } from '../../core/models/models';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-bill-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, HeaderComponent, StatusBadgeComponent],
  template: `
    <app-header title="Billing" subtitle="Manage invoices and sales"></app-header>

    <div class="page">
      <div class="page-header">
        <div>
          <h1>Bills</h1>
          <p class="page-subtitle">{{ result?.totalCount ?? bills.length }} total invoices</p>
        </div>
        <div class="page-actions">
          <a routerLink="/billing/new" class="btn btn-primary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            New Bill
          </a>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters-row">
        <select class="form-control" style="width:160px" [(ngModel)]="statusFilter" (change)="load()">
          <option value="">All Status</option>
          <option value="1">Draft</option>
          <option value="2">On Hold</option>
          <option value="3">Paid</option>
          <option value="4">Cancelled</option>
          <option value="5">Returned</option>
        </select>
        <input type="date" class="form-control" style="width:160px" [(ngModel)]="fromDate" (change)="load()">
        <input type="date" class="form-control" style="width:160px" [(ngModel)]="toDate" (change)="load()">
        <button class="btn btn-ghost btn-sm" (click)="clearFilters()">Clear</button>
      </div>

      <!-- Table -->
      <div class="card" style="padding: 0">
        <div class="table-wrapper" *ngIf="!loading; else skeletonTpl">
          <table class="table" *ngIf="bills.length > 0; else emptyTpl">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Tax</th>
                <th>Paid</th>
                <th>Balance Amt
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let bill of bills">
                <td class="font-semibold text-primary">#{{ bill.invoiceNo }}</td>
                <td class="text-muted text-sm">{{ bill.billDate | date:'dd MMM yyyy' }}</td>
                <td>{{ bill.customerName || 'Walk-in' }}</td>
                <td class="text-muted text-sm">{{ bill.itemCount }} item(s)</td>
                <td class="font-semibold">₹{{ bill.totalAmount | number:'1.2-2' }}</td>
                <td class="text-warning">₹{{ (bill.taxAmount || 0) | number:'1.2-2' }}</td>
                <td class="text-success">₹{{ bill.paidAmount | number:'1.2-2' }}</td>
                <td class="text-warning">₹{{ bill.balanceDue | number:'1.2-2' }}</td>
                <td><app-status-badge [status]="bill.status"></app-status-badge></td>
                <td>
                  <div class="row-actions">
                    <a [routerLink]="['/billing', bill.id]" class="btn btn-ghost btn-icon btn-sm" title="View">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    </a>
                    <a *ngIf="isRecallable(bill.status)"
                       [routerLink]="['/billing/new']" [queryParams]="{ recallId: bill.id }"
                       class="btn btn-secondary btn-icon btn-sm" title="Recall to POS">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
                    </a>
                    <button *ngIf="isDraft(bill.status)" class="btn btn-accent btn-icon btn-sm" (click)="finalize(bill.id)" title="Finalize">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="pagination" *ngIf="result && result.totalPages > 1">
          <button class="btn btn-ghost btn-sm" [disabled]="page <= 1" (click)="changePage(page - 1)">← Prev</button>
          <span class="page-info">Page {{ page }} of {{ result.totalPages }}</span>
          <button class="btn btn-ghost btn-sm" [disabled]="page >= result.totalPages" (click)="changePage(page + 1)">Next →</button>
        </div>
      </div>
    </div>

    <ng-template #emptyTpl>
      <div class="empty-state">
        <div class="empty-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/>
          </svg>
        </div>
        <h3>No bills found</h3>
        <p>Create your first bill to get started.</p>
      </div>
    </ng-template>

    <ng-template #skeletonTpl>
      <div style="padding: 20px; display: flex; flex-direction: column; gap: 12px;">
        <div *ngFor="let i of [1,2,3,4,5]" class="skeleton" style="height: 44px; border-radius: 8px;"></div>
      </div>
    </ng-template>
  `,
  styles: [`
    .row-actions { display: flex; gap: 4px; }
    .pagination { display: flex; align-items: center; justify-content: center; gap: 12px; padding: 16px; border-top: 1px solid var(--color-border); }
    .page-info { font-size: 0.875rem; color: var(--color-text-muted); }
  `]
})
export class BillListComponent implements OnInit {
  bills: BillListDto[] = [];
  result: PagedResult<BillListDto> | null = null;
  loading = true;
  page = 1;
  statusFilter = '';
  fromDate = '';
  toDate = '';
  readonly BillStatus = BillStatus;

  constructor(private billingService: BillingService, private toast: ToastService) { }

  ngOnInit(): void { this.load(); }

  isRecallable(status: any): boolean {
    const s = String(status).toLowerCase();
    return s === '1' || s === '2' || s === 'draft' || s === 'onhold';
  }

  isDraft(status: any): boolean {
    const s = String(status).toLowerCase();
    return s === '1' || s === 'draft';
  }

  load(): void {
    this.loading = true;
    this.billingService.getAll(this.page, 20, this.statusFilter || undefined,
      this.fromDate || undefined, this.toDate || undefined).subscribe({
        next: (res: any) => {
          const data = res?.data || res?.Data || res;
          if (data?.items && Array.isArray(data.items)) {
            this.result = data;
            this.bills = data.items;
          } else if (Array.isArray(data)) {
            this.bills = data;
            this.result = { items: data, totalCount: data.length, page: 1, pageSize: 20, totalPages: 1 };
          } else {
            this.bills = [];
          }
          this.loading = false;
        },
        error: (err) => {
          console.error('Error loading bills:', err);
          this.bills = [];
          this.loading = false;
        }
      });
  }

  changePage(p: number): void { this.page = p; this.load(); }
  clearFilters(): void { this.statusFilter = ''; this.fromDate = ''; this.toDate = ''; this.load(); }

  finalize(id: number): void {
    this.billingService.finalize(id).subscribe({
      next: (res: any) => {
        if (res.success !== false) {
          this.toast.success('Bill finalized successfully!');
          this.load();
        } else {
          this.toast.error(res.message || 'Failed to finalize');
        }
      },
      error: () => this.toast.error('Failed to finalize bill')
    });
  }
}
