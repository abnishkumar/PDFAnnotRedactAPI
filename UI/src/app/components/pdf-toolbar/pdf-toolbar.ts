import { Component, Output, EventEmitter, Input, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-pdf-toolbar',
  standalone: true,
  imports: [CommonModule,FormsModule],
  templateUrl: './pdf-toolbar.html',
  styleUrls: ['./pdf-toolbar.css']
})
export class PdfToolbar {
  @Input() hasPdf: boolean = false;
  @Output() toolSelected = new EventEmitter<'redact' | 'annotate'>();
  @Output() save = new EventEmitter<void>();
  selectedTool: string = 'annotate'; // Default tool selected
  ngOnInit() { 
    this.toolSelected.emit('annotate');
  }

  onToolSelected(tool: 'redact' | 'annotate') {
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