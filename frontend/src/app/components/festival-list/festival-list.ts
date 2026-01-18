import { Component, inject, signal, effect } from '@angular/core';
//effect:Pour executer du code quand un signal change.
import { FestivalCardComponent } from '../festival-card-component/festival-card-component';
import { Festival } from '../../interfaces/festival';
import { FestivalService } from '../../services/festival-service';
import { FestivalFormComponent } from '../festival-form/festival-form';

@Component({
  selector: 'app-festival-list',
  imports: [FestivalCardComponent,FestivalFormComponent],
  templateUrl: './festival-list.html',
  styleUrl: './festival-list.css',
})
export class FestivalList {
  readonly svc = inject(FestivalService);
  readonly a = this.svc.loadFestivalsFromBD();
  festivals = this.svc.festivalList;
  lastRemoved = signal<Festival | null>(null);
  //Signal pour le festival en cours d'édition:
  festivalToEdit = signal<Festival | null>(null);


  nbFestivals = effect(() => {
    //Le code prend effet si on SUPPRIME un festival,on AJOUTE un festival,on MODIFIE la liste entière
    console.log('Nombre de festivals :', this.svc.festivalList().length);
    //Le code prend effet si on met à jour lastRemoved dans removeFestival,on réinitialise lastRemoved
    console.log('Dernier supprimé :', this.lastRemoved()?.name);
  });

  //// Méthode appelée quand on clique sur Modifier
  onEditFestival(festival: Festival) {
    this.festivalToEdit.set(festival);
  }

  // Réinitialiser après modification
  onFormClosed() {
    this.festivalToEdit.set(null);
  }

  removeFestival(name: string) {
    // 1. Trouver le festival à supprimer
    const lastRemTemp = this.svc.findByName(name).subscribe(festival => {
      this.lastRemoved.set(festival);
    });
    // 2. Supprimer du service
    this.svc.removeFestivalByName(name);
  }

  onMakeCurrent(festivalName: string) {
    this.svc.setCurrentFestival(festivalName).subscribe({
      next: () => {
        console.log(`Festival "${festivalName}" défini comme courant`);
      },
      error: (err) => {
        console.error('Erreur lors de la définition du festival courant:', err);
      }
    });
  }
}
