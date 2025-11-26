import { Component, effect, inject, input, output, signal } from '@angular/core';
//FormArray: Pour gérer un tableau de formulaires (nos zones tarifaires)
//FormBuilder: Service pour créer facilement des formulaires
//FormGroup: Représente un groupe de champs de formulaire
//ReactiveFormsModule: Module nécessaire pour les formulaires réactifs
//Validators: Pour ajouter des règles de validation
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FestivalService } from '../../services/festival.service';
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
  festivalToEdit = input<Festival | null>(null);
  formClosed = output<void>();
  
  //Signal qui contrôle si le formulaire est visible ou caché.
  //Réactif: quand sa valeur change, l'interface se met à jour automatiquement
  showForm = signal(false);
  
  festivalForm: FormGroup = this.fb.group({
    //Le champ name est obligatoire et minimum 3 caracteres.
    name: ['', [Validators.required, Validators.minLength(3)]],
    //Le champ nbtable est obligatoire et minimum 1 caractere.
    nbTables: [0, [Validators.required, Validators.min(1)]],
    //FormArray vide au départ et on y ajoutera dynamiquement des zones tarifaires
    tariffZones: this.fb.array([])
  });

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
    // Vider d'abord les zones existantes
    this.tariffZones.clear();
    
    // Remplir les champs principaux
    this.festivalForm.patchValue({
      name: festival.name,
      nbTables: festival.nbTables
    });
    
    // Ajouter chaque zone tarifaire
    festival.tariffZones.forEach(zone => {
      const zoneForm = this.fb.group({
        id: [zone.id],
        name: [zone.name, Validators.required],
        nbTables: [zone.nbTables, [Validators.required, Validators.min(1)]],
        tablePrice: [zone.tablePrice, [Validators.required, Validators.min(0)]],
        squareMeterPrice: [zone.squareMeterPrice, [Validators.required, Validators.min(0)]],
        festivalName: [zone.festivalName]
      });
      this.tariffZones.push(zoneForm);
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
      id: [Date.now()], //Génère un ID unique basé sur l'heure actuelle
      name: ['', Validators.required],
      nbTables: [0, [Validators.required, Validators.min(1)]],
      tablePrice: [0, [Validators.required, Validators.min(0)]],
      squareMeterPrice: [0, [Validators.required, Validators.min(0)]],
      festivalName: ['']
    });
    this.tariffZones.push(zoneForm);//Ajoute ce formulaire au FormArray avec push()
  }

  removeTariffZone(index: number) {
    this.tariffZones.removeAt(index);
  }

  onSubmit() {
    if (this.festivalForm.valid) {
      const formValue = this.festivalForm.value;
      
      const festival: Festival = {
        ...formValue,// ← Copie TOUT de formValue
        tariffZones: formValue.tariffZones.map((zone: any) => ({
          ...zone,// ← Copie TOUT de chaque zone
          festivalName: formValue.name
        }))
      };
      
      // MODE ÉDITION : Si on a un festival à éditer
      if (this.festivalToEdit()) {
        const originalName = this.festivalToEdit()!.name;
        this.festivalService.updateFestival(originalName, festival);
      } 
      // MODE CRÉATION : Nouveau festival
      else {
        this.festivalService.addFestival(festival);
      }
      
      this.resetForm();
      this.showForm.set(false);
      this.formClosed.emit(); 
    }
  }

  resetForm() {
    this.festivalForm.reset({ nbTables: 0 });
    this.tariffZones.clear();
  }

  // Indique si on est en mode édition ou création
  isEditMode(): boolean {
    return this.festivalToEdit() !== null;
  }
}