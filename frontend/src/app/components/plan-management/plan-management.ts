import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FestivalService } from '../../services/festival-service';
import { TariffZoneService } from '../../services/tariff-zone-service';
import { PlanAreaService } from '../../services/plan-area-service';
import { PlanArea } from '../../interfaces/plan-area';
import { TariffZone } from '../../interfaces/tariff-zone';
import { TariffZoneGame } from '../../interfaces/tariff-zone-game';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-plan-management',
  imports: [CommonModule, ReactiveFormsModule,],
  templateUrl: './plan-management.html',
  styleUrl: './plan-management.css',
})
export class PlanManagement {
  private fb = inject(FormBuilder);
  private festivalService = inject(FestivalService);
  private tariffZoneService = inject(TariffZoneService);
  private planAreaService = inject(PlanAreaService);

  currentFestival = this.festivalService.currentFestival;
  
  tariffZones = computed(() => {
    const festival = this.currentFestival();
    return festival?.tariffZones || [];
  });

  selectedTariffZone = signal<TariffZone | null>(null);
  showForm = signal(false);
  
  planAreas = signal<PlanArea[]>([]);
  availableGames = signal<TariffZoneGame[]>([]);
  selectedGameIds = signal<Set<number>>(new Set());
  editingPlanArea = signal<PlanArea | null>(null);

  planAreaForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    nbSmallTables: [0, [Validators.required, Validators.min(0)]],
    nbLargeTables: [0, [Validators.required, Validators.min(0)]],
    nbCityHallTables: [0, [Validators.required, Validators.min(0)]],
  });

  constructor() {
    effect(() => {
      const festival = this.currentFestival();
      if (festival) {
        this.selectedTariffZone.set(null);
        this.planAreas.set([]);
      }
    });
  }

  selectTariffZone(zone: TariffZone) {
    this.selectedTariffZone.set(zone);
    this.showForm.set(false);
    this.selectedGameIds.set(new Set());
    this.loadPlanAreas();
    this.loadAvailableGames(zone.idTZ);
  }

  loadPlanAreas() {
    const festival = this.currentFestival();
    if (!festival) return;

    this.planAreaService.getPlanAreasByFestival(festival.name).subscribe({
      next: (areas) => {
        const selectedZone = this.selectedTariffZone();
        if (selectedZone) {
          const filteredAreas = areas.filter(area => area.idTZ === selectedZone.idTZ);
          
          filteredAreas.forEach(area => {
            this.planAreaService.getAssignedGames(area.id).subscribe({
              next: (assignedGames) => {
                area.presentedGames = assignedGames.map(game => ({
                  ...game,
                  quantity: 1
                }));
                
                this.planAreas.set([...this.planAreas()]);
              },
              error: (err) => console.error('Erreur chargement jeux:', err)
            });
          });
          
          this.planAreas.set(filteredAreas);
        }
      },
      error: (err) => {
        console.error('Erreur chargement zones:', err);
      }
    });
  }

  loadAvailableGames(tzId: number) {
    this.tariffZoneService.getGamesFromTariffZone(tzId).subscribe({
      next: (games) => {
        const available = games.filter(g => g.remainingQuantity > 0);
        this.availableGames.set(available);
      },
      error: (err) => {
        console.error('Erreur chargement jeux:', err);
        this.availableGames.set([]);
      }
    });
  }

  toggleGameSelection(gameId: number) {
    const current = new Set(this.selectedGameIds());
    if (current.has(gameId)) {
      current.delete(gameId);
    } else {
      current.add(gameId);
    }
    this.selectedGameIds.set(current);
  }

  toggleForm() {
    this.showForm.update(v => !v);
    if (!this.showForm()) {
      this.cancelForm();
    }
  }

  editPlanArea(area: PlanArea) {
    this.editingPlanArea.set(area);
    this.planAreaForm.patchValue({
      name: area.name,
      nbSmallTables: area.nbSmallTables,
      nbLargeTables: area.nbLargeTables,
      nbCityHallTables: area.nbCityHallTables
    });
    this.showForm.set(true);
  }

  deletePlanArea(area: PlanArea) {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer la zone "${area.name}" ?`)) {
      return;
    }

    const selectedZone = this.selectedTariffZone();
    if (!selectedZone) return;

    this.planAreaService.deletePlanArea(area.id).subscribe({
      next: () => {
        alert('Zone de plan supprimée avec succès !');
        
        const newRemainingSmall = Math.min(
          selectedZone.remainingSmallTables + area.nbSmallTables,
          selectedZone.nbSmallTables
        );
        const newRemainingLarge = Math.min(
          selectedZone.remainingLargeTables + area.nbLargeTables,
          selectedZone.nbLargeTables
        );
        const newRemainingCityHall = Math.min(
          selectedZone.remainingCityHallTables + area.nbCityHallTables,
          selectedZone.nbCityHallTables
        );

        const updatePayload: TariffZone = {
          idTZ: selectedZone.idTZ,  
          festivalName: selectedZone.festivalName,  
          name: selectedZone.name,
          nbSmallTables: selectedZone.nbSmallTables,
          nbLargeTables: selectedZone.nbLargeTables,
          nbCityHallTables: selectedZone.nbCityHallTables,
          remainingSmallTables: newRemainingSmall,
          remainingLargeTables: newRemainingLarge,
          remainingCityHallTables: newRemainingCityHall,
          smallTablePrice: selectedZone.smallTablePrice,
          largeTablePrice: selectedZone.largeTablePrice,
          cityHallTablePrice: selectedZone.cityHallTablePrice,
          squareMeterPrice: selectedZone.squareMeterPrice
        };

        this.tariffZoneService.updateTariffZoneById(selectedZone.idTZ, updatePayload).subscribe({
          next: () => {
            this.festivalService.loadFestivalsFromBD();
            
            setTimeout(() => {
              const festival = this.currentFestival();
              if (festival) {
                const updatedZone = festival.tariffZones?.find(z => z.idTZ === selectedZone.idTZ);
                if (updatedZone) {
                  this.selectedTariffZone.set(updatedZone);
                }
              }
              this.loadPlanAreas();
            }, 300);
          },
          error: (err: any) => {
            console.error('Erreur mise à jour zone tarifaire:', err);
          }
        });
      },
      error: (err: any) => {
        console.error('Erreur suppression:', err);
        if (err.status === 409) {
          alert('Impossible de supprimer : la zone contient des jeux ou des éditeurs');
        } else {
          alert('Erreur lors de la suppression');
        }
      }
    });
  }

  onSubmit() {
    if (this.planAreaForm.invalid) return;

    const selectedZone = this.selectedTariffZone();
    const festival = this.currentFestival();
    if (!selectedZone || !festival) {
      alert('Veuillez sélectionner une zone tarifaire');
      return;
    }

    const formValue = this.planAreaForm.value;
    const editingArea = this.editingPlanArea();

    const requestedSmall = formValue.nbSmallTables || 0;
    const requestedLarge = formValue.nbLargeTables || 0;
    const requestedCityHall = formValue.nbCityHallTables || 0;

    const smallDiff = editingArea 
      ? requestedSmall - editingArea.nbSmallTables 
      : requestedSmall;
    const largeDiff = editingArea
      ? requestedLarge - editingArea.nbLargeTables 
      : requestedLarge;
    const cityHallDiff = editingArea 
      ? requestedCityHall - editingArea.nbCityHallTables 
      : requestedCityHall;

    if (smallDiff > selectedZone.remainingSmallTables) {
      alert(`Petites tables : Vous demandez ${smallDiff} mais il n'y a que ${selectedZone.remainingSmallTables} disponibles`);
      return;
    }
    if (largeDiff > selectedZone.remainingLargeTables) {
      alert(`Grandes tables : Vous demandez ${largeDiff} mais il n'y a que ${selectedZone.remainingLargeTables} disponibles`);
      return;
    }
    if (cityHallDiff > selectedZone.remainingCityHallTables) {
      alert(`Tables mairie : Vous demandez ${cityHallDiff} mais il n'y a que ${selectedZone.remainingCityHallTables} disponibles`);
      return;
    }

    if (requestedSmall < 0 || requestedLarge < 0 || requestedCityHall < 0) {
      alert('Le nombre de tables ne peut pas être négatif');
      return;
    }

    const planAreaData: PlanArea = {
      id: editingArea?.id || 0,
      name: formValue.name,
      nbSmallTables: requestedSmall,
      nbLargeTables: requestedLarge,
      nbCityHallTables: requestedCityHall,
      festivalName: festival.name,
      idTZ: selectedZone.idTZ
    };

    const request$ = editingArea
      ? this.planAreaService.updatePlanArea(planAreaData)
      : this.planAreaService.createPlanArea(planAreaData);

    request$.subscribe({
      next: (response) => {
        const updatedZone = {
          ...selectedZone,
          remainingSmallTables: selectedZone.remainingSmallTables - smallDiff,
          remainingLargeTables: selectedZone.remainingLargeTables - largeDiff,
          remainingCityHallTables: selectedZone.remainingCityHallTables - cityHallDiff
        };
        
        this.tariffZoneService.updateTariffZoneById(selectedZone.idTZ, updatedZone).subscribe({
          next: () => {
            if (editingArea) {
              alert('Zone modifiée avec succès !');
              this.finalizeCreation();
            } else {
              const planAreaId = (response as { message: string; id: number }).id;
              this.assignSelectedGames(planAreaId, festival.name);
            }
          },
          error: (err: any) => {
            console.error('Erreur mise à jour zone tarifaire:', err);
            alert('Zone créée mais erreur de mise à jour des tables');
          }
        });
      },
      error: (err: any) => {
        console.error('Erreur:', err);
        alert('Erreur lors de l\'opération');
      }
    });
  }

  assignSelectedGames(planAreaId: number, festivalName: string) {
    const gameIds = Array.from(this.selectedGameIds());
    
    if (gameIds.length === 0) {
      this.finalizeCreation();
      return;
    }
  
    const requests = gameIds.map(gameId => {
      const game = this.availableGames().find(g => g.id === gameId);
      
      if (!game || !game.idReservation) {
        return null;
      }

      return this.planAreaService.assignGameToPlanArea(planAreaId, {
        idGame: gameId,
        idReservation: game.idReservation,
        festivalName: festivalName
      });
    }).filter(r => r !== null);

    if (requests.length > 0) {
      forkJoin(requests).subscribe({
        next: () => this.finalizeCreation(),
        error: (err) => {
          console.error('Erreur assignation jeux:', err);
          alert('Zone créée mais erreur d\'assignation des jeux');
          this.finalizeCreation();
        }
      });
    } else {
      alert('Aucun jeu valide à assigner');
      this.finalizeCreation();
    }
  }

  finalizeCreation() {
    alert('Zone de plan créée avec succès !');
    this.festivalService.loadFestivalsFromBD();
    
    setTimeout(() => {
      const festival = this.currentFestival();
      const selectedZone = this.selectedTariffZone();
      
      if (festival && selectedZone) {
        const updatedZone = festival.tariffZones?.find(z => z.idTZ === selectedZone.idTZ);
        if (updatedZone) {
          this.selectedTariffZone.set(updatedZone);
        }
      }
      
      this.planAreaForm.reset();
      this.showForm.set(false);
      this.editingPlanArea.set(null);
      this.selectedGameIds.set(new Set());
      this.loadPlanAreas();
    }, 300);
  }

  cancelForm() {
    this.planAreaForm.reset();
    this.showForm.set(false);
    this.editingPlanArea.set(null);
    this.selectedGameIds.set(new Set());
  }
}