import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <header class="header">
      <div class="header-left">
        <h1 class="page-title">{{ title }}</h1>
        <p class="page-subtitle" *ngIf="subtitle">{{ subtitle }}</p>
      </div>
      <div class="header-right">
        <div class="header-user" *ngIf="auth.currentUser as user">
          <div class="user-chip">
            <div class="chip-avatar">{{ user.name.charAt(0).toUpperCase() }}</div>
            <div class="chip-info">
              <span class="chip-name">{{ user.name }}</span>
              <span class="chip-role">{{ getRoleName(user.role) }}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  `,
  styles: [`
    .header {
      height: var(--header-height);
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 32px;
      background: var(--color-bg-secondary);
      border-bottom: 1px solid var(--color-border);
      position: sticky; top: 0; z-index: 50;
    }

    .header-left {
      display: flex; flex-direction: column; gap: 1px;
    }

    .page-title {
      font-size: 1.125rem; font-weight: 700;
      background: linear-gradient(135deg, var(--color-text), var(--color-primary-light));
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    }

    .page-subtitle {
      font-size: 0.75rem; color: var(--color-text-muted);
    }

    .header-right { display: flex; align-items: center; gap: 16px; }

    .user-chip {
      display: flex; align-items: center; gap: 10px;
      padding: 6px 14px 6px 6px;
      background: var(--color-bg-elevated);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-full);
      cursor: default;
    }

    .chip-avatar {
      width: 30px; height: 30px;
      background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 0.8rem; color: white;
    }

    .chip-info {
      display: flex; flex-direction: column;
      .chip-name { font-size: 0.8rem; font-weight: 600; color: var(--color-text); }
      .chip-role { font-size: 0.65rem; color: var(--color-text-muted); }
    }
  `]
})
export class HeaderComponent {
  @Input() title = '';
  @Input() subtitle = '';

  constructor(public auth: AuthService) {}

  getRoleName(role: number): string {
    return ['', 'Admin', 'Manager', 'Cashier'][role] ?? '';
  }
}
