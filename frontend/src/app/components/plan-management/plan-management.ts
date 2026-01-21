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

  // Stocker seulement l'ID de la zone sélectionnée
  private selectedTariffZoneId = signal<number | null>(null);
  
  // Computed qui retrouve toujours la zone à jour depuis le festival
  selectedTariffZone = computed(() => {
    const id = this.selectedTariffZoneId();
    if (!id) return null;
    return this.tariffZones().find(z => z.idTZ === id) || null;
  });

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

  /**
   * Tables RÉSERVÉES par les éditeurs dans la zone tarifaire sélectionnée
   * = total - remaining (ce sont les tables que les éditeurs ont réservé)
   */
  reservedTables = computed(() => {
    const zone = this.selectedTariffZone();
    if (!zone) return { small: 0, large: 0, cityHall: 0 };
    return {
      small: zone.nbSmallTables - zone.remainingSmallTables,
      large: zone.nbLargeTables - zone.remainingLargeTables,
      cityHall: zone.nbCityHallTables - zone.remainingCityHallTables
    };
  });

  /**
   * Tables déjà PLACÉES dans les zones du plan
   * = somme des tables de toutes les zones du plan de cette zone tarifaire
   */
  placedTables = computed(() => {
    const areas = this.planAreas();
    const editing = this.editingPlanArea();
    
    // On exclut la zone en cours d'édition du calcul
    const areasToCount = editing 
      ? areas.filter(a => a.id !== editing.id)
      : areas;

    return {
      small: areasToCount.reduce((sum, a) => sum + a.nbSmallTables, 0),
      large: areasToCount.reduce((sum, a) => sum + a.nbLargeTables, 0),
      cityHall: areasToCount.reduce((sum, a) => sum + a.nbCityHallTables, 0)
    };
  });

  /**
   * Tables DISPONIBLES pour placement dans de nouvelles zones du plan
   * = tables réservées - tables déjà placées
   */
  availableForPlacement = computed(() => {
    const reserved = this.reservedTables();
    const placed = this.placedTables();
    return {
      small: Math.max(0, reserved.small - placed.small),
      large: Math.max(0, reserved.large - placed.large),
      cityHall: Math.max(0, reserved.cityHall - placed.cityHall)
    };
  });
  // Stocker le nom du dernier festival pour détecter un changement
  private lastFestivalName = signal<string | null>(null);

  constructor() {
    // Recharger les données du festival au démarrage pour avoir les dernières données
    this.festivalService.loadCurrentFestival();

    // Réinitialiser seulement si on change de festival (pas juste mise à jour des données)
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

    this.planAreaService.deletePlanArea(area.id).subscribe({
      next: () => {
        alert('Zone de plan supprimée avec succès !');
        this.loadPlanAreas();
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
    const available = this.availableForPlacement();

    const requestedSmall = formValue.nbSmallTables || 0;
    const requestedLarge = formValue.nbLargeTables || 0;
    const requestedCityHall = formValue.nbCityHallTables || 0;

    // Validation: nombres négatifs
    if (requestedSmall < 0 || requestedLarge < 0 || requestedCityHall < 0) {
      alert('Le nombre de tables ne peut pas être négatif');
      return;
    }

    // Validation: ne pas dépasser les tables disponibles pour placement
    if (requestedSmall > available.small) {
      alert(`Petites tables : Vous demandez ${requestedSmall} mais seulement ${available.small} sont disponibles pour placement`);
      return;
    }
    if (requestedLarge > available.large) {
      alert(`Grandes tables : Vous demandez ${requestedLarge} mais seulement ${available.large} sont disponibles pour placement`);
      return;
    }
    if (requestedCityHall > available.cityHall) {
      alert(`Tables mairie : Vous demandez ${requestedCityHall} mais seulement ${available.cityHall} sont disponibles pour placement`);
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
    // Sauvegarder la liste des jeux disponibles maintenant car elle sera peut-être modifiée après
    const gamesSnapshot = [...this.availableGames()];

    console.log('=== DEBUG assignSelectedGames ===');
    console.log('planAreaId:', planAreaId);
    console.log('festivalName:', festivalName);
    console.log('gameIds sélectionnés:', gameIds);
    console.log('availableGames:', gamesSnapshot);

    if (gameIds.length === 0) {
      this.finalizeSubmit();
      return;
    }

    const requests = gameIds.map(gameId => {
      const game = gamesSnapshot.find(g => g.id === gameId);
      console.log(`Jeu ${gameId}:`, game);

      if (!game) {
        console.warn(`Jeu ${gameId} non trouvé dans availableGames`);
        return null;
      }
      if (!game.idReservation) {
        console.warn(`Jeu ${gameId} n'a pas d'idReservation:`, game.idReservation);
        return null;
      }

      return this.planAreaService.assignGameToPlanArea(planAreaId, {
        idGame: gameId,
        idReservation: game.idReservation,
        festivalName: festivalName
      });
    }).filter(r => r !== null);

    console.log('Nombre de requêtes valides:', requests.length);

    if (requests.length > 0) {
      forkJoin(requests).subscribe({
        next: () => this.finalizeSubmit(),
        error: (err) => {
          console.error('Erreur assignation jeux:', err);
          alert('Zone créée mais erreur d\'assignation des jeux');
          this.finalizeSubmit();
        }
      });
    } else {
      console.error('Aucune requête valide générée');
      this.finalizeSubmit();
    }
  }

  finalizeSubmit() {
    alert('Zone de plan enregistrée avec succès !');
    this.planAreaForm.reset();
    this.showForm.set(false);
    this.editingPlanArea.set(null);
    this.selectedGameIds.set(new Set());
    this.loadPlanAreas();
  }

  cancelForm() {
    this.planAreaForm.reset();
    this.showForm.set(false);
    this.editingPlanArea.set(null);
    this.selectedGameIds.set(new Set());
  }
}