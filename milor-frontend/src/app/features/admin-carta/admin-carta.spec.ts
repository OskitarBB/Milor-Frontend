import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminCarta } from './admin-carta';

describe('AdminCarta', () => {
  let component: AdminCarta;
  let fixture: ComponentFixture<AdminCarta>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminCarta],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminCarta);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
