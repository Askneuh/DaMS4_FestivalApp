import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Game } from '../interfaces/game';
import { Mechanism } from '../interfaces/mechanism';
import { environment } from '../../environment/environment';

@Injectable({
  providedIn: 'root',
})
export class GameService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  private readonly _gameList = signal<Game[]>([]);
  readonly gameList = this._gameList.asReadonly();

  constructor() {
    this.loadGamesFromBD();
  }

  loadGamesFromBD(): void {
    this.http.get<Game[]>(`${this.apiUrl}/games`, { withCredentials: true })
      .subscribe({
        next: (games) => {
          this._gameList.set(games);
        },
        error: (err) => {
          console.error('Erreur lors du chargement des jeux :', err);
        }
      });
  }

  findById(id: number): Observable<Game> {
    return this.http.get<Game>(`${this.apiUrl}/games/${id}`, { withCredentials: true });
  }

  getGamesByEditor(idEditor: number): Observable<Game[]> {
    return this.http.get<Game[]>(`${this.apiUrl}/games/byEditor/${idEditor}`, { withCredentials: true });
  }

  getGamesThatEditorDontHave(idEditor: number): Observable<Game[]> {
    return this.http.get<Game[]>(`${this.apiUrl}/games/notByEditor/${idEditor}`, { withCredentials: true });
  }

  getGamesOfDistributeurs(): Observable<Game[]> {
    return this.http.get<Game[]>(`${this.apiUrl}/games/byDistributeurs`, { withCredentials: true });
  }

  getMechanismsByGame(idGame: number): Observable<Mechanism[]> {
    return this.http.get<Mechanism[]>(`${this.apiUrl}/games/${idGame}/mechanisms`, { withCredentials: true });
  }

  getGameTypeLabel(idGameType: number): Observable<{ gameTypeLabel: string }> {
    return this.http.get<{ gameTypeLabel: string }>(`${this.apiUrl}/games/gameType/${idGameType}/label`, { withCredentials: true });
  }

  addGame(game: Game): Observable<{ message: string; id: number }> {
    const { id, ...gameToSend } = game;
    return this.http.post<{ message: string; id: number }>(`${this.apiUrl}/games`, gameToSend, { withCredentials: true });
  }

  updateGame(id: number, game: Game): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/games/update/${id}`, game, { withCredentials: true });
  }

  deleteGame(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/games/${id}`, { withCredentials: true });
  }

  getGamesByTariffZone(tariffZone: string): Observable<Game[]> {
    return this.http.get<Game[]>(`${this.apiUrl}/games/byTariffZone/${tariffZone}`, { withCredentials: true });
  }


  mapFormToGame(formValue: any): Game {
    return {
      id: formValue.id,
      name: formValue.name,
      author: formValue.author,
      nbMinPlayer: formValue.nbMinPlayer,
      nbMaxPlayer: formValue.nbMaxPlayer,
      idGameType: formValue.idGameType,
      minimumAge: formValue.minimumAge,
      duration: formValue.duration,
      prototype: formValue.prototype,
      theme: formValue.theme,
      description: formValue.description,
      gameNotice: formValue.gameNotice,
      gameImage: formValue.gameImage,
      rulesTutorial: formValue.rulesTutorial,
      edition: formValue.edition,
      idEditor: formValue.idEditor
    };
  }

  /**
   * Retourne les valeurs par défaut pour la création d'un jeu
   * @param editorId - ID de l'éditeur
   * @returns Objet Game avec valeurs par défaut
   */
  getDefaultGameValues(editorId: number): Partial<Game> {
    return {
      id: 0,
      name: '',
      author: '',
      nbMinPlayer: 1,
      nbMaxPlayer: 4,
      idGameType: 1,
      minimumAge: 6,
      duration: 30,
      prototype: false,
      theme: '',
      description: '',
      gameNotice: '',
      gameImage: '',
      rulesTutorial: '',
      edition: 2024,
      idEditor: editorId
    };
  }

  /**
   * Filtre les jeux par terme de recherche
   * @param games - Liste des jeux à filtrer
   * @param searchTerm - Terme de recherche
   * @returns Liste filtrée des jeux
   */
  filterGames(games: Game[], searchTerm: string): Game[] {
    const term = searchTerm.toLowerCase();
    return games.filter(g =>
      g.name.toLowerCase().includes(term) ||
      g.author.toLowerCase().includes(term)
    );
  }

  /**
   * Trie les jeux selon le critère spécifié
   * @param games - Liste des jeux à trier
   * @param sortBy - Critère de tri
   * @returns Liste triée des jeux
   */
  sortGames(
    games: Game[],
    sortBy: 'name' | 'author' | 'duration' | 'players'
  ): Game[] {
    const result = [...games];

    switch (sortBy) {
      case 'name':
        return result.sort((a, b) => a.name.localeCompare(b.name));
      case 'author':
        return result.sort((a, b) => a.author.localeCompare(b.author));
      case 'duration':
        return result.sort((a, b) => a.duration - b.duration);
      case 'players':
        return result.sort((a, b) => a.nbMinPlayer - b.nbMinPlayer);
      default:
        return result;
    }
  }
}
