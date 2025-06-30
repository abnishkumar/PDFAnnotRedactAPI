import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DropzoneConfigInterface, DropzoneModule } from 'ngx-dropzone-wrapper';

@Component({
  standalone: true,
  selector: 'app-drop-zone',
  imports: [DropzoneModule,FormsModule],
  templateUrl: './drop-zone.component.html',
  styleUrls: ['./drop-zone.component.css']
})
export class DropZoneComponent implements OnInit {
  @Output() fileEvent = new EventEmitter<string>();
  @Output() removeFileEvent = new EventEmitter<string>();
  public message!: string;
  public errFlag = false;
  public DEFAULT_DROPZONE_CONFIG: DropzoneConfigInterface = {
    url: 'http://localhost:8000/upload', // <-- FastAPI endpoint
    addRemoveLinks: true,
    acceptedFiles: '.pdf',
    maxFiles: 1,
    errorReset: 1
  };

  ngOnInit(): void {
    this.message = 'Only ONE PDF File is Allowed';
    this.errFlag = false;
  }

  fileUploadSuccess(event: any): void {
    this.message = 'Only ONE PDF File is Allowed';
    if (this.errFlag) {
      this.removeFileEvent.emit(event);
      return;
    }
    this.errFlag = false;
    // event is usually an array of files
    const file: File = event[0];
    if (file && file.type === 'application/pdf') {
      const fileUrl = URL.createObjectURL(file);
      this.fileEvent.emit(fileUrl);
    } else {
      this.message = 'Please upload a PDF file.';
      this.errFlag = true;
    }
  }

  fileUploadError(event: any): void {
    console.log(event);
    const file: File = event[0];
    if (!file || file.type !== 'application/pdf') {
      alert('Error: Not a PDF');
      this.message = 'Please upload a PDF file.';
    } else {
      this.message = 'Please save the current file. Next upload will replace the current file.';
    }
    this.errFlag = true;
  }

  removeFile(event: any): void {
    if (!this.errFlag) {
      this.removeFileEvent.emit(event);
    }
  }
}
