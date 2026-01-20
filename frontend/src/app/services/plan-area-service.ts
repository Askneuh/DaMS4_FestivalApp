import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PlanArea } from '../interfaces/plan-area';
import { Editor } from '../interfaces/editor';
import { PlanAreaGame } from '../interfaces/plan-area-game';
import { AssignedGame } from '../interfaces/assigned-game';
import { EditorWithGameCount } from '../interfaces/editor-with-game-count';
import { GameAssignmentRequest } from '../interfaces/game-assignment-request';
import { environment } from '../../environment/environment';

@Injectable({
  providedIn: 'root',
})
export class PlanAreaService {
  private readonly API_URL = `${environment.apiUrl}/planArea`;
  private readonly http = inject(HttpClient);


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

  assignGameToPlanArea(planAreaId: number, assignment: GameAssignmentRequest): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.API_URL}/${planAreaId}/assign-game`,
      assignment,
      { withCredentials: true }
    );
  }

  unassignGameFromPlanArea(planAreaId: number, gameId: number, reservationId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `${this.API_URL}/${planAreaId}/games/${gameId}/reservation/${reservationId}`,
      { withCredentials: true }
    );
  }

  getAssignedGames(planAreaId: number): Observable<AssignedGame[]> {
    return this.http.get<AssignedGame[]>(
      `${this.API_URL}/${planAreaId}/assigned-games`,
      { withCredentials: true }
    );
  }

  getEditorsFromAssignedGames(planAreaId: number): Observable<EditorWithGameCount[]> {
    return this.http.get<EditorWithGameCount[]>(
      `${this.API_URL}/${planAreaId}/editors-from-games`,
      { withCredentials: true }
    );
  }
}
