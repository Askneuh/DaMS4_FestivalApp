import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PlanArea } from '../interfaces/plan-area';
import { Editor } from '../interfaces/editor';
import { PlanAreaGame } from '../interfaces/plan-area-game';

@Injectable({
  providedIn: 'root',
})
export class PlanAreaService {
  public readonly API_URL = 'https://localhost:4000/api';
  public readonly http = inject(HttpClient);


  getPlanAreasByFestival(festivalName: string): Observable<PlanArea[]> {
    return this.http.get<PlanArea[]>(`${this.API_URL}/festival/${festivalName}`, { withCredentials: true });
  }

  getPlanAreaById(id: number): Observable<PlanArea> {
    return this.http.get<PlanArea>(`${this.API_URL}/${id}`, { withCredentials: true });
  }

  createPlanArea(planArea: Partial<PlanArea>): Observable<{ message: string, id: number }> {
    return this.http.post<{ message: string, id: number }>(this.API_URL, planArea, { withCredentials: true });
  }

  updatePlanArea(planArea: PlanArea): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.API_URL}/update/${planArea.id}`, planArea, { withCredentials: true });
  }

  deletePlanArea(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.API_URL}/${id}`, { withCredentials: true });
  }

  getGamesInPlanArea(id: number): Observable<PlanAreaGame[]> {
    return this.http.get<PlanAreaGame[]>(`${this.API_URL}/${id}/games`, { withCredentials: true });
  }

  addGameToPlanArea(idPA: number, idGame: number, quantity: number): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.API_URL}/${idPA}/games`, { idGame, quantity }, { withCredentials: true });
  }

  getEditorsInPlanArea(id: number): Observable<Editor[]> {
    return this.http.get<Editor[]>(`${this.API_URL}/${id}/editors`, { withCredentials: true });
  }

  addEditorToPlanArea(idPA: number, idEditor: number): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.API_URL}/${idPA}/editors`, { idEditor }, { withCredentials: true });
  }
}
