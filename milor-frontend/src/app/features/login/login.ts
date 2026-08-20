import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div class="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-800 space-y-6">
        <div class="text-center">
          <span class="text-4xl">🍔</span>
          <h1 class="text-2xl font-black text-slate-900 mt-2">MILOR POS</h1>
          <p class="text-xs text-slate-500 mt-1">Ingresa tus credenciales para acceder</p>
        </div>

        @if (errorMsg()) {
          <div class="p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl font-bold text-center">
            {{ errorMsg() }}
          </div>
        }

        <form (ngSubmit)="enviarLogin()" class="space-y-4">
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Usuario</label>
            <input type="text" [(ngModel)]="username" name="username" required
                   class="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-amber-500">
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Contraseña</label>
            <input type="password" [(ngModel)]="password" name="password" required
                   class="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-amber-500">
          </div>
          <button type="submit" class="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition shadow-sm text-xs uppercase tracking-wider">
            Iniciar Sesión
          </button>
        </form>
      </div>
    </div>
  `
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  username = '';
  password = '';
  errorMsg = signal<string | null>(null);

  enviarLogin(): void {
    this.auth.login(this.username, this.password).subscribe({
      next: (user) => {
        if (user.rol === 'MESERO') {
          this.router.navigate(['/operador']);
        } else {
          this.router.navigate(['/admin/dashboard']);
        }
      },
      error: (err) => {
        this.errorMsg.set(err.error?.message || 'Credenciales incorrectas');
      }
    });
  }
}