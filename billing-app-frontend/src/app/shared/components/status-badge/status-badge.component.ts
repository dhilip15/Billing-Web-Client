import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `<span class="badge" [ngClass]="badgeClass">{{ label }}</span>`,
  styles: [``]
})
export class StatusBadgeComponent {
  @Input() status!: number | string;

  get label(): string {
    const val = Number(this.status);
    if (!isNaN(val) && val > 0) {
      const labels: Record<number, string> = {
        1: 'Draft',
        2: 'On Hold',
        3: 'Paid',
        4: 'Cancelled',
        5: 'Returned'
      };
      if (labels[val]) return labels[val];
    }

    if (typeof this.status === 'string' && this.status.trim()) {
      return this.status;
    }

    return 'Unknown';
  }

  get badgeClass(): string {
    const val = Number(this.status);
    if (!isNaN(val) && val > 0) {
      const classes: Record<number, string> = {
        1: 'badge-gray',
        2: 'badge-warning',
        3: 'badge-success',
        4: 'badge-error',
        5: 'badge-info'
      };
      if (classes[val]) return classes[val];
    }

    const str = String(this.status || '').toLowerCase();
    if (str.includes('paid')) return 'badge-success';
    if (str.includes('hold')) return 'badge-warning';
    if (str.includes('draft')) return 'badge-gray';
    if (str.includes('cancel')) return 'badge-error';
    if (str.includes('return')) return 'badge-info';

    return 'badge-gray';
  }
}
