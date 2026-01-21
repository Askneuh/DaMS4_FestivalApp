import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { forkJoin } from 'rxjs';
import { PlanManagement } from './plan-management';

describe('PlanManagement', () => {
  let component: PlanManagement;
  let fixture: ComponentFixture<PlanManagement>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlanManagement, HttpClientTestingModule]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PlanManagement);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // 🧪 TEST POUR CRÉER UNE RÉSERVATION FICTIVE
  it('🧪 Créer une réservation de test pour tester les zones de plan', (done) => {
    const API_URL = 'https://localhost:4000/api';
    const http = TestBed.inject(HttpClient);

    const loginData = { login: 'admin', password: 'admin123' };

    // 1. Se connecter en tant qu'admin
    http.post<{ token: string }>(`${API_URL}/auth/login`, loginData, { withCredentials: true }).subscribe({
      next: (authResponse: { token: string }) => {
        console.log('✅ Connecté en tant qu\'admin');

        // 2. Créer une réservation
        const reservationData = {
          idEditor: 1, // Asmodee
          status: 'Test',
          nbSmallTables: 2,
          nbLargeTables: 1,
          nbCityHallTables: 1,
          remise: 0,
          festivalName: 'Festival 2025',
          idTZ: 1 // Zone A
        };

        http.post<{ id: number }>(`${API_URL}/reservation`, reservationData, { withCredentials: true }).subscribe({
          next: (resResponse: { id: number }) => {
            const reservationId = resResponse.id;
            console.log(`✅ Réservation créée (ID: ${reservationId})`);

            // 3. Ajouter 3 jeux à cette réservation
            const gamesToAdd = [1, 2, 3]; // Dobble, Dixit, Splendor
            const gameRequests = gamesToAdd.map(gameId => 
              http.post(`${API_URL}/reservation/${reservationId}/games`, { idGame: gameId, quantity: 1 }, { withCredentials: true })
            );
            
            forkJoin(gameRequests).subscribe({
              next: () => {
                console.log('✅ Jeux ajoutés à la réservation');
                alert('🎉 Réservation de test créée ! Tu peux maintenant tester ta zone de plan.');
                done();
              },
              error: (err: any) => {
                console.error('❌ Erreur ajout jeux:', err);
                done.fail(err);
              }
            });
          },
          error: (err: any) => {
            console.error('❌ Erreur création réservation:', err);
            done.fail(err);
          }
        });
      },
      error: (err: any) => {
        console.error('❌ Erreur login:', err);
        done.fail(err);
      }
    });
  });
});