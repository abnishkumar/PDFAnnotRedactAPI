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
  @Output() toolSelected = new EventEmitter<'redact' | 'annotate'>();
  @Output() save = new EventEmitter<void>();

  ngOnInit() { 
    this.toolSelected.emit('annotate');
  }

  selectdTool(tool: 'redact' | 'annotate') {
    console.log('Selected tool:', tool);
    this.toolSelected.emit(tool);
  }

  // clearTool() {
  //   this.toolSelected.emit();
  // }

  savePdf() {
    this.save.emit();
  }
}