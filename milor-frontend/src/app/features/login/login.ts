import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService, RolUsuario } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div class="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-800 space-y-6 text-center">
        <div>
          <span class="text-4xl">🍔</span>
          <h1 class="text-2xl font-black text-slate-900 mt-2">MILOR POS</h1>
          <p class="text-xs text-slate-500 mt-1">Selecciona tu perfil de acceso al sistema</p>
        </div>

        <div class="space-y-3">
          <button (click)="ingresar('MESERO')" class="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition shadow-sm text-xs uppercase tracking-wider">
            👨‍🍳 Ingresar como Mesero (Solo Operador)
          </button>
          <button (click)="ingresar('ADMIN')" class="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition shadow-sm text-xs uppercase tracking-wider">
            ⚙️ Ingresar como Administrador (Carta, Dashboard, Historial)
          </button>
          <button (click)="ingresar('SOPORTE')" class="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition shadow-sm text-xs uppercase tracking-wider">
            🛠️ Ingresar como Soporte [Tú] (Acceso Total)
          </button>
        </div>
      </div>
    </div>
  `
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  ingresar(rol: RolUsuario): void {
    this.auth.iniciarSesion(rol);
    if (rol === 'MESERO') {
      this.router.navigate(['/operador']);
    } else {
      this.router.navigate(['/admin/dashboard']);
    }
  }
}