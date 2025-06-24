import { Routes } from '@angular/router';
import { PdfViewer } from './components/pdf-viewer/pdf-viewer';


export const routes: Routes = [
  { path: '', component: PdfViewer },
  { path: '**', redirectTo: '' }
];