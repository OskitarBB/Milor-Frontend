import { Component, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MilorService } from '../../core/services/milor.service';
import { CartaDiariaDTO, Plato, Entrada } from '../../core/models/milor.models';

@Component({
  selector: 'app-admin-carta',
  standalone: true,
  imports: [CommonModule, FormsModule],
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

  // Estados reactivos para modales de edición
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
      }
    });
  }

  eliminarPlato(id?: number): void {
    if (!id) return;
    const plato = this.cartaEditable().platos.find(p => p.id === id);
    this.milorService.eliminarPlato(id).subscribe({
      next: () => {
        this.mostrarAviso(`Plato "${plato?.nombre || id}" eliminado definitivamente`);
      }
    });
  }

  togglePlatoActivo(id?: number): void {
    if (!id) return;
    const plato = this.cartaEditable().platos.find(p => p.id === id);
    if (plato) {
      const nuevoEstado = !plato.activo;
      this.milorService.guardarPlato({
        ...plato,
        activo: nuevoEstado
      }).subscribe({
        next: () => {
          const estadoTexto = nuevoEstado ? 'Activo (Visible en Operador)' : 'Inactivo (Pausado)';
          this.mostrarAviso(`Plato "${plato.nombre}" cambiado a: ${estadoTexto}`);
        }
      });
    }
  }

  abrirEditarPlato(plato: Plato): void {
    this.platoEnEdicion.set({ ...plato });
  }

  cerrarEditarPlato(): void {
    this.platoEnEdicion.set(null);
  }

  guardarPlatoEditado(): void {
    const plato = this.platoEnEdicion();
    if (!plato || !plato.nombre.trim()) return;

    this.milorService.guardarPlato({
      ...plato,
      stock: plato.esIlimitado ? 0 : Number(plato.stock)
    }).subscribe({
      next: () => {
        this.mostrarAviso(`Plato "${plato.nombre}" actualizado correctamente`);
        this.cerrarEditarPlato();
      }
    });
  }

  agregarEntrada(): void {
    const nombre = this.nuevaEntradaNombre().trim();
    if (!nombre) return;

    this.milorService.guardarEntrada({
      nombre: nombre,
      activo: true
    }).subscribe({
      next: () => {
        this.mostrarAviso(`Entrada "${nombre}" agregada con éxito`);
        this.nuevaEntradaNombre.set('');
      }
    });
  }

  eliminarEntrada(id?: number): void {
    if (!id) return;
    const entrada = this.cartaEditable().entradas.find(e => e.id === id);
    this.milorService.eliminarEntrada(id).subscribe({
      next: () => {
        this.mostrarAviso(`Entrada "${entrada?.nombre || id}" eliminada definitivamente`);
      }
    });
  }

  toggleEntradaActiva(id?: number): void {
    if (!id) return;
    const entrada = this.cartaEditable().entradas.find(e => e.id === id);
    if (entrada) {
      const nuevoEstado = !entrada.activo;
      this.milorService.guardarEntrada({
        ...entrada,
        activo: nuevoEstado
      }).subscribe({
        next: () => {
          const estadoTexto = nuevoEstado ? 'Activa (Visible en Operador)' : 'Inactiva (Pausada)';
          this.mostrarAviso(`Entrada "${entrada.nombre}" cambiada a: ${estadoTexto}`);
        }
      });
    }
  }

  abrirEditarEntrada(entrada: Entrada): void {
    this.entradaEnEdicion.set({ ...entrada });
  }

  cerrarEditarEntrada(): void {
    this.entradaEnEdicion.set(null);
  }

  guardarEntradaEditada(): void {
    const entrada = this.entradaEnEdicion();
    if (!entrada || !entrada.nombre.trim()) return;

    this.milorService.guardarEntrada(entrada).subscribe({
      next: () => {
        this.mostrarAviso(`Entrada "${entrada.nombre}" actualizada correctamente`);
        this.cerrarEditarEntrada();
      }
    });
  }

  guardarConfiguracion(): void {
    const precios = this.cartaEditable().precios;
    this.milorService.actualizarPrecios(precios).subscribe({
      next: () => {
        this.guardadoExitoso.set(true);
        setTimeout(() => this.guardadoExitoso.set(false), 3000);
      }
    });
  }
}