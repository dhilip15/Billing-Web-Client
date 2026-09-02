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
            <button class="btn btn-secondary" style="margin-top:22px; margin-left: auto;" (click)="exportGstCsv()" [disabled]="!gstReport || gstReport.length === 0">
              Export to CSV
            </button>
          </div>
        </div>

        <div class="card" style="padding:0" *ngIf="gstReport">
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
  loadingGst = false;
  loadingSales = false;
  chart?: Chart;

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
    const csvContent = "data:text/csv;charset=utf-8,"
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `GST_Report_${this.gstFrom}_to_${this.gstTo}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
