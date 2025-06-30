import { AfterViewInit, Component, ElementRef, NgZone, ViewChild } from '@angular/core';
import { jsPDF } from 'jspdf';

// @ts-ignore
import PDFJS from './pdf.js';
import { DropZoneComponent } from './drop-zone/drop-zone.component.js';
import { FormsModule } from '@angular/forms';

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
  draw(ctx: CanvasRenderingContext2D): void;
}

@Component({
  standalone: true,
  imports: [DropZoneComponent,FormsModule],
  selector: 'app-redactor',
  templateUrl: './redactor.component.html',
  styleUrls: ['./redactor.component.css']
})
export class RedactorComponent implements AfterViewInit {

  @ViewChild('myCanvas', { static: true }) __CANVAS!: ElementRef<HTMLCanvasElement>;
  public __CANVAS_CTX!: CanvasRenderingContext2D;

  public __PDF_DOC: any;
  public __CURRENT_PAGE = 1;
  public __TOTAL_PAGES = 0;
  public __PAGE_RENDERING_IN_PROGRESS = 0;
  public curPage = 1;
  public img = new Image();
  public buff: Rect[] = [];
  public storedRects: Rect[] = [];
  public allPages: HTMLCanvasElement[] = [];
  public rectT: any;
  public show = false;
  public refresh = true;
  public fillColor = "#000000";
  public mouse = {
    button: false,
    x: 0,
    y: 0,
    down: false,
    up: false,
    event: (e: MouseEvent) => {
      const rectCanv = this.__CANVAS.nativeElement.getBoundingClientRect();
      const m = this.mouse;
      m.x = (e.clientX - rectCanv.left) / (rectCanv.right - rectCanv.left) * this.__CANVAS.nativeElement.width;
      m.y = (e.clientY - rectCanv.top) / (rectCanv.bottom - rectCanv.top) * this.__CANVAS.nativeElement.height;
      const prevButton = m.button;
      m.button = e.type === 'mousedown' ? true : e.type === 'mouseup' ? false : m.button;
      if (!prevButton && m.button) m.down = true;
      if (prevButton && !m.button) m.up = true;
    }
  };

  constructor(private ngZone: NgZone) {}

  ngAfterViewInit(): void {
    this.show = false;
    this.__CANVAS_CTX = this.__CANVAS.nativeElement.getContext('2d')!;
    this.rectT = this.rect();

    // Attach mouse events
    this.__CANVAS.nativeElement.addEventListener('mousedown', this.mouse.event);
    this.__CANVAS.nativeElement.addEventListener('mousemove', this.mouse.event);
    this.__CANVAS.nativeElement.addEventListener('mouseup', this.mouse.event);

    this.ngZone.runOutsideAngular(() => {
      const mainLoop = () => {
        if (this.refresh || this.mouse.down || this.mouse.up || this.mouse.button) {
          this.refresh = false;
          if (this.mouse.down) {
            this.mouse.down = false;
            this.rectT.restart(this.mouse);
          } else if (this.mouse.button) {
            this.rectT.update(this.mouse);
          } else if (this.mouse.up) {
            this.mouse.up = false;
            this.rectT.update(this.mouse);
            const tempRect = this.rectT.toRect();
            const m = this.mouse;
            if (
              isFinite(tempRect.x) && isFinite(tempRect.y) && isFinite(tempRect.w) && isFinite(tempRect.h) &&
              tempRect.w !== 0 && tempRect.h !== 0 &&
              m.x > 0 && m.x < this.__CANVAS.nativeElement.width &&
              m.y > 0 && m.y < this.__CANVAS.nativeElement.height
            ) {
              this.__CANVAS_CTX.save();
              this.__CANVAS_CTX.globalAlpha = 0.5;
              this.__CANVAS_CTX.fillStyle = this.fillColor;
              tempRect.draw(this.__CANVAS_CTX);
              this.__CANVAS_CTX.restore();
              // Store a copy, not a reference
              this.storedRects.push({ ...tempRect, draw: tempRect.draw });
              this.buff = [];
              const canv = document.createElement('canvas');
              const canv_con = canv.getContext('2d')!;
              canv.width = this.__CANVAS_CTX.canvas.width;
              canv.height = this.__CANVAS_CTX.canvas.height;
              canv_con.drawImage(this.__CANVAS.nativeElement, 0, 0, this.__CANVAS_CTX.canvas.width, this.__CANVAS_CTX.canvas.height);
              this.allPages[this.__CURRENT_PAGE - 1] = canv;
            }
          }
          this.draw();
        }
        requestAnimationFrame(mainLoop);
      };
      requestAnimationFrame(mainLoop);
    });
  }

  rect(): any {
    let x1: number, y1: number, x2: number, y2: number;
    let show = false;
    const rectT = {
      x: 0, y: 0, w: 0, h: 0,
      draw: (ctx: CanvasRenderingContext2D) => {
        ctx.save();
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = this.fillColor || "#000000";
        ctx.fillRect(rectT.x, rectT.y, rectT.w, rectT.h);
        ctx.restore();
      }
    };
    const API = {
      restart: (point: { x: number, y: number }) => {
        x2 = x1 = point.x;
        y2 = y1 = point.y;
        fix();
        show = true;
      },
      update: (point: { x: number, y: number }) => {
        x2 = point.x;
        y2 = point.y;
        fix();
        show = true;
      },
      toRect: () => {
        show = false;
        return { ...rectT, draw: rectT.draw };
      },
      draw: (ctx: CanvasRenderingContext2D) => {
        if (show) rectT.draw(ctx);
      },
      show: false
    };
    function fix() {
      rectT.x = Math.min(x1, x2);
      rectT.y = Math.min(y1, y2);
      rectT.w = Math.abs(x2 - x1);
      rectT.h = Math.abs(y2 - y1);
    }
    return API;
  }

  uploadFile(): void {
    this.cleanCanvas();
    this.showPDF('http://localhost:4200/assets/test2.pdf');
    this.show = true;
  }

  undoAction(): void {
    if (this.storedRects.length > 0) {
      this.buff.push(this.storedRects.pop()!);
    }
  }

  redoAction(): void {
    if (this.buff.length > 0) {
      this.storedRects.push(this.buff.pop()!);
    }
  }

  prevPage(): void {
    if (this.__CURRENT_PAGE !== 1) {
      this.cleanCanvas();
      this.showPage(--this.__CURRENT_PAGE, true);
    }
  }

  nextPage(): void {
    if (this.__CURRENT_PAGE !== this.__TOTAL_PAGES) {
      this.cleanCanvas();
      this.showPage(++this.__CURRENT_PAGE, true);
    }
  }

  downloadFile(): void {
    let width = this.__CANVAS.nativeElement.width;
    let height = this.__CANVAS.nativeElement.height;
    let pdf: any;
    if (width > height) {
      pdf = new jsPDF('l', 'px', [width, height]);
    } else {
      pdf = new jsPDF('p', 'px', [height, width]);
    }
    width = pdf.internal.pageSize.getWidth();
    height = pdf.internal.pageSize.getHeight();
    for (let i = 0; i < this.allPages.length; i++) {
      pdf.addImage(this.allPages[i], 'PNG', 0, 0, width, height, "", "FAST");
      if (i < (this.allPages.length - 1)) {
        pdf.addPage();
      }
    }
    pdf.save('download.pdf');
  }

  showPDF(pdf_url: string): void {
    PDFJS.getDocument(pdf_url).promise.then((pdf_doc: any) => {
      this.__PDF_DOC = pdf_doc;
      this.__TOTAL_PAGES = this.__PDF_DOC.numPages;
      this.showPage(1, false);
      this.preloadAllPages();
    }).catch((error: any) => {
      alert(error.message);
    });
  }

  showPage(page_no: number, prev: boolean): void {
    this.storedRects = [];
    this.buff = [];
    this.__PAGE_RENDERING_IN_PROGRESS = 1;
    this.__CURRENT_PAGE = page_no;
    this.__PDF_DOC.getPage(page_no).then((page: any) => {
      const width = window.screen.availWidth - 50;
      const scale_required = width / page.getViewport({ scale: 1 }).width;
      const viewport = page.getViewport({ scale: scale_required });

      this.__CANVAS.nativeElement.width = width;
      this.__CANVAS.nativeElement.height = viewport.height;

      const renderContext = {
        canvasContext: this.__CANVAS_CTX,
        viewport: viewport
      };
      page.render(renderContext).then(() => {
        this.__PAGE_RENDERING_IN_PROGRESS = 0;
        if (prev) {
          this.img.src = this.allPages[page_no - 1].toDataURL();
        } else {
          this.img.src = this.__CANVAS.nativeElement.toDataURL();
        }
      });
    });
  }

  draw(): void {
    this.__CANVAS_CTX.drawImage(this.img, 0, 0, this.__CANVAS_CTX.canvas.width, this.__CANVAS_CTX.canvas.height);
    this.__CANVAS_CTX.lineWidth = 1;
    this.__CANVAS_CTX.strokeStyle = 'black';
    this.__CANVAS_CTX.fillStyle = this.fillColor;
    this.storedRects.forEach(rect2 => rect2.draw(this.__CANVAS_CTX));
    this.__CANVAS_CTX.save();
    this.__CANVAS_CTX.globalAlpha = 0.5;
    this.__CANVAS_CTX.fillStyle = this.fillColor;
    this.rectT.draw(this.__CANVAS_CTX);
    this.__CANVAS_CTX.restore();
    this.__CANVAS_CTX.fillStyle = this.fillColor;
  }

  cleanCanvas(): void {
    this.__CANVAS_CTX.clearRect(0, 0, this.__CANVAS_CTX.canvas.width, this.__CANVAS_CTX.canvas.height);
    this.fillColor = "#000000";
    this.img.src = this.__CANVAS.nativeElement.toDataURL();
  }

  captureFile($event: string): void {
    this.cleanCanvas();
    this.showPDF($event);
    this.show = true;
  }

  removeFile($event: any): void {
    this.show = false;
  }

  preloadAllPages(): void {
    this.allPages = [];
    for (let i = 1; i <= this.__TOTAL_PAGES; i++) {
      this.__PDF_DOC.getPage(i).then((page: any) => {
        const width = window.screen.availWidth - 50;
        const scale_required = width / page.getViewport({ scale: 1 }).width;
        const viewport = page.getViewport({ scale: scale_required });
        const canv = document.createElement('canvas');
        const canv_con = canv.getContext('2d')!;
        canv.width = width;
        canv.height = viewport.height;

        const renderContext = {
          canvasContext: canv_con,
          viewport: viewport
        };
        page.render(renderContext).then(() => {
          this.allPages.push(canv);
        });
      });
    }
  }
}
