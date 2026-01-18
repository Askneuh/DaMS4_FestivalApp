import { Injectable, inject, signal, WritableSignal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Contact } from '../interfaces/contact';

@Injectable({
  providedIn: 'root',
})
export class ContactService {
  private readonly http = inject(HttpClient);
  private readonly base = 'https://localhost:4000/api/contact';

  private readonly _contacts: WritableSignal<Contact[]> = signal<Contact[]>([]);
  readonly contacts = this._contacts.asReadonly();

  getContactsByEditor(editorId: number): void {
    this.http.get<Contact[]>(`${this.base}/editor/${editorId}`, { withCredentials: true })
      .subscribe(data => this._contacts.set(data));
  }

  getPriorityContact(editorId: number): Observable<Contact> {
    return this.http.get<Contact>(`${this.base}/editor/${editorId}/priority`, { withCredentials: true });
  }

  clearContacts(): void {
    this._contacts.set([]);
  }
}
