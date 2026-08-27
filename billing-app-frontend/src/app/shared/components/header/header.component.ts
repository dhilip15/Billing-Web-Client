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
      background: #092e1b;
      border-bottom: 1px solid rgba(65, 220, 142, 0.2);
      position: sticky; top: 0; z-index: 50;
      box-sizing: border-box;
    }

    .header-left {
      display: flex; flex-direction: column; gap: 1px;
    }

    .page-title {
      font-size: 1.125rem; font-weight: 700;
      color: #ffffff;
    }

    .page-subtitle {
      font-size: 0.75rem; color: rgba(255, 255, 255, 0.75);
    }

    .header-right { display: flex; align-items: center; gap: 16px; }

    .user-chip {
      display: flex; align-items: center; gap: 10px;
      padding: 6px 14px 6px 6px;
      background: rgba(255, 255, 255, 0.12);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: var(--radius-full);
      cursor: default;
    }

    .chip-avatar {
      width: 30px; height: 30px;
      background: #41dc8e;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 0.8rem; color: #052e16;
    }

    .chip-info {
      display: flex; flex-direction: column;
      .chip-name { font-size: 0.8rem; font-weight: 600; color: #ffffff; }
      .chip-role { font-size: 0.65rem; color: rgba(255, 255, 255, 0.75); }
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
