export type ModalidadConsumo = 'LOCAL' | 'LLEVAR';

export interface Plato {
  id?: number;
  nombre: string;
  stock: number;
  esIlimitado: boolean;
  activo?: boolean;
}

export interface Entrada {
  id?: number;
  nombre: string;
  activo?: boolean;
}

export interface CartaDiariaDTO {
  platos: Plato[];
  entradas: Entrada[];
  precios: {
    menuCompleto: number;
    soloSegundo: number;
  };
}

export interface ItemVentaRequest {
  platoId: number;
  entradaId: number | null;
  tipo: string;
  modalidad: ModalidadConsumo;
  subtotal: number;
}

export interface RegistroVentaRequest {
  modalidad: ModalidadConsumo;
  items: ItemVentaRequest[];
}

export interface ItemOrdenDTO {
  platoNombre: string;
  entradaNombre: string | null;
  modalidad: ModalidadConsumo;
  cantidad: number;
}

export interface OrdenRecienteDTO {
  id: number;
  fechaHora: string;
  modalidad: ModalidadConsumo;
  total: number;
  items: ItemOrdenDTO[];
}

export interface DashboardMetricasDTO {
  totalRecaudado: number;
  totalMenusVendidos: number;
  totalLocal: number;
  totalLlevar: number;
  totalConEntrada: number;
  totalSinEntrada: number;
  conteoPorPlato: Record<string, {
    nombre: string;
    vendidos: number;
    stockRestante: string;
    activo: boolean;
  }>;
  ultimasVentas: OrdenRecienteDTO[];
}