import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FestivalService } from '../../services/festival-service';
import { TariffZoneService } from '../../services/tariff-zone-service';
import { PlanAreaService } from '../../services/plan-area-service';
import { PlanArea } from '../../interfaces/plan-area';
import { TariffZone } from '../../interfaces/tariff-zone';

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

  selectedTariffZone = signal<TariffZone | null>(null);
  showForm = signal(false);
  
  planAreas = signal<PlanArea[]>([]);
  
  // Zone de plan en cours d'édition
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
        console.log('Festival courant:', festival);
      }
    });
  }

  selectTariffZone(zone: TariffZone) {
    this.selectedTariffZone.set(zone);
    this.showForm.set(false);
    this.loadPlanAreas();
  }

  loadPlanAreas() {
    const festival = this.currentFestival();
    if (!festival) return;

    this.planAreaService.getPlanAreasByFestival(festival.name).subscribe({
      next: (areas) => {
        const selectedZone = this.selectedTariffZone();
        if (selectedZone) {
          const filteredAreas = areas.filter(area => area.idTZ === selectedZone.idTZ);
          this.planAreas.set(filteredAreas);
        }
      },
      error: (err) => {
        console.error('Erreur chargement zones:', err);
      }
    });
  }

  toggleForm() {
    this.showForm.update(v => !v);
  }

  // Méthode pour éditer
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

  // Méthode pour supprimer
  deletePlanArea(area: PlanArea) {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer la zone "${area.name}" ?`)) {
      return;
    }

    const selectedZone = this.selectedTariffZone();
    if (!selectedZone) return;

    this.planAreaService.deletePlanArea(area.id).subscribe({
      next: () => {
        alert('Zone de plan supprimée avec succès !');

        // REMETTRE LES TABLES (MAIS PAS PLUS QUE LE MAXIMUM)
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

        //CRÉER UN OBJET AVEC TOUS LES CHAMPS REQUIS PAR TariffZone
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
            
            // ATTENDRE ET RECHARGER
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

    // VALEURS DEMANDÉES
    const requestedSmall = formValue.nbSmallTables || 0;
    const requestedLarge = formValue.nbLargeTables || 0;
    const requestedCityHall = formValue.nbCityHallTables || 0;

    // CALCUL DES DIFFÉRENCES (en édition, on libère les anciennes tables)
    const smallDiff = editingArea 
      ? requestedSmall - editingArea.nbSmallTables 
      : requestedSmall;
    const largeDiff = editingArea 
      ? requestedLarge - editingArea.nbLargeTables 
      : requestedLarge;
    const cityHallDiff = editingArea 
      ? requestedCityHall - editingArea.nbCityHallTables 
      : requestedCityHall;

    // VÉRIFICATION : Les différences ne doivent PAS dépasser les tables disponibles
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

    // VÉRIFICATION : Les valeurs ne doivent PAS être négatives
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
        console.log(editingArea ? 'Zone modifiée:' : 'Zone créée:', response);

        // METTRE À JOUR LA ZONE TARIFAIRE (UNIQUEMENT LES DIFFÉRENCES)
        const updatedZone = {
          ...selectedZone,
          remainingSmallTables: selectedZone.remainingSmallTables - smallDiff,
          remainingLargeTables: selectedZone.remainingLargeTables - largeDiff,
          remainingCityHallTables: selectedZone.remainingCityHallTables - cityHallDiff
        };

        this.tariffZoneService.updateTariffZoneById(selectedZone.idTZ, updatedZone).subscribe({
          next: () => {
            alert(editingArea ? 'Zone modifiée avec succès !' : 'Zone créée avec succès !');
            
            this.festivalService.loadFestivalsFromBD();
            setTimeout(() => {
              const festival = this.currentFestival();
              if (festival) {
                const updatedZone = festival.tariffZones?.find(z => z.idTZ === selectedZone.idTZ);
                if (updatedZone) {
                  this.selectedTariffZone.set(updatedZone); 
                }
              }
              
              this.planAreaForm.reset();
              this.showForm.set(false);
              this.editingPlanArea.set(null);
              this.loadPlanAreas();
            }, 300); 
          },
          error: (err: any) => {
            console.error('Erreur mise à jour zone tarifaire:', err);
            alert('Opération réussie mais erreur de mise à jour des tables');
          }
        });
      },
      error: (err: any) => {
        console.error('Erreur:', err);
        alert('Erreur lors de l\'opération');
      }
    });
  }

  cancelForm() {
    this.planAreaForm.reset();
    this.showForm.set(false);
    this.editingPlanArea.set(null);
  }
}