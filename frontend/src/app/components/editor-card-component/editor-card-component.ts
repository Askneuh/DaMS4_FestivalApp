import { Component, input, output } from '@angular/core';
import { Editor } from '../../interfaces/editor';

@Component({
  selector: 'app-editor-card',
  imports: [],
  templateUrl: './editor-card-component.html',
  styleUrl: './editor-card-component.css'
})
export class EditorCardComponent {

  public editor = input<Editor>();

  public onDelete = output<number>();
  
  handleDelete(): void {
    const editor = this.editor();
    if (editor) {
      this.onDelete.emit(editor.id);
    }
  }
}