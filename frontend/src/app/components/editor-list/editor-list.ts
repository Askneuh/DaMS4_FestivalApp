import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { EditorCardComponent } from '../editor-card/editor-card';
import { EditorFormComponent } from '../editor-form/editor-form';
import { Editor } from '../../interfaces/editor';
import { EditorService } from '../../services/editor-service';

@Component({
  selector: 'app-editor-list',
  imports: [EditorCardComponent, EditorFormComponent],
  templateUrl: './editor-list.html',
  styleUrl: './editor-list.css',
})
export class EditorList {
  readonly svc = inject(EditorService);
  readonly router = inject(Router);
  editors = this.svc.editors;

  editorToEdit = signal<Editor | null>(null);

  searchTerm = signal('');
  filterType = signal<'all' | 'exposant' | 'distributeur' | 'both'>('all');

  filteredEditors = computed(() => {
    let result = this.editors();

    const filter = this.filterType();
    if (filter === 'exposant') {
      result = result.filter(e => e.exposant);
    } else if (filter === 'distributeur') {
      result = result.filter(e => e.distributeur);
    } else if (filter === 'both') {
      result = result.filter(e => e.exposant && e.distributeur);
    }

    const search = this.searchTerm().toLowerCase();
    if (search) {
      result = result.filter(e => e.name.toLowerCase().startsWith(search));
    }

    return result.sort((a, b) => a.name.localeCompare(b.name));
  });

  onEditEditor(editor: Editor) {
    this.editorToEdit.set(editor);
  }

  onFormClosed() {
    this.editorToEdit.set(null);
  }

  removeEditor(id: number) {
    this.svc.removeEditor(id).subscribe({
      next: () => {
        this.svc.loadEditorsFromBD();
      },
      error: (err) => {
        console.error('Erreur lors de la suppression :', err);
      }
    });
  }

  viewGames(id: number) {
    this.router.navigate(['/editor-games', id]);
  }

  viewContacts(id: number) {
    this.router.navigate(['/editor-contacts', id]);
  }
}
