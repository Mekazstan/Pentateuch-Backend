import { Transform } from 'class-transformer';

export function Sanitize() {
  return Transform(({ value }) => {
    if (typeof value === 'string') {
      return value
        .trim()
        .replace(/<[^>]*>/g, '')
        .replace(/[<>]/g, '');
    }
    return value;
  });
}
