import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PdfTextFinder } from './pdf-text-finder';

describe('PdfTextFinder', () => {
  let component: PdfTextFinder;
  let fixture: ComponentFixture<PdfTextFinder>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PdfTextFinder]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PdfTextFinder);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
