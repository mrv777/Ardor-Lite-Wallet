import { PipeTransform, Pipe } from '@angular/core';

@Pipe({
  name: 'truncate',
  pure: true
})
export class TruncatePipe implements PipeTransform {
  /**
   * A simple angular2 pipe which truncate strings.
   * The total number of character returned by this filter is value.length + trail.length
   *
   * @example `{{ "Some too long string" | truncate }}`
   * @example `{{ "Some too long string" | truncate :15 }}`
   * @example `{{ "Some too long string" | truncate :15:'--' }}`
   * @example `{{ "Some too long string" | truncate :15:'--':'left }}`
   * @example `{{ "Some too long string" | truncate :15:null:'middle" }}`
   *
   * @param {string} value Input string passed to the filter.
   * @param {string} [limit=10] The number of kept characters. If the `value` string has more than `limit` characters, they will be replaced by the `trail` string.
   * @param {string} [trail="..."] The string which will replace extra characters.
   * @param {string} [position="right"] The position of replacement string. Allowed values are 'left' | 'right' | 'middle'.
   * @returns {string}
   */
  transform(value: string, limit: number, trail: string, position: string): string {
    value = value || '';  // handle undefined/null value
    limit = limit || 8;
    trail = trail || '...';
    position = position || 'middle';

    if (position === 'left') {
      return value.length > limit
        ? trail + value.substring(value.length - limit, value.length)
        : value;
    } else if (position === 'right') {
      return value.length > limit
        ? value.substring(0, limit) + trail
        : value;
    } else if (position === 'middle') {
      return value.length > limit
        ? value.substring(0, limit/2) + trail + value.substring(value.length - limit/2, value.length)
        : value;
    } else {
      return value;
    }
  }
}