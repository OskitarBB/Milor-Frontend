import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    @if (auth.estaAutenticado()) {
      <header class="bg-white border-b border-slate-200 px-6 py-3 flex justify-between items-center shadow-xs">
        <div class="flex items-center gap-6">
          <span class="font-black text-slate-900 tracking-wider">MILOR POS</span>
          
          <nav class="flex items-center gap-2">
            <!-- Mesero o Soporte ven Operador -->
            @if (rol() === 'MESERO' || rol() === 'SOPORTE') {
              <a routerLink="/operador" routerLinkActive="bg-slate-900 text-white" class="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition">
                ⚡ Operador (Ventas)
              </a>
            }

            <!-- Administrador o Soporte ven Carta, Dashboard e Historial -->
            @if (rol() === 'ADMIN' || rol() === 'SOPORTE') {
              <a routerLink="/admin/carta" routerLinkActive="bg-slate-900 text-white" class="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition">
                ⚙️ Configurar Carta
              </a>
              <a routerLink="/admin/dashboard" routerLinkActive="bg-slate-900 text-white" class="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition">
                📊 Dashboard en Vivo
              </a>
              <a routerLink="/admin/historial" routerLinkActive="bg-slate-900 text-white" class="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition">
                📜 Historial de Ventas
              </a>
            }
          </nav>
        </div>

        <button (click)="salir()" class="text-xs font-bold text-red-600 hover:bg-red-50 px-3 py-2 rounded-xl transition">
          Cerrar Sesión
        </button>
      </header>
    }

    <router-outlet></router-outlet>
  `
})
export class App {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  
  readonly rol = this.auth.rolActual;

  salir(): void {
    this.auth.cerrarSesion();
    this.router.navigate(['/login']);
  }
}