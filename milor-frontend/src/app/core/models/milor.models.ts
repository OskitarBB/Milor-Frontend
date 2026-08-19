export type Modalidad = 'LOCAL' | 'LLEVAR';
export type ModalidadConsumo = 'LOCAL' | 'LLEVAR';
export type TipoMenu = 'COMPLETO' | 'SOLO_SEGUNDO' | 'EJECUTIVO' | 'CARTA';

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

export interface ConfiguracionPrecio {
  id?: number;
  menuCompleto?: number;
  soloSegundo?: number;
  precioLocal?: number;
  precioLlevar?: number;
}

export interface CartaDiariaDTO {
  platos: Plato[];
  entradas: Entrada[];
  precios: ConfiguracionPrecio;
}

export interface DetallePlatoMetrica {
  nombre: string;
  vendidos: number;
  stockRestante: string;
}

export interface OrdenReciente {
  id: number;
  fechaHora: string;
  modalidad: Modalidad;
  total: number;
  descripcionItems: string[];
}

export interface DashboardMetricasDTO {
  totalRecaudado: number;
  totalMenusVendidos: number;
  totalLocal: number;
  totalLlevar: number;
  totalConEntrada: number;
  totalSinEntrada: number;
  conteoPorPlato: { [key: string]: DetallePlatoMetrica };
  ultimasVentas: OrdenReciente[];
}

export interface ItemVentaRequest {
  platoId: number;
  entradaId?: number | null;
  tipo: TipoMenu;
  subtotal: number;
}

export interface RegistroVentaRequest {
  modalidad: Modalidad;
  items: ItemVentaRequest[];
}