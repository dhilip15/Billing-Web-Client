import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { ToastComponent } from '../toast/toast.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterModule, SidebarComponent, ToastComponent],
  template: `
    <div class="app-layout">
      <app-sidebar></app-sidebar>
      <main class="app-main">
        <router-outlet></router-outlet>
      </main>
      <app-toast></app-toast>
    </div>
  `,
  styles: [`
    .app-layout {
      display: flex;
      min-height: 100vh;
    }

    .app-main {
      flex: 1;
      margin-left: var(--sidebar-width);
      min-height: 100vh;
      overflow-x: hidden;
      transition: margin-left var(--transition-slow) cubic-bezier(0.4, 0, 0.2, 1);
    }
  `]
})
export class LayoutComponent {}
