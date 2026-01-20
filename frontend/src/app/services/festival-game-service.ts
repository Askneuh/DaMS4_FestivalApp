import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Game } from '../interfaces/game';
import { environment } from '../../environment/environment';

@Injectable({
  providedIn: 'root',
})
export class FestivalGameService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/festivalGame`;


  getGamesByFestival(festivalName: string): Observable<Game[]> {
    return this.http.get<Game[]>(`${this.apiUrl}/byFestival/${festivalName}`, { withCredentials: true });
  }


  getGamesByReservation(reservationId: number): Observable<Game[]> {
    return this.http.get<Game[]>(`${this.apiUrl}/byReservation/${reservationId}`, { withCredentials: true });
  }


  addGameToReservation(reservationId: number, gameId: number): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.apiUrl}/add`,
      { idReservation: reservationId, idGame: gameId },
      { withCredentials: true }
    );
  }

  removeGameFromReservation(reservationId: number, gameId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `${this.apiUrl}/remove/${reservationId}/${gameId}`,
      { withCredentials: true }
    );
  }
}
