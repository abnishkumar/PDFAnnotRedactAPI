import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxExtendedPdfViewerModule } from 'ngx-extended-pdf-viewer';

import { Subscription } from 'rxjs';
import { PdfToolbar } from '../pdf-toolbar/pdf-toolbar';
import { PdfComments } from '../pdf-comments/pdf-comments';
import { FilterByPagePipe } from '../filter-by-page.pipe';
import { Redaction } from '../../models/redaction.model';
import { PdfService } from '../../services/pdf.service';
import { RedactorComponent } from '../redactor/redactor.component';

@Component({
  selector: 'app-pdf-viewer',
  standalone: true,
  imports: [CommonModule, NgxExtendedPdfViewerModule,
    PdfToolbar,
    PdfComments,
    RedactorComponent,
    FilterByPagePipe],
  templateUrl: './pdf-viewer.html',
  styleUrls: ['./pdf-viewer.css']
})
export class PdfViewer implements OnInit, OnDestroy {
  @ViewChild('pdfViewer') pdfViewer!: ElementRef;
  pdfSrc: ArrayBuffer | null = null;
  redactions: Redaction[] = [];
  error: string | null = null;
  selectedTool: 'redact' | 'annotate' = 'annotate';
  currentPage = 1;
  private subscriptions = new Subscription();

  constructor(private pdfService: PdfService) { }

  ngOnInit() {
    this.subscriptions.add(
      this.pdfService.getRedactions().subscribe(redactions => {
        this.redactions = redactions;
      })
    );
    this.subscriptions.add(
      this.pdfService.getError().subscribe(error => this.error = error)
    );
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  async onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      try {
        const file = input.files[0];
        const arrayBuffer = await file.arrayBuffer();
        this.pdfSrc = arrayBuffer;
        this.pdfService.setPdfBytes(new Uint8Array(arrayBuffer));
        this.error = null;
      } catch {
        this.error = 'Failed to load PDF';
        // this.pdfSrc = undefined;
      }
    }
  }

  onPageChange(page: any) {
    this.currentPage = Number(page);
  }

  async savePdf() {
    if (!this.pdfSrc) {
      this.error = 'No PDF loaded to save';
      return;
    }
    try {
      const pdfBytes = await this.pdfService.savePdf();
      const uint8Array: any = pdfBytes instanceof Uint8Array
        ? pdfBytes
        : new Uint8Array(pdfBytes);
      const blob = new Blob([uint8Array], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'redacted.pdf';
      a.click();
      window.URL.revokeObjectURL(url);
      this.error = null;
    } catch (err) {
      this.error = 'Failed to save PDF: ' + (err instanceof Error ? err.message : 'Unknown error');
    }
  }
}

