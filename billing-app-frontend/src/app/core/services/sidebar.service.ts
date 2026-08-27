import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SidebarService {
  collapsed = signal<boolean>(false);

  toggle(): void {
    this.collapsed.update(v => !v);
  }

  setCollapsed(val: boolean): void {
    this.collapsed.set(val);
  }
}
