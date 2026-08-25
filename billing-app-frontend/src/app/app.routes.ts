import { Routes } from '@angular/router';
import { authGuard, loginGuard, roleGuard } from './core/guards/auth.guard';
import { LayoutComponent } from './shared/components/layout/layout.component';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [loginGuard],
    loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent)
  },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'billing',
        children: [
          {
            path: '',
            loadComponent: () => import('./features/billing/bill-list.component').then(m => m.BillListComponent)
          },
          {
            path: 'new',
            loadComponent: () => import('./features/billing/new-bill.component').then(m => m.NewBillComponent)
          },
          {
            path: ':id',
            loadComponent: () => import('./features/billing/bill-detail.component').then(m => m.BillDetailComponent)
          }
        ]
      },
      {
        path: 'products',
        loadComponent: () => import('./features/products/product-list.component').then(m => m.ProductListComponent)
      },
      {
        path: 'customers',
        loadComponent: () => import('./features/customers/customer-list.component').then(m => m.CustomerListComponent)
      },
      {
        path: 'suppliers',
        canActivate: [roleGuard(['Admin', 'Manager'])],
        loadComponent: () => import('./features/suppliers/supplier-list.component').then(m => m.SupplierListComponent)
      },
      {
        path: 'categories',
        canActivate: [roleGuard(['Admin', 'Manager'])],
        loadComponent: () => import('./features/categories/category-list.component').then(m => m.CategoryListComponent)
      },
      {
        path: 'purchases',
        canActivate: [roleGuard(['Admin', 'Manager'])],
        loadComponent: () => import('./features/purchases/purchase-list.component').then(m => m.PurchaseListComponent)
      },
      {
        path: 'stock-ledger',
        loadComponent: () => import('./features/stock-ledger/stock-ledger.component').then(m => m.StockLedgerComponent)
      },
      {
        path: 'reports',
        canActivate: [roleGuard(['Admin', 'Manager'])],
        loadComponent: () => import('./features/reports/reports.component').then(m => m.ReportsComponent)
      },
      {
        path: 'users',
        loadComponent: () => import('./features/users/user-list.component').then(m => m.UserListComponent)
      }
    ]
  },
  { path: '**', redirectTo: '' }
];
