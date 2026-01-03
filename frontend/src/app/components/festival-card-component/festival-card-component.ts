import { Component, input, output} from '@angular/core';
import { Festival } from '../../interfaces/festival';

@Component({
  selector: 'app-festival-card-component',
  imports: [],
  templateUrl: './festival-card-component.html',
  styleUrl: './festival-card-component.css'
})
export class FestivalCardComponent {
  public festival = input<Festival>();

  //Permet d'ajouter un bouton pour updater les infos d'un festival.
  editFestival = output<Festival>();
  // Output pour supprimer
  deleteFestival = output<string>(); 

  onEdit() {
    const fest = this.festival();
    if (fest) {
      this.editFestival.emit(fest);
    }
  }

  onDelete() {
    const fest = this.festival();
    if (fest) {
      // Afficher une confirmation avant suppression
      const confirmDelete = confirm(
        `Êtes-vous sûr de vouloir supprimer le festival "${fest.name}" ?\n\nCette action est irréversible.`
      );
      
      if (confirmDelete) {
        this.deleteFestival.emit(fest.name);
      }
    }
  }
  
}
