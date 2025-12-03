import { Routes } from '@angular/router';
import { EditorListComponent } from './components/editor-list-component/editor-list-component';
import { FestivalList } from './components/festival-list/festival-list';

export const routes: Routes = [
  { path: '', redirectTo: '/festivals', pathMatch: 'full' },
  { path: 'festivals', component: FestivalList },
  { path: 'editors', component: EditorListComponent }
];