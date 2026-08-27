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
      <!-- Decorative background circles -->
      <div class="bg-circle bg-circle-1"></div>
      <div class="bg-circle bg-circle-2"></div>
      <div class="bg-circle bg-circle-3"></div>

      <div class="login-card">

        <!-- ── Logo ── -->
        <div class="login-logo">
          <div class="logo-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
              <rect x="9" y="3" width="6" height="4" rx="1"/>
              <path d="M9 12h6M9 16h4"/>
            </svg>
          </div>
          <h1 class="brand-name">BillPro</h1>
          <p class="brand-sub">Billing &amp; Inventory Management</p>
        </div>

        <!-- ── Form ── -->
        <form (ngSubmit)="onSubmit()" #loginForm="ngForm" class="login-form" novalidate>

          <!-- Email -->
          <div class="field-group">
            <label for="email">Email Address</label>
            <div class="input-wrap">
              <span class="input-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </span>
              <input
                id="email"
                type="email"
                name="email"
                class="field-input"
                [(ngModel)]="email"
                required
                placeholder="admin@billing.com"
                autocomplete="email"
              />
            </div>
          </div>

          <!-- Password -->
          <div class="field-group">
            <label for="password">Password</label>
            <div class="input-wrap">
              <span class="input-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0110 0v4"/>
                </svg>
              </span>
              <input
                id="password"
                [type]="showPwd ? 'text' : 'password'"
                name="password"
                class="field-input"
                [(ngModel)]="password"
                required
                placeholder="••••••••"
                autocomplete="current-password"
              />
              <button type="button" class="eye-btn" (click)="showPwd = !showPwd" [title]="showPwd ? 'Hide password' : 'Show password'">
                <svg *ngIf="!showPwd" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
                <svg *ngIf="showPwd" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22"/>
                </svg>
              </button>
            </div>
          </div>

          <!-- Submit -->
          <button type="submit" class="sign-in-btn" [disabled]="loading">
            <span *ngIf="loading" class="btn-spinner"></span>
            <span>{{ loading ? 'Signing in…' : 'Sign In' }}</span>
          </button>

        </form>

        <p class="card-footer">Secure billing system &bull; v1.0</p>
      </div>
    </div>
  `,
  styles: [`
    /* ── Reset & root ── */
    * { box-sizing: border-box; margin: 0; padding: 0; }

    .login-root {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(145deg, #071a0f 0%, #0d2818 45%, #0a1f12 75%, #040f07 100%);
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      position: relative;
      overflow: hidden;
      padding: 24px;
    }

    /* ── Soft background glows ── */
    .bg-circle {
      position: absolute;
      border-radius: 50%;
      pointer-events: none;
    }
    .bg-circle-1 {
      width: 520px; height: 520px;
      background: radial-gradient(circle, rgba(52,211,153,0.13) 0%, transparent 65%);
      top: -180px; left: -180px;
      animation: drift 10s ease-in-out infinite;
    }
    .bg-circle-2 {
      width: 420px; height: 420px;
      background: radial-gradient(circle, rgba(16,185,129,0.10) 0%, transparent 65%);
      bottom: -140px; right: -140px;
      animation: drift 13s ease-in-out infinite reverse;
    }
    .bg-circle-3 {
      width: 280px; height: 280px;
      background: radial-gradient(circle, rgba(52,211,153,0.07) 0%, transparent 65%);
      top: 50%; left: 60%;
      animation: drift 16s ease-in-out infinite;
    }

    @keyframes drift {
      0%, 100% { transform: translate(0, 0) scale(1); }
      50%       { transform: translate(-20px, -30px) scale(1.07); }
    }

    @keyframes slideUp {
      from { opacity: 0; transform: translateY(28px) scale(0.98); }
      to   { opacity: 1; transform: translateY(0)   scale(1);    }
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* ── Card ── */
    .login-card {
      width: 100%;
      max-width: 420px;
      background: #ffffff;
      border-radius: 24px;
      padding: 44px 40px 36px;
      box-shadow:
        0 32px 72px rgba(0,0,0,0.45),
        0 0 0 1px rgba(255,255,255,0.04);
      position: relative;
      z-index: 1;
      animation: slideUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
    }

    /* ── Logo section ── */
    .login-logo {
      text-align: center;
      margin-bottom: 36px;
    }

    .logo-icon {
      width: 66px; height: 66px;
      margin: 0 auto 14px;
      background: linear-gradient(135deg, #10b981, #047857);
      border-radius: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow:
        0 8px 24px rgba(16,185,129,0.45),
        0 0 0 6px rgba(16,185,129,0.10);

      svg { width: 32px; height: 32px; }
    }

    .brand-name {
      font-size: 1.85rem;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.5px;
      margin-bottom: 5px;
    }

    .brand-sub {
      font-size: 0.83rem;
      font-weight: 500;
      color: #94a3b8;
      letter-spacing: 0.02em;
    }

    /* ── Form ── */
    .login-form {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .field-group {
      display: flex;
      flex-direction: column;
      gap: 7px;

      label {
        font-size: 0.78rem;
        font-weight: 700;
        color: #475569;
        letter-spacing: 0.06em;
        text-transform: uppercase;
      }
    }

    .input-wrap {
      position: relative;
      display: flex;
      align-items: center;
    }

    .input-icon {
      position: absolute;
      left: 14px;
      display: flex;
      align-items: center;
      color: #94a3b8;
      pointer-events: none;
      z-index: 1;

      svg { width: 16px; height: 16px; }
    }

    .field-input {
      width: 100%;
      padding: 13px 16px 13px 42px;
      font-size: 0.95rem;
      font-weight: 500;
      color: #1e293b;
      background: #f8fafc;
      border: 1.5px solid #e2e8f0;
      border-radius: 12px;
      outline: none;
      transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
      font-family: inherit;
      -webkit-appearance: none;

      &::placeholder {
        color: #c1cdd8;
        font-weight: 400;
      }

      &:focus {
        border-color: #10b981;
        background: #fff;
        box-shadow: 0 0 0 3.5px rgba(16,185,129,0.18);
      }
    }

    /* Password eye toggle */
    .eye-btn {
      position: absolute;
      right: 12px;
      background: none;
      border: none;
      cursor: pointer;
      color: #94a3b8;
      display: flex;
      align-items: center;
      padding: 4px;
      border-radius: 6px;
      transition: color 0.15s;

      svg { width: 17px; height: 17px; }

      &:hover { color: #10b981; }
    }

    /* ── Sign In button ── */
    .sign-in-btn {
      margin-top: 4px;
      width: 100%;
      padding: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      background: linear-gradient(135deg, #10b981 0%, #059652 100%);
      color: #fff;
      font-size: 0.97rem;
      font-weight: 700;
      letter-spacing: 0.03em;
      border: none;
      border-radius: 12px;
      cursor: pointer;
      box-shadow: 0 6px 22px rgba(16,185,129,0.40);
      transition: transform 0.18s ease, box-shadow 0.18s ease, opacity 0.18s ease;
      font-family: inherit;

      &:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 12px 32px rgba(16,185,129,0.52);
      }

      &:active:not(:disabled) {
        transform: translateY(0);
        box-shadow: 0 4px 14px rgba(16,185,129,0.35);
      }

      &:disabled {
        opacity: 0.65;
        cursor: not-allowed;
      }
    }

    /* ── Loading spinner ── */
    .btn-spinner {
      display: inline-block;
      flex-shrink: 0;
      width: 18px;
      height: 18px;
      border: 2.5px solid rgba(255,255,255,0.30);
      border-top-color: #ffffff;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }

    /* ── Footer ── */
    .card-footer {
      text-align: center;
      margin-top: 26px;
      font-size: 0.74rem;
      font-weight: 500;
      color: #b0bec5;
      letter-spacing: 0.03em;
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
