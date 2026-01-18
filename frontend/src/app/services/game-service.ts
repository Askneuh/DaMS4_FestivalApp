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
}
