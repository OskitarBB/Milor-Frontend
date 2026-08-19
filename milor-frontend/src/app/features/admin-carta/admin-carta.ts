import { Component, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MilorService } from '../../core/services/milor.service';
import { CartaDiariaDTO } from '../../core/models/milor.models';

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

  constructor() {
    effect(() => {
      const data = this.milorService.carta();
      if (data) {
        this.cartaEditable.set(JSON.parse(JSON.stringify(data)));
      }
    }, { allowSignalWrites: true });
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
        this.nuevoPlatoNombre.set('');
        this.nuevoPlatoStock.set(20);
        this.nuevoPlatoIlimitado.set(false);
      }
    });
  }

  eliminarPlato(id?: number): void {
    if (id) {
      this.milorService.eliminarPlato(id).subscribe();
    }
  }

  togglePlatoActivo(id?: number): void {
    if (!id) return;
    const plato = this.cartaEditable().platos.find(p => p.id === id);
    if (plato) {
      this.milorService.guardarPlato({
        ...plato,
        activo: !plato.activo
      }).subscribe();
    }
  }

  agregarEntrada(): void {
    const nombre = this.nuevaEntradaNombre().trim();
    if (!nombre) return;

    this.milorService.guardarEntrada({
      nombre: nombre,
      activo: true
    }).subscribe({
      next: () => this.nuevaEntradaNombre.set('')
    });
  }

  eliminarEntrada(id?: number): void {
    if (id) {
      this.milorService.eliminarEntrada(id).subscribe();
    }
  }

  toggleEntradaActiva(id?: number): void {
    if (!id) return;
    const entrada = this.cartaEditable().entradas.find(e => e.id === id);
    if (entrada) {
      this.milorService.guardarEntrada({
        ...entrada,
        activo: !entrada.activo
      }).subscribe();
    }
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