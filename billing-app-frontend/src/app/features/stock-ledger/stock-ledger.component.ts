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
            <thead><tr><th>Date</th><th>Product</th><th>Type</th><th>Qty</th><th>Balance After</th><th>Notes</th><th>By</th></tr></thead>
            <tbody>
              <tr *ngFor="let entry of ledger">
                <td class="text-sm text-muted">{{ entry.createdAt | date:'dd MMM, h:mm a' }}</td>
                <td class="font-medium">{{ entry.productName }}</td>
                <td><span class="badge" [ngClass]="getTypeBadge(entry.transactionType)">{{ getTypeName(entry.transactionType) }}</span></td>
                <td [class.text-success]="entry.quantity > 0" [class.text-error]="entry.quantity < 0">
                  {{ entry.quantity > 0 ? '+' : '' }}{{ entry.quantity }}
                </td>
                <td class="font-semibold">{{ entry.balanceAfter }}</td>
                <td class="text-muted text-sm">{{ entry.notes || '—' }}</td>
                <td class="text-muted text-sm">{{ entry.createdByName }}</td>
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

  getTypeName(t: TransactionType): string {
    return { 1: 'Purchase', 2: 'Sale', 3: 'Adjustment', 4: 'Sale Return', 5: 'Purchase Return' }[t] ?? 'Unknown';
  }
  getTypeBadge(t: TransactionType): string {
    return { 1: 'badge-success', 2: 'badge-info', 3: 'badge-warning', 4: 'badge-accent', 5: 'badge-gray' }[t] ?? 'badge-gray';
  }
}
