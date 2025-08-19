import {
  AfterViewInit,
  Component,
  ElementRef,
  Injectable,
  NgZone,
  ViewChild
} from '@angular/core';

import { jsPDF } from 'jspdf';
import { DropZoneComponent } from './drop-zone/drop-zone.component.js';
import { FormsModule } from '@angular/forms';

// Use pdfjs-dist from npm (install: npm install pdfjs-dist)
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker?url'; 


(pdfjsLib as any).GlobalWorkerOptions.workerSrc = pdfjsWorker;

@Component({
  selector: 'app-redactor',
  templateUrl: './redactor.component.html',
  styleUrls: ['./redactor.component.css'],
  imports: [DropZoneComponent, FormsModule],
  standalone: true
})
@Injectable()
export class RedactorComponent implements AfterViewInit {
  @ViewChild('myCanvas', { static: false }) __CANVAS!: ElementRef<HTMLCanvasElement>;
  public __CANVAS_CTX!: CanvasRenderingContext2D;

  public __PDF_DOC: any;
  public __CURRENT_PAGE: number = 1;
  public __TOTAL_PAGES: number = 0;
  public __PAGE_RENDERING_IN_PROGRESS: number = 0;

  public curPage = 1;
  public img: HTMLImageElement = new Image();
  public buff: any[] = [];
  public storedRects: any[] = [];
  public allPages: HTMLCanvasElement[] = [];
  public rectT: any;
  public show = false;
  public refresh = true;
  public fillColor: string = '#000000';

  public mouse: any = {
    button: false,
    x: 0,
    y: 0,
    down: false,
    up: false,
    that: this,
    event: (e: MouseEvent) => {
      const rectCanv = this.__CANVAS.nativeElement.getBoundingClientRect();
      const m = this.mouse;
      m.x =
        ((e.clientX - rectCanv.left) /
          (rectCanv.right - rectCanv.left)) *
        this.__CANVAS.nativeElement.width;
      m.y =
        ((e.clientY - rectCanv.top) /
          (rectCanv.bottom - rectCanv.top)) *
        this.__CANVAS.nativeElement.height;

      const prevButton = m.button;
      m.button =
        e.type === 'mousedown'
          ? true
          : e.type === 'mouseup'
          ? false
          : this.mouse.button;

      if (!prevButton && m.button) {
        m.down = true;
      }
      if (prevButton && !m.button) {
        m.up = true;
      }
    },
  };

  constructor(public ngZone: NgZone) {
    const that = this;
    this.ngZone.runOutsideAngular(() => {
      requestAnimationFrame(mainLoop);
      function mainLoop() {
        that.refresh = true;
        if (
          that.refresh ||
          that.mouse.down ||
          that.mouse.up ||
          that.mouse.button
        ) {
          that.refresh = false;
          if (that.mouse.down) {
            that.mouse.down = false;
            that.rectT.restart(that.mouse);
          } else if (that.mouse.button) {
            that.rectT.update(that.mouse);
          } else if (that.mouse.up) {
            that.mouse.up = false;
            that.rectT.update(that.mouse);
            const tempRect = that.rectT.toRect();
            const m = that.mouse;
            if (
              isFinite(tempRect.x) &&
              isFinite(tempRect.y) &&
              isFinite(tempRect.w) &&
              isFinite(tempRect.h) &&
              tempRect.w !== 0 &&
              tempRect.h !== 0 &&
              m.x > 0 &&
              m.x < that.__CANVAS.nativeElement.width &&
              m.y > 0 &&
              m.y < that.__CANVAS.nativeElement.height
            ) {
              that.__CANVAS_CTX.fillStyle = that.fillColor;
              tempRect.draw(that.__CANVAS_CTX);
              that.storedRects.push(tempRect);
              that.buff = [];
              const canv = document.createElement('canvas');
              const canv_con = canv.getContext('2d')!;
              canv.width = that.__CANVAS_CTX.canvas.width;
              canv.height = that.__CANVAS_CTX.canvas.height;
              canv_con.drawImage(
                that.__CANVAS.nativeElement,
                0,
                0,
                that.__CANVAS_CTX.canvas.width,
                that.__CANVAS_CTX.canvas.height
              );
              that.allPages[that.__CURRENT_PAGE - 1] = canv;
            }
          }
          that.draw();
        }
        requestAnimationFrame(mainLoop);
      }
    });
  }

  rect(): object {
    let x1: number, y1: number, x2: number, y2: number;
    let show = false;
    const rectT = { x: 0, y: 0, w: 0, h: 0, draw };
    function fix() {
      rectT.x = Math.min(x1, x2);
      rectT.y = Math.min(y1, y2);
      rectT.w = Math.max(x1, x2) - Math.min(x1, x2);
      rectT.h = Math.max(y1, y2) - Math.min(y1, y2);
    }

    function draw(ctx: CanvasRenderingContext2D) {
      ctx.fillRect(rectT.x, rectT.y, rectT.w, rectT.h);
    }

    return {
      restart(point: any) {
        x2 = x1 = point.x;
        y2 = y1 = point.y;
        fix();
        show = true;
      },
      update(point: any) {
        x2 = point.x;
        y2 = point.y;
        fix();
        show = true;
      },
      toRect() {
        show = false;
        return Object.assign({}, rectT);
      },
      draw(ctx: CanvasRenderingContext2D) {
        if (show) {
          rectT.draw(ctx);
        }
      },
      show: false,
    };
  }

  ngAfterViewInit(): void {
    this.show = false;
    this.__CANVAS_CTX = this.__CANVAS.nativeElement.getContext(
      '2d'
    ) as CanvasRenderingContext2D;
    this.rectT = this.rect();
  }

  uploadFile(): void {
    this.cleanCanvas();
    this.showPDF('http://localhost:4200/assets/test2.pdf');
    this.show = true;
  }

  undoAction(): void {
    if (this.storedRects.length > 0) {
      this.buff.push(this.storedRects.pop());
    }
  }

  redoAction(): void {
    if (this.buff.length > 0) {
      this.storedRects.push(this.buff.pop());
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
    let pdf: any = null;

    if (width > height) {
      pdf = new jsPDF('l', 'px', [width, height]);
    } else {
      pdf = new jsPDF('p', 'px', [height, width]);
    }

    width = pdf.internal.pageSize.getWidth();
    height = pdf.internal.pageSize.getHeight();

    for (let i = 0; i < this.allPages.length; i++) {
      pdf.addImage(
        this.allPages[i],
        'PNG',
        0,
        0,
        width,
        height,
        '',
        'FAST'
      );
      if (i < this.allPages.length - 1) {
        pdf.addPage();
      }
    }
    pdf.save('download.pdf');
  }

  showPDF(pdf_url: string): void {
    const that = this;
    pdfjsLib.getDocument(pdf_url).promise
      .then(function (pdf_doc: any) {
        that.__PDF_DOC = pdf_doc;
        that.__TOTAL_PAGES = pdf_doc.numPages;
        that.showPage(1, false);
        that.preloadAllPages();
      })
      .catch(function (error: any) {
        alert(error.message);
      });
  }

  showPage(page_no: number, prev: boolean) {
    this.storedRects = [];
    this.buff = [];
    this.__PAGE_RENDERING_IN_PROGRESS = 1;
    this.__CURRENT_PAGE = page_no;
    const that = this;
    this.__PDF_DOC.getPage(page_no).then(function (page: any) {
      const width = window.screen.availWidth - 50;
      const scale_required = width / page.getViewport({ scale: 1 }).width;
      const viewport = page.getViewport({ scale: scale_required });

      that.__CANVAS.nativeElement.width = width;
      that.__CANVAS.nativeElement.height = viewport.height;

      const renderContext = {
        canvasContext: that.__CANVAS_CTX,
        viewport: viewport,
      };

      page.render(renderContext).promise.then(function () {
        that.__PAGE_RENDERING_IN_PROGRESS = 0;
        if (prev) {
          that.img.src = that.allPages[page_no - 1].toDataURL();
        } else {
          that.img.src = that.__CANVAS.nativeElement.toDataURL();
        }
      });
    });
  }

  draw() {
    this.__CANVAS_CTX.drawImage(
      this.img,
      0,
      0,
      this.__CANVAS_CTX.canvas.width,
      this.__CANVAS_CTX.canvas.height
    );
    this.__CANVAS_CTX.lineWidth = 1;
    this.__CANVAS_CTX.strokeStyle = 'black';
    this.__CANVAS_CTX.fillStyle = this.fillColor;
    this.storedRects.forEach((rect2) =>
      rect2.draw(this.__CANVAS_CTX)
    );
    this.__CANVAS_CTX.fillStyle = this.fillColor + '80';
    this.__CANVAS_CTX.strokeStyle = 'red';
    this.rectT.draw(this.__CANVAS_CTX);
    this.__CANVAS_CTX.fillStyle = this.fillColor;
  }

  cleanCanvas(): void {
    this.__CANVAS_CTX.clearRect(
      0,
      0,
      this.__CANVAS_CTX.canvas.width,
      this.__CANVAS_CTX.canvas.height
    );
    this.fillColor = '#000000';
    this.img.src = this.__CANVAS.nativeElement.toDataURL();
  }

  captureFile($event: string) {
    this.cleanCanvas();
    this.showPDF($event);
    this.show = true;
  }

  removeFile($event: any) {
    this.show = false;
  }

  preloadAllPages() {
    this.allPages = [];
    const that = this;
    for (let i = 1; i <= this.__TOTAL_PAGES; i++) {
      this.__PDF_DOC.getPage(i).then(function (page: any) {
        const width = window.screen.availWidth - 150;
        const scale_required = width / page.getViewport({ scale: 1 }).width;
        const viewport = page.getViewport({ scale: scale_required });
        const canv = document.createElement('canvas');
        const canv_con = canv.getContext('2d')!;
        canv.width = width;
        canv.height = viewport.height;

        const renderContext = {
          canvasContext: canv_con,
          viewport: viewport,
        };

        page.render(renderContext).promise.then(function () {
          that.allPages.push(canv);
        });
      });
    }
  }
}
