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

  // Signal pour stocker la liste des zones tarifaires
  tariffZoneList = signal<TariffZone[]>([]);

  /**
   * Récupère une zone tarifaire par son ID
   * @param idTZ - L'ID de la zone tarifaire
   * @returns Observable<TariffZone>
   */
  findById(idTZ: number): Observable<TariffZone> {
    return this.http.get<TariffZone>(`${this.apiUrl}/tariffZones/${idTZ}`);
  }

  /**
   * Récupère toutes les zones tarifaires d'un festival
   * @param festivalName - Le nom du festival
   * @returns Observable<TariffZone[]>
   */
  findByFestivalName(festivalName: string): Observable<TariffZone[]> {
    return this.http.get<TariffZone[]>(`${this.apiUrl}/tariffZones/festival/${festivalName}`);
  }

  /**
   * Crée une nouvelle zone tarifaire
   * @param tariffZone - La zone tarifaire à créer
   */
  addTariffZone(tariffZone: TariffZone) {
    this.http.post<{ message: string; id: number }>(`${this.apiUrl}/tariffZones`, tariffZone, { withCredentials: true })
      .subscribe({
        next: (response) => {
          console.log(`✅ Zone tarifaire "${tariffZone.name}" créée avec l'ID ${response.id}`);
          // Recharger les zones tarifaires du festival
          if (tariffZone.festivalName) {
            this.loadTariffZonesByFestival(tariffZone.festivalName);
          }
        },
        error: (err) => {
          console.error('Erreur lors de la création de la zone tarifaire :', err);
          if (err.status === 409) {
            alert('Une zone tarifaire avec cet ID existe déjà.');
          } else if (err.status === 400) {
            alert('Données invalides. Veuillez vérifier les informations saisies.');
          } else {
            alert('Une erreur serveur est survenue lors de la création de la zone tarifaire.');
          }
        }
      });
  }

  /**
   * Met à jour une zone tarifaire par son ID
   * @param idTZ - L'ID de la zone tarifaire à mettre à jour
   * @param tariffZone - Les nouvelles données de la zone tarifaire
   */
  updateTariffZoneById(idTZ: number, tariffZone: Partial<TariffZone>) {
    this.http.post<{ message: string }>(`${this.apiUrl}/tariffZones/update/${idTZ}`, tariffZone, { withCredentials: true })
      .subscribe({
        next: () => {
          console.log(`✅ Zone tarifaire ID ${idTZ} mise à jour avec succès`);
          // Mettre à jour la liste locale
          this.tariffZoneList.update(zones =>
            zones.map(z => z.idTZ === idTZ ? { ...z, ...tariffZone } as TariffZone : z)
          );
        },
        error: (err) => {
          console.error('Erreur lors de la mise à jour de la zone tarifaire :', err);
          if (err.status === 404) {
            alert('Zone tarifaire non trouvée.');
          } else {
            alert('Erreur lors de la modification en base de données.');
          }
        }
      });
  }

  /**
   * Supprime une zone tarifaire par son ID
   * @param idTZ - L'ID de la zone tarifaire à supprimer
   */
  deleteTariffZoneById(idTZ: number) {
    this.http.delete<{ message: string }>(`${this.apiUrl}/tariffZones/${idTZ}`, { withCredentials: true })
      .subscribe({
        next: () => {
          console.log(`✅ Zone tarifaire ID ${idTZ} supprimée`);
          // Mettre à jour la liste locale
          this.tariffZoneList.update(zones => zones.filter(z => z.idTZ !== idTZ));
        },
        error: (err) => {
          console.error('Erreur lors de la suppression de la zone tarifaire :', err);
          if (err.status === 404) {
            alert('Zone tarifaire non trouvée.');
          } else {
            alert('Une erreur serveur est survenue lors de la suppression de la zone tarifaire.');
          }
        }
      });
  }

  /**
   * Charge toutes les zones tarifaires d'un festival dans le signal
   * @param festivalName - Le nom du festival
   */
  loadTariffZonesByFestival(festivalName: string): void {
    this.findByFestivalName(festivalName).subscribe({
      next: (zones) => {
        this.tariffZoneList.set(zones);
        console.log(`✅ ${zones.length} zone(s) tarifaire(s) chargée(s) pour le festival "${festivalName}"`);
      },
      error: (err) => {
        console.error('Erreur lors du chargement des zones tarifaires :', err);
        if (err.status === 404) {
          // Aucune zone tarifaire trouvée, on initialise avec un tableau vide
          this.tariffZoneList.set([]);
        }
      }
    });
  }
}
