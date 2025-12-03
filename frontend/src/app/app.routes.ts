import { Routes } from '@angular/router';
import { FestivalList } from './components/festival-list/festival-list';
import { FestivalDetail } from './components/festival-detail/festival-detail';


export const routes: Routes = [
  { path: '', component: FestivalList }, //URL racine,Affiche la liste des festivals
  { path: 'festival/:name', component: FestivalDetail }//Affiche les détails d'un festival
];
