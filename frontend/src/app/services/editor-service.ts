import { Injectable, signal, inject } from '@angular/core';
import { Editor } from '../interfaces/editor';
import { Contact } from '../interfaces/contact';
import { Game } from '../interfaces/game';
import { EditorWithReservationStatus } from '../interfaces/editor-with-reservation-status';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class EditorService {
  private readonly http = inject(HttpClient)
  private readonly apiUrl = 'https://localhost:4000/api';

  private readonly _editors = signal<Editor[]>([])
  readonly editors = this._editors.asReadonly()

  constructor() {
    this.loadEditorsFromBD();
  }

  loadEditorsFromBD(): void {
    this.http.get<Editor[]>(`${this.apiUrl}/editeurs`, { withCredentials: true })
      .subscribe({
        next: (editors) => {
          this._editors.set(editors);
        },
        error: (err) => {
          console.error('Erreur lors du chargement des éditeurs :', err);
        }
      });
  }

  findById(id: number) {
    return this.http.get<Editor>(`${this.apiUrl}/editeurs/${id}`, { withCredentials: true })
  }


  addEditor(editor: Editor): Observable<Editor> {
    const { id, ...editorToSend } = editor;
    return this.http.post<Editor>(`${this.apiUrl}/editeurs`, editorToSend, { withCredentials: true });
  }


  updateEditor(editor: Editor, id: number): Observable<Editor> {
    return this.http.post<Editor>(`${this.apiUrl}/editeurs/update/${id}`, editor, { withCredentials: true });
  }

  getEditorsByFestival(festivalName: string): Observable<Editor[]> {
    return this.http.get<Editor[]>(`${this.apiUrl}/editeurs/festival/${festivalName}`, { withCredentials: true });
  }

  getEditorsWithReservationStatus(festivalName: string): Observable<EditorWithReservationStatus[]> {
    return this.http.get<EditorWithReservationStatus[]>(
      `${this.apiUrl}/editeurs/festival/${festivalName}/withReservationStatus`,
      { withCredentials: true }
    );
  }

  getEditorsWithReservationStatusForCurrentFestival(): Observable<EditorWithReservationStatus[]> {
    return this.http.get<EditorWithReservationStatus[]>(
      `${this.apiUrl}/editeurs/current-festival/withReservationStatus`,
      { withCredentials: true }
    );
  }

  removeEditor(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/editeurs/${id}`, { withCredentials: true });
  }
}
