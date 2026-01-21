import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ContactService } from '../../services/contact-service';
import { EditorService } from '../../services/editor-service';
import { Contact } from '../../interfaces/contact';
import { Editor } from '../../interfaces/editor';
import { ContactFormComponent } from '../contact-form/contact-form';

@Component({
  selector: 'app-editor-contacts',
  imports: [ContactFormComponent],
  templateUrl: './editor-contacts.html',
  styleUrl: './editor-contacts.css',
})
export class EditorContactsComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private contactService = inject(ContactService);
  private editorService = inject(EditorService);

  editor = signal<Editor | null>(null);
  contacts = this.contactService.contacts;
  contactToEdit = signal<Contact | null>(null);
  editorId = signal<number>(0);

  sortedContacts = computed(() => {
    return this.contactService.sortContactsByPriority(this.contacts());
  });

  constructor() {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      const editorId = parseInt(idParam, 10);
      this.editorId.set(editorId);
      this.loadEditor(editorId);
      this.loadContacts(editorId);
    }
  }

  loadEditor(id: number) {
    this.editorService.findById(id).subscribe({
      next: (editor) => this.editor.set(editor),
      error: (err) => console.error('Erreur chargement éditeur:', err)
    });
  }

  loadContacts(editorId: number) {
    this.contactService.getContactsByEditor(editorId);
  }

  onEditContact(contact: Contact) {
    this.contactToEdit.set(contact);
  }

  onFormClosed() {
    this.contactToEdit.set(null);
    this.loadContacts(this.editorId());
  }

  deleteContact(id: number) {
    const confirmDelete = confirm('Êtes-vous sûr de vouloir supprimer ce contact ?');
    if (confirmDelete) {
      this.contactService.deleteContact(id).subscribe({
        next: () => this.loadContacts(this.editorId()),
        error: (err) => console.error('Erreur suppression:', err)
      });
    }
  }

  goBack() {
    this.router.navigate(['/editor-list']);
  }
}
