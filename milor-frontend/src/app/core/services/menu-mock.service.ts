import { Injectable, computed, signal } from '@angular/core';
import { CartaDiaria, DashboardMetricas, ItemVenta, ModalidadConsumo, RegistroVenta } from '../models/menu.models';

@Injectable({
  providedIn: 'root'
})
export class MenuMockService {

  // 1. Estado inicial de la Carta Diaria (Signal)
  readonly cartaDiaria = signal<CartaDiaria>({
    fecha: new Date().toISOString().split('T')[0],
    precios: {
      menuCompleto: 12.00,
      soloSegundo: 10.00
    },
    entradas: [
      { id: 'e1', nombre: 'Sopa Minuta', activo: true },
      { id: 'e2', nombre: 'Papa a la Huancaína', activo: true },
      { id: 'e3', nombre: 'Ensalada Fresca', activo: true }
    ],
    platos: [
      { id: 'p1', nombre: 'Ají de Gallina', stock: 15, esIlimitado: false, activo: true },
      { id: 'p2', nombre: 'Lomo Saltado', stock: 20, esIlimitado: false, activo: true },
      { id: 'p3', nombre: 'Seco de Pollo', stock: 10, esIlimitado: false, activo: true },
      { id: 'p4', nombre: 'Chaufa de Carne', stock: 0, esIlimitado: true, activo: true } // Ilimitado
    ]
  });

  // 2. Historial de Ventas Registradas (Signal)
  readonly ventas = signal<RegistroVenta[]>([]);

  // 3. Métricas calculadas automáticamente al cambiar ventas o carta (Computed Signal)
  readonly metricas = computed<DashboardMetricas>(() => {
    const listaVentas = this.ventas();
    const carta = this.cartaDiaria();

    let totalRecaudado = 0;
    let totalMenusVendidos = 0;
    let totalLocal = 0;
    let totalLlevar = 0;
    let totalConEntrada = 0;
    let totalSinEntrada = 0;

    // Inicializar conteo por plato con el stock actual
    const conteoPorPlato: DashboardMetricas['conteoPorPlato'] = {};
    carta.platos.forEach(p => {
      conteoPorPlato[p.id] = {
        nombre: p.nombre,
        vendidos: 0,
        stockRestante: p.esIlimitado ? 'Ilimitado' : p.stock
      };
    });

    // Procesar acumulados
    listaVentas.forEach(v => {
      totalRecaudado += v.total;
      
      if (v.modalidad === 'LOCAL') totalLocal += v.items.length;
      if (v.modalidad === 'LLEVAR') totalLlevar += v.items.length;

      v.items.forEach(item => {
        totalMenusVendidos++;
        if (item.tipo === 'COMPLETO') {
          totalConEntrada++;
        } else {
          totalSinEntrada++;
        }

        if (conteoPorPlato[item.plato.id]) {
          conteoPorPlato[item.plato.id].vendidos++;
        }
      });
    });

    return {
      totalRecaudado,
      totalMenusVendidos,
      totalLocal,
      totalLlevar,
      totalConEntrada,
      totalSinEntrada,
      conteoPorPlato
    };
  });

  // 4. Acción: Registrar venta y descontar stock de forma atómica en memoria
  registrarVenta(modalidad: ModalidadConsumo, items: ItemVenta[]): { exito: boolean; mensaje?: string } {
    if (!items || items.length === 0) {
      return { exito: false, mensaje: 'No hay ítems para registrar.' };
    }

    const cartaActual = this.cartaDiaria();
    const nuevosPlatos = [...cartaActual.platos];

    // Validar disponibilidad de stock antes de descontar
    for (const item of items) {
      const platoIndex = nuevosPlatos.findIndex(p => p.id === item.plato.id);
      if (platoIndex === -1) {
        return { exito: false, mensaje: `El plato ${item.plato.nombre} no existe en la carta.` };
      }

      const platoRef = nuevosPlatos[platoIndex];
      if (!platoRef.esIlimitado && platoRef.stock <= 0) {
        return { exito: false, mensaje: `¡Stock agotado para ${platoRef.nombre}!` };
      }
    }

    // Descontar stock
    items.forEach(item => {
      const platoIndex = nuevosPlatos.findIndex(p => p.id === item.plato.id);
      const platoRef = { ...nuevosPlatos[platoIndex] };
      if (!platoRef.esIlimitado) {
        platoRef.stock = Math.max(0, platoRef.stock - 1);
      }
      nuevosPlatos[platoIndex] = platoRef;
    });

    // Crear registro de venta
    const total = items.reduce((acc, curr) => acc + curr.subtotal, 0);
    const nuevaVenta: RegistroVenta = {
      id: 'v-' + Date.now(),
      hora: new Date().toLocaleTimeString('es-PE', { hour12: false }),
      modalidad,
      items,
      total
    };

    // Actualizar estados reactivos
    this.cartaDiaria.update(prev => ({ ...prev, platos: nuevosPlatos }));
    this.ventas.update(prev => [nuevaVenta, ...prev]);

    return { exito: true };
  }

  // 5. Acción: Actualizar configuración de carta (para Admin)
  actualizarCarta(nuevaCarta: CartaDiaria): void {
    this.cartaDiaria.set(nuevaCarta);
  }
}