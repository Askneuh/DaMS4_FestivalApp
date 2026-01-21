import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Game } from '../interfaces/game';
import { Observable } from 'rxjs';
import { environment } from '../../environment/environment';

@Injectable({
  providedIn: 'root'
})
export class GameServiceTemp {
  private readonly API_URL = `${environment.apiUrl}/game`;
  private readonly http = inject(HttpClient);

  getGameById(id: number): Observable<Game> {
    return this.http.get<Game>(`${this.API_URL}/${id}`, { withCredentials: true });
  }

  getGamesByEditor(idEditor: number): Observable<Game[]> {
    return this.http.get<Game[]>(`${this.API_URL}/byEditor/${idEditor}`, { withCredentials: true });
  }

  createGame(game: Partial<Game>): Observable<{ message: string, id: number }> {
    return this.http.post<{ message: string, id: number }>(this.API_URL, game, { withCredentials: true });
  }

  updateGame(id: number, game: Partial<Game>): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.API_URL}/update/${id}`, game, { withCredentials: true });
  }

  deleteGame(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.API_URL}/${id}`, { withCredentials: true });
  }
}
