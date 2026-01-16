import { Injectable, signal, inject } from '@angular/core';
import { Editor } from '../interfaces/editor';
import { Contact } from '../interfaces/contact';
import { Game } from '../interfaces/game';
import { HttpClient } from '@angular/common/http';

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

  /**
   * Charge tous les éditeurs depuis la base de données
   */
  loadEditorsFromBD(): void {
    this.http.get<Editor[]>(`${this.apiUrl}/editeurs`, { withCredentials: true })
      .subscribe({
        next: (editors) => {
          this._editors.set(editors);
          console.log(`✅ ${editors.length} éditeur(s) chargé(s) depuis la base de données`);
        },
        error: (err) => {
          console.error('Erreur lors du chargement des éditeurs :', err);
        }
      });
  }

  findById(id: number) {
    return this.http.get<Editor>(`${this.apiUrl}/editeurs/${id}`, { withCredentials: true })
  }


  addEditor(editor: Editor) {
    // 1. On prépare l'objet sans l'ID d'origine (optionnel car le SQL l'ignore, mais plus propre)
    const { id, ...editorToSend } = editor;

    this.http.post<Editor>(`${this.apiUrl}/editeurs`, editorToSend, { withCredentials: true })
      .subscribe({
        next: (newEditorFromBD) => {

          this._editors.update(list => [...list, newEditorFromBD]);

          console.log(`✅ ${newEditorFromBD.name} a été ajouté avec l'ID n°${newEditorFromBD.id}`);
          alert(`Éditeur "${newEditorFromBD.name}" créé avec succès dans la base de données !`);
        },
        error: (err) => {
          console.error('Erreur lors de la création dans la BDD :', err);
          alert('Erreur lors de la création. Vérifiez la console.');
        }
      });
  }


  updateEditor(partial: Partial<Editor>, id: number) {
    this.http.post<Editor>(`${this.apiUrl}/editeurs/update/${id}`, partial, { withCredentials: true })
      .subscribe({
        next: (updatedEditor) => {
          // Mise à jour du signal avec l'objet exact provenant de la BDD
          this._editors.update(list =>
            list.map(e => (e.id === id ? updatedEditor : e))
          );

          console.log(`Éditeur "${updatedEditor.name}" mis à jour avec succès.`);
        },
        error: (err) => {
          console.error('Erreur lors de la mise à jour :', err);
          alert('Erreur lors de la modification en base de données.');
        }
      });
  }

  /**
   * Supprime un éditeur par son ID
   */
  removeEditor(id: number): void {
    this.http.delete<{ message: string }>(`${this.apiUrl}/editeurs/${id}`, { withCredentials: true })
      .subscribe({
        next: () => {
          this._editors.update(list => list.filter(e => e.id !== id));
          console.log(`✅ Éditeur ID ${id} supprimé avec succès`);
        },
        error: (err) => {
          console.error('Erreur lors de la suppression de l\'éditeur :', err);
          if (err.status === 404) {
            alert('Éditeur non trouvé.');
          } else {
            alert('Une erreur serveur est survenue lors de la suppression de l\'éditeur.');
          }
        }
      });
  }

}
