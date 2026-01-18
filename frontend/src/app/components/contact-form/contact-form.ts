import { Component, effect, inject, input, output, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Contact } from '../../interfaces/contact';
import { ContactService } from '../../services/contact-service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-contact-form',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './contact-form.html',
  styleUrl: './contact-form.css',
})
export class ContactFormComponent {
  private contactService = inject(ContactService);
  contactToEdit = input<Contact | null>(null);
  idEditor = input.required<number>();
  formClosed = output<void>();

  showForm = signal(false);

  contactForm = new FormGroup({
    id: new FormControl<number>(0, { nonNullable: true }),
    name: new FormControl<string>('', { 
      nonNullable: true, 
      validators: [Validators.required, Validators.minLength(2)] 
    }),
    email: new FormControl<string>('', { 
      nonNullable: true, 
      validators: [Validators.required, Validators.email] 
    }),
    phone: new FormControl<string>('', { nonNullable: true }),
    role: new FormControl<string>('', { nonNullable: true }),
    priority: new FormControl<boolean>(false, { nonNullable: true }),
    idEditor: new FormControl<number>(0, { nonNullable: true })
  });

  constructor() {
    effect(() => {
      const contact = this.contactToEdit();
      if (contact) {
        this.contactForm.patchValue({
          id: contact.id,
          name: contact.name,
          email: contact.email,
          phone: contact.phone || '',
          role: contact.role || '',
          priority: contact.priority,
          idEditor: contact.idEditor
        });
        this.showForm.set(true);
      }
    });

    effect(() => {
      const editorId = this.idEditor();
      if (editorId) {
        this.contactForm.patchValue({ idEditor: editorId });
      }
    });
  }

  OpenCloseForm() {
    this.showForm.update(v => !v);
    if (!this.showForm()) {
      this.resetForm();
    }
  }

  onSubmit() {
    if (this.contactForm.valid) {
      const formValue = this.contactForm.getRawValue();
      const contact: Contact = {
        id: formValue.id,
        name: formValue.name,
        email: formValue.email,
        phone: formValue.phone,
        role: formValue.role,
        priority: formValue.priority,
        idEditor: formValue.idEditor
      };

      if (this.contactToEdit() && this.contactToEdit()!.id !== 0) {
        this.contactService.updateContact(contact).subscribe({
          next: () => {
            this.resetForm();
            this.showForm.set(false);
            this.formClosed.emit();
          },
          error: (err) => console.error('Erreur mise à jour:', err)
        });
      } else {
        const { id, ...contactToSend } = contact;
        this.contactService.addContactByEditor(contactToSend).subscribe({
          next: () => {
            this.resetForm();
            this.showForm.set(false);
            this.formClosed.emit();
          },
          error: (err) => console.error('Erreur création:', err)
        });
      }
    }
  }

  resetForm() {
    this.contactForm.reset({
      id: 0,
      name: '',
      email: '',
      phone: '',
      role: '',
      priority: false,
      idEditor: this.idEditor()
    });
  }

  isEditMode(): boolean {
    return this.contactToEdit() !== null && this.contactToEdit()!.id !== 0;
  }
}
