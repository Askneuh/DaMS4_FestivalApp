import { Injectable, signal, inject } from '@angular/core';
import { Festival } from '../interfaces/festival';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FestivalService {
  public readonly http = inject(HttpClient)
  private readonly apiUrl = 'https://localhost:4000/api';

  festival1 = {
    name: "Festival-Rose",
    nbSmallTables: 30,
    nbLargeTables: 15,
    nbCityHallTables: 5,
    remainingSmallTables: 30,
    remainingLargeTables: 15,
    remainingCityHallTables: 5,
    tariffZones: [
      { idTZ: 1, name: "Zone A", nbSmallTables: 12, nbLargeTables: 6, nbCityHallTables: 2, remainingSmallTables: 12, remainingLargeTables: 6, remainingCityHallTables: 2, smallTablePrice: 80, largeTablePrice: 120, cityHallTablePrice: 150, festivalName: "Festival-Rose", squareMeterPrice: 50 },
      { idTZ: 2, name: "Zone B", nbSmallTables: 18, nbLargeTables: 9, nbCityHallTables: 3, remainingSmallTables: 18, remainingLargeTables: 9, remainingCityHallTables: 3, smallTablePrice: 100, largeTablePrice: 150, cityHallTablePrice: 200, festivalName: "Festival-Rose", squareMeterPrice: 75 }
    ]
  };

  festival2 = {
    name: "Festival-Batman",
    nbSmallTables: 60,
    nbLargeTables: 30,
    nbCityHallTables: 10,
    remainingSmallTables: 60,
    remainingLargeTables: 30,
    remainingCityHallTables: 10,
    tariffZones: [
      { idTZ: 3, name: "Zone C", nbSmallTables: 30, nbLargeTables: 15, nbCityHallTables: 5, remainingSmallTables: 30, remainingLargeTables: 15, remainingCityHallTables: 5, smallTablePrice: 150, largeTablePrice: 200, cityHallTablePrice: 250, festivalName: "Festival-Batman", squareMeterPrice: 100 },
      { idTZ: 4, name: "Zone D", nbSmallTables: 30, nbLargeTables: 15, nbCityHallTables: 5, remainingSmallTables: 30, remainingLargeTables: 15, remainingCityHallTables: 5, smallTablePrice: 180, largeTablePrice: 250, cityHallTablePrice: 300, festivalName: "Festival-Batman", squareMeterPrice: 125 }
    ]
  };

  festival3 = {
    name: "Festival-Nouveau",
    nbSmallTables: 40,
    nbLargeTables: 20,
    nbCityHallTables: 10,
    remainingSmallTables: 40,
    remainingLargeTables: 20,
    remainingCityHallTables: 10,
    tariffZones: [
      { idTZ: 5, name: "Zone E", nbSmallTables: 20, nbLargeTables: 10, nbCityHallTables: 5, remainingSmallTables: 20, remainingLargeTables: 10, remainingCityHallTables: 5, smallTablePrice: 200, largeTablePrice: 300, cityHallTablePrice: 400, festivalName: "Festival-Nouveau", squareMeterPrice: 150 },
      { idTZ: 6, name: "Zone F", nbSmallTables: 20, nbLargeTables: 10, nbCityHallTables: 5, remainingSmallTables: 20, remainingLargeTables: 10, remainingCityHallTables: 5, smallTablePrice: 250, largeTablePrice: 350, cityHallTablePrice: 450, festivalName: "Festival-Nouveau", squareMeterPrice: 175 }
    ]
  }

  festivalList = signal<Festival[]>([]);

  constructor() {
    this.loadFestivalsFromBD();
  }


  //Renvoie le festival trouvé par son nom, mais sans les tariffZones
  //Pour load les zones tarifaires d'un festival : voir service tariffZone
  findByName(name: string): Observable<Festival> {
    return this.http.get<Festival>(`${this.apiUrl}/festivals/${name}`)
  }


  removeFestivalByName(name: string) {
    this.http.delete(`${this.apiUrl}/festivals/${name}`, { withCredentials: true })
      .subscribe({
        next: () => {
          this.festivalList.update(festivals => festivals.filter(f => f.name !== name));
          console.log(`✅ Festival "${name}" supprimé de la base de données.`);
        },
        error: (err) => {
          console.error('Erreur lors de la suppression du festival :', err);
          alert('Une erreur serveur est survenue lors de la suppression du festival.');
        }
      });
  }



  addFestival(festival: Festival) {
    this.http.post<Festival>(`${this.apiUrl}/festivals`, festival, { withCredentials: true })
      .subscribe({
        next: (newFestivalBD) => {
          this.festivalList.update(festivals => [...festivals, newFestivalBD]);

          console.log(`✅ Festival "${newFestivalBD.name}" ajouté à la base de données.`);
        },
        error: (err) => {
          console.error('Erreur lors de l\'ajout du festival :', err);
          if (err.status === 409) {
            alert('Un festival portant ce nom existe déjà.');
          } else {
            alert('Une erreur serveur est survenue lors de la création du festival.');
          }
        }
      });

  }


  updateFestivalByName(name: string, festival: Festival) {
    this.http.post<Festival>(`${this.apiUrl}/festivals/update/${name}`, festival, { withCredentials: true })
      .subscribe({
        next: (updatedFestival) => {
          this.festivalList.update(festivals =>
            festivals.map(f => f.name === name ? { ...f, ...updatedFestival } : f)
          );
          console.log(`✅ Festival "${name}" mis à jour avec succès.`);
        },
        error: (err) => {
          console.error('Erreur lors de la mise à jour du festival :', err);
          alert('Erreur lors de la modification en base de données.');
        }
      });
  }

  addFestivalExamples() {
    this.addFestival(this.festival1);
    this.addFestival(this.festival2);
    this.addFestival(this.festival3);
  }

  loadFestivalsFromBD(): void {
    this.http.get<Festival[]>(`${this.apiUrl}/festivals`, { withCredentials: true })
      .subscribe(data => {
        this.festivalList.set(data);
      });
  }
}