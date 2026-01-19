import { Injectable, inject } from '@angular/core';
import { Reservation } from '../interfaces/reservation';
import { Contact } from '../interfaces/contact';
import { HttpClient } from '@angular/common/http';
import { ReservationDAO } from '../interfaces/reservationDAO';
import { Observable } from 'rxjs';

import { ReservationGame } from '../interfaces/reservation-game';

@Injectable({
  providedIn: 'root',
})
export class ReservationService {


  public readonly API_URL = 'https://localhost:4000/api';
  public readonly http = inject(HttpClient);

  getReservationsByEditor(idEditor: number): Observable<ReservationDAO[]> {
    return this.http.get<ReservationDAO[]>(`${this.API_URL}/reservation/byEditor/${idEditor}`, { withCredentials: true });
  }

  getReservationsByFestival(festivalName: string): Observable<ReservationDAO[]> {
    return this.http.get<ReservationDAO[]>(`${this.API_URL}/reservation/byFestival/${festivalName}`, { withCredentials: true });
  }

  getReservationById(idReservation: number): Observable<ReservationDAO> {
    return this.http.get<ReservationDAO>(`${this.API_URL}/reservation/${idReservation}`, { withCredentials: true });
  }

  createReservation(reservation: Partial<Reservation>): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/reservation`, reservation, { withCredentials: true });
  }

  updateReservation(idReservation: number, reservation: Reservation): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/reservation/update/${idReservation}`, reservation, { withCredentials: true });
  }

  getReservationGames(idReservation: number): Observable<ReservationGame[]> {
    return this.http.get<ReservationGame[]>(`${this.API_URL}/reservation/${idReservation}/games`, { withCredentials: true });
  }

  addGameToReservation(idReservation: number, idGame: number, quantity: number = 1): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/reservation/${idReservation}/games`, { idGame, quantity }, { withCredentials: true });
  }

  updateGameInReservation(idReservation: number, idGame: number, updates: { quantity?: number, isGamePlaced?: boolean }): Observable<any> {
    return this.http.put<any>(`${this.API_URL}/reservation/${idReservation}/games/${idGame}`, updates, { withCredentials: true });
  }

  removeGameFromReservation(idReservation: number, idGame: number): Observable<any> {
    return this.http.delete<any>(`${this.API_URL}/reservation/${idReservation}/games/${idGame}`, { withCredentials: true });
  }

  addSuivi(idReservation: number, status: string, commentaire: string = ''): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/suiviReservation`, { idReservation, status, commentaire }, { withCredentials: true });
  }

  updateStatus(idReservation: number, newStatus: string): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/reservation/update/${idReservation}`, { status: newStatus }, { withCredentials: true });
  }

  getSuiviHistory(idReservation: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/suiviReservation/reservation/${idReservation}`, { withCredentials: true });
  }
}

