import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ExamplePdfViewerComponent } from './example-pdf-viewer/example-pdf-viewer.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet,ExamplePdfViewerComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected title = 'pdf-viewer-app';
}
