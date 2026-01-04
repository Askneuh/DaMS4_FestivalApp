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
      nbTables: 50,
      tariffZones: [
        { idTZ: 1, name: "Zone A", nbTables: 20, tablePrice: 100, festivalName: "Festival-Rose", squareMeterPrice: 50 },
        { idTZ: 2, name: "Zone B", nbTables: 30, tablePrice: 150, festivalName: "Festival-Rose", squareMeterPrice: 75 }
      ]
    };

    festival2 = {
      name: "Festival-Batman",
      nbTables: 100,
      tariffZones: [
        { idTZ: 3, name: "Zone C", nbTables: 50, tablePrice: 200, festivalName: "Festival-Batman", squareMeterPrice: 100 },
        { idTZ: 4, name: "Zone D", nbTables: 50, tablePrice: 250, festivalName: "Festival-Batman", squareMeterPrice: 125 }
      ]
    };

    festival3 = {
      name: "Festival-Nouveau",
      nbTables: 70,
      tariffZones: [
        { idTZ: 5, name: "Zone E", nbTables: 35, tablePrice: 300, festivalName: "Festival-Nouveau", squareMeterPrice: 150 },
        { idTZ: 6, name: "Zone F", nbTables: 35, tablePrice: 350, festivalName: "Festival-Nouveau", squareMeterPrice: 175 }
      ]
    }

    festivalList = signal<Festival[]>([]);

    constructor() {
      this.loadFestivalsFromBD();
    }
    

  //findByName(name: string): Festival | undefined {
    //return this.festivalList().find(f => f.name === name);
  //}

  findByNameBD(name:string): Observable<Festival> {
    return this.http.get<Festival>(`${this.apiUrl}/festivals/${name}`)
  }

  //Pas encore de route pour la suppression (TODO)
  //removeFestival(name: string) {
    //this.festivalList.update(festivals => festivals.filter(f => f.name !== name));
  //}

  removeFestivalBD(name: string) {
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

  //addFestival(festival: Festival) {
    //this.festivalList.update(festivals => [...festivals, festival]);
  //}

  addFestivalBD(festival: Festival) {    
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

  ///updateFestival(name: string, updatedFestival: Festival) {
    //this.festivalList.update(festivals => 
      //festivals.map(f => f.name === name ? updatedFestival : f)
    //);
  //}

  updateFestivalBD(name: string, festival: Festival) {
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
    this.addFestivalBD(this.festival1);
    this.addFestivalBD(this.festival2);
    this.addFestivalBD(this.festival3);
  }

  loadFestivalsFromBD(): void {
    this.http.get<Festival[]>(`${this.apiUrl}/festivals`, { withCredentials: true })
      .subscribe(data => {
        this.festivalList.set(data);
      });
  }
}