import { Component, inject } from '@angular/core';
import { EditorCardComponent } from '../editor-card-component/editor-card-component';
import { EditorService } from '../../services/editor-service';

@Component({
  selector: 'app-editors-list',
  imports: [EditorCardComponent],
  templateUrl: './editor-list-component.html',
  styleUrl: './editor-list-component.css'
})
export class EditorListComponent {
  private editorService = inject(EditorService);
  
  protected editors = this.editorService.editors;
  
  handleDelete(editorId: number): void {
    const editor = this.editorService.findById(editorId);
    if (editor && confirm(`Supprimer ${editor.name} ?`)) {
      this.editorService.removeEditor(editorId);
    }
  }
}