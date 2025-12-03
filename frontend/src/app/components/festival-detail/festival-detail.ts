import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FestivalService } from '../../services/festival-service';
import { Festival } from '../../interfaces/festival';
import { CommonModule } from '@angular/common';
import { ReservationService } from '../../services/reservation-service';
import { ReservationForm } from '../reservation-form/reservation-form';
//ce fichier,Il récupère le nom du festival depuis l'URL, le cherche dans le service, et l'affiche.
@Component({
  selector: 'app-festival-detail',
  imports: [CommonModule,ReservationForm],
  templateUrl: './festival-detail.html',
  styleUrl: './festival-detail.css',
})


export class FestivalDetail implements OnInit {//Oninit est une interface fournie par Angular.
  private route = inject(ActivatedRoute);
  private router = inject(Router);//permet de changer de page
  private festivalService = inject(FestivalService);
  private reservationService = inject(ReservationService);
  
  
  festival = signal<Festival | undefined>(undefined);
  
  reservations = computed(() => {
    const fest = this.festival();
    if (!fest) return [];
    return this.reservationService.reservationList()
      .filter(r => r.festivalName === fest.name);
  });

  ////Angular garantit que quand ngOnInit() s'exécute, tout est prêt : les injections, l'URL, le DOM, etc.
  ngOnInit() {
    const name = this.route.snapshot.params['name'];//Récupère le nom du festival depuis l'URL (ex: "Festival-Rose")
    const found = this.festivalService.findByName(name);//Cherche ce festival dans la liste du service
    if (found) {
      this.festival.set(found);//Si trouvé, le met dans le signal pour l'afficher
    }
  }

  goBack() {
    this.router.navigate(['/']);
  }

  // Appelée quand une réservation est créée
  onReservationCreated() {
    // Les réservations se mettent à jour automatiquement via le signal
  }

  // Supprimer une réservation
  deleteReservation(id: number) {
    const confirmDelete = confirm('Supprimer cette réservation ?');
    if (confirmDelete) {
      this.reservationService.removeReservation(id);
    }
  }
  // Tables restantes par zone
getTablesRestantesZone(zoneName: string): number {
  const fest = this.festival();
  if (!fest) return 0;
  
  const zone = fest.tariffZones.find(z => z.name === zoneName);
  if (!zone) return 0;
  
  const tablesReservees = this.festivalService.getTablesReserveesParZone(
    fest.name, 
    zoneName, 
    this.reservationService
  );
  
  return zone.nbTables - tablesReservees;
}
}
