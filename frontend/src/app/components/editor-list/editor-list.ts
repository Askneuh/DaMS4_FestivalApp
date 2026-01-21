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
    return this.svc.filterEditors(
      this.editors(),
      this.filterType(),
      this.searchTerm()
    );
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