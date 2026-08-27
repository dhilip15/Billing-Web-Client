import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { AuthService } from '../../../core/services/auth.service';
import { SidebarService } from '../../../core/services/sidebar.service';

interface NavItem {
  label: string;
  route: string;
  icon: string;
  roles?: string[];
  children?: NavItem[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <aside class="sidebar" [class.collapsed]="collapsed">
      <!-- Logo -->
      <div class="sidebar-logo"(click)="toggleSidebar()" [title]="collapsed ? 'Expand sidebar' : 'Collapse sidebar'">
        <div class="logo-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
            <rect x="9" y="3" width="6" height="4" rx="1"/>
            <path d="M9 14l2 2 4-4"/>
          </svg>
          <button *ngIf="!collapsed" class="sidebar-toggle" style="margin-right: 25px;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path *ngIf="!collapsed" d="M15 18l-6-6 6-6"/>
              <path *ngIf="collapsed" d="M9 18l6-6-6-6"/>
            </svg>
          </button>
        </div>
        <span class="logo-text">BillPro</span>
      </div>

      <!-- Nav -->
      <nav class="sidebar-nav">
        <ng-container *ngFor="let item of visibleNavItems">
          <a class="nav-item"
             [routerLink]="item.route"
             [class.active]="isActive(item.route)"
             [title]="item.label">
            <span class="nav-icon" [innerHTML]="getSafeIcon(item.icon)"></span>
            <span class="nav-label">{{ item.label }}</span>
            <span class="active-indicator"></span>
          </a>
        </ng-container>
      </nav>

      <!-- User -->
      <div class="sidebar-user">
        <div class="user-avatar" [title]="userName">{{ userInitial }}</div>
        <div class="user-info">
          <div class="user-name">{{ userName }}</div>
          <div class="user-role">{{ userRole }}</div>
        </div>
        <button class="logout-btn" (click)="logout()" title="Logout">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
          </svg>
        </button>
      </div>
    </aside>
  `,
  styles: [`
    .sidebar {
      width: var(--sidebar-width);
      height: 100vh;
      background: #092e1b;
      border-right: 1px solid rgba(65, 220, 142, 0.2);
      display: flex; flex-direction: column;
      position: fixed; left: 0; top: 0; bottom: 0;
      z-index: 100;
      transition: width var(--transition-slow) cubic-bezier(0.4,0,0.2,1);
      overflow: hidden;

      &.collapsed {
        width: var(--sidebar-collapsed-width);
        .logo-text, .nav-label, .user-info { display: none; }
        .sidebar-logo { padding: 0; justify-content: center; }
        .sidebar-nav { padding: 16px 6px; }
        .nav-item { justify-content: center; padding: 11px 0; gap: 0; }
        .sidebar-user { padding: 12px 6px; justify-content: center; }
        .logout-btn { display: none; }
      }
    }

    .sidebar-logo {
      height: var(--header-height);
      display: flex; align-items: center; gap: 12px;
      padding: 0 20px;
      border-bottom: 1px solid rgba(65, 220, 142, 0.2);
      box-sizing: border-box;
    }

    .logo-icon {
      width: 36px; height: 36px; flex-shrink: 0;
      background: #41dc8e;
      border-radius: var(--radius-md);
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 0 16px rgba(65, 220, 142, 0.4);
      svg { width: 20px; height: 20px; color: #052e16; }
    }

    .logo-text {
      font-size: 1.25rem; font-weight: 800;
      color: #ffffff;
      white-space: nowrap;
    }

    .sidebar-toggle {
      position: absolute; right: -14px; top: calc((var(--header-height) - 28px) / 2);
      width: 28px; height: 28px;
      background: #0d3a22;
      border: 1px solid rgba(65, 220, 142, 0.3);
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; color: #ffffff;
      transition: all var(--transition-fast);
      z-index: 10;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      svg { width: 14px; height: 14px;color: #ffffff }
      &:hover { background: #41dc8e; color: #ffffff; border-color: #41dc8e; }
    }

    .sidebar-nav {
      flex: 1; padding: 16px 12px;
      overflow-y: auto; overflow-x: hidden;
      display: flex; flex-direction: column; gap: 2px;
      -ms-overflow-style: none;
      scrollbar-width: none;
      &::-webkit-scrollbar { display: none; }
    }

    .nav-item {
      display: flex; align-items: center; gap: 12px;
      padding: 11px 12px;
      border-radius: var(--radius-md);
      color: rgba(255, 255, 255, 0.85);
      font-size: 0.875rem; font-weight: 500;
      text-decoration: none;
      transition: all var(--transition-fast);
      position: relative;
      white-space: nowrap;

      &:hover {
        background: rgba(255, 255, 255, 0.12);
        color: #ffffff;
      }

      &.active {
        background: #41dc8e;
        color: #052e16;
        font-weight: 700;
      }

      .active-indicator {
        display: none;
        position: absolute; right: 0; top: 25%; bottom: 25%;
        width: 3px; border-radius: 2px;
        background: #ffffff;
      }
      &.active .active-indicator { display: block; }
    }

    .nav-icon {
      width: 24px; height: 24px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      color: inherit;
      ::ng-deep svg { width: 20px; height: 20px; stroke: currentColor; display: block; }
    }

    .sidebar-user {
      padding: 12px 16px;
      border-top: 1px solid rgba(65, 220, 142, 0.2);
      display: flex; align-items: center; gap: 10px;
    }

    .user-avatar {
      width: 36px; height: 36px; flex-shrink: 0;
      background: #41dc8e;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 0.875rem; color: #052e16;
    }

    .user-info {
      flex: 1; overflow: hidden;
      .user-name { font-size: 0.8125rem; font-weight: 600; color: #ffffff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .user-role { font-size: 0.7rem; color: rgba(255, 255, 255, 0.7); }
    }

    .logout-btn {
      background: none; border: none; cursor: pointer;
      color: rgba(255, 255, 255, 0.7);
      padding: 4px;
      border-radius: var(--radius-sm);
      transition: color var(--transition-fast);
      svg { width: 16px; height: 16px; display: block; }
      &:hover { color: #f87171; }
    }
  `]
})
export class SidebarComponent implements OnInit {
  currentRoute = '';

  get collapsed(): boolean {
    return this.sidebarService.collapsed();
  }

  toggleSidebar(): void {
    this.sidebarService.toggle();
  }

  private readonly svgIcons: Record<string, string> = {
    dashboard: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>`,
    billing: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12h6M9 16h4"/></svg>`,
    products: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>`,
    customers: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>`,
    suppliers: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8zM6 1v3M10 1v3M14 1v3"/></svg>`,
    categories: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 10h16M4 14h16M4 18h16"/></svg>`,
    purchases: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0"/></svg>`,
    stock: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`,
    reports: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`,
    users: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
  };

  navItems: NavItem[] = [
    { label: 'Dashboard', route: '/dashboard', icon: this.svgIcons['dashboard'] },
    { label: 'Billing', route: '/billing', icon: this.svgIcons['billing'] },
    { label: 'Products', route: '/products', icon: this.svgIcons['products'] },
    { label: 'Customers', route: '/customers', icon: this.svgIcons['customers'] },
    { label: 'Suppliers', route: '/suppliers', icon: this.svgIcons['suppliers'], roles: ['Admin', 'Manager'] },
    { label: 'Categories', route: '/categories', icon: this.svgIcons['categories'], roles: ['Admin', 'Manager'] },
    { label: 'Purchases', route: '/purchases', icon: this.svgIcons['purchases'], roles: ['Admin', 'Manager'] },
    { label: 'Stock Ledger', route: '/stock-ledger', icon: this.svgIcons['stock'] },
    { label: 'Reports', route: '/reports', icon: this.svgIcons['reports'], roles: ['Admin', 'Manager'] },
    { label: 'Users', route: '/users', icon: this.svgIcons['users'] },
  ];

  private safeIconsCache = new Map<string, SafeHtml>();

  constructor(
    private auth: AuthService,
    private router: Router,
    private sidebarService: SidebarService,
    private sanitizer: DomSanitizer
  ) { }

  getSafeIcon(svgString: string): SafeHtml {
    if (!svgString) return '';
    if (!this.safeIconsCache.has(svgString)) {
      this.safeIconsCache.set(svgString, this.sanitizer.bypassSecurityTrustHtml(svgString));
    }
    return this.safeIconsCache.get(svgString)!;
  }

  ngOnInit(): void {
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe((e: any) => {
      this.currentRoute = e.urlAfterRedirects;
    });
    this.currentRoute = this.router.url;
  }

  get visibleNavItems(): NavItem[] {
    const roleName = this.getRoleName().toLowerCase();
    return this.navItems.filter(item =>
      !item.roles || item.roles.some(r => r.toLowerCase() === roleName)
    );
  }

  get userName(): string { return this.auth.currentUser?.name ?? 'User'; }
  get userInitial(): string { return this.userName.charAt(0).toUpperCase(); }
  get userRole(): string { return this.getRoleName(); }

  isActive(route: string): boolean { return this.currentRoute.startsWith(route); }

  logout(): void { this.auth.logout(); }

  private getRoleName(): string {
    return this.auth.getRoleName();
  }
}
