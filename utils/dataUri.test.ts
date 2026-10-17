import { bytesToDataUri } from './dataUri';

const bytes = (text: string): ArrayBuffer => new Uint8Array([...text].map((c) => c.charCodeAt(0))).buffer;

describe('bytesToDataUri', () => {
  it('codifica en base64 con y sin relleno', () => {
    expect(bytesToDataUri(bytes('Man'), 'image/png')).toBe('data:image/png;base64,TWFu');
    expect(bytesToDataUri(bytes('Ma'), 'image/png')).toBe('data:image/png;base64,TWE=');
    expect(bytesToDataUri(bytes('M'), 'image/png')).toBe('data:image/png;base64,TQ==');
  });

  it('acepta bytes altos (una imagen real no es texto)', () => {
    const jpegHeader = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]).buffer;
    expect(bytesToDataUri(jpegHeader, 'image/jpeg')).toBe('data:image/jpeg;base64,/9j/4A==');
  });
});
