import { Component, inject, signal, computed, effect } from '@angular/core';
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
  mostrarSugerenciasPlatos = signal(false);

  nuevaEntradaNombre = signal('');
  mostrarSugerenciasEntradas = signal(false);

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
    });
  }

  private normalizarTexto(texto: string): string {
    if (!texto) return '';
    return texto
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  private formatearTitulo(texto: string): string {
    if (!texto) return '';
    return texto
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/\b\w/g, letra => letra.toUpperCase());
  }

  onPlatoInput(valor: string): void {
    this.nuevoPlatoNombre.set(valor);
    this.mostrarSugerenciasPlatos.set(true);
  }

  onEntradaInput(valor: string): void {
    this.nuevaEntradaNombre.set(valor);
    this.mostrarSugerenciasEntradas.set(true);
  }

  // 🚀 Muestra todos los platos inactivos si está vacío, o filtra si hay texto
  readonly platosSugeridos = computed(() => {
    if (!this.mostrarSugerenciasPlatos()) return [];
    const query = this.normalizarTexto(this.nuevoPlatoNombre());
    const inactivos = this.cartaEditable().platos.filter(p => !p.activo);
    
    if (!query) return inactivos;
    
    return inactivos.filter(p => this.normalizarTexto(p.nombre).includes(query));
  });

  // 🚀 Muestra todas las entradas inactivas si está vacío, o filtra si hay texto
  readonly entradasSugeridas = computed(() => {
    if (!this.mostrarSugerenciasEntradas()) return [];
    const query = this.normalizarTexto(this.nuevaEntradaNombre());
    const inactivas = this.cartaEditable().entradas.filter(e => !e.activo);
    
    if (!query) return inactivas;
    
    return inactivas.filter(e => this.normalizarTexto(e.nombre).includes(query));
  });

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

    const nombreFormateado = this.formatearTitulo(this.nuevoPlatoNombre());
    if (!nombreFormateado) return;

    const existente = this.cartaEditable().platos.find(p => 
      this.normalizarTexto(p.nombre) === this.normalizarTexto(nombreFormateado)
    );

    const payload = {
      id: existente ? existente.id : undefined,
      nombre: nombreFormateado,
      stock: this.nuevoPlatoIlimitado() ? 0 : Number(this.nuevoPlatoStock()),
      esIlimitado: this.nuevoPlatoIlimitado(),
      activo: true
    };

    this.milorService.guardarPlato(payload).subscribe({
      next: () => {
        this.mostrarAviso(`Plato "${nombreFormateado}" agregado con éxito`);
        this.nuevoPlatoNombre.set('');
        this.nuevoPlatoStock.set(20);
        this.nuevoPlatoIlimitado.set(false);
        this.mostrarSugerenciasPlatos.set(false);
      },
      error: (err) => alert(err.error?.message || 'Error al guardar el plato.')
    });
  }

  seleccionarPlatoSugerido(plato: Plato): void {
    this.nuevoPlatoNombre.set(plato.nombre);
    if (plato.stock !== undefined && plato.stock > 0) {
      this.nuevoPlatoStock.set(plato.stock);
    }
    this.nuevoPlatoIlimitado.set(!!plato.esIlimitado);
    this.mostrarSugerenciasPlatos.set(false);
  }

  agregarEntrada(): void {
    if (!this.milorService.turnoAbierto()) {
      alert('Acción bloqueada: Debe abrir un turno en el Dashboard antes de modificar la carta.');
      return;
    }

    const nombreFormateado = this.formatearTitulo(this.nuevaEntradaNombre());
    if (!nombreFormateado) return;

    const existente = this.cartaEditable().entradas.find(e => 
      this.normalizarTexto(e.nombre) === this.normalizarTexto(nombreFormateado)
    );

    const payload = {
      id: existente ? existente.id : undefined,
      nombre: nombreFormateado,
      activo: true
    };

    this.milorService.guardarEntrada(payload).subscribe({
      next: () => {
        this.mostrarAviso(`Entrada "${nombreFormateado}" agregada con éxito`);
        this.nuevaEntradaNombre.set('');
        this.mostrarSugerenciasEntradas.set(false);
      },
      error: (err) => alert(err.error?.message || 'Error al guardar la entrada.')
    });
  }

  seleccionarEntradaSugerida(entrada: Entrada): void {
    this.nuevaEntradaNombre.set(entrada.nombre);
    this.mostrarSugerenciasEntradas.set(false);
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

    plato.nombre = this.formatearTitulo(plato.nombre);

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

    entrada.nombre = this.formatearTitulo(entrada.nombre);

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