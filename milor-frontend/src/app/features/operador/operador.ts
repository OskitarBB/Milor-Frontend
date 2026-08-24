import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MilorService } from '../../core/services/milor.service';
import { ModalidadConsumo, Plato, Entrada, RegistroVentaRequest } from '../../core/models/milor.models';

interface ItemPedidoVista {
  plato: Plato;
  entrada: Entrada | null;
  cantidad: number; // Cantidad acumulada del mismo plato y entrada
  subtotal: number; // Subtotal total para este grupo (cantidad * precio unitario)
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
    
    if (this.platoSeleccionado()?.id === plato.id) {
      this.platoSeleccionado.set(null);
    } else {
      this.platoSeleccionado.set(plato);
    }
    
    this.mensajeError.set(null);
  }

  seleccionarEntrada(entrada: Entrada | 'SIN_ENTRADA'): void {
    if (!this.milorService.turnoAbierto()) return;
    if (entrada !== 'SIN_ENTRADA' && entrada.activo === false) return;
    
    if (this.entradaSeleccionada() === entrada) {
      this.entradaSeleccionada.set('SIN_ENTRADA');
    } else {
      this.entradaSeleccionada.set(entrada);
    }
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
    const precioUnitario = esCompleto
      ? Number(precios.menuCompleto || 12)
      : Number(precios.soloSegundo || 10);

    const entradaActual = esCompleto ? (this.entradaSeleccionada() as Entrada) : null;

    this.pedidoActual.update(items => {
      // Buscamos si ya existe en la orden un ítem con el mismo plato y la misma entrada
      const index = items.findIndex(item => 
        item.plato.id === plato.id && 
        ((item.entrada === null && entradaActual === null) || (item.entrada?.id === entradaActual?.id))
      );

      if (index !== -1) {
        // Si ya existe, incrementamos la cantidad y recalculamos el subtotal del grupo
        const updated = [...items];
        const existing = updated[index];
        const nuevaCantidad = existing.cantidad + 1;
        updated[index] = {
          ...existing,
          cantidad: nuevaCantidad,
          subtotal: nuevaCantidad * precioUnitario
        };
        return updated;
      } else {
        // Si no existe, lo agregamos como un nuevo bloque con cantidad 1
        return [...items, {
          plato: plato,
          entrada: entradaActual,
          cantidad: 1,
          subtotal: precioUnitario
        }];
      }
    });

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

    // Expandimos los grupos con cantidad > 1 en ítems individuales para que el backend 
    // procese el stock y los detalles correctamente sin requerir cambios en Java.
    const itemsExpandidos: any[] = [];
    for (const item of this.pedidoActual()) {
      const precioUnitario = item.subtotal / item.cantidad;
      for (let i = 0; i < item.cantidad; i++) {
        itemsExpandidos.push({
          platoId: item.plato.id!,
          entradaId: item.entrada?.id || null,
          tipo: item.entrada ? 'COMPLETO' : 'SOLO_SEGUNDO',
          subtotal: precioUnitario
        });
      }
    }

    const payload: RegistroVentaRequest = {
      modalidad: this.modalidad(),
      items: itemsExpandidos
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