import { Injectable, inject, signal, WritableSignal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Contact } from '../interfaces/contact';
import { environment } from '../../environment/environment';

@Injectable({
  providedIn: 'root',
})
export class ContactService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/contact`;

  private readonly _contacts: WritableSignal<Contact[]> = signal<Contact[]>([]);
  readonly contacts = this._contacts.asReadonly();

  getContactsByEditor(editorId: number): void {
    this.http.get<Contact[]>(`${this.base}/editor/${editorId}`, { withCredentials: true })
      .subscribe(data => this._contacts.set(data));
  }

  clearContacts(): void {
    this._contacts.set([]);
  }

  addContactByEditor(contact: Omit<Contact, 'id'>): Observable<{ message: string; id: number }> {
    return this.http.post<{ message: string; id: number }>(this.base, contact, { withCredentials: true });
  }
  deleteContact(id: number): Observable<any> {
    return this.http.delete(`${this.base}/${id}`, { withCredentials: true });
  }

  updateContact(contact: Contact): Observable<any> {
    return this.http.post(`${this.base}/update/${contact.id}`, contact, { withCredentials: true });
  }

  /**
   * Trie les contacts par priorité puis par nom
   * @param contacts - Liste des contacts à trier
   * @returns Liste triée des contacts (prioritaires en premier, puis alphabétique)
   */
  sortContactsByPriority(contacts: Contact[]): Contact[] {
    return [...contacts].sort((a, b) => {
      if (a.priority && !b.priority) return -1;
      if (!a.priority && b.priority) return 1;
      return a.name.localeCompare(b.name);
    });
  }
}
