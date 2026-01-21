import { Injectable, signal, inject } from '@angular/core';
import { Festival } from '../interfaces/festival';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environment/environment';
import { FestivalGameRow } from '../interfaces/festival-game-row';

@Injectable({
  providedIn: 'root'
})
export class FestivalService {
  private readonly http = inject(HttpClient)
  private readonly apiUrl = environment.apiUrl;

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

  getFestivalGames(festivalName: string): Observable<FestivalGameRow[]> {
    return this.http.get<FestivalGameRow[]>(`${this.apiUrl}/festivals/${festivalName}/games`, { withCredentials: true });
  }


  removeFestivalByName(name: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/festivals/${name}`, { withCredentials: true });
  }



  addFestival(festival: Festival): Observable<Festival> {
    return this.http.post<Festival>(`${this.apiUrl}/festivals`, festival, { withCredentials: true })
      .pipe(
        tap((newFestival) => {
          this._currentFestival.set(newFestival);
          this.loadFestivalsFromBD();
        })
      );
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

  /**
   * Prépare les données du formulaire pour la sauvegarde en base de données
   * Transforme formValue → Festival avec calcul des totaux depuis les zones
   * @param formValue - Valeurs brutes du formulaire
   * @returns Festival prêt à être sauvegardé
   */
  prepareFestivalForSave(formValue: any): Festival {
    const zones = (formValue.tariffZones || []).map((zone: any) => ({
      idTZ: zone.idTZ || 0,
      name: zone.name,
      nbSmallTables: zone.nbSmallTables || 0,
      nbLargeTables: zone.nbLargeTables || 0,
      nbCityHallTables: zone.nbCityHallTables || 0,
      remainingSmallTables: zone.nbSmallTables || 0,
      remainingLargeTables: zone.nbLargeTables || 0,
      remainingCityHallTables: zone.nbCityHallTables || 0,
      smallTablePrice: zone.smallTablePrice || 0,
      largeTablePrice: zone.largeTablePrice || 0,
      cityHallTablePrice: zone.cityHallTablePrice || 0,
      squareMeterPrice: zone.squareMeterPrice || 0,
      festivalName: formValue.name
    }));

    // Compute totals from zones
    let totalSmall = 0;
    let totalLarge = 0;
    let totalCityHall = 0;
    for (const z of zones) {
      totalSmall += z.nbSmallTables;
      totalLarge += z.nbLargeTables;
      totalCityHall += z.nbCityHallTables;
    }

    const festival: Festival = {
      name: formValue.name,
      nbSmallTables: totalSmall,
      nbLargeTables: totalLarge,
      nbCityHallTables: totalCityHall,
      remainingSmallTables: totalSmall,
      remainingLargeTables: totalLarge,
      remainingCityHallTables: totalCityHall,
      isCurrent: false,
      tariffZones: zones
    };

    return festival;
  }

  /**
   * Calcule les tables réellement restantes d'un festival
   * en soustrayant les tables allouées aux zones tarifaires
   * @param festival - Festival avec ses zones tarifaires
   * @returns Objet avec les tables restantes par type
   */
  calculateRemainingTables(festival: Festival): {
    remainingSmallTables: number;
    remainingLargeTables: number;
    remainingCityHallTables: number;
  } {
    // Si pas de zones tarifaires, toutes les tables sont disponibles
    if (!festival.tariffZones || festival.tariffZones.length === 0) {
      return {
        remainingSmallTables: festival.nbSmallTables,
        remainingLargeTables: festival.nbLargeTables,
        remainingCityHallTables: festival.nbCityHallTables
      };
    }

    // Calculer le total alloué aux zones tarifaires
    let allocatedSmall = 0;
    let allocatedLarge = 0;
    let allocatedCityHall = 0;

    festival.tariffZones.forEach(zone => {
      allocatedSmall += zone.nbSmallTables || 0;
      allocatedLarge += zone.nbLargeTables || 0;
      allocatedCityHall += zone.nbCityHallTables || 0;
    });

    // Retourner les tables restantes (total - alloué)
    return {
      remainingSmallTables: Math.max(0, festival.nbSmallTables - allocatedSmall),
      remainingLargeTables: Math.max(0, festival.nbLargeTables - allocatedLarge),
      remainingCityHallTables: Math.max(0, festival.nbCityHallTables - allocatedCityHall)
    };
  }

}