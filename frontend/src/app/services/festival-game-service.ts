import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Game } from '../interfaces/game';

@Injectable({
  providedIn: 'root',
})
export class FestivalGameService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'https://localhost:4000/api/festivalGame';

  /**
   * Récupère tous les jeux présentés lors d'un festival
   * @param festivalName - Le nom du festival
   * @returns Observable<Game[]>
   */
  getGamesByFestival(festivalName: string): Observable<Game[]> {
    return this.http.get<Game[]>(`${this.apiUrl}/byFestival/${festivalName}`, { withCredentials: true });
  }

  /**
   * Récupère tous les jeux d'une réservation
   * @param reservationId - L'ID de la réservation
   * @returns Observable<Game[]>
   */
  getGamesByReservation(reservationId: number): Observable<Game[]> {
    return this.http.get<Game[]>(`${this.apiUrl}/byReservation/${reservationId}`, { withCredentials: true });
  }

  /**
   * Ajoute un jeu à une réservation
   * @param reservationId - L'ID de la réservation
   * @param gameId - L'ID du jeu
   * @returns Observable<{ message: string }>
   */
  addGameToReservation(reservationId: number, gameId: number): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.apiUrl}/add`,
      { idReservation: reservationId, idGame: gameId },
      { withCredentials: true }
    );
  }

  /**
   * Retire un jeu d'une réservation
   * @param reservationId - L'ID de la réservation
   * @param gameId - L'ID du jeu
   * @returns Observable<{ message: string }>
   */
  removeGameFromReservation(reservationId: number, gameId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `${this.apiUrl}/remove/${reservationId}/${gameId}`,
      { withCredentials: true }
    );
  }
}
