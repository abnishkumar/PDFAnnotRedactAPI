import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PdfToolbar } from './pdf-toolbar';

describe('PdfToolbar', () => {
  let component: PdfToolbar;
  let fixture: ComponentFixture<PdfToolbar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PdfToolbar]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PdfToolbar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
