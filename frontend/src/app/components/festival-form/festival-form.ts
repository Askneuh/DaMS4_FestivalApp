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

@Component({
  selector: 'app-festival-form',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './festival-form.html',
  styleUrl: './festival-form.css',
})
export class FestivalFormComponent {
  //fb: Service pour construire nos formulaires facilement
  private fb = inject(FormBuilder);
  private festivalService = inject(FestivalService);
  private tariffZoneService = inject(TariffZoneService);
  festivalToEdit = input<Festival | null>(null);
  formClosed = output<void>();

  //Signal qui contrôle si le formulaire est visible ou caché.
  //Réactif: quand sa valeur change, l'interface se met à jour automatiquement
  showForm = signal(false);

  festivalForm: FormGroup = this.fb.group({
    //Le champ name est obligatoire et minimum 3 caracteres.
    name: ['', [Validators.required, Validators.minLength(3)]],
    //Les champs de tables sont obligatoires et minimum 0.
    nbSmallTables: [0, [Validators.required, Validators.min(0)]],
    nbLargeTables: [0, [Validators.required, Validators.min(0)]],
    nbCityHallTables: [0, [Validators.required, Validators.min(0)]],
    //FormArray vide au départ et on y ajoutera dynamiquement des zones tarifaires
    tariffZones: this.fb.array([])
  }, { validators: this.tableAllocationValidator }); // Ajout du validateur ici

  // Effect: Pré-remplit le formulaire quand on reçoit un festival à éditer
  constructor() {
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
      name: festival.name,
      nbSmallTables: festival.nbSmallTables,
      nbLargeTables: festival.nbLargeTables,
      nbCityHallTables: festival.nbCityHallTables
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

      const festival: Festival = {
        name: formValue.name,
        nbSmallTables: formValue.nbSmallTables,
        nbLargeTables: formValue.nbLargeTables,
        nbCityHallTables: formValue.nbCityHallTables,
        remainingSmallTables: formValue.nbSmallTables,
        remainingLargeTables: formValue.nbLargeTables,
        remainingCityHallTables: formValue.nbCityHallTables,
        isCurrent: false,
        tariffZones: formValue.tariffZones.map((zone: any) => ({
          ...zone,
          remainingSmallTables: zone.nbSmallTables,
          remainingLargeTables: zone.nbLargeTables,
          remainingCityHallTables: zone.nbCityHallTables,
          festivalName: formValue.name
        }))
      };

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
    this.festivalForm.reset({
      nbSmallTables: 0,
      nbLargeTables: 0,
      nbCityHallTables: 0
    });
    this.tariffZones.clear();
  }

  // Indique si on est en mode édition ou création
  isEditMode(): boolean {
    return this.festivalToEdit() !== null;
  }

  // Custom Validator pour vérifier l'allocation des tables
  tableAllocationValidator(group: AbstractControl): ValidationErrors | null {
    const nbSmallTables = group.get('nbSmallTables')?.value || 0;
    const nbLargeTables = group.get('nbLargeTables')?.value || 0;
    const nbCityHallTables = group.get('nbCityHallTables')?.value || 0;

    const tariffZones = group.get('tariffZones') as FormArray;

    if (!tariffZones) return null;

    let allocatedSmall = 0;
    let allocatedLarge = 0;
    let allocatedCityHall = 0;

    tariffZones.controls.forEach((zone) => {
      allocatedSmall += zone.get('nbSmallTables')?.value || 0;
      allocatedLarge += zone.get('nbLargeTables')?.value || 0;
      allocatedCityHall += zone.get('nbCityHallTables')?.value || 0;
    });

    const errors: any = {};
    let hasError = false;

    if (allocatedSmall > nbSmallTables) {
      errors.smallTablesExceeded = { allocated: allocatedSmall, total: nbSmallTables };
      hasError = true;
    }
    if (allocatedLarge > nbLargeTables) {
      errors.largeTablesExceeded = { allocated: allocatedLarge, total: nbLargeTables };
      hasError = true;
    }
    if (allocatedCityHall > nbCityHallTables) {
      errors.cityHallTablesExceeded = { allocated: allocatedCityHall, total: nbCityHallTables };
      hasError = true;
    }

    return hasError ? errors : null;
  }
}
