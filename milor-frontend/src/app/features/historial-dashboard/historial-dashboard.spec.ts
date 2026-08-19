import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HistorialDashboard } from './historial-dashboard';

describe('HistorialDashboard', () => {
  let component: HistorialDashboard;
  let fixture: ComponentFixture<HistorialDashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HistorialDashboard],
    }).compileComponents();

    fixture = TestBed.createComponent(HistorialDashboard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
