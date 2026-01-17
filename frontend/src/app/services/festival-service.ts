import { Injectable, signal, inject } from '@angular/core';
import { Festival } from '../interfaces/festival';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FestivalService {
  private readonly http = inject(HttpClient)
  private readonly apiUrl = 'https://localhost:4000/api';

  festivalList = signal<Festival[]>([]);

  constructor() {
    this.loadFestivalsFromBD();
  }


  findByName(name: string): Observable<Festival> {
    return this.http.get<Festival>(`${this.apiUrl}/festivals/${name}`, { withCredentials: true })
  }


  removeFestivalByName(name: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/festivals/${name}`, { withCredentials: true });
  }



  addFestival(festival: Festival): Observable<Festival> {
    return this.http.post<Festival>(`${this.apiUrl}/festivals`, festival, { withCredentials: true });
  }


  updateFestivalByName(name: string, festival: Festival): Observable<Festival> {
    return this.http.post<Festival>(`${this.apiUrl}/festivals/update/${name}`, festival, { withCredentials: true });
  }



  loadFestivalsFromBD(): void {
    this.http.get<Festival[]>(`${this.apiUrl}/festivals`, { withCredentials: true })
      .subscribe(data => {
        this.festivalList.set(data);
      });
  }
}