import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-admin-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-5xl mx-auto p-4 space-y-6">
      
      <!-- Encabezado -->
      <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <h1 class="text-xl font-black text-slate-800">Gestión de Usuarios y Accesos</h1>
        <p class="text-xs text-slate-500">Crea, edita o elimina credenciales de acceso para meseros y administradores.</p>
      </div>

      @if (mensajeExito()) {
        <div class="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-xl text-center">
          {{ mensajeExito() }}
        </div>
      }

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <!-- Formulario para Crear Usuario -->
        <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 class="text-sm font-black text-slate-800 uppercase tracking-wider">Nuevo Usuario</h2>
          
          <form (ngSubmit)="crearUsuario()" class="space-y-3">
            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Nombre de Usuario</label>
              <input type="text" [(ngModel)]="nuevoUsername" name="username" required placeholder="Ej. mesero_juan"
                     class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-amber-500">
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Contraseña</label>
              <input type="password" [(ngModel)]="nuevoPassword" name="password" required placeholder="••••••••"
                     class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-amber-500">
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Rol de Acceso</label>
              <select [(ngModel)]="nuevoRol" name="rol" class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-amber-500">
                <option value="MESERO">Mesero (Solo Operador)</option>
                <option value="ADMIN">Administrador (Gestión Completa)</option>
                <option value="SOPORTE">Soporte (Acceso Total)</option>
              </select>
            </div>

            <button type="submit" class="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition shadow-sm uppercase tracking-wider">
              + Registrar Usuario
            </button>
          </form>
        </div>

        <!-- Tabla de Usuarios Registrados -->
        <div class="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 class="text-sm font-black text-slate-800 uppercase tracking-wider">Usuarios Activos en el Sistema</h2>
          
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead>
                <tr class="border-b border-slate-200 text-slate-400 font-bold">
                  <th class="pb-3">USUARIO</th>
                  <th class="pb-3 text-center">ROL</th>
                  <th class="pb-3 text-right">ACCIONES</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                @for (u of listaUsuarios(); track u.id) {
                  <tr>
                    <td class="py-3 font-bold text-slate-800">{{ u.username }}</td>
                    <td class="py-3 text-center">
                      <span class="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase"
                        [class]="u.rol === 'ADMIN' ? 'bg-purple-100 text-purple-700' : (u.rol === 'SOPORTE' ? 'bg-indigo-100 text-indigo-700' : 'bg-amber-100 text-amber-700')">
                        {{ u.rol }}
                      </span>
                    </td>
                    <td class="py-3 text-right">
                      <!-- Ocultar botón de eliminar si es admin o soporte -->
                      @if (u.username.toLowerCase() !== 'admin' && u.username.toLowerCase() !== 'soporte') {
                        <button (click)="eliminar(u.id)" class="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-lg transition">
                          Eliminar
                        </button>
                      } @else {
                        <span class="text-[10px] font-bold text-slate-400 uppercase">Protegido</span>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  `
})
export class AdminUsuarios implements OnInit {
  private readonly auth = inject(AuthService);

  listaUsuarios = signal<any[]>([]);
  nuevoUsername = '';
  nuevoPassword = '';
  nuevoRol = 'MESERO';
  mensajeExito = signal<string | null>(null);

  ngOnInit(): void {
    this.cargarUsuarios();
  }

  cargarUsuarios(): void {
    this.auth.listarUsuarios().subscribe({
      next: (data) => this.listaUsuarios.set(data),
      error: (err) => console.error('Error al listar usuarios', err)
    });
  }

  crearUsuario(): void {
    if (!this.nuevoUsername || !this.nuevoPassword) return;

    this.auth.crearUsuario({
      username: this.nuevoUsername,
      password: this.nuevoPassword,
      rol: this.nuevoRol
    }).subscribe({
      next: () => {
        this.mensajeExito.set(`¡Usuario "${this.nuevoUsername}" creado exitosamente!`);
        this.nuevoUsername = '';
        this.nuevoPassword = '';
        this.cargarUsuarios();
        setTimeout(() => this.mensajeExito.set(null), 3000);
      },
      error: (err) => alert(err.error?.message || 'Error al crear usuario')
    });
  }

  eliminar(id: number): void {
    if (confirm('¿Estás seguro de eliminar este usuario?')) {
      this.auth.eliminarUsuario(id).subscribe({
        next: () => this.cargarUsuarios(),
        error: (err) => alert(err.error?.message || 'Error al eliminar usuario')
      });
    }
  }
}