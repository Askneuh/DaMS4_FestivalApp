import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TariffZone } from '../interfaces/tariff-zone';

@Injectable({
  providedIn: 'root',
})
export class TariffZoneService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'https://localhost:4000/api';

  private readonly _tariffZoneList = signal<TariffZone[]>([]);
  readonly tariffZoneList = this._tariffZoneList.asReadonly();

  findById(idTZ: number): Observable<TariffZone> {
    return this.http.get<TariffZone>(`${this.apiUrl}/tariffZones/${idTZ}`, { withCredentials: true });
  }

  findByFestivalName(festivalName: string): Observable<TariffZone[]> {
    return this.http.get<TariffZone[]>(`${this.apiUrl}/tariffZones/festival/${festivalName}`, { withCredentials: true });
  }

  addTariffZone(tariffZone: TariffZone): Observable<{ message: string; id: number }> {
    return this.http.post<{ message: string; id: number }>(`${this.apiUrl}/tariffZones`, tariffZone, { withCredentials: true });
  }

  updateTariffZoneById(idTZ: number, tariffZone: TariffZone): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/tariffZones/update/${idTZ}`, tariffZone, { withCredentials: true });
  }

  deleteTariffZoneById(idTZ: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/tariffZones/${idTZ}`, { withCredentials: true });
  }

  loadTariffZonesByFestival(festivalName: string): void {
    this.findByFestivalName(festivalName).subscribe({
      next: (zones) => {
        this._tariffZoneList.set(zones);
      },
      error: (err) => {
        console.error('Erreur lors du chargement des zones tarifaires :', err);
        if (err.status === 404) {
          this._tariffZoneList.set([]);
        }
      }
    });
  }
}
