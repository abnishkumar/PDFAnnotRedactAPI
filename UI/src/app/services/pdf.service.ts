import { Injectable } from '@angular/core';
import { PDFDocument, rgb } from 'pdf-lib';
import { Redaction } from '../models/redaction.model';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PdfService {
  private redactions = new BehaviorSubject<Redaction[]>([]);
  private error = new BehaviorSubject<string | null>(null);
  private pdfBytes = new BehaviorSubject<Uint8Array | null>(null);

  addRedaction(redaction: Redaction): void {
    const current = this.redactions.value;
    this.redactions.next([...current, redaction]);
  }

  getRedactions(): Observable<Redaction[]> {
    return this.redactions.asObservable();
  }

  getError(): Observable<string | null> {
    return this.error.asObservable();
  }

  setPdfBytes(bytes: Uint8Array): void {
    console.log('Setting PDF bytes, size:', bytes.length);
    this.pdfBytes.next(bytes);
  }

  async savePdf(): Promise<Uint8Array> {
    try {
      const bytes = this.pdfBytes.value;
      if (!bytes || bytes.length === 0) {
        throw new Error('No valid PDF data available');
      }
      console.log('Loading PDF, bytes:', bytes.length);
      const pdfDoc = await PDFDocument.load(bytes);
      const pageCount = pdfDoc.getPageCount();
      console.log('PDF page count:', pageCount);
      for (const redaction of this.redactions.value) {
        if (redaction.page < 1 || redaction.page > pageCount) {
          throw new Error(`Invalid page number: ${redaction.page}`);
        }
        const page = pdfDoc.getPage(redaction.page - 1);
        const { width, height } = page.getSize();
        const x = Math.max(0, Math.min(redaction.coordinates.x, width));
        const y = Math.max(0, Math.min(redaction.coordinates.y, height));
        page.drawRectangle({
          x,
          y,
          width: Math.min(redaction.coordinates.width, width - x),
          height: Math.min(redaction.coordinates.height, height - y),
          color: rgb(0, 0, 0),
        });
      }
      const savedBytes = await pdfDoc.save();
      console.log('Saved PDF, bytes:', savedBytes.length);
      this.error.next(null);
      return savedBytes;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      this.error.next('Failed to save PDF: ' + errorMsg);
      console.error('Save PDF error:', err);
      throw new Error(errorMsg);
    }
  }
}