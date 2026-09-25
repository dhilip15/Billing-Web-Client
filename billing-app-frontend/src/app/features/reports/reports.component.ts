import { Component, AfterViewInit, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportService } from '../../core/services/report.service';
import { SalesReportDto, StockReportItemDto, GstReportItemDto } from '../../core/models/models';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent],
  template: `
    <app-header title="Reports" subtitle="Business analytics and reports"></app-header>
    <div class="page">
      <!-- Tab header -->
      <div class="tab-bar mb-6">
        <button class="tab-btn" [class.active]="activeTab === 'sales'" (click)="activeTab = 'sales'">Sales Report</button>
        <button class="tab-btn" [class.active]="activeTab === 'stock'" (click)="activeTab = 'stock'; loadStock()">Stock Report</button>
        <button class="tab-btn" [class.active]="activeTab === 'gst'" (click)="activeTab = 'gst'">GST Report</button>
      </div>

      <!-- Sales Report -->
      <div *ngIf="activeTab === 'sales'">
        <div class="card mb-6">
          <div class="flex items-center gap-4 flex-wrap">
            <div class="form-group" style="margin:0">
              <label>From</label>
              <input type="date" class="form-control" [(ngModel)]="salesFrom"/>
            </div>
            <div class="form-group" style="margin:0">
              <label>To</label>
              <input type="date" class="form-control" [(ngModel)]="salesTo"/>
            </div>
            <button class="btn btn-primary" style="margin-top:22px" (click)="loadSales()" [disabled]="loadingSales">
              <span *ngIf="loadingSales" class="spinner"></span> Generate Report
            </button>
          </div>
        </div>

        <div *ngIf="salesReport">
          <!-- KPI -->
          <div class="kpi-grid mb-6">
            <div class="stat-card">
              <div class="stat-value text-primary">₹{{ salesReport.totalRevenue | number:'1.2-2' }}</div>
              <div class="stat-label">Total Revenue</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">{{ salesReport.totalBills }}</div>
              <div class="stat-label">Total Bills</div>
            </div>
            <div class="stat-card">
              <div class="stat-value text-success">{{ salesReport.totalBills }}</div>
              <div class="stat-label">Paid Bills</div>
            </div>
            <div class="stat-card">
              <div class="stat-value text-warning">₹{{ salesReport.totalTax | number:'1.2-2' }}</div>
              <div class="stat-label">Total Tax</div>
            </div>
          </div>

          <!-- Chart -->
          <div class="card mb-6">
            <h3 class="mb-4">Revenue by Period</h3>
            <canvas #salesChart style="max-height:320px"></canvas>
          </div>

          <!-- Table -->
          <div class="card" style="padding:0">
            <div style="padding:20px 24px 0"><h3>Breakdown</h3></div>
            <div class="table-wrapper">
              <table class="table">
                <thead><tr><th>Period</th><th>Revenue</th><th>Bills</th></tr></thead>
                <tbody>
                  <tr *ngFor="let row of salesReport.dailyBreakdown">
                    <td class="font-medium">{{ row.date | date:\'dd MMM yyyy\' }}</td>
                    <td class="text-success font-semibold">₹{{ row.revenue | number:'1.2-2' }}</td>
                    <td>{{ row.bills }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- Stock Report -->
      <div *ngIf="activeTab === 'stock'">
        <div class="card" style="padding:0" *ngIf="stockReport">
          <div class="table-wrapper">
            <table class="table">
              <thead><tr><th>Product</th><th>SKU</th><th>Category</th><th>Stock</th><th>Reorder</th><th>Unit</th><th>Sell Price</th><th>Stock Value</th></tr></thead>
              <tbody>
                <tr *ngFor="let s of stockReport">
                  <td class="font-medium">{{ s.productName }}</td>
                  <td class="text-muted text-sm">{{ s.sku }}</td>
                  <td class="text-muted text-sm">{{ s.categoryName }}</td>
                  <td [class.text-error]="s.currentStock <= s.reorderLevel" [class.text-success]="s.currentStock > s.reorderLevel">
                    {{ s.currentStock }}
                  </td>
                  <td class="text-muted text-sm">{{ s.reorderLevel }}</td>
                  <td class="text-muted text-sm">{{ s.unit }}</td>
                  <td>₹{{ s.sellingPrice | number:'1.2-2' }}</td>
                  <td class="font-semibold">₹{{ s.stockValue | number:'1.2-2' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div class="empty-state" *ngIf="!stockReport">
          <p>Loading stock report...</p>
        </div>
      </div>
      </div>
      <!-- GST Report -->
      <div *ngIf="activeTab === 'gst'">
        <div class="card mb-6">
          <div class="flex items-center justify-between gap-4 flex-wrap">
            <div class="flex items-center gap-4 flex-wrap">
              <div class="form-group" style="margin:0">
                <label>From</label>
                <input type="date" class="form-control" [(ngModel)]="gstFrom"/>
              </div>
              <div class="form-group" style="margin:0">
                <label>To</label>
                <input type="date" class="form-control" [(ngModel)]="gstTo"/>
              </div>
              <button class="btn btn-primary" style="margin-top:22px" (click)="loadGst()" [disabled]="loadingGst">
                <span *ngIf="loadingGst" class="spinner"></span> Generate Report
              </button>
            </div>

            <!-- View Mode & Export Actions -->
            <div class="flex items-center gap-2 flex-wrap" style="margin-top:22px" *ngIf="gstReport && gstReport.length > 0">
              <div class="tab-bar" style="padding:2px">
                <button class="tab-btn" style="padding:4px 12px; font-size:0.775rem" [class.active]="gstViewMode === 'detailed'" (click)="gstViewMode = 'detailed'">Detailed</button>
                <button class="tab-btn" style="padding:4px 12px; font-size:0.775rem" [class.active]="gstViewMode === 'summary'" (click)="gstViewMode = 'summary'">Date Summary</button>
              </div>

              <button class="btn btn-secondary" (click)="exportGstCsv()">
                📊 Export CSV
              </button>
              <button class="btn btn-primary print-btn" (click)="exportGstPdf()">
                🖨️ Export PDF
              </button>
            </div>
          </div>
        </div>

        <!-- GST KPI Summary Cards -->
        <div class="kpi-grid mb-6" *ngIf="gstReport && gstReport.length > 0">
          <div class="stat-card">
            <div class="stat-value">₹{{ totalGstTaxable | number:'1.2-2' }}</div>
            <div class="stat-label">Total Taxable Val</div>
          </div>
          <div class="stat-card">
            <div class="stat-value text-warning">₹{{ totalGstCgst | number:'1.2-2' }}</div>
            <div class="stat-label">CGST (9%)</div>
          </div>
          <div class="stat-card">
            <div class="stat-value text-warning">₹{{ totalGstSgst | number:'1.2-2' }}</div>
            <div class="stat-label">SGST (9%)</div>
          </div>
          <div class="stat-card">
            <div class="stat-value text-error">₹{{ totalGstAmount | number:'1.2-2' }}</div>
            <div class="stat-label">Total GST Tax</div>
          </div>
          <div class="stat-card">
            <div class="stat-value text-success">₹{{ totalGstValue | number:'1.2-2' }}</div>
            <div class="stat-label">Total Invoice Value</div>
          </div>
        </div>

        <!-- Detailed Invoice View Table -->
        <div class="card" style="padding:0" *ngIf="gstReport && gstReport.length > 0 && gstViewMode === 'detailed'">
          <div class="table-wrapper">
            <table class="table">
              <thead><tr><th>Date</th><th>Invoice No</th><th>Customer</th><th>GSTIN</th><th>Taxable Val</th><th>CGST</th><th>SGST</th><th>Total Val</th></tr></thead>
              <tbody>
                <tr *ngFor="let g of gstReport">
                  <td class="text-muted text-sm">{{ g.billDate | date:'dd MMM yyyy' }}</td>
                  <td class="font-medium">{{ g.invoiceNo }}</td>
                  <td>{{ g.customerName }}</td>
                  <td>{{ g.gstin || '-' }}</td>
                  <td>₹{{ g.taxableValue | number:'1.2-2' }}</td>
                  <td class="text-warning">₹{{ g.cgst | number:'1.2-2' }}</td>
                  <td class="text-warning">₹{{ g.sgst | number:'1.2-2' }}</td>
                  <td class="font-semibold text-primary">₹{{ g.totalValue | number:'1.2-2' }}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr style="background:var(--color-bg-elevated); font-weight:600">
                  <td colspan="4">TOTALS</td>
                  <td>₹{{ totalGstTaxable | number:'1.2-2' }}</td>
                  <td class="text-warning">₹{{ totalGstCgst | number:'1.2-2' }}</td>
                  <td class="text-warning">₹{{ totalGstSgst | number:'1.2-2' }}</td>
                  <td class="text-primary font-bold">₹{{ totalGstValue | number:'1.2-2' }}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <!-- Date-Wise Summary Table -->
        <div class="card" style="padding:0" *ngIf="gstReport && gstReport.length > 0 && gstViewMode === 'summary'">
          <div class="table-wrapper">
            <table class="table">
              <thead><tr><th>Date</th><th>Bills Count</th><th>Taxable Val</th><th>CGST</th><th>SGST</th><th>Total Val</th></tr></thead>
              <tbody>
                <tr *ngFor="let row of dateGroupedGst">
                  <td class="font-medium">{{ row.date | date:'dd MMM yyyy' }}</td>
                  <td class="text-muted text-sm">{{ row.count }} bill(s)</td>
                  <td>₹{{ row.taxableValue | number:'1.2-2' }}</td>
                  <td class="text-warning">₹{{ row.cgst | number:'1.2-2' }}</td>
                  <td class="text-warning">₹{{ row.sgst | number:'1.2-2' }}</td>
                  <td class="font-semibold text-primary">₹{{ row.totalValue | number:'1.2-2' }}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr style="background:var(--color-bg-elevated); font-weight:600">
                  <td colspan="2">TOTALS</td>
                  <td>₹{{ totalGstTaxable | number:'1.2-2' }}</td>
                  <td class="text-warning">₹{{ totalGstCgst | number:'1.2-2' }}</td>
                  <td class="text-warning">₹{{ totalGstSgst | number:'1.2-2' }}</td>
                  <td class="text-primary font-bold">₹{{ totalGstValue | number:'1.2-2' }}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div class="empty-state" *ngIf="gstReport && gstReport.length === 0">
          <p>No GST sales found for the selected period.</p>
        </div>
      </div>
  `,
  styles: [`
    .tab-bar { display: flex; gap: 4px; background: var(--color-bg-card); border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: 4px; width: fit-content; }
    .tab-btn { padding: 8px 20px; border: none; border-radius: var(--radius-md); background: none; color: var(--color-text-muted); font-family: inherit; font-size: 0.875rem; font-weight: 500; cursor: pointer; transition: all var(--transition-fast); &.active { background: var(--color-primary); color: white; } &:not(.active):hover { background: var(--color-bg-elevated); color: var(--color-text); } }
    .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; }
  `]
})
export class ReportsComponent implements OnInit {
  @ViewChild('salesChart') salesChartRef?: ElementRef<HTMLCanvasElement>;
  activeTab = 'sales';
  salesFrom = '';
  salesTo = '';
  salesReport: SalesReportDto | null = null;
  stockReport: StockReportItemDto[] | null = null;
  gstReport: GstReportItemDto[] | null = null;
  gstFrom = '';
  gstTo = '';
  gstViewMode: 'detailed' | 'summary' = 'detailed';
  loadingGst = false;
  loadingSales = false;
  chart?: Chart;

  get totalGstTaxable(): number {
    return (this.gstReport || []).reduce((s, i) => s + (i.taxableValue || 0), 0);
  }
  get totalGstCgst(): number {
    return (this.gstReport || []).reduce((s, i) => s + (i.cgst || 0), 0);
  }
  get totalGstSgst(): number {
    return (this.gstReport || []).reduce((s, i) => s + (i.sgst || 0), 0);
  }
  get totalGstAmount(): number {
    return this.totalGstCgst + this.totalGstSgst;
  }
  get totalGstValue(): number {
    return (this.gstReport || []).reduce((s, i) => s + (i.totalValue || 0), 0);
  }

  get dateGroupedGst(): { date: string, count: number, taxableValue: number, cgst: number, sgst: number, totalValue: number }[] {
    if (!this.gstReport) return [];
    const map = new Map<string, { date: string, count: number, taxableValue: number, cgst: number, sgst: number, totalValue: number }>();
    
    this.gstReport.forEach(item => {
      const dateStr = item.billDate ? new Date(item.billDate).toISOString().split('T')[0] : 'Unknown';
      let entry = map.get(dateStr);
      if (!entry) {
        entry = { date: dateStr, count: 0, taxableValue: 0, cgst: 0, sgst: 0, totalValue: 0 };
        map.set(dateStr, entry);
      }
      entry.count++;
      entry.taxableValue += item.taxableValue || 0;
      entry.cgst += item.cgst || 0;
      entry.sgst += item.sgst || 0;
      entry.totalValue += item.totalValue || 0;
    });

    return Array.from(map.values()).sort((a, b) => b.date.localeCompare(a.date));
  }

  constructor(private reportService: ReportService) { }

  ngOnInit(): void {
    const now = new Date();
    this.salesTo = now.toISOString().split('T')[0];
    now.setMonth(now.getMonth() - 1);
    this.salesFrom = now.toISOString().split('T')[0];
    this.gstFrom = this.salesFrom;
    this.gstTo = this.salesTo;
  }

  loadSales(): void {
    this.loadingSales = true;
    this.reportService.getSalesReport({ from: this.salesFrom, to: this.salesTo }).subscribe({
      next: r => {
        if (r.success) {
          this.salesReport = r.data!;
          setTimeout(() => this.drawChart(), 100);
        }
        this.loadingSales = false;
      },
      error: () => { this.loadingSales = false; }
    });
  }

  loadStock(): void {
    if (!this.stockReport) {
      this.reportService.getStockReport().subscribe(r => { if (r.success) this.stockReport = r.data!; });
    }
  }

  loadGst(): void {
    this.loadingGst = true;
    this.reportService.getGstReport({ from: this.gstFrom, to: this.gstTo }).subscribe({
      next: r => {
        if (r.success) this.gstReport = r.data!;
        this.loadingGst = false;
      },
      error: () => this.loadingGst = false
    });
  }

  exportGstCsv(): void {
    if (!this.gstReport || !this.gstReport.length) return;
    
    if (this.gstViewMode === 'summary') {
      const headers = ['Date', 'Bills Count', 'Taxable Value', 'CGST', 'SGST', 'Total Value'];
      const rows = this.dateGroupedGst.map(r => [
        new Date(r.date).toLocaleDateString(),
        r.count,
        r.taxableValue.toFixed(2),
        r.cgst.toFixed(2),
        r.sgst.toFixed(2),
        r.totalValue.toFixed(2)
      ]);
      rows.push(['TOTALS', '', this.totalGstTaxable.toFixed(2), this.totalGstCgst.toFixed(2), this.totalGstSgst.toFixed(2), this.totalGstValue.toFixed(2)]);
      
      const csvContent = "data:text/csv;charset=utf-8,"
        + headers.join(",") + "\n"
        + rows.map(e => e.join(",")).join("\n");

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `GST_Summary_Report_${this.gstFrom}_to_${this.gstTo}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const headers = ['Date', 'Invoice No', 'Customer Name', 'GSTIN', 'Taxable Value', 'CGST', 'SGST', 'Total Value'];
      const rows = this.gstReport.map(r => [
        new Date(r.billDate).toLocaleDateString(),
        r.invoiceNo,
        `"${r.customerName}"`,
        r.gstin || '-',
        r.taxableValue.toFixed(2),
        r.cgst.toFixed(2),
        r.sgst.toFixed(2),
        r.totalValue.toFixed(2)
      ]);
      rows.push(['TOTALS', '', '', '', this.totalGstTaxable.toFixed(2), this.totalGstCgst.toFixed(2), this.totalGstSgst.toFixed(2), this.totalGstValue.toFixed(2)]);

      const csvContent = "data:text/csv;charset=utf-8,"
        + headers.join(",") + "\n"
        + rows.map(e => e.join(",")).join("\n");

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `GST_Detailed_Report_${this.gstFrom}_to_${this.gstTo}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  exportGstPdf(): void {
    if (!this.gstReport || !this.gstReport.length) return;
    const printWin = window.open('', '_blank', 'width=900,height=700');
    if (!printWin) return;

    const rowsHtml = this.gstViewMode === 'summary' 
      ? this.dateGroupedGst.map(r => `
          <tr>
            <td>${new Date(r.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
            <td>${r.count} bill(s)</td>
            <td>₹${r.taxableValue.toFixed(2)}</td>
            <td>₹${r.cgst.toFixed(2)}</td>
            <td>₹${r.sgst.toFixed(2)}</td>
            <td><strong>₹${r.totalValue.toFixed(2)}</strong></td>
          </tr>`).join('')
      : this.gstReport.map(g => `
          <tr>
            <td>${new Date(g.billDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
            <td>${g.invoiceNo}</td>
            <td>${g.customerName || 'Walk-in'}</td>
            <td>${g.gstin || '-'}</td>
            <td>₹${g.taxableValue.toFixed(2)}</td>
            <td>₹${g.cgst.toFixed(2)}</td>
            <td>₹${g.sgst.toFixed(2)}</td>
            <td><strong>₹${g.totalValue.toFixed(2)}</strong></td>
          </tr>`).join('');

    const tableHeadersHtml = this.gstViewMode === 'summary'
      ? `<th>Date</th><th>Bills Count</th><th>Taxable Value</th><th>CGST</th><th>SGST</th><th>Total Value</th>`
      : `<th>Date</th><th>Invoice No</th><th>Customer</th><th>GSTIN</th><th>Taxable Value</th><th>CGST</th><th>SGST</th><th>Total Value</th>`;

    const tableColsSpan = this.gstViewMode === 'summary' ? 2 : 4;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>GST Report (${this.gstFrom} to ${this.gstTo})</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 24px; color: #1f2937; }
          .header { text-align: center; border-bottom: 2px solid #10b981; padding-bottom: 12px; margin-bottom: 20px; }
          .title { font-size: 24px; font-weight: bold; color: #065f46; }
          .subtitle { font-size: 14px; color: #6b7280; margin-top: 4px; }
          .kpi-grid { display: flex; gap: 12px; margin-bottom: 20px; }
          .kpi-card { flex: 1; background: #f3f4f6; border-radius: 8px; padding: 12px; text-align: center; }
          .kpi-val { font-size: 16px; font-weight: bold; color: #059669; }
          .kpi-lbl { font-size: 11px; color: #4b5563; text-transform: uppercase; margin-top: 4px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px; }
          th { background-color: #ecfdf5; color: #065f46; text-align: left; padding: 10px; border-bottom: 2px solid #d1fae5; }
          td { padding: 10px; border-bottom: 1px solid #e5e7eb; }
          tfoot tr { background-color: #f9fafb; font-weight: bold; }
          tfoot td { border-top: 2px solid #10b981; font-size: 14px; }
          @media print { body { padding: 0; font-weight: 600; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">GST Tax Report</div>
          <div class="subtitle">Period: ${this.gstFrom} to ${this.gstTo} (${this.gstViewMode === 'summary' ? 'Date-wise Summary' : 'Detailed Invoices'})</div>
        </div>

        <div class="kpi-grid">
          <div class="kpi-card"><div class="kpi-val">₹${this.totalGstTaxable.toFixed(2)}</div><div class="kpi-lbl">Taxable Value</div></div>
          <div class="kpi-card"><div class="kpi-val">₹${this.totalGstCgst.toFixed(2)}</div><div class="kpi-lbl">CGST</div></div>
          <div class="kpi-card"><div class="kpi-val">₹${this.totalGstSgst.toFixed(2)}</div><div class="kpi-lbl">SGST</div></div>
          <div class="kpi-card"><div class="kpi-val">₹${this.totalGstAmount.toFixed(2)}</div><div class="kpi-lbl">Total GST</div></div>
          <div class="kpi-card"><div class="kpi-val">₹${this.totalGstValue.toFixed(2)}</div><div class="kpi-lbl">Grand Total</div></div>
        </div>

        <table>
          <thead><tr>${tableHeadersHtml}</tr></thead>
          <tbody>${rowsHtml}</tbody>
          <tfoot>
            <tr>
              <td colspan="${tableColsSpan}">TOTAL SUMMARY</td>
              <td>₹${this.totalGstTaxable.toFixed(2)}</td>
              <td>₹${this.totalGstCgst.toFixed(2)}</td>
              <td>₹${this.totalGstSgst.toFixed(2)}</td>
              <td>₹${this.totalGstValue.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
        <script>
          window.onload = function() { window.print(); };
        </script>
      </body>
      </html>
    `;

    printWin.document.write(htmlContent);
    printWin.document.close();
  }

  drawChart(): void {
    if (!this.salesChartRef || !this.salesReport) return;
    this.chart?.destroy();
    this.chart = new Chart(this.salesChartRef.nativeElement, {
      type: 'bar',
      data: {
        labels: this.salesReport.dailyBreakdown.map(i => new Date(i.date).toLocaleDateString()),
        datasets: [{
          label: 'Revenue (₹)',
          data: this.salesReport.dailyBreakdown.map(i => i.revenue),
          backgroundColor: 'rgba(65, 220, 142, 0.75)',
          borderColor: '#41dc8e',
          borderWidth: 1,
          borderRadius: 6,
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { labels: { color: '#374151' } } },
        scales: {
          x: { ticks: { color: '#374151' }, grid: { color: 'rgba(209,231,221,0.5)' } },
          y: { ticks: { color: '#374151' }, grid: { color: 'rgba(209,231,221,0.5)' } }
        }
      }
    });
  }
}
