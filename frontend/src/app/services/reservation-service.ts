import { Injectable, inject } from '@angular/core';
import { Reservation } from '../interfaces/reservation';
import { Contact } from '../interfaces/contact';
import { HttpClient } from '@angular/common/http';
import { ReservationDAO } from '../interfaces/reservationDAO';
import { Observable } from 'rxjs';
import { environment } from '../../environment/environment';

import { ReservationGame } from '../interfaces/reservation-game';

@Injectable({
  providedIn: 'root',
})
export class ReservationService {

  private readonly API_URL = environment.apiUrl;
  private readonly http = inject(HttpClient);

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

  /**
   * Transforme les données du formulaire en objet Reservation
   * @param formValue - Valeurs brutes du formulaire
   * @returns Reservation typée
   */
  mapFormToReservation(formValue: any): any {
    return {
      idReservation: formValue.idReservation || 0,
      idEditor: formValue.idEditor,
      status: formValue.status,
      nbSmallTables: formValue.nbSmallTables,
      nbLargeTables: formValue.nbLargeTables,
      nbCityHallTables: formValue.nbCityHallTables,
      remise: formValue.remise,
      typeAnimateur: formValue.typeAnimateur,
      listeDemandee: formValue.listeDemandee,
      listeRecue: formValue.listeRecue,
      jeuxRecus: formValue.jeuxRecus,
      festivalName: formValue.festivalName,
      idTZ: formValue.idTZ
    };
  }

  /**
   * Calcule le prix total d'une réservation
   * @param reservation - Données de la réservation
   * @param zone - Zone tarifaire
   * @returns Prix total après remise
   */
  calculateTotalPrice(
    reservation: {
      nbSmallTables: number;
      nbLargeTables: number;
      nbCityHallTables: number;
      m2?: number;
      remise: number;
    },
    zone: {
      smallTablePrice: number;
      largeTablePrice: number;
      cityHallTablePrice: number;
      squareMeterPrice?: number;
    }
  ): number {
    const smallPrice = (reservation.nbSmallTables || 0) * Number(zone.smallTablePrice || 0);
    const largePrice = (reservation.nbLargeTables || 0) * Number(zone.largeTablePrice || 0);
    const cityHallPrice = (reservation.nbCityHallTables || 0) * Number(zone.cityHallTablePrice || 0);
    // m² price = smallTablePrice / 4 (since 4m² = 1 small table)
    const m2Price = (reservation.m2 || 0) * (Number(zone.smallTablePrice || 0) / 4);

    return Math.max(0, smallPrice + largePrice + cityHallPrice + m2Price - Number(reservation.remise || 0));
  }

  /**
   * Crée une réservation par défaut pour un éditeur
   * @param editorId - ID de l'éditeur
   * @param festivalName - Nom du festival
   * @returns Réservation avec valeurs par défaut
   */
  createDefaultReservation(editorId: number, festivalName: string): any {
    return {
      idEditor: editorId,
      status: 'Contact pris',
      nbSmallTables: 0,
      nbLargeTables: 0,
      nbCityHallTables: 0,
      remise: 0,
      typeAnimateur: 0,
      listeDemandee: false,
      listeRecue: false,
      jeuxRecus: false,
      festivalName: festivalName,
      idTZ: 1
    };
  }

  /**
   * Calcule le nombre total de tables d'une réservation
   * @param reservation - Réservation
   * @returns Total de tables (small + large + cityHall)
   */
  calculateTotalTablesCount(reservation: any): number {
    return (reservation.nbSmallTables || 0) +
      (reservation.nbLargeTables || 0) +
      (reservation.nbCityHallTables || 0) +
      Math.ceil((reservation.m2 || 0) / 4);
  }

  /**
   * Filtre et trie les réservations pour l'affichage en liste
   * Transforme les éditeurs avec réservations en items de liste avec calculs
   * @param editors - Liste des éditeurs (avec propriété reservation optionnelle)
   * @param searchTerm - Terme de recherche (nom d'éditeur, insensible à la casse)
   * @param statusFilter - Filtre de statut ('all' ou statut spécifique)
   * @param sortColumn - Colonne de tri ('name', 'status', 'price', 'tables')
   * @param sortDirection - Direction du tri ('asc' ou 'desc')
   * @returns Liste filtrée et triée d'items de réservation
   */
  filterAndSortReservations(
    editors: any[],
    searchTerm: string,
    statusFilter: string,
    sortColumn: 'name' | 'status' | 'price' | 'tables',
    sortDirection: 'asc' | 'desc'
  ): any[] {
    const search = searchTerm.toLowerCase();

    // 1. Transformation : créer les items avec données calculées
    let result = editors
      .filter(e => e.exposant) // Seulement les exposants
      .map(editor => ({
        editor: {
          id: editor.id,
          name: editor.name,
          logo: editor.logo,
          exposant: editor.exposant,
          distributeur: editor.distributeur
        },
        reservation: editor.reservation,
        status: editor.reservation?.status || 'Pas encore de contact',
        lastContact: editor.reservation?.lastContactDate || null,
        totalPrice: editor.reservation?.totalPrice || 0,
        totalTables: editor.reservation
          ? (editor.reservation.totalTables !== undefined 
              ? editor.reservation.totalTables 
              : this.calculateTotalTablesCount(editor.reservation))
          : 0
      }));

    // 2. Filtrage par nom et statut
    result = result.filter(item => {
      const matchesSearch = item.editor.name.toLowerCase().startsWith(search);
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    // 3. Tri par colonne
    result.sort((a, b) => {
      let valA: any, valB: any;

      switch (sortColumn) {
        case 'name':
          valA = a.editor.name;
          valB = b.editor.name;
          break;
        case 'status':
          valA = a.status;
          valB = b.status;
          break;
        case 'price':
          valA = a.totalPrice;
          valB = b.totalPrice;
          break;
        case 'tables':
          valA = a.totalTables;
          valB = b.totalTables;
          break;
        default:
          valA = a.editor.name;
          valB = b.editor.name;
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }
}

