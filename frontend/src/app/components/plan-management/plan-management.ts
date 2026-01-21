import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FestivalService } from '../../services/festival-service';
import { TariffZoneService } from '../../services/tariff-zone-service';
import { PlanAreaService } from '../../services/plan-area-service';
import { PlanArea } from '../../interfaces/plan-area';
import { TariffZone } from '../../interfaces/tariff-zone';
import { TariffZoneGame } from '../../interfaces/tariff-zone-game';
import { AssignedGame } from '../../interfaces/assigned-game';
import { forkJoin, Observable } from 'rxjs';

@Component({
  selector: 'app-plan-management',
  imports: [CommonModule, ReactiveFormsModule],
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

  private selectedTariffZoneId = signal<number | null>(null);
  
  selectedTariffZone = computed(() => {
    const id = this.selectedTariffZoneId();
    if (!id) return null;
    return this.tariffZones().find(z => z.idTZ === id) || null;
  });

  showForm = signal(false);

  planAreas = signal<PlanArea[]>([]);
  availableGames = signal<TariffZoneGame[]>([]);
  selectedGameIds = signal<Set<number>>(new Set());
  selectedQuantities = signal<Map<number, number>>(new Map());
  editingPlanArea = signal<PlanArea | null>(null);
  editingAreaGames = signal<AssignedGame[]>([]);
  
  quantitiesToRemove = signal<Map<number, number>>(new Map());

  planAreaForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    nbSmallTables: [0, [Validators.required, Validators.min(0)]],
    nbLargeTables: [0, [Validators.required, Validators.min(0)]],
    nbCityHallTables: [0, [Validators.required, Validators.min(0)]],
  });

  reservedTables = computed(() => {
    const zone = this.selectedTariffZone();
    if (!zone) return { small: 0, large: 0, cityHall: 0 };
    return {
      small: zone.nbSmallTables - zone.remainingSmallTables,
      large: zone.nbLargeTables - zone.remainingLargeTables,
      cityHall: zone.nbCityHallTables - zone.remainingCityHallTables
    };
  });

  placedTables = computed(() => {
    const areas = this.planAreas();
    const editing = this.editingPlanArea();
    
    const areasToCount = editing 
      ? areas.filter(a => a.id !== editing.id)
      : areas;

    return {
      small: areasToCount.reduce((sum, a) => sum + a.nbSmallTables, 0),
      large: areasToCount.reduce((sum, a) => sum + a.nbLargeTables, 0),
      cityHall: areasToCount.reduce((sum, a) => sum + a.nbCityHallTables, 0)
    };
  });

  availableForPlacement = computed(() => {
    const reserved = this.reservedTables();
    const placed = this.placedTables();
    return {
      small: Math.max(0, reserved.small - placed.small),
      large: Math.max(0, reserved.large - placed.large),
      cityHall: Math.max(0, reserved.cityHall - placed.cityHall)
    };
  });

  private lastFestivalName = signal<string | null>(null);

  constructor() {
    this.festivalService.loadCurrentFestival();

    effect(() => {
      const festival = this.currentFestival();
      const currentName = festival?.name || null;
      const lastName = this.lastFestivalName();
      
      if (currentName !== lastName) {
        this.lastFestivalName.set(currentName);
        this.selectedTariffZoneId.set(null);
        this.planAreas.set([]);
      }
    });
  }

  selectTariffZone(zone: TariffZone) {
    this.selectedTariffZoneId.set(zone.idTZ);
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

          // Charger les détails (jeux + éditeurs) pour chaque zone
          const detailRequests = filteredAreas.map(area => 
            forkJoin({
              games: this.planAreaService.getAssignedGames(area.id),
              editors: this.planAreaService.getEditorsFromAssignedGames(area.id)
            }).pipe(
              // On peut catcher l'erreur individuellement pour ne pas casser tout le chargement
              /* catchError(() => of({ games: [], editors: [] })) */ 
              // Pour l'instant on laisse propager si erreur
            )
          );

          if (detailRequests.length > 0) {
            forkJoin(detailRequests).subscribe({
              next: (results) => {
                results.forEach((res, index) => {
                  filteredAreas[index].presentedGames = res.games;
                  filteredAreas[index].editors = res.editors;
                });
                this.planAreas.set(filteredAreas);
                
                // Si une zone est en cours de visualisation, mettre à jour ses données
                const currentViewing = this.viewingPlanArea();
                if (currentViewing) {
                  const updated = filteredAreas.find(a => a.id === currentViewing.id);
                  if (updated) {
                    this.viewingPlanArea.set(updated);
                  }
                }
              },
              error: (err) => console.error('Erreur chargement détails zones:', err)
            });
          } else {
            this.planAreas.set(filteredAreas);
          }
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

  loadEditingAreaGames(planAreaId: number) {
    this.planAreaService.getAssignedGames(planAreaId).subscribe({
      next: (games) => {
        this.editingAreaGames.set(games);
        const initialRemovals = new Map<number, number>();
        games.forEach(g => initialRemovals.set(g.id, 1));
        this.quantitiesToRemove.set(initialRemovals);
      },
      error: (err) => {
        console.error('Erreur chargement jeux assignés:', err);
        this.editingAreaGames.set([]);
      }
    });
  }

  updateRemovalQuantity(gameId: number, qty: number, max: number) {
    if (qty < 1) qty = 1;
    if (qty > max) qty = max;
    const current = new Map(this.quantitiesToRemove());
    current.set(gameId, qty);
    this.quantitiesToRemove.set(current);
  }

  getRemovalQuantity(gameId: number): number {
    return this.quantitiesToRemove().get(gameId) || 1;
  }

  removeGameFromZone(game: AssignedGame) {
    const area = this.editingPlanArea();
    if (!area) return;

    const qtyToRemove = this.getRemovalQuantity(game.id);

    if (!confirm(`Retirer ${qtyToRemove} exemplaire(s) de "${game.name}" de cette zone ?`)) return;
    
    this.planAreaService.unassignGameFromPlanArea(area.id, game.id, qtyToRemove, game.idReservation).subscribe({
      next: () => {
        this.loadEditingAreaGames(area.id);
        this.loadPlanAreas(); // Rafraîchir la liste principale (cartes)
        const zone = this.selectedTariffZone();
        if (zone) {
          this.loadAvailableGames(zone.idTZ);
        }
      },
      error: (err) => {
        console.error('Erreur retrait jeu:', err);
        alert(err.error?.error || 'Erreur lors du retrait du jeu');
      }
    });
  }

  addGameToExistingZone(game: TariffZoneGame) {
    const area = this.editingPlanArea();
    if (!area) return;

    const qty = this.getQuantity(game.id);

    if (qty > game.remainingQuantity) {
      alert(`Il ne reste que ${game.remainingQuantity} exemplaire(s) disponible(s)`);
      return;
    }

    if (!game.idReservation) {
      alert("Erreur: ID Réservation manquant pour ce jeu");
      return;
    }

    this.planAreaService.assignGameToPlanArea(area.id, game.id, qty, game.idReservation).subscribe({
      next: () => {
        const quantities = new Map(this.selectedQuantities());
        quantities.delete(game.id);
        this.selectedQuantities.set(quantities);

        this.loadEditingAreaGames(area.id);
        this.loadPlanAreas(); // Rafraîchir la liste principale
        const zone = this.selectedTariffZone();
        if (zone) {
          this.loadAvailableGames(zone.idTZ);
        }
      },
      error: (err) => {
        console.error('Erreur ajout jeu:', err);
        alert(err.error?.error || 'Erreur lors de l\'ajout du jeu');
      }
    });
  }

  updateQuantity(gameId: number, qty: number, max: number) {
    if (qty < 1) qty = 1;
    if (qty > max) qty = max;
    
    const current = new Map(this.selectedQuantities());
    current.set(gameId, qty);
    this.selectedQuantities.set(current);
  }

  getQuantity(gameId: number): number {
    return this.selectedQuantities().get(gameId) || 1;
  }

  toggleGameSelection(gameId: number) {
    const current = new Set(this.selectedGameIds());
    if (current.has(gameId)) {
      current.delete(gameId);
      const quantities = new Map(this.selectedQuantities());
      quantities.delete(gameId);
      this.selectedQuantities.set(quantities);
    } else {
      current.add(gameId);
      this.updateQuantity(gameId, 1, 999); 
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
    this.loadEditingAreaGames(area.id);
    this.showForm.set(true);
  }

  deletePlanArea(area: PlanArea) {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer la zone "${area.name}" ?`)) {
      return;
    }

    this.planAreaService.deletePlanArea(area.id).subscribe({
      next: () => {
        alert('Zone de plan supprimée avec succès !');
        this.loadPlanAreas();
        const zone = this.selectedTariffZone();
        if (zone) {
          this.loadAvailableGames(zone.idTZ);
        }
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

  cancelForm() {
    this.planAreaForm.reset();
    this.showForm.set(false);
    this.editingPlanArea.set(null);
    this.selectedGameIds.set(new Set());
    this.selectedQuantities.set(new Map());
    this.editingAreaGames.set([]);
    this.quantitiesToRemove.set(new Map());
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
    const available = this.availableForPlacement();

    const requestedSmall = formValue.nbSmallTables || 0;
    const requestedLarge = formValue.nbLargeTables || 0;
    const requestedCityHall = formValue.nbCityHallTables || 0;

    if (requestedSmall < 0 || requestedLarge < 0 || requestedCityHall < 0) {
      alert('Le nombre de tables ne peut pas être négatif');
      return;
    }

    // Calcul de la disponibilité en tenant compte des tables déjà possédées par la zone si en édition
    const currentSmall = editingArea?.nbSmallTables || 0;
    const currentLarge = editingArea?.nbLargeTables || 0;
    const currentCityHall = editingArea?.nbCityHallTables || 0;

    if (requestedSmall > available.small + currentSmall) {
      alert(`Petites tables : Insuffisant (Dispo: ${available.small})`);
      return;
    }
    if (requestedLarge > available.large + currentLarge) {
      alert(`Grandes tables : Insuffisant (Dispo: ${available.large})`);
      return;
    }
    if (requestedCityHall > available.cityHall + currentCityHall) {
      alert(`Tables mairie : Insuffisant (Dispo: ${available.cityHall})`);
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
        if (editingArea) {
          alert('Zone modifiée avec succès !');
          this.finalizeSubmit();
        } else {
          const planAreaId = (response as { message: string; id: number }).id;
          this.assignSelectedGames(planAreaId, festival.name);
        }
      },
      error: (err: any) => {
        console.error('Erreur:', err);
        alert(err.error?.error || 'Erreur lors de l\'opération');
      }
    });
  }

  assignSelectedGames(planAreaId: number, festivalName: string) {
    const gameIds = Array.from(this.selectedGameIds());

    if (gameIds.length === 0) {
      this.finalizeSubmit();
      return;
    }

    const gamesToAssign = this.availableGames().filter(g => this.selectedGameIds().has(g.id));

    const requests = gamesToAssign.map(game => {
      const qty = this.getQuantity(game.id);
      if (!game.idReservation) {
        return null;
      }
      return this.planAreaService.assignGameToPlanArea(planAreaId, game.id, qty, game.idReservation);
    }).filter(req => req !== null) as Observable<{message: string}>[];

    if (requests.length > 0) {
      forkJoin(requests).subscribe({
        next: () => this.finalizeSubmit(),
        error: (err) => {
          console.error('Erreur assignation jeux:', err);
          this.finalizeSubmit();
        }
      });
    } else {
      this.finalizeSubmit();
    }
  }

  viewingPlanArea = signal<PlanArea | null>(null);

  viewDetails(area: PlanArea) {
    this.viewingPlanArea.set(area);
  }

  finalizeSubmit() {
    this.planAreaForm.reset();
    this.showForm.set(false);
    this.editingPlanArea.set(null);
    this.selectedGameIds.set(new Set());
    
    // Si on éditait une zone qui est actuellement visualisée en détails, on veut recharger ses détails
    // loadPlanAreas va rafraîchir les données de toutes les zones, donc viewingPlanArea pointera vers des données "obsèques"
    // On rappelle loadPlanAreas, et on mettra à jour viewingPlanArea quand les nouvelles données arriveront
    this.loadPlanAreas();
    
    const zone = this.selectedTariffZone();
    if (zone) {
      this.loadAvailableGames(zone.idTZ);
    }
  }
}