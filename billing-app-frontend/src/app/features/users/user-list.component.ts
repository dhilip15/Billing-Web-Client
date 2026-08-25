import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { UserDto, UserRole, CreateUserRequest } from '../../core/models/models';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent],
  template: `
    <app-header title="Users" subtitle="Manage system users (Admin only)"></app-header>
    <div class="page">
      <div class="page-header">
        <div><h1>Users</h1><p class="page-subtitle">{{ users.length }} users</p></div>
        <button class="btn btn-primary" (click)="showModal = true; form = defaultForm()">+ Add User</button>
      </div>
      <div class="card" style="padding:0">
        <div class="table-wrapper">
          <table class="table" *ngIf="users.length > 0; else empty">
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th></tr></thead>
            <tbody>
              <tr *ngFor="let u of users">
                <td>
                  <div style="display:flex;align-items:center;gap:10px">
                    <div class="user-av">{{ u.name.charAt(0).toUpperCase() }}</div>
                    <span class="font-semibold">{{ u.name }}</span>
                  </div>
                </td>
                <td class="text-muted text-sm">{{ u.email }}</td>
                <td><span class="badge" [ngClass]="getRoleBadge(u.role)">{{ getRoleName(u.role) }}</span></td>
                <td><span class="badge" [ngClass]="u.isActive ? 'badge-success' : 'badge-gray'">{{ u.isActive ? 'Active' : 'Inactive' }}</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
    <ng-template #empty><div class="empty-state" style="padding:48px"><h3>No users found</h3></div></ng-template>

    <div class="modal-overlay" *ngIf="showModal" (click)="showModal = false">
      <div class="modal" (click)="$event.stopPropagation()">
        <div class="modal-header"><h3>Create User</h3><button class="btn btn-ghost btn-icon" (click)="showModal = false">✕</button></div>
        <div class="form-grid cols-2">
          <div class="form-group" style="grid-column:1/-1"><label>Full Name *</label><input class="form-control" [(ngModel)]="form.name" placeholder="John Doe"/></div>
          <div class="form-group" style="grid-column:1/-1"><label>Email *</label><input class="form-control" type="email" [(ngModel)]="form.email" placeholder="john@example.com"/></div>
          <div class="form-group"><label>Password *</label><input class="form-control" type="password" [(ngModel)]="form.password" placeholder="Min 6 chars"/></div>
          <div class="form-group"><label>Role</label>
            <select class="form-control" [(ngModel)]="form.role">
              <option [ngValue]="1">Admin</option>
              <option [ngValue]="2">Manager</option>
              <option [ngValue]="3">Cashier</option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" (click)="showModal = false">Cancel</button>
          <button class="btn btn-primary" (click)="create()" [disabled]="saving"><span *ngIf="saving" class="spinner"></span>Create</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .user-av { width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,var(--color-primary),var(--color-accent));display:flex;align-items:center;justify-content:center;font-weight:700;font-size:.8rem;color:white;flex-shrink:0; }
  `]
})
export class UserListComponent implements OnInit {
  users: UserDto[] = []; showModal = false; saving = false;
  form: CreateUserRequest = this.defaultForm();

  constructor(private auth: AuthService, private toast: ToastService) {}
  ngOnInit(): void { this.auth.getUsers().subscribe(r => { if (r.success) this.users = r.data!; }); }

  create(): void {
    if (!this.form.name?.trim()) {
      this.toast.error('Name is required');
      return;
    }
    if (!this.form.email?.trim()) {
      this.toast.error('Email is required');
      return;
    }
    if (!this.form.password || this.form.password.length < 6) {
      this.toast.error('Password must be at least 6 characters');
      return;
    }

    const payload: CreateUserRequest = {
      name: this.form.name.trim(),
      email: this.form.email.trim(),
      password: this.form.password,
      role: Number(this.form.role) || UserRole.Cashier
    };

    this.saving = true;
    this.auth.createUser(payload).subscribe({
      next: r => {
        if (r.success) {
          this.toast.success('User created!');
          this.showModal = false;
          this.ngOnInit();
        } else {
          this.toast.error(r.message || 'Failed to create user');
        }
        this.saving = false;
      },
      error: () => { this.saving = false; }
    });
  }

  getRoleName(r: any): string { return this.auth.getRoleName(r); }
  getRoleBadge(r: any): string {
    const role = this.auth.getRoleName(r);
    if (role === 'Admin') return 'badge-primary';
    if (role === 'Manager') return 'badge-accent';
    return 'badge-gray';
  }
  defaultForm(): CreateUserRequest { return { name: '', email: '', password: '', role: UserRole.Cashier }; }
}
