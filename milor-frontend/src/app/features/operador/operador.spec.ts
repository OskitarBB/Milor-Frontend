import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Operador } from './operador';

describe('Operador', () => {
  let component: Operador;
  let fixture: ComponentFixture<Operador>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Operador],
    }).compileComponents();

    fixture = TestBed.createComponent(Operador);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
