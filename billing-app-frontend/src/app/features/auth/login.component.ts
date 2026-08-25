import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-root">
      <!-- Background blobs -->
      <div class="blob blob-1"></div>
      <div class="blob blob-2"></div>

      <div class="login-card">
        <!-- Logo -->
        <div class="login-logo">
          <div class="logo-circle">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
              <rect x="9" y="3" width="6" height="4" rx="1"/>
              <path d="M9 12h6M9 16h4"/>
            </svg>
          </div>
          <h1>BillPro</h1>
          <p>Billing & Inventory Management</p>
        </div>

        <form (ngSubmit)="onSubmit()" #loginForm="ngForm" class="login-form">
          <div class="form-group">
            <label for="email">Email Address</label>
            <div class="input-icon-wrapper">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              <input id="email" type="email" class="form-control" name="email"
                     [(ngModel)]="email" required placeholder="admin@billing.com" autocomplete="email"/>
            </div>
          </div>

          <div class="form-group">
            <label for="password">Password</label>
            <div class="input-icon-wrapper">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0110 0v4"/>
              </svg>
              <input id="password" [type]="showPwd ? 'text' : 'password'" class="form-control"
                     name="password" [(ngModel)]="password" required placeholder="••••••••" autocomplete="current-password"/>
              <button type="button" class="pwd-toggle" (click)="showPwd = !showPwd">
                <svg *ngIf="!showPwd" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                </svg>
                <svg *ngIf="showPwd" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22"/>
                </svg>
              </button>
            </div>
          </div>

          <button type="submit" class="btn btn-primary btn-lg w-full login-btn" [disabled]="loading">
            <span *ngIf="loading" class="spinner"></span>
            <span>{{ loading ? 'Signing in...' : 'Sign In' }}</span>
          </button>
        </form>

        <p class="login-footer">
          Secure billing system &bull; v1.0
        </p>
      </div>
    </div>
  `,
  styles: [`
    .login-root {
      min-height: 100vh;
      display: flex; align-items: center; justify-content: center;
      background: var(--color-bg);
      position: relative; overflow: hidden;
    }

    .blob {
      position: absolute; border-radius: 50%;
      filter: blur(80px); opacity: 0.15; pointer-events: none;

      &-1 {
        width: 500px; height: 500px;
        background: radial-gradient(circle, var(--color-primary), transparent);
        top: -150px; left: -150px;
        animation: float 8s ease-in-out infinite;
      }
      &-2 {
        width: 400px; height: 400px;
        background: radial-gradient(circle, var(--color-accent), transparent);
        bottom: -100px; right: -100px;
        animation: float 10s ease-in-out infinite reverse;
      }
    }

    @keyframes float {
      0%, 100% { transform: translateY(0) scale(1); }
      50% { transform: translateY(-30px) scale(1.05); }
    }

    .login-card {
      width: min(440px, calc(100vw - 40px));
      background: rgba(30, 41, 59, 0.8);
      backdrop-filter: blur(20px);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-xl);
      padding: 48px 40px 36px;
      box-shadow: var(--shadow-xl), 0 0 80px rgba(99, 102, 241, 0.1);
      position: relative; z-index: 1;
      animation: slideUp var(--transition-slow);
    }

    .login-logo {
      text-align: center; margin-bottom: 36px;

      .logo-circle {
        width: 64px; height: 64px; margin: 0 auto 16px;
        background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark));
        border-radius: var(--radius-lg);
        display: flex; align-items: center; justify-content: center;
        box-shadow: 0 0 32px rgba(99, 102, 241, 0.45);
        svg { width: 32px; height: 32px; }
      }

      h1 {
        font-size: 2rem; font-weight: 800; margin-bottom: 6px;
        background: linear-gradient(135deg, #fff, var(--color-primary-light));
        -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      }

      p { font-size: 0.875rem; color: var(--color-text-muted); }
    }

    .login-form { display: flex; flex-direction: column; gap: 20px; }

    .input-icon-wrapper {
      position: relative;

      > svg:first-child {
        position: absolute; left: 14px; top: 50%; transform: translateY(-50%);
        width: 16px; height: 16px; color: var(--color-text-muted);
        pointer-events: none;
      }

      .form-control { padding-left: 42px; }
    }

    .pwd-toggle {
      position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
      background: none; border: none; cursor: pointer;
      color: var(--color-text-muted); padding: 4px;
      svg { width: 16px; height: 16px; display: block; }
      &:hover { color: var(--color-text); }
    }

    .login-btn { margin-top: 8px; justify-content: center; }

    .login-footer {
      text-align: center; margin-top: 24px;
      font-size: 0.75rem; color: var(--color-text-muted);
    }
  `]
})
export class LoginComponent {
  email = '';
  password = '';
  showPwd = false;
  loading = false;

  constructor(private auth: AuthService, private router: Router, private toast: ToastService) {}

  onSubmit(): void {
    if (!this.email || !this.password) {
      this.toast.warning('Please enter your email and password.');
      return;
    }
    this.loading = true;
    this.auth.login({ email: this.email, password: this.password }).subscribe({
      next: res => {
        if (res.success) {
          this.toast.success('Welcome back!');
          this.router.navigate(['/dashboard']);
        } else {
          this.toast.error(res.message ?? 'Login failed');
          this.loading = false;
        }
      },
      error: () => { this.loading = false; }
    });
  }
}
