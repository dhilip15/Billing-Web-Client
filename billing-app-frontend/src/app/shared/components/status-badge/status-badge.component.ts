import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BillStatus } from '../../../core/models/models';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `<span class="badge" [ngClass]="badgeClass">{{ label }}</span>`,
  styles: [``]
})
export class StatusBadgeComponent {
  @Input() status!: BillStatus;

  get label(): string {
    const labels: Record<number, string> = {
      1: 'Draft', 2: 'On Hold', 3: 'Paid', 4: 'Cancelled', 5: 'Returned'
    };
    return labels[this.status] ?? 'Unknown';
  }

  get badgeClass(): string {
    const classes: Record<number, string> = {
      1: 'badge-gray',
      2: 'badge-warning',
      3: 'badge-success',
      4: 'badge-error',
      5: 'badge-info'
    };
    return classes[this.status] ?? 'badge-gray';
  }
}
