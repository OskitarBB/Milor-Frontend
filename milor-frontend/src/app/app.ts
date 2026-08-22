// app.ts
import { Component, inject, signal, computed, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { WebSocketService } from './core/services/websocket.service';
import { Subscription, filter } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <!-- Estilos de animación personalizados para el menú desplegable -->
    <style>
      @keyframes slideUpFade {
        0% {
          opacity: 0;
          transform: translateY(10px) scale(0.95);
        }
        100% {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }
      .animate-slide-up {
        animation: slideUpFade 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      }
    </style>

    <!-- Notificación flotante global estricta -->
    @if (mostrarNotificacionAlerta()) {
      <div class="fixed bottom-6 right-6 z-50 animate-bounce bg-amber-500 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center space-x-3 border border-amber-400">
        <span class="text-xl">🔔</span>
        <div>
          <h4 class="text-xs font-black uppercase tracking-wider">¡Alerta de Venta!</h4>
          <p class="text-xs font-medium">{{ nuevaNotificacion() }}</p>
        </div>
      </div>
    }

    <!-- El header se muestra ÚNICAMENTE si hay sesión activa Y NO estamos en el login -->
    @if (mostrarNavbar()) {
      <header class="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 shadow-xs sticky top-0 z-50 w-full">
        <div class="flex justify-between items-center w-full relative">
          <div class="flex items-center gap-4 sm:gap-6">
            <span class="font-black text-slate-900 tracking-wider text-sm sm:text-base">MILOR POS</span>
            
            <!-- Navbar de Escritorio -->
            <nav class="hidden sm:flex items-center gap-2">
              @if (rol() === 'MESERO' || rol() === 'SOPORTE') {
                <a routerLink="/operador" routerLinkActive="bg-slate-900 text-white" class="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition">
                  ⚡ Operador (Ventas)
                </a>
              }

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

          <!-- Botón de Cerrar Sesión en Escritorio y Botón Menú Móvil -->
          <div class="flex items-center gap-2">
            <button (click)="salir()" class="hidden sm:inline-flex text-xs font-bold text-red-600 hover:bg-red-50 px-3 py-2 rounded-xl transition">
              Cerrar Sesión
            </button>

            <!-- Botón Hamburguesa para Móvil -->
            <button 
              (click)="toggleMenu()"
              class="sm:hidden px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition active:scale-95">
              <span class="text-base">{{ menuAbierto() ? '✕' : '☰' }}</span>
              <span>{{ menuAbierto() ? 'Cerrar' : '' }}</span>
            </button>
          </div>
        </div>

        <!-- Menú Desplegable Móvil Flotante con Backdrop de Cierre Automático -->
        @if (menuAbierto()) {
          <!-- Capa invisible de fondo que detecta clics fuera para cerrar el menú -->
          <div class="fixed inset-0 z-40 bg-transparent sm:hidden" (click)="cerrarMenu()"></div>

          <!-- Tarjeta del Menú -->
          <div class="sm:hidden absolute top-full right-4 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-2xl p-2.5 flex flex-col gap-1 z-50 animate-slide-up">
            @if (rol() === 'MESERO' || rol() === 'SOPORTE') {
              <a routerLink="/operador" (click)="cerrarMenu()" routerLinkActive="bg-slate-900 text-white" class="px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition flex items-center gap-2">
                ⚡ Operador (Ventas)
              </a>
            }

            @if (rol() === 'ADMIN' || rol() === 'SOPORTE') {
              <a routerLink="/admin/dashboard" (click)="cerrarMenu()" routerLinkActive="bg-slate-900 text-white" class="px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition flex items-center gap-2">
                📊 Dashboard
              </a>
              <a routerLink="/admin/carta" (click)="cerrarMenu()" routerLinkActive="bg-slate-900 text-white" class="px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition flex items-center gap-2">
                ⚙️ Carta
              </a>
              <a routerLink="/admin/historial" (click)="cerrarMenu()" routerLinkActive="bg-slate-900 text-white" class="px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition flex items-center gap-2">
                📜 Historial
              </a>
              <a routerLink="/admin/usuarios" (click)="cerrarMenu()" routerLinkActive="bg-slate-900 text-white" class="px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition flex items-center gap-2">
                👥 Configuración
              </a>
            }

            <button (click)="salir(); cerrarMenu();" class="w-full text-left px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition flex items-center gap-2 mt-1 border-t border-slate-100 pt-2">
              🚪 Cerrar Sesión
            </button>
          </div>
        }
      </header>
    }

    <main class="w-full overflow-x-hidden">
      <router-outlet></router-outlet>
    </main>
  `
})
export class App implements OnDestroy {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly webSocketService = inject(WebSocketService);
  
  private wsSub?: Subscription;
  private routerSub?: Subscription;

  readonly rol = this.auth.rolActual;
  readonly nuevaNotificacion = signal<string | null>(null);
  readonly currentUrl = signal(this.router.url);
  readonly menuAbierto = signal(false);

  // Control estricto del Navbar
  readonly mostrarNavbar = computed(() => {
    const url = this.currentUrl();
    const tokenValido = this.auth.estaAutenticado();
    const enLogin = url.includes('/login') || url === '/' || url === '';
    return tokenValido && !enLogin;
  });

  // La alerta solo aparece si hay evento, sesión, NO es login y EXCLUYE la ruta '/operador'
  readonly mostrarNotificacionAlerta = computed(() => {
    const url = this.currentUrl();
    const mensaje = this.nuevaNotificacion();
    const tokenValido = this.auth.estaAutenticado();
    const enLogin = url.includes('/login') || url === '/' || url === '';
    const enOperador = url.includes('/operador');

    return tokenValido && mensaje !== null && !enLogin && !enOperador;
  });

  constructor() {
    this.routerSub = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.currentUrl.set(event.urlAfterRedirects || event.url);
    });

    // Suscripción estricta al canal WebSocket '/topic/ventas' para cuando se registre una venta
    this.wsSub = this.webSocketService.onVentaRegistrada().subscribe({
      next: () => {
        this.nuevaNotificacion.set('¡Se ha registrado una nueva venta en el sistema!');
        setTimeout(() => this.nuevaNotificacion.set(null), 4000);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.wsSub) this.wsSub.unsubscribe();
    if (this.routerSub) this.routerSub.unsubscribe();
  }

  toggleMenu(): void {
    this.menuAbierto.update(v => !v);
  }

  cerrarMenu(): void {
    this.menuAbierto.set(false);
  }

  salir(): void {
    this.auth.cerrarSesion();
    this.router.navigate(['/login']);
  }
}