import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StockLedgerService } from '../../core/services/report.service';
import { StockLedgerDto, TransactionType } from '../../core/models/models';
import { HeaderComponent } from '../../shared/components/header/header.component';

@Component({
  selector: 'app-stock-ledger',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent],
  template: `
    <app-header title="Stock Ledger" subtitle="View stock movement history"></app-header>
    <div class="page">
      <div class="page-header"><h1>Stock Ledger</h1></div>
      <div class="card" style="padding:0">
        <div class="table-wrapper">
          <table class="table" *ngIf="ledger.length > 0; else empty">
            <thead><tr><th>Date</th><th>Type</th><th>Qty</th><th>Balance After</th><th>Notes</th><th>By</th></tr></thead>
            <tbody>
              <tr *ngFor="let entry of ledger">
                <td class="text-sm text-muted">{{ entry.transactionDate | date:'dd MMM, h:mm a' }}</td>
                <td><span class="badge" [ngClass]="getTypeBadge(entry.transactionType)">{{ getTypeName(entry.transactionType) }}</span></td>
                <td [class.text-success]="entry.quantity > 0" [class.text-error]="entry.quantity < 0">
                  {{ entry.quantity > 0 ? '+' : '' }}{{ entry.quantity }}
                </td>
                <td class="font-semibold">{{ entry.balanceAfter }}</td>
                <td class="text-muted text-sm">{{ entry.notes || '—' }}</td>
                <td class="text-muted text-sm">{{ entry.createdBy || 'System' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
    <ng-template #empty><div class="empty-state" style="padding:48px"><h3>No stock movements</h3></div></ng-template>
  `, styles: []
})
export class StockLedgerComponent implements OnInit {
  ledger: StockLedgerDto[] = [];
  constructor(private stockLedgerService: StockLedgerService) {}
  ngOnInit(): void { this.stockLedgerService.getRecent(100).subscribe(r => { if (r.success) this.ledger = r.data!; }); }

  getTypeName(t: any): string {
    if (typeof t === 'string') return t;
    return { 1: 'Purchase', 2: 'Sale', 3: 'Adjustment', 4: 'Sale Return', 5: 'Purchase Return' }[t as number] ?? 'Unknown';
  }
  getTypeBadge(t: any): string {
    let typeName = typeof t === 'string' ? t : this.getTypeName(t);
    const map: Record<string, string> = { 'Purchase': 'badge-success', 'Sale': 'badge-info', 'Adjustment': 'badge-warning', 'SaleReturn': 'badge-accent', 'Sale Return': 'badge-accent', 'PurchaseReturn': 'badge-gray', 'Purchase Return': 'badge-gray' };
    return map[typeName] ?? 'badge-gray';
  }
}
