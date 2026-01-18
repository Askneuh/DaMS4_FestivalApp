import { Component, input, output } from '@angular/core';
import { Editor } from '../../interfaces/editor';

@Component({
  selector: 'app-editor-card',
  imports: [],
  templateUrl: './editor-card.html',
  styleUrl: './editor-card.css'
})
export class EditorCardComponent {
  public editor = input<Editor>();
  editEditor = output<Editor>();
  deleteEditor = output<number>();
  viewGames = output<number>();

  onEdit() {
    const ed = this.editor();
    if (ed) {
      this.editEditor.emit(ed);
    }
  }

  onDelete() {
    const ed = this.editor();
    if (ed) {
      const confirmDelete = confirm(
        `Etes-vous sur de vouloir supprimer l'editeur "${ed.name}" ? \n\nCela supprimera également tous les jeux associés.`
      );
      if (confirmDelete) {
        this.deleteEditor.emit(ed.id);
      }
    }
  }

  onViewGames() {
    const ed = this.editor();
    if (ed) {
      this.viewGames.emit(ed.id);
    }
  }
}
