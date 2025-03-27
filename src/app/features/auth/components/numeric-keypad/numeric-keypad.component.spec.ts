import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NumericKeypadComponent } from './numeric-keypad.component';

describe('NumericKeypadComponent', () => {
  let component: NumericKeypadComponent;
  let fixture: ComponentFixture<NumericKeypadComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NumericKeypadComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NumericKeypadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
