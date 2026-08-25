import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Toast, ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      <div *ngFor="let toast of toasts; trackBy: trackId"
           class="toast toast-{{ toast.type }}"
           (click)="remove(toast.id)">
        <span class="toast-icon" [innerHTML]="getIcon(toast.type)"></span>
        <span class="toast-msg">{{ toast.message }}</span>
        <button class="toast-close">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed; bottom: 24px; right: 24px;
      display: flex; flex-direction: column; gap: 10px;
      z-index: 2000; pointer-events: none;
    }

    .toast {
      display: flex; align-items: center; gap: 12px;
      padding: 14px 16px;
      border-radius: var(--radius-md);
      background: var(--color-bg-elevated);
      border: 1px solid var(--color-border);
      box-shadow: var(--shadow-xl);
      min-width: 300px; max-width: 420px;
      cursor: pointer;
      pointer-events: all;
      animation: toastIn 0.3s ease;
      backdrop-filter: blur(12px);

      &-success { border-left: 3px solid var(--color-success); }
      &-error   { border-left: 3px solid var(--color-error); }
      &-warning { border-left: 3px solid var(--color-warning); }
      &-info    { border-left: 3px solid var(--color-info); }
    }

    .toast-icon {
      width: 20px; height: 20px; flex-shrink: 0;
      ::ng-deep svg { width: 18px; height: 18px; display: block; }
    }

    .toast-msg { flex: 1; font-size: 0.875rem; color: var(--color-text); }

    .toast-close {
      background: none; border: none; cursor: pointer;
      color: var(--color-text-muted); padding: 2px;
      svg { width: 14px; height: 14px; }
    }

    @keyframes toastIn {
      from { opacity: 0; transform: translateX(40px); }
      to   { opacity: 1; transform: translateX(0); }
    }
  `]
})
export class ToastComponent implements OnInit {
  toasts: Toast[] = [];

  constructor(private toastService: ToastService) {}

  ngOnInit(): void {
    this.toastService.toasts$.subscribe((t: Toast[]) => this.toasts = t);
  }

  remove(id: number): void { this.toastService.remove(id); }
  trackId(_: number, t: Toast): number { return t.id; }

  getIcon(type: string): string {
    const icons: Record<string, string> = {
      success: `<svg viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
      error:   `<svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
      warning: `<svg viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
      info:    `<svg viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
    };
    return icons[type] ?? icons['info'];
  }
}
