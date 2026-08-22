// admin-usuarios.ts
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-admin-usuarios',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="max-w-7xl mx-auto p-3 sm:p-4 space-y-4 sm:space-y-6 relative">
      
      <!-- Encabezado -->
      <div class="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
        <h1 class="text-lg sm:text-xl font-black text-slate-800">Gestión de Usuarios y Accesos</h1>
        <p class="text-xs text-slate-500 mt-0.5">Crea, edita o elimina credenciales de acceso para meseros y administradores.</p>
      </div>

      <!-- Alerta de Éxito -->
      @if (mensajeExito()) {
        <div class="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-xl text-center shadow-sm">
          {{ mensajeExito() }}
        </div>
      }

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 items-start">
        
        <!-- Formulario Reactivo para Crear Usuario -->
        <div class="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 relative z-30 transition-all">
          <h2 class="text-xs sm:text-sm font-black text-slate-800 uppercase tracking-wider">Nuevo Usuario</h2>
          
          <form [formGroup]="usuarioForm" (ngSubmit)="crearUsuario()" class="space-y-3">
            <div>
              <label class="block text-[11px] font-bold text-slate-500 uppercase mb-1">Nombre de Usuario</label>
              <input type="text" formControlName="username" placeholder="Ej. mesero_juan"
                     class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 transition">
            </div>

            <div>
              <label class="block text-[11px] font-bold text-slate-500 uppercase mb-1">Contraseña</label>
              <input type="password" formControlName="password" placeholder="••••••••"
                     class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 transition">
            </div>

            <!-- Selector de Rol Personalizado -->
            <div class="relative">
              <label class="block text-[11px] font-bold text-slate-500 uppercase mb-1">Rol de Acceso</label>
              <button 
                type="button"
                (click)="toggleDropdown()"
                class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-slate-900 transition text-left">
                <span>{{ getRolLabel(usuarioForm.get('rol')?.value) }}</span>
                <span class="text-slate-400 text-[10px] transition-transform duration-200" [class.rotate-180]="dropdownAbierto()">▼</span>
              </button>

              @if (dropdownAbierto()) {
                <!-- Se despliega hacia abajo con sombra y z-index alto -->
                <div class="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden py-1">
                  @for (rol of rolesDisponibles; track rol.value) {
                    <button 
                      type="button"
                      (click)="seleccionarRol(rol.value)"
                      class="w-full text-left px-3.5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-900 hover:text-white transition flex items-center justify-between">
                      <span>{{ rol.label }}</span>
                      @if (usuarioForm.get('rol')?.value === rol.value) {
                        <span class="text-emerald-500 font-bold">✓</span>
                      }
                    </button>
                  }
                </div>
              }
            </div>

            <button type="submit" [disabled]="usuarioForm.invalid" 
                    class="w-full py-3 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white font-bold text-xs rounded-xl transition shadow-sm uppercase tracking-wider active:scale-95 mt-2">
              + Registrar Usuario
            </button>

            <!-- Espaciador dinámico: Empuja el fondo de la tarjeta hacia abajo solo cuando el menú está abierto para evitar cortes -->
            @if (dropdownAbierto()) {
              <div class="h-28 transition-all pointer-events-none"></div>
            }
          </form>
        </div>

        <!-- Tabla de Usuarios Registrados -->
        <div class="lg:col-span-2 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 class="text-xs sm:text-sm font-black text-slate-800 uppercase tracking-wider">Usuarios Activos en el Sistema</h2>
          
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs min-w-[320px]">
              <thead>
                <tr class="border-b border-slate-200 text-slate-400 font-bold">
                  <th class="pb-3">USUARIO</th>
                  <th class="pb-3 text-center">ROL</th>
                  <th class="pb-3 text-right">ACCIONES</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                @for (u of listaUsuarios(); track u.id) {
                  <tr class="hover:bg-slate-50 transition">
                    <td class="py-3 font-bold text-slate-800">{{ u.username }}</td>
                    <td class="py-3 text-center">
                      <span class="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase"
                        [class]="u.rol === 'ADMIN' ? 'bg-purple-100 text-purple-700' : (u.rol === 'SOPORTE' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700')">
                        {{ u.rol }}
                      </span>
                    </td>
                    <td class="py-3 text-right">
                      @if (u.username.toLowerCase() !== 'admin' && u.username.toLowerCase() !== 'soporte') {
                        <button (click)="confirmarEliminacion(u.id)" class="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-lg transition active:scale-95">
                          Eliminar
                        </button>
                      } @else {
                        <span class="text-[10px] font-bold text-slate-400 uppercase">Protegido</span>
                      }
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="3" class="py-8 text-center text-slate-400 text-xs">
                      No hay usuarios registrados en el sistema.
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>

      </div>

      <!-- MODAL DE CONFIRMACIÓN DE ELIMINACIÓN -->
      @if (usuarioAEliminarId() !== null) {
        <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div class="bg-white rounded-3xl p-5 sm:p-6 w-full max-w-md shadow-2xl border border-slate-100 space-y-4">
            
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center text-xl font-black">🗑️</div>
              <div>
                <h3 class="text-sm sm:text-base font-black text-slate-800 uppercase tracking-wide">Eliminar Usuario</h3>
                <p class="text-xs text-slate-500">Esta acción no se puede deshacer.</p>
              </div>
            </div>

            <div class="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-600">
              <p>⚠️ ¿Estás seguro de que deseas eliminar permanentemente este usuario del sistema?</p>
            </div>

            <div class="flex gap-3 pt-1">
              <button 
                type="button" 
                (click)="cancelarEliminacion()" 
                class="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition active:scale-95">
                Cancelar
              </button>
              
              <button 
                type="button" 
                (click)="ejecutarEliminacion()" 
                class="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-lg transition active:scale-95">
                Sí, Eliminar
              </button>
            </div>

          </div>
        </div>
      }

    </div>
  `
})
export class AdminUsuarios implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  usuarioForm: FormGroup = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(3)]],
    password: ['', [Validators.required, Validators.minLength(4)]],
    rol: ['MESERO', Validators.required]
  });

  listaUsuarios = signal<any[]>([]);
  mensajeExito = signal<string | null>(null);

  // Estados para el selector personalizado de roles
  dropdownAbierto = signal(false);
  rolesDisponibles = [
    { value: 'MESERO', label: 'Mesero (Solo Operador)' },
    { value: 'ADMIN', label: 'Administrador (Gestión Completa)' },
    { value: 'SOPORTE', label: 'Soporte (Acceso Total)' }
  ];

  // Estado para el modal de eliminación
  usuarioAEliminarId = signal<number | null>(null);

  ngOnInit(): void {
    this.cargarUsuarios();
  }

  cargarUsuarios(): void {
    this.auth.listarUsuarios().subscribe({
      next: (data) => this.listaUsuarios.set(data),
      error: (err) => console.error('Error al listar usuarios', err)
    });
  }

  toggleDropdown(): void {
    this.dropdownAbierto.update(v => !v);
  }

  seleccionarRol(valor: string): void {
    this.usuarioForm.get('rol')?.setValue(valor);
    this.dropdownAbierto.set(false);
  }

  getRolLabel(valor: string): string {
    const encontrado = this.rolesDisponibles.find(r => r.value === valor);
    return encontrado ? encontrado.label : 'Seleccionar rol';
  }

  crearUsuario(): void {
    if (this.usuarioForm.invalid) return;

    this.auth.crearUsuario(this.usuarioForm.value).subscribe({
      next: () => {
        this.mensajeExito.set(`¡Usuario creado exitosamente!`);
        this.usuarioForm.reset({ rol: 'MESERO' });
        this.cargarUsuarios();
        setTimeout(() => this.mensajeExito.set(null), 3000);
      },
      error: (err) => alert(err.error?.message || 'Error al crear usuario')
    });
  }

  confirmarEliminacion(id: number): void {
    this.usuarioAEliminarId.set(id);
  }

  cancelarEliminacion(): void {
    this.usuarioAEliminarId.set(null);
  }

  ejecutarEliminacion(): void {
    const id = this.usuarioAEliminarId();
    if (id === null) return;

    this.auth.eliminarUsuario(id).subscribe({
      next: () => {
        this.usuarioAEliminarId.set(null);
        this.cargarUsuarios();
        this.mensajeExito.set('Usuario eliminado correctamente.');
        setTimeout(() => this.mensajeExito.set(null), 3000);
      },
      error: (err) => {
        this.usuarioAEliminarId.set(null);
        alert(err.error?.message || 'Error al eliminar usuario');
      }
    });
  }
}