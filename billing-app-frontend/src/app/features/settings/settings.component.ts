import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SettingsService, StoreSettings } from '../../core/services/settings.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title">System Configuration</h1>
          <p class="page-subtitle">Manage your store details used across the application</p>
        </div>
      </div>

      <div class="settings-grid">

        <!-- Store Details Card -->
        <div class="settings-card">
          <div class="card-header">
            <span class="card-icon">🏪</span>
            <div>
              <h2 class="card-title">Store Details</h2>
              <p class="card-desc">This information appears on barcodes, bills, and reports</p>
            </div>
          </div>

          <div class="form-grid" *ngIf="form">
            <div class="form-group full-width">
              <label>Store Name *</label>
              <input class="form-control" [(ngModel)]="form.storeName" placeholder="e.g. Sri Ram Stores" />
            </div>
            <div class="form-group full-width">
              <label>Address</label>
              <textarea class="form-control" rows="2" [(ngModel)]="form.address" placeholder="123 Main St, City - 600001"></textarea>
            </div>
            <div class="form-group">
              <label>Phone</label>
              <input class="form-control" [(ngModel)]="form.phone" placeholder="+91 99999 99999" />
            </div>
            <div class="form-group">
              <label>Email</label>
              <input class="form-control" type="email" [(ngModel)]="form.email" placeholder="store@example.com" />
            </div>
            <div class="form-group">
              <label>GST Number</label>
              <input class="form-control" [(ngModel)]="form.gstNumber" placeholder="22AAAAA0000A1Z5" />
            </div>
          </div>

          <div class="card-footer">
            <div class="last-updated" *ngIf="settings?.updatedAt">
              Last saved: {{ settings?.updatedAt | date:'dd MMM yyyy, hh:mm a' }}
            </div>
            <button class="btn btn-primary" (click)="save()" [disabled]="saving">
              <span class="spinner" *ngIf="saving"></span>
              {{ saving ? 'Saving...' : '💾 Save Settings' }}
            </button>
          </div>
        </div>

        <!-- Live Preview Card -->
        <div class="settings-card preview-card">
          <div class="card-header">
            <span class="card-icon">🏷️</span>
            <div>
              <h2 class="card-title">Barcode Label Preview</h2>
              <p class="card-desc">How your label will look when printed</p>
            </div>
          </div>
          <div class="label-preview">
            <div class="preview-label">
              <div class="preview-store-name">{{ form.storeName || 'Your Store Name' }}</div>
              <div class="preview-product-name">Sample Product Name</div>
              <div class="preview-price">MRP: &#8377;499.00</div>
              <div class="preview-barcode">
                <div class="barcode-bars">
                  <span *ngFor="let b of bars" [style.width]="b + 'px'" [style.background]="'#000'" class="bar"></span>
                </div>
                <div class="barcode-num">PRD20240901000001</div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .page { padding: 24px; max-width: 1000px; margin: 0 auto; }
    .page-header { margin-bottom: 28px; }
    .page-title { font-size: 1.5rem; font-weight: 700; color: var(--color-text); margin-bottom: 4px; }
    .page-subtitle { color: var(--color-text-muted); font-size: 0.875rem; }

    .settings-grid {
      display: grid;
      grid-template-columns: 1fr 380px;
      gap: 24px;
      align-items: start;
    }

    .settings-card {
      background: var(--color-bg-card);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      overflow: hidden;
    }

    .card-header {
      display: flex;
      align-items: flex-start;
      gap: 14px;
      padding: 20px 24px;
      border-bottom: 1px solid var(--color-border-light);
      background: var(--color-bg-elevated);
    }

    .card-icon { font-size: 24px; }
    .card-title { font-size: 1rem; font-weight: 600; color: var(--color-text); margin-bottom: 2px; }
    .card-desc { font-size: 0.8rem; color: var(--color-text-muted); }

    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      padding: 24px;
    }

    .form-group { display: flex; flex-direction: column; gap: 6px; }
    .form-group.full-width { grid-column: 1 / -1; }
    .form-group label { font-size: 0.8rem; font-weight: 500; color: var(--color-text-secondary); }
    .form-control {
      padding: 10px 12px;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      background: var(--color-bg);
      color: var(--color-text);
      font-size: 0.9rem;
      font-family: inherit;
      width: 100%;
      transition: border-color var(--transition-fast);
    }
    .form-control:focus { outline: none; border-color: var(--color-primary); }

    .card-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 24px;
      border-top: 1px solid var(--color-border-light);
      background: var(--color-bg-elevated);
    }

    .last-updated { font-size: 0.75rem; color: var(--color-text-muted); }

    /* Preview */
    .preview-card {}
    .label-preview {
      padding: 32px 24px;
      display: flex;
      justify-content: center;
      align-items: center;
      background: #e8e8e8;
      min-height: 220px;
    }

    .preview-label {
      background: white;
      border: 1px solid #ccc;
      border-radius: 4px;
      padding: 8px 10px;
      width: 170px;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      font-family: Arial, sans-serif;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      gap: 3px;
    }

    .preview-store-name { font-size: 10px; font-weight: bold; color: #000; }
    .preview-product-name { font-size: 11px; font-weight: bold; color: #000; }
    .preview-price { font-size: 9px; font-weight: bold; color: #000; }

    .preview-barcode { display: flex; flex-direction: column; align-items: center; gap: 2px; }
    .barcode-bars { display: flex; align-items: stretch; height: 30px; gap: 1px; }
    .bar { display: inline-block; height: 100%; }
    .barcode-num { font-size: 7px; color: #666; font-family: monospace; }

    .spinner {
      width: 14px; height: 14px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
      display: inline-block;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    @media (max-width: 768px) {
      .settings-grid { grid-template-columns: 1fr; }
      .form-grid { grid-template-columns: 1fr; }
      .form-group.full-width { grid-column: 1; }
    }
  `]
})
export class SettingsComponent implements OnInit {
  settings: StoreSettings | null = null;
  form: Partial<StoreSettings> = {};
  saving = false;
  bars: number[] = [];

  constructor(
    private settingsService: SettingsService,
    private toast: ToastService
  ) {
    // Generate fake barcode bars for preview
    this.bars = Array.from({ length: 30 }, () => Math.random() > 0.5 ? 2 : 1);
  }

  ngOnInit(): void {
    this.settingsService.load().subscribe(res => {
      this.settings = res.data;
      this.form = { ...res.data };
    });
  }

  save(): void {
    if (!this.form.storeName?.trim()) {
      this.toast.error('Store name is required.');
      return;
    }
    this.saving = true;
    this.settingsService.update(this.form).subscribe({
      next: res => {
        this.settings = res.data;
        this.toast.success('Settings saved successfully!');
        this.saving = false;
      },
      error: () => {
        this.toast.error('Failed to save settings.');
        this.saving = false;
      }
    });
  }
}
