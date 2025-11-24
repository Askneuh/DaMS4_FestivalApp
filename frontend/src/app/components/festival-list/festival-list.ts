import { Component, inject, signal, effect } from '@angular/core';
//effect:Pour executer du code quand un signal change.
import { FestivalCardComponent } from '../festival-card-component/festival-card-component';
import { Festival } from '../../interfaces/festival';
import { FestivalListService } from '../../services/festival-list.service';

@Component({
  selector: 'app-festival-list',
  imports: [FestivalCardComponent],
  templateUrl: './festival-list.html',
  styleUrl: './festival-list.css',
})
export class FestivalList {
  readonly svc = inject(FestivalListService);
  festivals = this.svc.festivalList;
  lastRemoved = signal<Festival | null>(null);

  nbFestivals = effect(() => {
    //Le code prend effet si on SUPPRIME un festival,on AJOUTE un festival,on MODIFIE la liste entière
    console.log('Nombre de festivals :', this.svc.festivalList().length);
    //Le code prend effet si on met à jour lastRemoved dans removeFestival,on réinitialise lastRemoved
    console.log('Dernier supprimé :', this.lastRemoved()?.name);
  });

  removeFestival(name: string) {
    // 1. Trouver le festival à supprimer
    const lastRemTemp = this.svc.findByName(name);
    // 2. Si trouvé, le sauvegarder
    if (lastRemTemp) {
      this.lastRemoved.set(lastRemTemp);
    }
    // 3. Supprimer du service
    this.svc.removeFestival(name);
  }
}
