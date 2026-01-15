import { Injectable, inject } from '@angular/core';
import { Reservation } from '../interfaces/reservation';
import { Contact } from '../interfaces/contact';
import { HttpClient } from '@angular/common/http';
import { ReservationDAO } from '../interfaces/reservationDAO';
import { Observable } from 'rxjs';

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

  createReservation(reservation: Reservation): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/reservation`, reservation, { withCredentials: true });
  }

  updateReservation(idReservation: number, reservation: Partial<Reservation>): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/reservation/update/${idReservation}`, reservation, { withCredentials: true });
  }

  //addContactEntry(idReservation: number, entry: Contact) {
  //TODO
  //}

  //updateStatus(idReservation: number, newStatus: string) {
  //TODO
  //}
}

