import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserDto } from '../../interfaces/user-dto';
import { UserService } from '../../services/user-service';

@Component({
  selector: 'app-admin',
  imports: [ReactiveFormsModule],
  templateUrl: './admin.html',
  styleUrl: './admin.css',
})
export class Admin {
  public readonly userService = inject(UserService);

  availableRoles = [
    { value: 'visiteur', label: 'Visiteur' },
    { value: 'editeur_jeu', label: 'Éditeur de Jeu' },
    { value: 'organisateur', label: 'Organisateur' },
    { value: 'admin', label: 'Administrateur' }
  ];

  showForm = signal(false);

  userForm = new FormGroup({
    login: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(3)]
    }),
    password: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(6)]
    }),
    role: new FormControl<string>('visiteur', { nonNullable: true })
  });

  // Editing state
  editingUserId = signal<number | null>(null);
  editingRoleControl = new FormControl('', { nonNullable: true });

  successMessage = signal<string>('');
  errorMessage = signal<string>('');

  constructor() {
    this.userService.loadAll();
  }

  OpenCloseForm() {
    this.showForm.update(v => !v);
    if (!this.showForm()) {
      this.resetForm();
    }
  }

  onSubmit() {
    if (this.userForm.valid) {
      const { login, password, role } = this.userForm.getRawValue();

      this.userService.createUser(login, password, role).subscribe({
        next: () => {
          this.showSuccess(`Utilisateur "${login}" créé avec succès`);
          this.resetForm();
          this.showForm.set(false);
          this.userService.loadAll();
        },
        error: (err) => {
          const message = err.error?.error || 'Erreur lors de la création de l\'utilisateur';
          this.showError(message);
        }
      });
    }
  }

  resetForm() {
    this.userForm.reset({
      login: '',
      password: '',
      role: 'visiteur'
    });
  }

  // Start editing a user's role
  startEdit(userId: number, currentRole: string | String) {
    this.editingUserId.set(userId);
    this.editingRoleControl.setValue(currentRole.toString());
  }

  // Cancel editing
  cancelEdit() {
    this.editingUserId.set(null);
    this.editingRoleControl.setValue('');
  }

  // Handle role change
  onRoleChange(userId: number) {
    const newRole = this.editingRoleControl.value;
    if (!newRole) return;

    this.userService.updateUserRole(userId, newRole).subscribe({
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
