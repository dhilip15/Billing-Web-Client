import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DashboardService } from '../../core/services/dashboard.service';
import { DashboardDto } from '../../core/models/models';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderComponent, StatusBadgeComponent],
  template: `
    <app-header title="Dashboard" subtitle="Welcome back! Here's what's happening today."></app-header>

    <div class="page">
      <!-- KPI Cards -->
      <div class="kpi-grid" *ngIf="data; else loading">
        <div class="stat-card" style="color: var(--color-primary)">
          <div class="stat-icon" style="background: var(--color-primary-bg)">
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" stroke-width="2">
              <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
            </svg>
          </div>
          <div class="stat-value">₹{{ data.todaySales | number:'1.0-0' }}</div>
          <div class="stat-label">Today's Revenue</div>
        </div>

        <div class="stat-card" style="color: var(--color-accent)">
          <div class="stat-icon" style="background: var(--color-accent-bg)">
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" stroke-width="2">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/>
            </svg>
          </div>
          <div class="stat-value">{{ data.todayBillCount }}</div>
          <div class="stat-label">Bills Today</div>
        </div>

        <div class="stat-card" style="color: #a78bfa">
          <div class="stat-icon" style="background: rgba(167,139,250,0.1)">
            <svg viewBox="0 0 24 24" fill="none" stroke="#a78bfa" stroke-width="2">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
            </svg>
          </div>
          <div class="stat-value">{{ data.totalCustomers }}</div>
          <div class="stat-label">Total Customers</div>
        </div>

        <div class="stat-card" [class.card-alert]="data.lowStockCount > 0" style="color: var(--color-warning)">
          <div class="stat-icon" style="background: rgba(245,158,11,0.1)">
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--color-warning)" stroke-width="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <div class="stat-value">{{ data.lowStockCount }}</div>
          <div class="stat-label">Low Stock Alerts</div>
        </div>
      </div>

      <!-- Main content -->
      <div class="dashboard-grid" *ngIf="data">
        <!-- Recent Bills -->
        <div class="card">
          <div class="flex items-center justify-between mb-4">
            <h3>Recent Bills</h3>
            <a routerLink="/billing" class="btn btn-ghost btn-sm">View all</a>
          </div>
          <div class="table-wrapper" *ngIf="data.recentBills.length > 0; else noBills">
            <table class="table">
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let bill of data.recentBills">
                  <td class="font-medium text-primary">#{{ bill.invoiceNo }}</td>
                  <td>{{ bill.customerName || 'Walk-in' }}</td>
                  <td class="font-semibold">₹{{ bill.totalAmount | number:'1.2-2' }}</td>
                  <td><app-status-badge [status]="bill.status"></app-status-badge></td>
                </tr>
              </tbody>
            </table>
          </div>
          <ng-template #noBills>
            <div class="empty-state" style="padding: 32px 0">
              <p>No bills yet today.</p>
            </div>
          </ng-template>
        </div>

        <!-- Low Stock -->
        <div class="card">
          <div class="flex items-center justify-between mb-4">
            <h3>Low Stock Products</h3>
            <a routerLink="/products" class="btn btn-ghost btn-sm">View all</a>
          </div>
          <div *ngIf="data.lowStockProducts.length > 0; else noStock">
            <div *ngFor="let p of data.lowStockProducts" class="stock-item">
              <div class="stock-info">
                <div class="stock-name">{{ p.name }}</div>
                <div class="stock-sku text-xs text-muted">{{ p.sku }}</div>
              </div>
              <div class="stock-level">
                <div class="stock-bar-bg">
                  <div class="stock-bar" [style.width.%]="getStockPercent(p.currentStock, p.reorderLevel)"
                       [style.background]="getStockColor(p.currentStock, p.reorderLevel)"></div>
                </div>
                <span class="stock-count" [class.text-error]="p.currentStock <= p.reorderLevel">
                  {{ p.currentStock }} {{ p.unit }}
                </span>
              </div>
            </div>
          </div>
          <ng-template #noStock>
            <div class="empty-state" style="padding: 32px 0">
              <p>All products are well stocked! 🎉</p>
            </div>
          </ng-template>
        </div>
      </div>

      <!-- Loading skeleton -->
      <ng-template #loading>
        <div class="kpi-grid">
          <div *ngFor="let i of [1,2,3,4]" class="stat-card">
            <div class="skeleton" style="width:48px;height:48px;margin-bottom:16px"></div>
            <div class="skeleton" style="width:80%;height:32px;margin-bottom:8px"></div>
            <div class="skeleton" style="width:50%;height:14px"></div>
          </div>
        </div>
      </ng-template>
    </div>
  `,
  styles: [`
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px; margin-bottom: 28px;
    }

    .card-alert { border-color: rgba(245, 158, 11, 0.3) !important; }

    .dashboard-grid {
      display: grid;
      grid-template-columns: 3fr 2fr;
      gap: 20px;
      @media (max-width: 900px) { grid-template-columns: 1fr; }
    }

    .stock-item {
      display: flex; align-items: center; justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid var(--color-border-light);
      gap: 12px;
      &:last-child { border-bottom: none; }
    }

    .stock-info { flex: 1; min-width: 0; }
    .stock-name { font-size: 0.875rem; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

    .stock-level { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }

    .stock-bar-bg {
      width: 80px; height: 6px;
      background: var(--color-bg-elevated);
      border-radius: var(--radius-full); overflow: hidden;
    }
    .stock-bar { height: 100%; border-radius: var(--radius-full); transition: width 0.5s ease; }
    .stock-count { font-size: 0.75rem; font-weight: 600; min-width: 50px; text-align: right; }
  `]
})
export class DashboardComponent implements OnInit {
  data: DashboardDto | null = null;

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.dashboardService.getDashboard().subscribe({
      next: res => { if (res.success) this.data = res.data!; }
    });
  }

  getStockPercent(current: number, reorder: number): number {
    const max = reorder * 3;
    return Math.min(100, Math.round((current / max) * 100));
  }

  getStockColor(current: number, reorder: number): string {
    if (current === 0) return 'var(--color-error)';
    if (current <= reorder) return 'var(--color-warning)';
    return 'var(--color-success)';
  }
}
