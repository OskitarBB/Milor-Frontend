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
    <!-- Estilos CSS para evitar el conflicto del hover en el Navbar -->
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

      /* Estilo base de los enlaces del navbar */
      .nav-link {
        padding: 0.5rem 1rem;
        border-radius: 0.75rem;
        font-size: 0.75rem;
        font-weight: 700;
        color: #475569; /* text-slate-600 */
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        gap: 0.375rem;
      }

      /* El hover SOLO actúa si el enlace NO está activo */
      .nav-link:hover:not(.activo) {
        background-color: #f1f5f9; /* bg-slate-100 */
        color: #0f172a; /* text-slate-900 */
      }

      /* Estilo absoluto cuando la sección está activa (anula cualquier hover) */
      .nav-link.activo {
        background-color: #020617 !important; /* slate-950 */
        color: #ffffff !important;          /* Texto blanco nítido */
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
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
                <a routerLink="/operador" 
                   routerLinkActive="activo" 
                   [routerLinkActiveOptions]="{ exact: true }"
                   class="nav-link">
                  ⚡ Operador (Ventas)
                </a>
              }

              @if (rol() === 'ADMIN' || rol() === 'SOPORTE') {
                <a routerLink="/admin/dashboard" 
                   routerLinkActive="activo" 
                   [routerLinkActiveOptions]="{ exact: true }"
                   class="nav-link">
                  📊 Dashboard
                </a>
                <a routerLink="/admin/carta" 
                   routerLinkActive="activo" 
                   [routerLinkActiveOptions]="{ exact: true }"
                   class="nav-link">
                  ⚙️ Carta
                </a>
                <a routerLink="/admin/historial" 
                   routerLinkActive="activo" 
                   [routerLinkActiveOptions]="{ exact: true }"
                   class="nav-link">
                  📜 Historial
                </a>
                <a routerLink="/admin/usuarios" 
                   routerLinkActive="activo" 
                   [routerLinkActiveOptions]="{ exact: true }"
                   class="nav-link">
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
          <div class="fixed inset-0 z-40 bg-transparent sm:hidden" (click)="cerrarMenu()"></div>

          <div class="sm:hidden absolute top-full right-4 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-2xl p-2.5 flex flex-col gap-1 z-50 animate-slide-up">
            @if (rol() === 'MESERO' || rol() === 'SOPORTE') {
              <a routerLink="/operador" (click)="cerrarMenu()" routerLinkActive="activo" [routerLinkActiveOptions]="{ exact: true }" class="nav-link">
                ⚡ Operador (Ventas)
              </a>
            }

            @if (rol() === 'ADMIN' || rol() === 'SOPORTE') {
              <a routerLink="/admin/dashboard" (click)="cerrarMenu()" routerLinkActive="activo" [routerLinkActiveOptions]="{ exact: true }" class="nav-link">
                📊 Dashboard
              </a>
              <a routerLink="/admin/carta" (click)="cerrarMenu()" routerLinkActive="activo" [routerLinkActiveOptions]="{ exact: true }" class="nav-link">
                ⚙️ Carta
              </a>
              <a routerLink="/admin/historial" (click)="cerrarMenu()" routerLinkActive="activo" [routerLinkActiveOptions]="{ exact: true }" class="nav-link">
                📜 Historial
              </a>
              <a routerLink="/admin/usuarios" (click)="cerrarMenu()" routerLinkActive="activo" [routerLinkActiveOptions]="{ exact: true }" class="nav-link">
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

    <!-- MODAL GLOBAL DE INACTIVIDAD (Se muestra en CUALQUIER vista actual al cumplirse el tiempo) -->
    @if (auth.sesionExpiradaModal()) {
      <div class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
        <div class="bg-white max-w-md w-full p-6 rounded-3xl shadow-2xl border border-slate-200 text-center space-y-5">
          
          <div class="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center text-2xl mx-auto shadow-inner">
            ⏰
          </div>

          <div class="space-y-1.5">
            <h3 class="text-base font-black text-slate-900 uppercase tracking-wide">Sesión Expirada por Inactividad</h3>
            <p class="text-xs text-slate-500 leading-relaxed">
              Tu sesión se ha cerrado automáticamente después de 15 minutos sin actividad para proteger la seguridad del sistema Milor.
            </p>
          </div>

          <button 
            type="button"
            (click)="auth.confirmarExpiracion()"
            class="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition active:scale-95 cursor-pointer">
            Entendido / Ir al Login
          </button>

        </div>
      </div>
    }
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

  readonly mostrarNavbar = computed(() => {
    const url = this.currentUrl();
    const tokenValido = this.auth.estaAutenticado();
    const enLogin = url.includes('/login') || url === '/' || url === '';
    return tokenValido && !enLogin;
  });

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