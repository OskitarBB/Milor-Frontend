export type ModalidadConsumo = 'LOCAL' | 'LLEVAR';

export type TipoMenu = 'COMPLETO' | 'SOLO_SEGUNDO';

export interface Entrada {
  id: string;
  nombre: string;
  activo: boolean;
}

export interface PlatoFondo {
  id: string;
  nombre: string;
  stock: number;          // Cantidad disponible
  esIlimitado: boolean;   // Si es true, ignora el límite numérico
  activo: boolean;
}

export interface PreciosConfig {
  menuCompleto: number;    // Por defecto S/ 12.00
  soloSegundo: number;     // Por defecto S/ 10.00
}

export interface CartaDiaria {
  fecha: string;           // Formato YYYY-MM-DD
  precios: PreciosConfig;
  entradas: Entrada[];
  platos: PlatoFondo[];
}

export interface ItemVenta {
  plato: PlatoFondo;
  entrada?: Entrada;       // Opcional: undefined o null representa "Sin Entrada"
  tipo: TipoMenu;
  subtotal: number;
}

export interface RegistroVenta {
  id: string;
  hora: string;            // Formato HH:mm:ss
  modalidad: ModalidadConsumo;
  items: ItemVenta[];
  total: number;
}

export interface DashboardMetricas {
  totalRecaudado: number;
  totalMenusVendidos: number;
  totalLocal: number;
  totalLlevar: number;
  totalConEntrada: number;
  totalSinEntrada: number;
  conteoPorPlato: { [platoId: string]: { nombre: string; vendidos: number; stockRestante: number | string } };
}