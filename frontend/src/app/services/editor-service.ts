import { Injectable, signal, inject } from '@angular/core';
import { Editor } from '../interfaces/editor';
import { Contact } from '../interfaces/contact';
import { Game } from '../interfaces/game';
import { EditorWithReservationStatus } from '../interfaces/editor-with-reservation-status';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment/environment';

@Injectable({
  providedIn: 'root',
})
export class EditorService {
  private readonly http = inject(HttpClient)
  private readonly apiUrl = environment.apiUrl;

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

  /**
   * Transforme les données du formulaire en objet Editor
   * @param formValue - Valeurs brutes du formulaire
   * @returns Editor typé
   */
  mapFormToEditor(formValue: any): Editor {
    return {
      id: formValue.id ?? 0,
      name: formValue.name,
      exposant: formValue.exposant,
      distributeur: formValue.distributeur,
      logo: formValue.logo
    };
  }

  /**
   * Filtre et trie les éditeurs selon les critères
   * @param editors - Liste des éditeurs
   * @param filterType - Type de filtre ('all' | 'exposant' | 'distributeur' | 'both')
   * @param searchTerm - Terme de recherche
   * @returns Liste filtrée et triée
   */
  filterEditors(
    editors: Editor[],
    filterType: 'all' | 'exposant' | 'distributeur' | 'both',
    searchTerm: string
  ): Editor[] {
    let result = editors;

    // Filtrage par type
    if (filterType === 'exposant') {
      result = result.filter(e => e.exposant);
    } else if (filterType === 'distributeur') {
      result = result.filter(e => e.distributeur);
    } else if (filterType === 'both') {
      result = result.filter(e => e.exposant && e.distributeur);
    }

    // Filtrage par recherche
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      result = result.filter(e => e.name.toLowerCase().startsWith(search));
    }

    // Tri alphabétique
    return result.sort((a, b) => a.name.localeCompare(b.name));
  }
}
