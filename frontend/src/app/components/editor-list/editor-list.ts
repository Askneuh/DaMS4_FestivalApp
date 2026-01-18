import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { EditorCardComponent } from '../editor-card/editor-card';
import { Editor } from '../../interfaces/editor';
import { EditorService } from '../../services/editor-service';

@Component({
  selector: 'app-editor-list',
  imports: [EditorCardComponent],
  templateUrl: './editor-list.html',
  styleUrl: './editor-list.css',
})
export class EditorList {
  readonly svc = inject(EditorService);
  readonly router = inject(Router);
  editors = this.svc.editors;

  editorToEdit = signal<Editor | null>(null);

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
}
