import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { BillingService } from '../../core/services/billing.service';
import { BillDto, BillStatus } from '../../core/models/models';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { ToastService } from '../../core/services/toast.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-bill-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, HeaderComponent, StatusBadgeComponent],
  template: `
    <app-header [title]="bill ? '#' + bill.invoiceNo : 'Loading...'" subtitle="Bill Detail"></app-header>

    <div class="page" *ngIf="bill">
      <div class="page-header">
        <div class="flex items-center gap-3">
          <a routerLink="/billing" class="btn btn-ghost btn-sm">← Back</a>
          <app-status-badge [status]="bill.status"></app-status-badge>
        </div>
        <div class="page-actions">
          <button *ngIf="bill.status === BillStatus.Draft" class="btn btn-accent" (click)="finalize()">Finalize</button>
          <button *ngIf="bill.status === BillStatus.Draft" class="btn btn-secondary" (click)="hold()">Hold</button>
          <button *ngIf="bill.status !== BillStatus.Paid && bill.status !== BillStatus.Cancelled && bill.status !== BillStatus.Returned"
                  class="btn btn-danger" (click)="showCancelModal = true">Cancel</button>
          <button *ngIf="bill.status === BillStatus.Paid" class="btn btn-secondary" (click)="processReturn()">Process Return</button>
          <button class="btn btn-ghost" onclick="window.print()">🖨️ Print</button>
        </div>
      </div>

      <div class="detail-grid">
        <!-- Invoice info -->
        <div class="card">
          <h3 class="mb-4">Invoice Info</h3>
          <div class="info-grid">
            <div class="info-row"><span>Invoice #</span><strong>{{ bill.invoiceNo }}</strong></div>
            <div class="info-row"><span>Date</span><strong>{{ bill.billDate | date:'dd MMM yyyy, h:mm a' }}</strong></div>
            <div class="info-row"><span>Financial Year</span><strong>{{ bill.financialYear }}</strong></div>
            <div class="info-row"><span>Created By</span><strong>{{ bill.createdByName }}</strong></div>
          </div>
        </div>

        <!-- Customer info -->
        <div class="card">
          <h3 class="mb-4">Customer</h3>
          <div class="info-grid" *ngIf="bill.customerName; else walkIn">
            <div class="info-row"><span>Name</span><strong>{{ bill.customerName }}</strong></div>
          </div>
          <ng-template #walkIn><p class="text-muted">Walk-in Customer</p></ng-template>
        </div>
      </div>

      <!-- Items table -->
      <div class="card mt-4" style="padding: 0">
        <div style="padding: 20px 24px 0;"><h3>Items</h3></div>
        <div class="table-wrapper">
          <table class="table">
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Unit</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Tax %</th>
                <th>Tax Amt</th>
                <th>Discount</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of (bill.billItems || bill?.items || [])">
                <td class="font-medium">{{ item.productName }}</td>
                <td class="text-muted text-sm">{{ item.sku }}</td>
                <td class="text-muted text-sm">{{ item.unit }}</td>
                <td>{{ item.quantity }}</td>
                <td>₹{{ item.unitPrice | number:'1.2-2' }}</td>
                <td>{{ item.taxPercent }}%</td>
                <td>₹{{ item.taxAmount | number:'1.2-2' }}</td>
                <td>₹{{ item.discount | number:'1.2-2' }}</td>
                <td class="font-semibold">₹{{ item.total | number:'1.2-2' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Totals + Payments -->
      <div class="summary-grid mt-4">
        <div class="card">
          <h3 class="mb-4">Payments</h3>
          <div *ngFor="let pmt of (bill.payments || [])" class="info-row">
            <span>{{ getPaymentMode(pmt.mode) }}</span>
            <strong class="text-success">₹{{ pmt.amount | number:'1.2-2' }}</strong>
          </div>
          <div class="info-row" *ngIf="!bill.payments || bill.payments.length === 0"><p class="text-muted">No payments recorded</p></div>
        </div>
        <div class="card">
          <h3 class="mb-4">Totals</h3>
          <div class="info-row"><span>Sub Total</span><strong>₹{{ bill.subTotal | number:'1.2-2' }}</strong></div>
          <div class="info-row"><span>Tax</span><strong>₹{{ bill.taxAmount | number:'1.2-2' }}</strong></div>
          <div class="info-row"><span>Discount</span><strong>₹{{ bill.discountAmount | number:'1.2-2' }}</strong></div>
          <div class="divider"></div>
          <div class="info-row" style="font-size:1.1rem"><span>Total</span><strong class="text-primary">₹{{ bill.totalAmount | number:'1.2-2' }}</strong></div>
          <div class="info-row"><span>Paid</span><strong class="text-success">₹{{ bill.paidAmount | number:'1.2-2' }}</strong></div>
          <div class="info-row" *ngIf="bill.balanceDue > 0"><span>Balance Due</span><strong class="text-error">₹{{ bill.balanceDue | number:'1.2-2' }}</strong></div>
        </div>
      </div>

      <!-- Notes -->
      <div class="card mt-4" *ngIf="bill.notes">
        <h4>Notes</h4>
        <p class="mt-2">{{ bill.notes }}</p>
      </div>
    </div>

    <!-- Cancel Modal -->
    <div class="modal-overlay" *ngIf="showCancelModal" (click)="showCancelModal = false">
      <div class="modal" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>Cancel Bill</h3>
          <button class="btn btn-ghost btn-icon" (click)="showCancelModal = false">✕</button>
        </div>
        <div class="form-group">
          <label>Reason for cancellation</label>
          <textarea class="form-control" rows="3" [(ngModel)]="cancelReason" placeholder="Enter reason..."></textarea>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" (click)="showCancelModal = false">Cancel</button>
          <button class="btn btn-danger" (click)="cancelBill()" [disabled]="!cancelReason">Confirm Cancel</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; @media (max-width: 700px) { grid-template-columns: 1fr; } }
    .summary-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; @media (max-width: 700px) { grid-template-columns: 1fr; } }
    .info-grid { display: flex; flex-direction: column; gap: 4px; }
    .info-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid var(--color-border-light); font-size: 0.875rem; color: var(--color-text-secondary); &:last-child { border-bottom: none; } strong { color: var(--color-text); } }
  `]
})
export class BillDetailComponent implements OnInit {
  bill: BillDto | null = null;
  showCancelModal = false;
  cancelReason = '';
  readonly BillStatus = BillStatus;

  constructor(
    private route: ActivatedRoute,
    private billingService: BillingService,
    private toast: ToastService,
    private router: Router
  ) { }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.billingService.getById(id).subscribe({
      next: (r: any) => {
        const data = r?.data || r?.Data || r;
        if (data && (data.id || data.invoiceNo)) {
          this.bill = data;
        }
      },
      error: (err) => console.error('Error fetching bill detail:', err)
    });
  }

  finalize(): void {
    if (!this.bill) return;
    this.billingService.finalize(this.bill.id).subscribe({
      next: (r: any) => {
        const data = r?.data || r?.Data || r;
        if (r.success || data?.id) {
          this.toast.success('Finalized!');
          this.bill = data;
        } else {
          this.toast.error(r.message || 'Failed to finalize');
        }
      },
      error: () => this.toast.error('Failed to finalize bill')
    });
  }

  hold(): void {
    if (!this.bill) return;
    this.billingService.hold(this.bill.id).subscribe({
      next: (r: any) => {
        if (r.success !== false) {
          this.toast.info('Bill on hold.');
          this.router.navigate(['/billing']);
        }
      },
      error: () => this.toast.error('Failed to hold bill')
    });
  }

  cancelBill(): void {
    if (!this.bill || !this.cancelReason) return;
    this.billingService.cancel(this.bill.id, this.cancelReason).subscribe({
      next: (r: any) => {
        if (r.success !== false) {
          this.toast.success('Bill cancelled.');
          this.showCancelModal = false;
          this.router.navigate(['/billing']);
        }
      },
      error: () => this.toast.error('Failed to cancel bill')
    });
  }

  processReturn(): void {
    if (!this.bill) return;
    this.billingService.processReturn(this.bill.id).subscribe({
      next: (r: any) => {
        const data = r?.data || r?.Data || r;
        if (r.success !== false) {
          this.toast.success('Return processed!');
          if (data?.id) this.bill = data;
        }
      },
      error: () => this.toast.error('Failed to process return')
    });
  }

  getPaymentMode(mode: number): string {
    return ['', 'Cash', 'Card', 'UPI', 'Credit'][mode] ?? 'Unknown';
  }
}
