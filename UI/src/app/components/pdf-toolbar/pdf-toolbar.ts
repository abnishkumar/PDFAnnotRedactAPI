import { Component, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pdf-toolbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pdf-toolbar.html',
  styleUrls: ['./pdf-toolbar.css']
})
export class PdfToolbar {
 @Input() hasPdf: boolean = false;
  @Output() toolSelected = new EventEmitter<'redact' | null>();
  @Output() save = new EventEmitter<void>();

  selectRedactTool() {
    this.toolSelected.emit('redact');
  }

  clearTool() {
    this.toolSelected.emit(null);
  }

  savePdf() {
    this.save.emit();
  }
}