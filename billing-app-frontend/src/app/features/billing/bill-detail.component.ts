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

    <!-- ══════════════════════════════════════════════════
         THERMAL RECEIPT — shown only during window.print()
         ══════════════════════════════════════════════════ -->
    <div class="receipt-print" *ngIf="bill" id="thermal-receipt">

      <!-- Store Header -->
      <div class="rpt-store-name">SRI TAMIL DEPARTMENT STORE</div>
      <div class="rpt-store-addr">OMPARTRIKOVIL STREET NEAR BUS STAND,</div>
      <div class="rpt-store-addr">NAMBYUR - 638 458</div>
      <div class="rpt-store-phone">96777 03783, 84899 99869</div>
      <div class="rpt-separator">- - - - - - - - - - - - - - - - - - - -</div>
      <div class="rpt-title">CASH BILL</div>
      <div class="rpt-separator">- - - - - - - - - - - - - - - - - - - -</div>

      <!-- Bill meta -->
      <div class="rpt-meta-row">
        <span>To: {{ bill.customerName || 'Walk-in' }}</span>
      </div>
      <div class="rpt-meta-right">
        <div>B.No : {{ bill.invoiceNo }}</div>
        <div>Date : {{ bill.billDate | date:'dd-MM-yyyy' }}</div>
        <div>Time : {{ bill.billDate | date:'hh:mm a' }}</div>
      </div>
      <div class="rpt-separator">- - - - - - - - - - - - - - - - - - - -</div>

      <!-- Column Headers -->
      <div class="rpt-col-header">
        <span class="col-desc">DESCRIPTION</span>
        <span class="col-qty">QTY</span>
        <span class="col-mrp">MRP</span>
        <span class="col-rate">RATE</span>
        <span class="col-amt">AMT</span>
      </div>
      <div class="rpt-separator">- - - - - - - - - - - - - - - - - - - -</div>

      <!-- Items -->
      <div class="rpt-item-row" *ngFor="let item of ($any(bill).billItems || $any(bill).items || [])">
        <span class="col-desc">{{ item.productName }}</span>
        <span class="col-qty">{{ item.quantity }}</span>
        <span class="col-mrp">{{ item.unitPrice | number:'1.2-2' }}</span>
        <span class="col-rate">{{ item.unitPrice | number:'1.2-2' }}</span>
        <span class="col-amt">{{ calcItemTotal(item) | number:'1.2-2' }}</span>
      </div>

      <div class="rpt-separator">- - - - - - - - - - - - - - - - - - - -</div>

      <!-- Totals -->
      <div class="rpt-total-row">
        <span>GrossAmount</span>
        <span>{{ bill.subTotal | number:'1.2-2' }}</span>
      </div>
      <div class="rpt-tax-breakdown" *ngFor="let tax of getTaxBreakdown()">
        <span>( TAX{{ tax.percent }}% &nbsp; {{ tax.amount | number:'1.2-2' }} )</span>
      </div>
      <div class="rpt-total-row" *ngIf="getRoundedOff() !== 0">
        <span>Rounded Off</span>
        <span>{{ getRoundedOff() | number:'1.2-2' }}</span>
      </div>
      <div class="rpt-separator">- - - - - - - - - - - - - - - - - - - -</div>
      <div class="rpt-net-amount">
        <span>NET AMOUNT</span>
        <span>{{ bill.totalAmount | number:'1.2-2' }}</span>
      </div>
      <div class="rpt-separator">- - - - - - - - - - - - - - - - - - - -</div>

      <!-- Footer -->
      <div class="rpt-footer-row">
        <span>Total Items {{ ($any(bill).billItems || $any(bill).items || []).length }}</span>
        <span>{{ bill.createdBy || 'Admin' }}</span>
      </div>
      <div class="rpt-savings" *ngIf="bill.discountAmount > 0">
        Today Savings Rs. {{ bill.discountAmount | number:'1.2-2' }}
      </div>
      <div class="rpt-thankyou">Thank You! Visit Again</div>
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
    .print-btn { background: linear-gradient(135deg, #10b981, #059652); border-color: transparent; }

    /* ══════════════════════════════════════════
       THERMAL RECEIPT STYLES
       Hidden on screen, visible only when printing
       ══════════════════════════════════════════ */
    .receipt-print {
      display: none; /* hidden on screen */
    }

    /* ── Receipt content styles (used during print via global styles.scss) ── */
    .rpt-store-name {
      font-size: 14px;
      font-weight: bold;
      text-align: center;
      letter-spacing: 1px;
      margin-bottom: 2px;
    }

    .rpt-store-addr {
      font-size: 10px;
      text-align: center;
      margin-bottom: 1px;
    }

    .rpt-store-phone {
      font-size: 10px;
      text-align: center;
      margin-bottom: 2px;
    }

    .rpt-title {
      font-size: 12px;
      font-weight: bold;
      text-align: center;
      letter-spacing: 2px;
      margin: 2px 0;
    }

    .rpt-separator {
      font-size: 9px;
      text-align: center;
      margin: 3px 0;
      color: #555;
    }

    .rpt-meta-row {
      font-size: 10px;
      margin-bottom: 1px;
    }

    .rpt-meta-right {
      font-size: 10px;
      text-align: right;
      margin-bottom: 2px;
    }

    .rpt-col-header {
      display: flex;
      font-size: 10px;
      font-weight: bold;
      margin: 2px 0;
    }

    .rpt-item-row {
      display: flex;
      font-size: 10px;
      margin: 1px 0;
      align-items: flex-start;
    }

    .col-desc  { flex: 2; overflow: hidden; word-break: break-word; }
    .col-qty   { width: 28px; text-align: right; flex-shrink: 0; }
    .col-mrp   { width: 42px; text-align: right; flex-shrink: 0; }
    .col-rate  { width: 42px; text-align: right; flex-shrink: 0; }
    .col-amt   { width: 48px; text-align: right; flex-shrink: 0; }

    .rpt-total-row {
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      margin: 2px 0;
    }

    .rpt-tax-breakdown {
      font-size: 10px;
      text-align: left;
      margin: 1px 4px;
      color: #444;
    }

    .rpt-net-amount {
      display: flex;
      justify-content: space-between;
      font-size: 13px;
      font-weight: bold;
      margin: 3px 0;
      letter-spacing: 0.5px;
    }

    .rpt-footer-row {
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      margin: 2px 0;
    }

    .rpt-savings {
      font-size: 10px;
      text-align: center;
      margin: 2px 0;
    }

    .rpt-thankyou {
      font-size: 11px;
      font-weight: bold;
      text-align: center;
      margin-top: 6px;
      letter-spacing: 1px;
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

  printBill(): void {
    window.print();
  }

  /** Group tax amounts by percent */
  getTaxBreakdown(): { percent: number; amount: number }[] {
    const items = (this.bill?.billItems || (this.bill as any)?.items || []) as any[];
    const map = new Map<number, number>();
    items.forEach((item: any) => {
      const pct = Number(item.taxPercent) || 0;
      const amt = Number(item.taxAmount) || 0;
      map.set(pct, (map.get(pct) || 0) + amt);
    });
    return Array.from(map.entries())
      .filter(([, amt]) => amt > 0)
      .map(([percent, amount]) => ({ percent, amount }));
  }

  /** Rounded off difference */
  getRoundedOff(): number {
    if (!this.bill) return 0;
    const net = this.bill.totalAmount || 0;
    const rounded = Math.round(net);
    return +(rounded - net).toFixed(2);
  }

  /** Calculate item total — uses pre-computed value if available, else calculates */
  calcItemTotal(item: any): number {
    if (item.total != null && item.total !== 0) return Number(item.total);
    const qty   = Number(item.quantity)   || 0;
    const price = Number(item.unitPrice)  || 0;
    const tax   = Number(item.taxPercent) || 0;
    const disc  = Number(item.discount)   || 0;
    return +(qty * price * (1 + tax / 100) - disc).toFixed(2);
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
