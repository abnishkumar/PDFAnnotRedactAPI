import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PdfComments } from './pdf-comments';

describe('PdfComments', () => {
  let component: PdfComments;
  let fixture: ComponentFixture<PdfComments>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PdfComments]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PdfComments);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
