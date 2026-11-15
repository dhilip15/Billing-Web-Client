import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { BillingService } from '../../core/services/billing.service';
import { BillDto, BillStatus } from '../../core/models/models';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { ToastService } from '../../core/services/toast.service';
import { SettingsService } from '../../core/services/settings.service';
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
          <a *ngIf="isRecallable(bill.status)" [routerLink]="['/billing/new']" [queryParams]="{ recallId: bill.id }" class="btn btn-secondary">🛒 Recall to POS</a>
          <button *ngIf="bill.status === BillStatus.Draft" class="btn btn-accent" (click)="finalize()">Finalize</button>
          <button *ngIf="bill.status === BillStatus.Draft" class="btn btn-secondary" (click)="hold()">Hold</button>
          <button *ngIf="bill.status !== BillStatus.Paid && bill.status !== BillStatus.Cancelled && bill.status !== BillStatus.Returned"
                  class="btn btn-danger" (click)="showCancelModal = true">Cancel</button>
          <button *ngIf="bill.status === BillStatus.Paid" class="btn btn-secondary" (click)="processReturn()">Process Return</button>
          <button class="btn btn-primary print-btn" (click)="printBill()">🖨️ Print Bill</button>
        </div>
      </div>

      <div class="detail-grid">
        <!-- Invoice info -->
        <div class="card">
          <h3 class="mb-4">Invoice Info</h3>
          <div class="info-grid">
            <div class="info-row"><span>Invoice #</span><strong>{{ bill.invoiceNo }}</strong></div>
            <div class="info-row"><span>Date</span><strong>{{ bill.billDate | date:'dd MMM yyyy, h:mm a' }}</strong></div>
            <div class="info-row"><span>Created By</span><strong>{{ bill.createdBy }}</strong></div>
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
              <tr *ngFor="let item of ($any(bill).billItems || $any(bill).items || [])">
                <td class="font-medium">{{ item.productName }}</td>
                <td class="text-muted text-sm">{{ item.sku }}</td>
                <td class="text-muted text-sm">{{ item.unit }}</td>
                <td>{{ item.quantity }}</td>
                <td>₹{{ item.unitPrice | number:'1.2-2' }}</td>
                <td>{{ item.taxPercent }}%</td>
                <td>₹{{ item.taxAmount | number:'1.2-2' }}</td>
                <td>₹{{ item.discount | number:'1.2-2' }}</td>
                <td class="font-semibold">₹{{ calcItemTotal(item) | number:'1.2-2' }}</td>
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
            <span>{{ pmt.mode }}</span>
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

    <!-- THERMAL RECEIPT (Shown only during print) -->
    <div class="receipt-print" *ngIf="bill" id="thermal-receipt">

      <!-- Store Header -->
      <div class="rpt-store-name">{{ settingsService.storeName }}</div>
      <div class="rpt-store-addr" *ngIf="settingsService.settings?.address" style="white-space: pre-line;">{{ settingsService.settings?.address }}</div>
      <div class="rpt-store-phone" *ngIf="settingsService.settings?.phone">Ph: {{ settingsService.settings?.phone }}</div>
      <div class="rpt-store-phone" *ngIf="settingsService.settings?.email">Email: {{ settingsService.settings?.email }}</div>
      <div class="rpt-store-phone" *ngIf="settingsService.settings?.gstNumber">GST No: {{ settingsService.settings?.gstNumber }}</div>
      
      <div class="rpt-separator"></div>
      <div class="rpt-title">CASH BILL</div>
      <div class="rpt-separator"></div>

      <!-- Bill meta -->
      <div class="rpt-meta-info">
        <div><span class="rpt-meta-label">Bill No</span>: {{ bill.invoiceNo }}</div>
        <div><span class="rpt-meta-label">User Name</span>: {{ bill.createdBy || 'Administrator' }}</div>
        <div><span class="rpt-meta-label">Bill Date</span>: {{ bill.billDate | date:'dd-MM-yyyy hh:mm a' }}</div>
        <div><span class="rpt-meta-label">To</span>: {{ bill.customerName || 'Walk-in' }}</div>
      </div>

      <!-- Product Table -->
      <table class="rpt-table">
        <colgroup>
          <col class="col-desc-w">
          <col class="col-rate-w">
          <col class="col-qty-w">
          <col class="col-amt-w">
        </colgroup>
        <thead>
          <tr>
            <th class="th-desc">Description</th>
            <th class="th-rate">Rate</th>
            <th class="th-qty">Qty</th>
            <th class="th-amt">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let item of ($any(bill).billItems || $any(bill).items || [])">
            <td class="td-desc">{{ item.productName }}</td>
            <td class="td-rate">{{ item.unitPrice | number:'1.2-2' }}</td>
            <td class="td-qty">{{ item.quantity }}</td>
            <td class="td-amt">{{ calcItemTotal(item) | number:'1.2-2' }}</td>
          </tr>
        </tbody>
      </table>

      <div class="rpt-separator"></div>

      <!-- Totals Section -->
      <div class="rpt-totals-section">
        <div class="rpt-line-item">
          <span>Total Items : {{ ($any(bill).billItems || $any(bill).items || []).length }}</span>
          <span>Total Amt : {{ bill.subTotal + bill.taxAmount | number:'1.2-2' }}</span>
        </div>
        <div class="rpt-line-item" *ngIf="getRoundedOff() !== 0" style="justify-content: flex-end;">
          <span>Round off : {{ getRoundedOff() | number:'1.2-2' }}</span>
        </div>
      </div>

      <div class="rpt-separator"></div>

      <!-- Net Amount (bold & prominent) -->
      <div class="rpt-net-amount">
        <span>NET AMOUNT</span>
        <span>{{ bill.totalAmount | number:'1.2-2' }}</span>
      </div>

      <div class="rpt-separator"></div>

      <!-- MRP & Rate Summary -->
      <div class="rpt-rate-summary">
        <div class="rpt-line-item">
          <span>Total MRP :</span>
          <span>{{ getTotalMRP() | number:'1.2-2' }}</span>
        </div>
        <div class="rpt-line-item">
          <span>Total Rate :</span>
          <span>{{ getTotalRate() | number:'1.2-2' }}</span>
        </div>
        <div class="rpt-savings" *ngIf="getTotalMRP() > getTotalRate()">
          ** Today's Saving Rs. {{ (getTotalMRP() - getTotalRate()) | number:'1.2-2' }} **
        </div>
      </div>

      <!-- GST Section -->
      <div *ngIf="getTaxBreakdownList().length > 0">
        <div class="rpt-separator"></div>
        <table class="rpt-table rpt-tax-table">
          <colgroup>
            <col style="width: 44px;">
            <col style="width: 76px;">
            <col style="width: 72px;">
            <col style="width: 72px;">
          </colgroup>
          <thead>
            <tr>
              <th style="text-align: left; padding-left: 2px;">GST%</th>
              <th style="text-align: right; padding-right: 4px;">Value</th>
              <th style="text-align: right; padding-right: 4px;">SGST</th>
              <th style="text-align: right; padding-right: 2px;">CGST</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let tax of getTaxBreakdownList()">
              <td style="text-align: left; padding-left: 2px;">{{ tax.percent }}%</td>
              <td style="text-align: right; padding-right: 4px;">{{ tax.value | number:'1.2-2' }}</td>
              <td style="text-align: right; padding-right: 4px;">{{ tax.sgst | number:'1.2-2' }}</td>
              <td style="text-align: right; padding-right: 2px;">{{ tax.cgst | number:'1.2-2' }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="rpt-separator"></div>
      <div class="rpt-thankyou">THANK YOU! VISIT AGAIN!!</div>
    </div>

    <!-- Cancel Modal -->
    <div class="modal-overlay" *ngIf="showCancelModal" (click)="showCancelModal = false">
      <div class="modal" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>Cancel Bill</h3>
          <button class="btn btn-ghost btn-icon" (click)="showCancelModal = false">X</button>
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
    .print-btn { background: linear-gradient(135deg, #10b981, #059652); border-color: transparent; }

    /* THERMAL RECEIPT STYLES */
    .receipt-print {
      display: none;
    }

    @media print {
      @page {
        size: 80mm auto;
        margin: 0mm;
      }

      .page, .app-header, nav, header, sidebar { display: none !important; }
      body, html {
        margin: 0;
        padding: 0;
        background: #fff;
        width: 80mm;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      .receipt-print {
        display: block !important;
        width: 72mm !important;
        max-width: 72mm !important;
        box-sizing: border-box !important;
        margin: 0 auto !important;
        padding: 2mm 1mm 25mm 1mm;
        font-family: 'Courier New', Courier, monospace;
        color: #000;
        font-size: 10.5px;
        font-weight: 700;
        line-height: 1.35;
      }

      .rpt-store-name {
        font-size: 16px;
        font-weight: 900;
        text-align: center;
        letter-spacing: 0.5px;
        margin-bottom: 2px;
        text-transform: uppercase;
      }

      .rpt-store-addr, .rpt-store-phone {
        font-size: 10.5px;
        font-weight: 700;
        text-align: center;
        margin-bottom: 1px;
        line-height: 1.25;
      }

      .rpt-title {
        font-size: 13px;
        font-weight: 900;
        text-align: center;
        margin: 3px 0;
        letter-spacing: 1.5px;
      }

      .rpt-separator {
        border-top: 1px dashed #000;
        margin: 4px 0;
      }

      .rpt-meta-info {
        font-size: 10.5px;
        font-weight: 700;
        line-height: 1.35;
      }

      .rpt-meta-label {
        display: inline-block;
        width: 72px;
      }

      /* Clean Table Format with Fixed Column Widths */
      .rpt-table {
        width: 100%;
        border-collapse: collapse;
        table-layout: fixed;
        font-family: inherit;
        font-size: 10.5px;
        font-weight: 700;
        margin: 1px 0;
      }

      .col-desc-w { width: auto; }
      .col-rate-w { width: 68px; }
      .col-qty-w  { width: 34px; }
      .col-amt-w  { width: 74px; }

      .rpt-table th, .rpt-table td {
        box-sizing: border-box;
        overflow: hidden;
      }

      .rpt-table thead th {
        font-size: 10.5px;
        font-weight: 900;
        padding: 3px 1px;
        border-top: 1px dashed #000;
        border-bottom: 1px dashed #000;
      }

      .rpt-table tbody td {
        padding: 2px 1px;
        vertical-align: top;
        font-size: 10.5px;
        font-weight: 700;
      }

      .th-desc, .td-desc {
        text-align: left;
        word-break: break-word;
        overflow-wrap: anywhere;
        white-space: normal;
        line-height: 1.25;
        padding-right: 4px !important;
      }

      .th-rate, .td-rate {
        text-align: right;
        white-space: nowrap;
        padding-right: 4px !important;
      }

      .th-qty, .td-qty {
        text-align: center;
        white-space: nowrap;
        padding-left: 2px !important;
        padding-right: 2px !important;
      }

      .th-amt, .td-amt {
        text-align: right;
        white-space: nowrap;
        padding-right: 2px !important;
      }

      /* Totals & Net Amount */
      .rpt-totals-section, .rpt-rate-summary {
        font-size: 10.5px;
        font-weight: 700;
        line-height: 1.35;
      }

      .rpt-line-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin: 1px 0;
      }

      .rpt-net-amount {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 15px;
        font-weight: 900;
        margin: 4px 0;
        letter-spacing: 0.5px;
      }

      .rpt-savings {
        font-size: 11.5px;
        font-weight: 900;
        text-align: center;
        margin-top: 5px;
        border: 1px dashed #000;
        padding: 3px 0;
        letter-spacing: 0.5px;
      }

      .rpt-thankyou {
        font-size: 13px;
        font-weight: 900;
        text-align: center;
        margin-top: 8px;
        letter-spacing: 1px;
        padding-bottom: 25mm;
      }
    }
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
    private router: Router,
    public settingsService: SettingsService
  ) { }

  ngOnInit(): void {
    this.settingsService.load().subscribe();
    const id = Number(this.route.snapshot.paramMap.get('id'));
    const autoPrint = this.route.snapshot.queryParamMap.get('print') === 'true';
    this.billingService.getById(id).subscribe({
      next: (r: any) => {
        const data = r?.data || r?.Data || r;
        if (data && (data.id || data.invoiceNo)) {
          this.bill = data;
          if (autoPrint) {
            setTimeout(() => this.printBill(), 300);
          }
        }
      },
      error: (err) => console.error('Error fetching bill detail:', err)
    });
  }

  isRecallable(status: any): boolean {
    const s = String(status).toLowerCase();
    return s === '1' || s === '2' || s === 'draft' || s === 'onhold';
  }

  printBill(): void {
    window.print();
  }

  getTaxBreakdownList(): any[] {
    const items = (this.bill?.billItems || (this.bill as any)?.items || []) as any[];
    const map = new Map<number, { value: number, sgst: number, cgst: number }>();
    items.forEach((item: any) => {
      const pct = Number(item.taxPercent) || 0;
      const amt = Number(item.taxAmount) || 0;
      const qty = Number(item.quantity) || 0;
      const price = Number(item.unitPrice) || 0;
      const taxable = (qty * price) / (1 + (pct / 100));

      if (!map.has(pct)) map.set(pct, { value: 0, sgst: 0, cgst: 0 });
      const current = map.get(pct)!;
      current.value += taxable;
      current.sgst += (amt / 2);
      current.cgst += (amt / 2);
    });
    return Array.from(map.entries())
      .filter(([, v]) => v.value > 0)
      .map(([percent, v]) => ({ percent, value: v.value, sgst: v.sgst, cgst: v.cgst }));
  }

  getTotalMRP(): number {
    const items = (this.bill?.billItems || (this.bill as any)?.items || []) as any[];
    return items.reduce((sum, item) => sum + ((Number(item.mrp) || Number(item.unitPrice)) * Number(item.quantity)), 0);
  }

  getTotalRate(): number {
    const items = (this.bill?.billItems || (this.bill as any)?.items || []) as any[];
    return items.reduce((sum, item) => sum + (Number(item.unitPrice) * Number(item.quantity)), 0);
  }

  getRoundedOff(): number {
    if (!this.bill) return 0;
    const net = this.bill.totalAmount || 0;
    const rounded = Math.round(net);
    return +(rounded - net).toFixed(2);
  }

  calcItemTotal(item: any): number {
    if (item.total != null && item.total !== 0) return Number(item.total);
    const qty = Number(item.quantity) || 0;
    const price = Number(item.unitPrice) || 0;
    const disc = Number(item.discount) || 0;
    return +(qty * price - disc).toFixed(2);
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
