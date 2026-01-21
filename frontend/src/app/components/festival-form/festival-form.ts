import { Component, effect, inject, input, output, signal } from '@angular/core';
//FormArray: Pour gérer un tableau de formulaires (nos zones tarifaires)
//FormBuilder: Service pour créer facilement des formulaires
//FormGroup: Représente un groupe de champs de formulaire
//ReactiveFormsModule: Module nécessaire pour les formulaires réactifs
//Validators: Pour ajouter des règles de validation
import { AbstractControl, FormArray, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { FestivalService } from '../../services/festival-service';
import { TariffZoneService } from '../../services/tariff-zone-service';
import { Festival } from '../../interfaces/festival';
import { CommonModule } from '@angular/common';
import { ValidationService } from '../../services/validation-service';
import { TariffZoneForm } from '../tariff-zone-form/tariff-zone-form';

@Component({
  selector: 'app-festival-form',
  imports: [ReactiveFormsModule, CommonModule, TariffZoneForm],
  templateUrl: './festival-form.html',
  styleUrl: './festival-form.css',
})
export class FestivalFormComponent {
  readonly festivalService = inject(FestivalService);
  readonly tariffZoneService = inject(TariffZoneService);
  readonly validationService = inject(ValidationService);
  festivalToEdit = input<Festival | null>(null);
  formClosed = output<void>();

  showForm = signal(false);

  // Custom Validator pour vérifier qu'au moins une zone existe
  atLeastOneZoneValidator = (control: AbstractControl): ValidationErrors | null => {
    const zones = control as FormArray;
    if (zones.length === 0) {
      return { noZones: true };
    }
    return null;
  }

  festivalForm = new FormGroup({
    name: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(3)]
    }),
    tariffZones: new FormArray<FormGroup>([], this.atLeastOneZoneValidator)
  });

  constructor() {
    effect(() => {
      const festival = this.festivalToEdit();
      if (festival) {
        this.loadFestivalData(festival);
        this.showForm.set(true);
      }
    });
  }

  get tariffZones(): FormArray {
    return this.festivalForm.controls.tariffZones;
  }

  private createZoneForm(zone?: any): FormGroup {
    return new FormGroup({
      idTZ: new FormControl<number>(zone?.idTZ ?? 0, { nonNullable: true }),
      name: new FormControl<string>(zone?.name ?? '', { nonNullable: true, validators: [Validators.required] }),
      nbSmallTables: new FormControl<number>(zone?.nbSmallTables ?? 0, { nonNullable: true, validators: [Validators.required, Validators.min(0)] }),
      nbLargeTables: new FormControl<number>(zone?.nbLargeTables ?? 0, { nonNullable: true, validators: [Validators.required, Validators.min(0)] }),
      nbCityHallTables: new FormControl<number>(zone?.nbCityHallTables ?? 0, { nonNullable: true, validators: [Validators.required, Validators.min(0)] }),
      smallTablePrice: new FormControl<number>(zone?.smallTablePrice ?? 0, { nonNullable: true, validators: [Validators.required, Validators.min(0)] }),
      largeTablePrice: new FormControl<number>(zone?.largeTablePrice ?? 0, { nonNullable: true, validators: [Validators.required, Validators.min(0)] }),
      cityHallTablePrice: new FormControl<number>(zone?.cityHallTablePrice ?? 0, { nonNullable: true, validators: [Validators.required, Validators.min(0)] }),
      squareMeterPrice: new FormControl<number>(zone?.squareMeterPrice ?? 0, { nonNullable: true, validators: [Validators.required, Validators.min(0)] }),
      festivalName: new FormControl<string>(zone?.festivalName ?? '', { nonNullable: true })
    });
  }

  loadFestivalData(festival: Festival) {
    this.tariffZones.clear();

    this.festivalForm.patchValue({
      name: festival.name
    });

    this.tariffZoneService.findByFestivalName(festival.name).subscribe(zones => {
      this.tariffZones.clear();
      zones.forEach(zone => {
        this.tariffZones.push(this.createZoneForm(zone));
      });
    });
  }

  OpenCloseForm() {
    this.showForm.update(v => !v);
    if (!this.showForm()) {
      this.resetForm();
    }
  }

  addTariffZone() {
    this.tariffZones.push(this.createZoneForm());
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

  castToFormGroup(control: AbstractControl): FormGroup {
    return control as FormGroup;
  }
}
