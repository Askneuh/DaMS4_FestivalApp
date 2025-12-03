import { Component, inject, signal, computed } from '@angular/core';
import { EditorCardComponent } from '../editor-card-component/editor-card-component';
import { EditorService } from '../../services/editor-service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-editors-list',
  imports: [EditorCardComponent, FormsModule],
  templateUrl: './editor-list-component.html',
  styleUrl: './editor-list-component.css'
})
export class EditorListComponent {
  private editorService = inject(EditorService);

  protected editors = this.editorService.editors;

  protected search = signal('');
  protected sortBy = signal<'name' | 'gamesCount' | 'contactsCount'>('name');

  protected filteredEditors = computed(() => {
    // On cherche dans la liste des editeurs
    let result = this.search() 
      ? this.editorService.searchByName(this.search())
      : this.editorService.editors();
    
    // On trie (on fait une copie du tableau original pour pouvoir trier la copie)
    const sorted = [...result].sort((a, b) => {
      switch (this.sortBy()) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'gamesCount':
          return b.games.length - a.games.length;
        case 'contactsCount':
          return b.contacts.length - a.contacts.length;
        default:
          return 0;
      }
    });
    
    return sorted;
  });
  

  // Quand un utilisateur change ce qui est dans la barre de recherche onSearchChange est appelée
  onSearchChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.search.set(input.value);
  }
  
  // Quand un utilisateur change le critère de tri onSortChange est appelée
  onSortChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.sortBy.set(select.value as 'name' | 'gamesCount' | 'contactsCount');
  }
  
  handleDelete(editorId: number): void {
    const editor = this.editorService.findById(editorId);
    if (editor && confirm(`Supprimer ${editor.name} ?`)) { 
      this.editorService.removeEditor(editorId);
    }
  }


}