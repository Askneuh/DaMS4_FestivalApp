import { Injectable, signal, inject } from '@angular/core';
import { Festival } from '../interfaces/festival';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class FestivalService {
  private readonly http = inject(HttpClient)
  private readonly apiUrl = 'https://localhost:4000/api';

  private readonly _festivalList = signal<Festival[]>([])
  readonly festivalList = this._festivalList.asReadonly()

  private readonly _currentFestival = signal<Festival | null>(null)
  readonly currentFestival = this._currentFestival.asReadonly()

  constructor() {
    this.loadFestivalsFromBD();
    this.loadCurrentFestival();
  }


  findByName(name: string): Observable<Festival> {
    return this.http.get<Festival>(`${this.apiUrl}/festivals/${name}`, { withCredentials: true })
  }


  removeFestivalByName(name: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/festivals/${name}`, { withCredentials: true });
  }



  addFestival(festival: Festival): void {
    this.http.post<Festival>(`${this.apiUrl}/festivals`, festival, { withCredentials: true })
      .subscribe({
        next: (newFestival) => {
          this._currentFestival.set(newFestival);
          this.loadFestivalsFromBD();
        }
      });
  }


  updateFestivalByName(name: string, festival: Festival): void {
    this.http.post<Festival>(`${this.apiUrl}/festivals/update/${name}`, festival, { withCredentials: true }).subscribe({
      next: (updatedFestival) => {
        this._currentFestival.set(updatedFestival);
        this.loadFestivalsFromBD();
      }
    });
  }



  loadFestivalsFromBD(): void {
    this.http.get<Festival[]>(`${this.apiUrl}/festivals`, { withCredentials: true })
      .subscribe(data => {
        this._festivalList.set(data);
        // Identifier le festival courant dans la liste
        const current = data.find(f => f.isCurrent === true);
        if (current) {
          this._currentFestival.set(current);
        }
      });
  }

  loadCurrentFestival(): void {
    this.http.get<Festival>(`${this.apiUrl}/festivals/current`, { withCredentials: true })
      .subscribe({
        next: (festival) => {
          this._currentFestival.set(festival);
        },
        error: (err) => {
          console.warn('Aucun festival courant défini', err);
          this._currentFestival.set(null);
        }
      });
  }

  setCurrentFestival(festivalName: string): Observable<Festival> {
    const observable = this.http.post<Festival>(
      `${this.apiUrl}/festivals/current/${festivalName}`,
      {},
      { withCredentials: true }
    );

    observable.subscribe({
      next: (festival) => {
        this._currentFestival.set(festival);
        // Mettre à jour la liste des festivals
        this.loadFestivalsFromBD();
      }
    });

    return observable;
  }

  getCurrentFestivalName(): string | null {
    return this._currentFestival()?.name || null;
  }
}