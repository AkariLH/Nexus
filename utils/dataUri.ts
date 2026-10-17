const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/**
 * Bytes de una imagen a `data:` URI. Base64 propio: en React Native no hay `Buffer` y `btoa` no
 * acepta bytes altos sin trucos.
 *
 * @complexity T: O(n), S: O(n)
 */
export function bytesToDataUri(buffer: ArrayBuffer, mime: string): string {
  const bytes = new Uint8Array(buffer);
  const chunks: string[] = [];

  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i];
    const b = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const c = i + 2 < bytes.length ? bytes[i + 2] : 0;
    const triple = (a << 16) | (b << 8) | c;
    chunks.push(
      ALPHABET[(triple >> 18) & 63] +
        ALPHABET[(triple >> 12) & 63] +
        (i + 1 < bytes.length ? ALPHABET[(triple >> 6) & 63] : '=') +
        (i + 2 < bytes.length ? ALPHABET[triple & 63] : '='),
    );
  }

  return `data:${mime};base64,${chunks.join('')}`;
}
