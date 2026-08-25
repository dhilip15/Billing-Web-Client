import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategoryService } from '../../core/services/category.service';
import { CategoryDto } from '../../core/models/models';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-category-list',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent],
  template: `
    <app-header title="Categories" subtitle="Organize products by category"></app-header>
    <div class="page">
      <div class="page-header">
        <div><h1>Categories</h1></div>
        <button class="btn btn-primary" (click)="openModal()">+ Add Category</button>
      </div>
      <div class="cat-grid">
        <div *ngFor="let c of categories" class="cat-card">
          <div class="cat-icon">{{ c.name.charAt(0).toUpperCase() }}</div>
          <div class="cat-info">
            <div class="font-semibold">{{ c.name }}</div>
            <div class="text-xs text-muted">{{ c.description || 'No description' }}</div>
          </div>
          <div style="display:flex;gap:4px;margin-left:auto">
            <button class="btn btn-ghost btn-sm" (click)="openModal(c)">Edit</button>
            <button class="btn btn-danger btn-sm" (click)="del(c.id)">Del</button>
          </div>
        </div>
        <div class="cat-card cat-add" (click)="openModal()">
          <div class="cat-icon" style="background:var(--color-primary-bg);color:var(--color-primary-light)">+</div>
          <div class="font-medium text-muted">Add Category</div>
        </div>
      </div>
    </div>

    <div class="modal-overlay" *ngIf="showModal" (click)="showModal = false">
      <div class="modal" (click)="$event.stopPropagation()">
        <div class="modal-header"><h3>{{ editId ? 'Edit' : 'Add' }} Category</h3><button class="btn btn-ghost btn-icon" (click)="showModal = false">✕</button></div>
        <div class="form-group"><label>Name *</label><input class="form-control" [(ngModel)]="form.name" placeholder="Category name"/></div>
        <div class="form-group mt-4"><label>Description</label><input class="form-control" [(ngModel)]="form.description" placeholder="Optional"/></div>
        <div class="modal-footer">
          <button class="btn btn-ghost" (click)="showModal = false">Cancel</button>
          <button class="btn btn-primary" (click)="save()" [disabled]="saving"><span *ngIf="saving" class="spinner"></span>Save</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .cat-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px; }
    .cat-card { display: flex; align-items: center; gap: 14px; background: var(--color-bg-card); border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: 16px; transition: all var(--transition-fast); &:hover { border-color: var(--color-primary); } &.cat-add { cursor: pointer; opacity: 0.7; &:hover { opacity: 1; } } }
    .cat-icon { width: 42px; height: 42px; border-radius: var(--radius-md); background: var(--color-bg-elevated); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 1.1rem; color: var(--color-primary-light); flex-shrink: 0; }
    .cat-info { flex: 1; min-width: 0; }
  `]
})
export class CategoryListComponent implements OnInit {
  categories: CategoryDto[] = []; showModal = false; editId: number | null = null; saving = false; form: any = {};
  constructor(private categoryService: CategoryService, private toast: ToastService) {}
  ngOnInit(): void { this.load(); }
  load(): void { this.categoryService.getAll().subscribe(r => { if (r.success) this.categories = r.data!; }); }
  openModal(c?: CategoryDto): void { this.editId = c?.id ?? null; this.form = c ? { ...c } : { name: '', description: '' }; this.showModal = true; }
  save(): void {
    this.saving = true;
    const obs = this.editId ? this.categoryService.update(this.editId, this.form) : this.categoryService.create(this.form);
    obs.subscribe({ next: r => { if (r.success) { this.toast.success('Saved!'); this.showModal = false; this.load(); } this.saving = false; }, error: () => { this.saving = false; } });
  }
  del(id: number): void { if (!confirm('Delete?')) return; this.categoryService.delete(id).subscribe(r => { if (r.success) { this.toast.success('Deleted!'); this.load(); } }); }
}
