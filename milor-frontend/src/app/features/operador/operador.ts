import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MilorService } from '../../core/services/milor.service';
import { ModalidadConsumo, Plato, Entrada, RegistroVentaRequest } from '../../core/models/milor.models';

interface ItemPedidoVista {
  plato: Plato;
  entrada: Entrada | null;
  subtotal: number;
}

@Component({
  selector: 'app-operador',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './operador.html',
  styleUrl: './operador.css'
})
export class Operador {
  readonly milorService = inject(MilorService);
  
  readonly carta = computed(() => this.milorService.carta() || {
    platos: [],
    entradas: [],
    precios: { menuCompleto: 12, soloSegundo: 10 }
  });

  readonly modalidad = signal<ModalidadConsumo>('LOCAL');
  readonly platoSeleccionado = signal<Plato | null>(null);
  readonly entradaSeleccionada = signal<Entrada | 'SIN_ENTRADA' | null>('SIN_ENTRADA');
  readonly pedidoActual = signal<ItemPedidoVista[]>([]);

  readonly mensajeError = signal<string | null>(null);
  readonly mensajeExito = signal<string | null>(null);

  // 🚀 Filtramos para mostrar únicamente los platos y entradas activos del turno actual
  readonly platosDisponibles = computed(() => this.carta().platos.filter(p => p.activo !== false));
  readonly entradasDisponibles = computed(() => this.carta().entradas.filter(e => e.activo !== false));

  readonly totalPedido = computed(() => {
    return this.pedidoActual().reduce((acc, item) => acc + item.subtotal, 0);
  });

  cambiarModalidad(m: ModalidadConsumo): void {
    if (!this.milorService.turnoAbierto()) return;
    this.modalidad.set(m);
  }

  seleccionarPlato(plato: Plato): void {
    if (!this.milorService.turnoAbierto() || plato.activo === false) return;
    this.platoSeleccionado.set(plato);
    this.mensajeError.set(null);
  }

  seleccionarEntrada(entrada: Entrada | 'SIN_ENTRADA'): void {
    if (!this.milorService.turnoAbierto()) return;
    if (entrada !== 'SIN_ENTRADA' && entrada.activo === false) return;
    this.entradaSeleccionada.set(entrada);
  }

  agregarItem(): void {
    if (!this.milorService.turnoAbierto()) {
      alert('Acción bloqueada: Debe abrir un turno en el Dashboard para registrar pedidos.');
      return;
    }

    const plato = this.platoSeleccionado();
    if (!plato || !plato.id) return;

    const esCompleto = this.entradaSeleccionada() !== 'SIN_ENTRADA' && this.entradaSeleccionada() !== null;
    const precios = this.carta().precios;
    const precio = esCompleto
      ? Number(precios.menuCompleto || 12)
      : Number(precios.soloSegundo || 10);

    const nuevoItem: ItemPedidoVista = {
      plato: plato,
      entrada: esCompleto ? (this.entradaSeleccionada() as Entrada) : null,
      subtotal: precio
    };

    this.pedidoActual.update(items => [...items, nuevoItem]);
    this.platoSeleccionado.set(null);
    this.entradaSeleccionada.set('SIN_ENTRADA');
  }

  quitarItem(index: number): void {
    this.pedidoActual.update(items => items.filter((_, i) => i !== index));
  }

  procesarPedido(): void {
    if (!this.milorService.turnoAbierto()) {
      alert('Acción bloqueada: Debe abrir un turno en el Dashboard para registrar pedidos.');
      return;
    }

    if (this.pedidoActual().length === 0) return;

    const payload: RegistroVentaRequest = {
      modalidad: this.modalidad(),
      items: this.pedidoActual().map(item => ({
        platoId: item.plato.id!,
        entradaId: item.entrada?.id || null,
        tipo: item.entrada ? 'COMPLETO' : 'SOLO_SEGUNDO',
        subtotal: item.subtotal
      }))
    };

    this.milorService.registrarVenta(payload).subscribe({
      next: () => {
        this.pedidoActual.set([]);
        this.mensajeExito.set('¡Venta registrada con éxito!');
        setTimeout(() => this.mensajeExito.set(null), 3000);
      },
      error: (err) => {
        this.mensajeError.set(err.error?.message || 'Error al procesar la venta en el servidor');
        setTimeout(() => this.mensajeError.set(null), 4000);
      }
    });
  }
}