import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Game } from '../interfaces/game';
import { Mechanism } from '../interfaces/mechanism';

@Injectable({
  providedIn: 'root',
})
export class GameService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'https://localhost:4000/api';

  // Signal pour stocker la liste des jeux
  private readonly _gameList = signal<Game[]>([]);
  readonly gameList = this._gameList.asReadonly();

  constructor() {
    this.loadGamesFromBD();
  }

  /**
   * Charge tous les jeux depuis la base de données
   */
  loadGamesFromBD(): void {
    this.http.get<Game[]>(`${this.apiUrl}/games`, { withCredentials: true })
      .subscribe({
        next: (games) => {
          this._gameList.set(games);
          console.log(`✅ ${games.length} jeu(x) chargé(s) depuis la base de données`);
        },
        error: (err) => {
          console.error('Erreur lors du chargement des jeux :', err);
        }
      });
  }

  /**
   * Récupère un jeu par son ID
   * @param id - L'ID du jeu
   * @returns Observable<Game>
   */
  findById(id: number): Observable<Game> {
    return this.http.get<Game>(`${this.apiUrl}/games/${id}`, { withCredentials: true });
  }

  /**
   * Récupère tous les jeux d'un éditeur
   * @param idEditor - L'ID de l'éditeur
   * @returns Observable<Game[]>
   */
  getGamesByEditor(idEditor: number): Observable<Game[]> {
    return this.http.get<Game[]>(`${this.apiUrl}/games/byEditor/${idEditor}`, { withCredentials: true });
  }

  /**
   * Récupère tous les jeux qu'un éditeur N'A PAS (jeux des autres éditeurs)
   * @param idEditor - L'ID de l'éditeur
   * @returns Observable<Game[]>
   */
  getGamesThatEditorDontHave(idEditor: number): Observable<Game[]> {
    return this.http.get<Game[]>(`${this.apiUrl}/games/notByEditor/${idEditor}`, { withCredentials: true });
  }

  /**
   * Récupère les mécanismes d'un jeu
   * @param idGame - L'ID du jeu
   * @returns Observable<Mechanism[]>
   */
  getMechanismsByGame(idGame: number): Observable<Mechanism[]> {
    return this.http.get<Mechanism[]>(`${this.apiUrl}/games/${idGame}/mechanisms`, { withCredentials: true });
  }

  /**
   * Récupère le libellé du type de jeu
   * @param idGameType - L'ID du type de jeu
   * @returns Observable<{ gameTypeLabel: string }>
   */
  getGameTypeLabel(idGameType: number): Observable<{ gameTypeLabel: string }> {
    return this.http.get<{ gameTypeLabel: string }>(`${this.apiUrl}/games/gameType/${idGameType}/label`, { withCredentials: true });
  }

  /**
   * Crée un nouveau jeu
   * @param game - Le jeu à créer
   */
  addGame(game: Game): void {
    const { id, ...gameToSend } = game;

    this.http.post<{ message: string; id: number }>(`${this.apiUrl}/games`, gameToSend, { withCredentials: true })
      .subscribe({
        next: (response) => {
          console.log(`✅ Jeu "${game.name}" créé avec l'ID ${response.id}`);
          this.loadGamesFromBD(); // Recharger la liste
        },
        error: (err) => {
          console.error('Erreur lors de la création du jeu :', err);
          if (err.status === 409) {
            alert('Un jeu avec cet ID existe déjà.');
          } else if (err.status === 400) {
            alert('Données invalides. Veuillez vérifier les informations saisies.');
          } else {
            alert('Une erreur serveur est survenue lors de la création du jeu.');
          }
        }
      });
  }

  /**
   * Met à jour un jeu par son ID
   * @param id - L'ID du jeu à mettre à jour
   * @param game - Les nouvelles données du jeu
   */
  updateGame(id: number, game: Partial<Game>): void {
    this.http.post<{ message: string }>(`${this.apiUrl}/games/update/${id}`, game, { withCredentials: true })
      .subscribe({
        next: () => {
          console.log(`✅ Jeu ID ${id} mis à jour avec succès`);
          this.loadGamesFromBD(); // Recharger la liste
        },
        error: (err) => {
          console.error('Erreur lors de la mise à jour du jeu :', err);
          if (err.status === 404) {
            alert('Jeu non trouvé.');
          } else {
            alert('Erreur lors de la modification en base de données.');
          }
        }
      });
  }

  /**
   * Supprime un jeu par son ID
   * @param id - L'ID du jeu à supprimer
   */
  deleteGame(id: number): void {
    this.http.delete<{ message: string }>(`${this.apiUrl}/games/${id}`, { withCredentials: true })
      .subscribe({
        next: () => {
          this._gameList.update(games => games.filter(g => g.id !== id));
          console.log(`✅ Jeu ID ${id} supprimé avec succès`);
        },
        error: (err) => {
          console.error('Erreur lors de la suppression du jeu :', err);
          if (err.status === 404) {
            alert('Jeu non trouvé.');
          } else {
            alert('Une erreur serveur est survenue lors de la suppression du jeu.');
          }
        }
      });
  }
}
