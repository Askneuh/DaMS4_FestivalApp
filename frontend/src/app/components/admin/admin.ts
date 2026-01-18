import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UserDto } from '../../interfaces/user-dto';
import { UserService } from '../../services/user-service';

@Component({
  selector: 'app-admin',
  imports: [FormsModule],
  templateUrl: './admin.html',
  styleUrl: './admin.css',
})
export class Admin {
  public readonly userService = inject(UserService);

  // Available roles
  availableRoles = [
    { value: 'visiteur', label: 'Visiteur' },
    { value: 'editeur_jeu', label: 'Éditeur de Jeu' },
    { value: 'organisateur', label: 'Organisateur' },
    { value: 'admin', label: 'Administrateur' }
  ];

  // New user form data
  newUser = {
    login: '',
    password: '',
    role: 'visiteur'
  };

  // Editing state
  editingUserId = signal<number | null>(null);
  editingRole = '';

  // Feedback messages
  successMessage = signal<string>('');
  errorMessage = signal<string>('');

  constructor() {
    this.userService.loadAll();
  }

  // Create a new user
  onCreateUser(event: Event) {
    event.preventDefault();

    if (!this.newUser.login || !this.newUser.password) {
      this.showError('Login et mot de passe requis');
      return;
    }

    this.userService.createUser(
      this.newUser.login,
      this.newUser.password,
      this.newUser.role
    ).subscribe({
      next: () => {
        this.showSuccess(`Utilisateur "${this.newUser.login}" créé avec succès`);
        // Reset form
        this.newUser = { login: '', password: '', role: 'visiteur' };
        // Reload users
        this.userService.loadAll();
      },
      error: (err) => {
        const message = err.error?.error || 'Erreur lors de la création de l\'utilisateur';
        this.showError(message);
      }
    });
  }

  // Start editing a user's role
  startEdit(userId: number, currentRole: string | String) {
    this.editingUserId.set(userId);
    this.editingRole = currentRole.toString();
  }

  // Cancel editing
  cancelEdit() {
    this.editingUserId.set(null);
    this.editingRole = '';
  }

  // Handle role change
  onRoleChange(userId: number) {
    this.userService.updateUserRole(userId, this.editingRole).subscribe({
      next: () => {
        this.showSuccess('Rôle mis à jour avec succès');
        this.cancelEdit();
        // Reload users to reflect changes
        this.userService.loadAll();
      },
      error: (err) => {
        const message = err.error?.error || 'Erreur lors de la mise à jour du rôle';
        this.showError(message);
        this.cancelEdit();
      }
    });
  }

  // Get role label from value
  getRoleLabel(roleValue: string | String): string {
    const role = this.availableRoles.find(r => r.value === roleValue);
    return role ? role.label : roleValue.toString();
  }

  // Delete a user
  deleteUser(userId: number, login: string) {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur "${login}" ?`)) {
      return;
    }

    this.userService.deleteUser(userId).subscribe({
      next: () => {
        this.showSuccess(`Utilisateur "${login}" supprimé avec succès`);
        this.userService.loadAll();
      },
      error: (err) => {
        const message = err.error?.error || 'Erreur lors de la suppression de l\'utilisateur';
        this.showError(message);
      }
    });
  }

  // Show success message
  private showSuccess(message: string) {
    this.successMessage.set(message);
    this.errorMessage.set('');
    setTimeout(() => this.successMessage.set(''), 5000);
  }

  // Show error message
  private showError(message: string) {
    this.errorMessage.set(message);
    this.successMessage.set('');
    setTimeout(() => this.errorMessage.set(''), 5000);
  }
}
