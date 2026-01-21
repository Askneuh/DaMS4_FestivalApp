import { Component, effect, inject, input, output, signal } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { EditorService } from '../../services/editor-service';
import { Editor } from '../../interfaces/editor';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-editor-form',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './editor-form.html',
  styleUrl: './editor-form.css',
})
export class EditorFormComponent {
  private editorService = inject(EditorService);
  editorToEdit = input<Editor | null>(null);
  formClosed = output<void>();

  showForm = signal(false);

  editorForm = new FormGroup({
    id: new FormControl<number>(0, { nonNullable: true }),
    name: new FormControl<string>('', { 
      nonNullable: true, 
      validators: [Validators.required, Validators.minLength(2)] 
    }),
    exposant: new FormControl<boolean>(false, { nonNullable: true }),
    distributeur: new FormControl<boolean>(false, { nonNullable: true }),
    logo: new FormControl<string>('', { nonNullable: true })
  }, { validators: this.atLeastOneCheckbox });

  atLeastOneCheckbox(control: AbstractControl): ValidationErrors | null {
    const exposant = control.get('exposant')?.value;
    const distributeur = control.get('distributeur')?.value;
    return (exposant || distributeur) ? null : { atLeastOne: true };
  }

  hasCheckboxError(): boolean {
    return this.editorForm.hasError('atLeastOne') && 
      (this.editorForm.get('exposant')?.touched === true || this.editorForm.get('distributeur')?.touched === true);
  }

  constructor() {
    effect(() => {
      const editor = this.editorToEdit();
      if (editor) {
        this.loadEditorData(editor);
        this.showForm.set(true);
      }
    });
  }

  loadEditorData(editor: Editor) {
    this.editorForm.patchValue({
      id: editor.id,
      name: editor.name,
      exposant: editor.exposant,
      distributeur: editor.distributeur,
      logo: editor.logo
    });
  }

  OpenCloseForm() {
    this.showForm.update(v => !v);
    if (!this.showForm()) {
      this.resetForm();
    }
  }

  onSubmit() {
    if (this.editorForm.valid) {
      const formValue = this.editorForm.getRawValue();

      const editor: Editor = {
        id: formValue.id ?? 0,
        name: formValue.name,
        exposant: formValue.exposant,
        distributeur: formValue.distributeur,
        logo: formValue.logo
      };

      if (this.editorToEdit() && this.editorToEdit()!.id !== 0) {
        this.editorService.updateEditor(editor, editor.id).subscribe({
          next: () => {
            this.editorService.loadEditorsFromBD();
            this.resetForm();
            this.showForm.set(false);
            this.formClosed.emit();
          },
          error: (err) => console.error('Erreur lors de la mise à jour :', err)
        });
      } else {
        this.editorService.addEditor(editor).subscribe({
          next: () => {
            this.editorService.loadEditorsFromBD();
            this.resetForm();
            this.showForm.set(false);
            this.formClosed.emit();
          },
          error: (err) => console.error('Erreur lors de la création :', err)
        });
      }
    }
  }

  resetForm() {
    this.editorForm.reset({
      id: 0,
      name: '',
      exposant: false,
      distributeur: false,
      logo: ''
    });
  }

  isEditMode(): boolean {
    return this.editorToEdit() !== null && this.editorToEdit()!.id !== 0;
  }
}
