import { Pipe, PipeTransform } from '@angular/core';
import { Redaction } from '../models/redaction.model';

@Pipe({
  name: 'filterByPage',
  standalone: true
})
export class FilterByPagePipe implements PipeTransform {
  transform(redactions: Redaction[], page: number): Redaction[] {
    return redactions.filter(redaction => redaction.page === page);
  }
}