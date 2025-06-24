import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pdf-toolbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pdf-toolbar.html',
  styleUrls: ['./pdf-toolbar.css']
})
export class PdfToolbar {
  @Output() toolSelected = new EventEmitter<'redact' | null>();
  @Output() save = new EventEmitter<void>();

  selectTool(tool: 'redact' | null) {
    this.toolSelected.emit(tool);
  }

  savePdf() { this.save.emit(); }
}