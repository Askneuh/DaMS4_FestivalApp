import { Component, effect, inject, input, output, signal } from '@angular/core';
//FormArray: Pour gérer un tableau de formulaires (nos zones tarifaires)
//FormBuilder: Service pour créer facilement des formulaires
//FormGroup: Représente un groupe de champs de formulaire
//ReactiveFormsModule: Module nécessaire pour les formulaires réactifs
//Validators: Pour ajouter des règles de validation
import { AbstractControl, FormArray, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { FestivalService } from '../../services/festival-service';
import { TariffZoneService } from '../../services/tariff-zone-service';
import { Festival } from '../../interfaces/festival';
import { CommonModule } from '@angular/common';
import { ValidationService } from '../../services/validation.service';

@Component({
  selector: 'app-festival-form',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './festival-form.html',
  styleUrl: './festival-form.css',
})
export class FestivalFormComponent {
  //fb: Service pour construire nos formulaires facilement
  readonly fb = inject(FormBuilder);
  readonly festivalService = inject(FestivalService);
  readonly tariffZoneService = inject(TariffZoneService);
  readonly validationService = inject(ValidationService);
  festivalToEdit = input<Festival | null>(null);
  formClosed = output<void>();

  //Signal qui contrôle si le formulaire est visible ou caché.
  //Réactif: quand sa valeur change, l'interface se met à jour automatiquement
  showForm = signal(false);

  // Déclarer sans initialiser (sera initialisé dans le constructor)
  festivalForm!: FormGroup;

  constructor() {
    // Initialiser le formulaire APRÈS les injections de dépendances
    this.festivalForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      tariffZones: this.fb.array([], this.atLeastOneZoneValidator)
    });

    // Effect: Pré-remplit le formulaire quand on reçoit un festival à éditer
    effect(() => {
      const festival = this.festivalToEdit();
      if (festival) {
        this.loadFestivalData(festival);
        this.showForm.set(true);
      }
    });
  }

  //Simplification appeler this.tariffZones() au lieu de l'expression complique.
  get tariffZones(): FormArray {
    return this.festivalForm.get('tariffZones') as FormArray;
  }

  // Charge les données d'un festival dans le formulaire
  loadFestivalData(festival: Festival) {
    console.log('Festival reçu:', festival);
    console.log('Zones tarifaires:', festival.tariffZones);
    // Vider d'abord les zones existantes
    this.tariffZones.clear();

    // Remplir les champs principaux
    this.festivalForm.patchValue({
      name: festival.name
    });

    // Ajouter chaque zone tarifaire
    // On utilise le service pour charger les zones à jour au cas où
    this.tariffZoneService.findByFestivalName(festival.name).subscribe(zones => {
      // Nettoyer encore au cas ou
      this.tariffZones.clear();
      zones.forEach(zone => {
        const zoneForm = this.fb.group({
          idTZ: [zone.idTZ],
          name: [zone.name, Validators.required],
          nbSmallTables: [zone.nbSmallTables, [Validators.required, Validators.min(0)]],
          nbLargeTables: [zone.nbLargeTables, [Validators.required, Validators.min(0)]],
          nbCityHallTables: [zone.nbCityHallTables, [Validators.required, Validators.min(0)]],
          smallTablePrice: [zone.smallTablePrice, [Validators.required, Validators.min(0)]],
          largeTablePrice: [zone.largeTablePrice, [Validators.required, Validators.min(0)]],
          cityHallTablePrice: [zone.cityHallTablePrice, [Validators.required, Validators.min(0)]],
          squareMeterPrice: [zone.squareMeterPrice, [Validators.required, Validators.min(0)]],
          festivalName: [zone.festivalName]
        });
        this.tariffZones.push(zoneForm);
      });
    });
  }


  //Cette méthode sert à afficher/masquer le formulaire et à le nettoyer quand on le ferme.
  OpenCloseForm() {
    this.showForm.update(v => !v);
    if (!this.showForm()) {
      this.resetForm();
    }
  }

  addTariffZone() {
    //1:Crée un nouveau FormGroup pour une zone tarifaire
    const zoneForm = this.fb.group({
      idTZ: [0], // ID sera généré par la base de données
      name: ['', Validators.required],
      nbSmallTables: [0, [Validators.required, Validators.min(0)]],
      nbLargeTables: [0, [Validators.required, Validators.min(0)]],
      nbCityHallTables: [0, [Validators.required, Validators.min(0)]],
      smallTablePrice: [0, [Validators.required, Validators.min(0)]],
      largeTablePrice: [0, [Validators.required, Validators.min(0)]],
      cityHallTablePrice: [0, [Validators.required, Validators.min(0)]],
      squareMeterPrice: [0, [Validators.required, Validators.min(0)]],
      festivalName: ['']
    });
    this.tariffZones.push(zoneForm);//Ajoute ce formulaire au FormArray avec push()
  }

  removeTariffZone(index: number) {
    const zoneGroup = this.tariffZones.at(index) as FormGroup;
    const idTZ = zoneGroup.get('idTZ')?.value;

    if (idTZ && idTZ > 0) {
      if (confirm("Voulez-vous vraiment supprimer cette zone tarifaire ? Cela est immédiat.")) {
        this.tariffZoneService.deleteTariffZoneById(idTZ).subscribe({
          next: () => {
            this.tariffZones.removeAt(index);
          },
          error: (err) => {
            console.error("Erreur suppression zone", err);
            const errorMessage = err.error?.error || "Une erreur est survenue lors de la suppression.";
            alert(errorMessage);
          }
        });
      }
    } else {
      this.tariffZones.removeAt(index);
    }
  }

  onSubmit() {
    if (this.festivalForm.valid) {
      const formValue = this.festivalForm.value;

      // Use service method instead of duplicating logic
      const festival = this.festivalService.prepareFestivalForSave(formValue);

      // MODE ÉDITION
      if (this.festivalToEdit()) {
        const originalName = this.festivalToEdit()!.name;
        this.festivalService.updateFestivalByName(originalName, festival);
        this.finishSubmit();
      }
      // MODE CRÉATION
      else {
        this.festivalService.addFestival(festival);
        this.finishSubmit();
      }
    }
  }

  finishSubmit() {
    this.resetForm();
    this.showForm.set(false);
    this.formClosed.emit();
  }

  resetForm() {
    this.festivalForm.reset();
    this.tariffZones.clear();
  }

  // Indique si on est en mode édition ou création
  isEditMode(): boolean {
    return this.festivalToEdit() !== null;
  }

  // Custom Validator pour vérifier qu'au moins une zone existe
  atLeastOneZoneValidator = (control: AbstractControl): ValidationErrors | null => {
    const zones = control as FormArray;
    if (zones.length === 0) {
      return { noZones: true };
    }
    return null;
  }
}
