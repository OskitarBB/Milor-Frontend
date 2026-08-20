import { Component, inject, signal, effect, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { WebSocketService } from './core/services/websocket.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <!-- ================================================= -->
    <!-- NOTIFICACIÓN FLOTANTE GLOBAL (EN CUALQUIER SECCIÓN) -->
    <!-- ================================================= -->
    @if (nuevaNotificacion()) {
      <div class="fixed bottom-6 right-6 z-50 animate-bounce bg-amber-500 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center space-x-3 border border-amber-400">
        <span class="text-xl">🔔</span>
        <div>
          <h4 class="text-xs font-black uppercase tracking-wider">¡Alerta de Venta!</h4>
          <p class="text-xs font-medium">{{ nuevaNotificacion() }}</p>
        </div>
      </div>
    }

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

            <!-- Administrador o Soporte ven las secciones administrativas + Configuración -->
            @if (rol() === 'ADMIN' || rol() === 'SOPORTE') {
              <a routerLink="/admin/dashboard" routerLinkActive="bg-slate-900 text-white" class="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition">
                📊 Dashboard
              </a>
              <a routerLink="/admin/carta" routerLinkActive="bg-slate-900 text-white" class="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition">
                ⚙️ Carta
              </a>
              <a routerLink="/admin/historial" routerLinkActive="bg-slate-900 text-white" class="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition">
                📜 Historial
              </a>
              <a routerLink="/admin/usuarios" routerLinkActive="bg-slate-900 text-white" class="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition">
                👥 Configuración
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
export class App implements OnDestroy {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly webSocketService = inject(WebSocketService);
  private wsSub?: Subscription;
  
  readonly rol = this.auth.rolActual;
  readonly nuevaNotificacion = signal<string | null>(null);

  constructor() {
    // Efecto reactivo: Conecta el WebSocket automáticamente al autenticarse
    effect(() => {
      if (this.auth.estaAutenticado()) {
        this.webSocketService.conectar(() => {
          if (!this.wsSub) {
            this.wsSub = this.webSocketService.onVentaRegistrada().subscribe({
              next: () => {
                this.nuevaNotificacion.set('¡Se ha registrado una nueva venta en el sistema!');
                setTimeout(() => {
                  this.nuevaNotificacion.set(null);
                }, 4000);
              }
            });
          }
        });
      } else {
        if (this.wsSub) {
          this.wsSub.unsubscribe();
          this.wsSub = undefined;
        }
      }
    }, { allowSignalWrites: true });
  }

  ngOnDestroy(): void {
    if (this.wsSub) {
      this.wsSub.unsubscribe();
    }
  }

  salir(): void {
    this.auth.cerrarSesion();
    this.router.navigate(['/login']);
  }
}