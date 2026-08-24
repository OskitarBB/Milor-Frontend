// operador.ts
import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MilorService } from '../../core/services/milor.service';
import { ModalidadConsumo, Plato, Entrada, RegistroVentaRequest } from '../../core/models/milor.models';

interface ItemPedidoVista {
  plato: Plato;
  entrada: Entrada | null;
  modalidad: ModalidadConsumo;
  cantidad: number;
  subtotal: number;
  showDropdown?: boolean;
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

  readonly ordenRegistradaExito = signal<boolean>(false);
  readonly mensajeError = signal<string | null>(null);
  readonly mensajeExito = signal<string | null>(null);

  // Muestra todos los platos y entradas (activos e inactivos) sincronizados en tiempo real
  readonly platosDisponibles = computed(() => this.carta().platos);
  readonly entradasDisponibles = computed(() => this.carta().entradas);

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
    const modalidadActual = this.modalidad();

    this.pedidoActual.update(items => {
      const index = items.findIndex(item => 
        item.plato.id === plato.id && 
        item.modalidad === modalidadActual &&
        ((item.entrada === null && entradaActual === null) || (item.entrada?.id === entradaActual?.id))
      );

      if (index !== -1) {
        const updated = [...items];
        const existing = updated[index];
        const nuevaCantidad = existing.cantidad + 1;
        updated[index] = {
          ...existing,
          cantidad: nuevaCantidad,
          subtotal: nuevaCantidad * precioUnitario,
          showDropdown: false
        };
        return updated;
      } else {
        return [...items, {
          plato: plato,
          entrada: entradaActual,
          modalidad: modalidadActual,
          cantidad: 1,
          subtotal: precioUnitario,
          showDropdown: false
        }];
      }
    });

    this.platoSeleccionado.set(null);
    this.entradaSeleccionada.set('SIN_ENTRADA');
  }

  cambiarModalidadItem(index: number): void {
    this.pedidoActual.update(items => {
      const updated = [...items];
      const item = updated[index];
      const nuevaMod: ModalidadConsumo = item.modalidad === 'LOCAL' ? 'LLEVAR' : 'LOCAL';
      
      updated[index] = {
        ...item,
        modalidad: nuevaMod
      };
      return updated;
    });
  }

  toggleDropdownItem(index: number, event: Event): void {
    event.stopPropagation();
    this.pedidoActual.update(items => {
      return items.map((item, i) => {
        if (i === index) {
          return { ...item, showDropdown: !item.showDropdown };
        }
        return { ...item, showDropdown: false };
      });
    });
  }

  // Función requerida por el HTML para cambiar la entrada desde el menú flotante
  cambiarEntradaItem(index: number, entradaObjOrId: Entrada | 'SIN_ENTRADA' | string | number): void {
    this.pedidoActual.update(items => {
      const updated = [...items];
      const item = updated[index];
      const precios = this.carta().precios;

      let nuevaEntrada: Entrada | null = null;
      if (entradaObjOrId !== 'SIN_ENTRADA') {
        if (typeof entradaObjOrId === 'object' && entradaObjOrId !== null) {
          nuevaEntrada = entradaObjOrId;
        } else {
          nuevaEntrada = this.carta().entradas.find(e => e.id === Number(entradaObjOrId)) || null;
        }
      }

      const esCompletoAhora = nuevaEntrada !== null;
      const nuevoPrecioUnitario = esCompletoAhora
        ? Number(precios.menuCompleto || 12)
        : Number(precios.soloSegundo || 10);

      updated[index] = {
        ...item,
        entrada: nuevaEntrada,
        subtotal: item.cantidad * nuevoPrecioUnitario,
        showDropdown: false
      };

      return updated;
    });
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

    const itemsExpandidos: any[] = [];
    for (const item of this.pedidoActual()) {
      const precioUnitario = item.subtotal / item.cantidad;
      for (let i = 0; i < item.cantidad; i++) {
        itemsExpandidos.push({
          platoId: item.plato.id!,
          entradaId: item.entrada?.id || null,
          tipo: item.entrada ? 'COMPLETO' : 'SOLO_SEGUNDO',
          modalidad: item.modalidad,
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
        this.ordenRegistradaExito.set(true);
        this.mensajeExito.set('¡Venta registrada con éxito!');
        
        setTimeout(() => {
          this.ordenRegistradaExito.set(false);
          this.mensajeExito.set(null);
        }, 3000);
      },
      error: (err) => {
        this.mensajeError.set(err.error?.message || 'Error al procesar la venta en el servidor');
        setTimeout(() => this.mensajeError.set(null), 4000);
      }
    });
  }
}