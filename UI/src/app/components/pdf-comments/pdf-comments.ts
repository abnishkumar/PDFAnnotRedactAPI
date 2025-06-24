import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-pdf-comments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pdf-comments.html',
  styleUrls: ['./pdf-comments.css']
})
export class PdfComments {
  comment = '';
  comments: { id: string; content: string }[] = [];

  addComment() {
    if (this.comment.trim()) {
      this.comments.push({
        id: Math.random().toString(36).substr(2, 9),
        content: this.comment
      });
      this.comment = '';
    }
  }
}