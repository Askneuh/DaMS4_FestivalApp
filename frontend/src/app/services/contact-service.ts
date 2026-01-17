import { Injectable, inject, signal, WritableSignal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Contact } from '../interfaces/contact';

@Injectable({
  providedIn: 'root',
})
export class ContactService {
  private readonly http = inject(HttpClient);
  private readonly base = 'https://localhost:4000/api/contact';

  private readonly _contacts: WritableSignal<Contact[]> = signal<Contact[]>([]);
  readonly contacts = this._contacts.asReadonly();

  private readonly _priorityContact: WritableSignal<Contact | null> = signal<Contact | null>(null);
  readonly priorityContact = this._priorityContact.asReadonly();

  getContactsByEditor(editorId: number): void {
    this.http.get<Contact[]>(`${this.base}/editor/${editorId}`, { withCredentials: true })
      .subscribe(data => this._contacts.set(data));
  }

  getPriorityContact(editorId: number): void {
    this.http.get<Contact>(`${this.base}/editor/${editorId}/priority`, { withCredentials: true })
      .subscribe({
        next: (data) => this._priorityContact.set(data),
        error: () => this._priorityContact.set(null)
      });
  }

  clearContacts(): void {
    this._contacts.set([]);
    this._priorityContact.set(null);
  }
}
