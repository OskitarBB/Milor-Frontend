import { Component, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MilorService } from '../../core/services/milor.service';
import { CartaDiariaDTO, Plato, Entrada } from '../../core/models/milor.models';

@Component({
  selector: 'app-admin-carta',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './admin-carta.html',
  styleUrl: './admin-carta.css'
})
export class AdminCarta {
  readonly milorService = inject(MilorService);
  
  readonly cartaEditable = signal<CartaDiariaDTO>({
    platos: [],
    entradas: [],
    precios: { menuCompleto: 12, soloSegundo: 10 }
  });

  nuevoPlatoNombre = signal('');
  nuevoPlatoStock = signal(20);
  nuevoPlatoIlimitado = signal(false);

  nuevaEntradaNombre = signal('');
  guardadoExitoso = signal(false);
  mensajeAviso = signal<string | null>(null);

  platoEnEdicion = signal<Plato | null>(null);
  entradaEnEdicion = signal<Entrada | null>(null);

  constructor() {
    effect(() => {
      const data = this.milorService.carta();
      if (data) {
        this.cartaEditable.set(JSON.parse(JSON.stringify(data)));
      }
    }, { allowSignalWrites: true });
  }

  private mostrarAviso(texto: string): void {
    this.mensajeAviso.set(texto);
    setTimeout(() => {
      this.mensajeAviso.set(null);
    }, 3500);
  }

  agregarPlato(): void {
    if (!this.milorService.turnoAbierto()) {
      alert('Acción bloqueada: Debe abrir un turno en el Dashboard antes de modificar la carta.');
      return;
    }

    const nombre = this.nuevoPlatoNombre().trim();
    if (!nombre) return;

    this.milorService.guardarPlato({
      nombre: nombre,
      stock: this.nuevoPlatoIlimitado() ? 0 : Number(this.nuevoPlatoStock()),
      esIlimitado: this.nuevoPlatoIlimitado(),
      activo: true
    }).subscribe({
      next: () => {
        this.mostrarAviso(`Plato "${nombre}" agregado con éxito`);
        this.nuevoPlatoNombre.set('');
        this.nuevoPlatoStock.set(20);
        this.nuevoPlatoIlimitado.set(false);
      },
      error: (err) => alert(err.error?.message || 'Error al guardar el plato.')
    });
  }

  eliminarPlato(id?: number): void {
    if (!this.milorService.turnoAbierto()) {
      alert('Acción bloqueada: Debe abrir un turno en el Dashboard antes de modificar la carta.');
      return;
    }

    if (!id) return;
    const plato = this.cartaEditable().platos.find(p => p.id === id);
    this.milorService.eliminarPlato(id).subscribe({
      next: () => {
        this.mostrarAviso(`Plato "${plato?.nombre || id}" eliminado definitivamente`);
      },
      error: (err) => alert(err.error?.message || 'Error al eliminar el plato.')
    });
  }

  togglePlatoActivo(id?: number): void {
    if (!this.milorService.turnoAbierto()) {
      alert('Acción bloqueada: Debe abrir un turno en el Dashboard antes de modificar la carta.');
      return;
    }

    if (!id) return;
    const plato = this.cartaEditable().platos.find(p => p.id === id);
    if (plato) {
      const nuevoEstado = !plato.activo;
      this.milorService.guardarPlato({
        ...plato,
        activo: nuevoEstado
      }).subscribe({
        next: () => {
          // 🚀 Actualización visual instantánea en el signal local
          this.cartaEditable.update(current => ({
            ...current,
            platos: current.platos.map(p => p.id === id ? { ...p, activo: nuevoEstado } : p)
          }));

          const estadoTexto = nuevoEstado ? 'Activo (Visible en Operador)' : 'Inactivo (Pausado)';
          this.mostrarAviso(`Plato "${plato.nombre}" cambiado a: ${estadoTexto}`);
        },
        error: (err) => alert(err.error?.message || 'Error al actualizar el estado del plato.')
      });
    }
  }

  abrirEditarPlato(plato: Plato): void {
    if (!this.milorService.turnoAbierto()) {
      alert('Acción bloqueada: Debe abrir un turno en el Dashboard antes de modificar la carta.');
      return;
    }
    this.platoEnEdicion.set({ ...plato });
  }

  cerrarEditarPlato(): void {
    this.platoEnEdicion.set(null);
  }

  guardarPlatoEditado(): void {
    if (!this.milorService.turnoAbierto()) {
      alert('Acción bloqueada: Debe abrir un turno en el Dashboard antes de modificar la carta.');
      return;
    }

    const plato = this.platoEnEdicion();
    if (!plato || !plato.nombre.trim()) return;

    this.milorService.guardarPlato({
      ...plato,
      stock: plato.esIlimitado ? 0 : Number(plato.stock)
    }).subscribe({
      next: () => {
        this.mostrarAviso(`Plato "${plato.nombre}" actualizado correctamente`);
        this.cerrarEditarPlato();
      },
      error: (err) => alert(err.error?.message || 'Error al actualizar el plato.')
    });
  }

  agregarEntrada(): void {
    if (!this.milorService.turnoAbierto()) {
      alert('Acción bloqueada: Debe abrir un turno en el Dashboard antes de modificar la carta.');
      return;
    }

    const nombre = this.nuevaEntradaNombre().trim();
    if (!nombre) return;

    this.milorService.guardarEntrada({
      nombre: nombre,
      activo: true
    }).subscribe({
      next: () => {
        this.mostrarAviso(`Entrada "${nombre}" agregada con éxito`);
        this.nuevaEntradaNombre.set('');
      },
      error: (err) => alert(err.error?.message || 'Error al guardar la entrada.')
    });
  }

  eliminarEntrada(id?: number): void {
    if (!this.milorService.turnoAbierto()) {
      alert('Acción bloqueada: Debe abrir un turno en el Dashboard antes de modificar la carta.');
      return;
    }

    if (!id) return;
    const entrada = this.cartaEditable().entradas.find(e => e.id === id);
    this.milorService.eliminarEntrada(id).subscribe({
      next: () => {
        this.mostrarAviso(`Entrada "${entrada?.nombre || id}" eliminada definitivamente`);
      },
      error: (err) => alert(err.error?.message || 'Error al eliminar la entrada.')
    });
  }

  toggleEntradaActiva(id?: number): void {
    if (!this.milorService.turnoAbierto()) {
      alert('Acción bloqueada: Debe abrir un turno en el Dashboard antes de modificar la carta.');
      return;
    }

    if (!id) return;
    const entrada = this.cartaEditable().entradas.find(e => e.id === id);
    if (entrada) {
      const nuevoEstado = !entrada.activo;
      this.milorService.guardarEntrada({
        ...entrada,
        activo: nuevoEstado
      }).subscribe({
        next: () => {
          // 🚀 Actualización visual instantánea en el signal local de entradas
          this.cartaEditable.update(current => ({
            ...current,
            entradas: current.entradas.map(e => e.id === id ? { ...e, activo: nuevoEstado } : e)
          }));

          const estadoTexto = nuevoEstado ? 'Activa (Visible en Operador)' : 'Inactiva (Pausada)';
          this.mostrarAviso(`Entrada "${entrada.nombre}" cambiada a: ${estadoTexto}`);
        },
        error: (err) => alert(err.error?.message || 'Error al actualizar el estado de la entrada.')
      });
    }
  }

  abrirEditarEntrada(entrada: Entrada): void {
    if (!this.milorService.turnoAbierto()) {
      alert('Acción bloqueada: Debe abrir un turno en el Dashboard antes de modificar la carta.');
      return;
    }
    this.entradaEnEdicion.set({ ...entrada });
  }

  cerrarEditarEntrada(): void {
    this.entradaEnEdicion.set(null);
  }

  guardarEntradaEditada(): void {
    if (!this.milorService.turnoAbierto()) {
      alert('Acción bloqueada: Debe abrir un turno en el Dashboard antes de modificar la carta.');
      return;
    }

    const entrada = this.entradaEnEdicion();
    if (!entrada || !entrada.nombre.trim()) return;

    this.milorService.guardarEntrada(entrada).subscribe({
      next: () => {
        this.mostrarAviso(`Entrada "${entrada.nombre}" actualizada correctamente`);
        this.cerrarEditarEntrada();
      },
      error: (err) => alert(err.error?.message || 'Error al actualizar la entrada.')
    });
  }

  guardarConfiguracion(): void {
    if (!this.milorService.turnoAbierto()) {
      alert('Acción bloqueada: Debe abrir un turno en el Dashboard antes de modificar la carta.');
      return;
    }

    const precios = this.cartaEditable().precios;
    this.milorService.actualizarPrecios(precios).subscribe({
      next: () => {
        this.guardadoExitoso.set(true);
        setTimeout(() => this.guardadoExitoso.set(false), 3000);
      },
      error: (err) => alert(err.error?.message || 'Error al actualizar los precios.')
    });
  }
}