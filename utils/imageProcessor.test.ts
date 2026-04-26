import { manipulateAsync } from 'expo-image-manipulator';
import { processProfilePhoto } from './imageProcessor';
import type { ImagePickerAsset } from 'expo-image-picker';

jest.mock('expo-image-manipulator', () => ({
  manipulateAsync: jest.fn(),
  SaveFormat: { JPEG: 'jpeg' },
}));

const mockManipulate = manipulateAsync as jest.Mock;

const makeAsset = (width = 1000): ImagePickerAsset =>
  ({ uri: 'file://photo.jpg', width, height: width } as ImagePickerAsset);

const makeBase64 = (byteLength: number): string =>
  'A'.repeat(byteLength);

const PREFIX = 'data:image/jpeg;base64,';

beforeEach(() => {
  mockManipulate.mockReset();
});

describe('processProfilePhoto', () => {
  it('TC-01: returns on first iteration when output fits within 1 MB', async () => {
    const base64 = makeBase64(500_000);
    mockManipulate.mockResolvedValueOnce({ base64, uri: 'file://out.jpg', width: 1000, height: 1000 });

    const result = await processProfilePhoto(makeAsset(1000));

    expect(result).toBe(`${PREFIX}${base64}`);
    expect(mockManipulate).toHaveBeenCalledTimes(1);
  });

  it('TC-02: reduces quality once when first iteration exceeds 1 MB', async () => {
    const big = makeBase64(2_000_000);
    const small = makeBase64(500_000);
    mockManipulate
      .mockResolvedValueOnce({ base64: big, uri: 'file://out.jpg', width: 1000, height: 1000 })
      .mockResolvedValueOnce({ base64: small, uri: 'file://out.jpg', width: 1000, height: 1000 });

    await processProfilePhoto(makeAsset(1000));

    expect(mockManipulate).toHaveBeenCalledTimes(2);
    expect(mockManipulate).toHaveBeenNthCalledWith(
      2,
      'file://photo.jpg',
      [{ resize: { width: 1000 } }],
      { compress: 0.6, format: 'jpeg', base64: true },
    );
  });

  it('TC-03: halves dimensions after quality reaches floor', async () => {
    const big = makeBase64(2_000_000);
    const small = makeBase64(500_000);
    // Quality sequence: 0.7→0.6→0.5→0.4→0.3→0.2 (6 calls at original width).
    // Call 6 uses quality=0.2 which is NOT > QUALITY_FLOOR, so the else branch fires:
    // reset quality to 0.7, halve width to 500. Call 7 is the first at width=500.
    mockManipulate
      .mockResolvedValueOnce({ base64: big, uri: 'file://out.jpg', width: 1000, height: 1000 })
      .mockResolvedValueOnce({ base64: big, uri: 'file://out.jpg', width: 1000, height: 1000 })
      .mockResolvedValueOnce({ base64: big, uri: 'file://out.jpg', width: 1000, height: 1000 })
      .mockResolvedValueOnce({ base64: big, uri: 'file://out.jpg', width: 1000, height: 1000 })
      .mockResolvedValueOnce({ base64: big, uri: 'file://out.jpg', width: 1000, height: 1000 })
      .mockResolvedValueOnce({ base64: big, uri: 'file://out.jpg', width: 1000, height: 1000 })
      .mockResolvedValueOnce({ base64: small, uri: 'file://out.jpg', width: 500, height: 500 });

    await processProfilePhoto(makeAsset(1000));

    expect(mockManipulate).toHaveBeenCalledTimes(7);
    expect(mockManipulate).toHaveBeenLastCalledWith(
      'file://photo.jpg',
      [{ resize: { width: 500 } }],
      { compress: 0.7, format: 'jpeg', base64: true },
    );
  });

  it('TC-04: throws IMAGE_TOO_LARGE when width drops below MIN_WIDTH', async () => {
    const big = makeBase64(2_000_000);
    // Always oversized — force width below 200
    mockManipulate.mockResolvedValue({ base64: big, uri: 'file://out.jpg', width: 100, height: 100 });

    await expect(processProfilePhoto(makeAsset(300))).rejects.toThrow('IMAGE_TOO_LARGE');
  });

  it('TC-05: output always starts with data:image/jpeg;base64,', async () => {
    mockManipulate.mockResolvedValueOnce({
      base64: makeBase64(100),
      uri: 'file://out.jpg',
      width: 1000,
      height: 1000,
    });

    const result = await processProfilePhoto(makeAsset(1000));

    expect(result.startsWith('data:image/jpeg;base64,')).toBe(true);
  });

  it('TC-06: first call uses compress:0.7, format:jpeg, base64:true', async () => {
    mockManipulate.mockResolvedValueOnce({
      base64: makeBase64(100),
      uri: 'file://out.jpg',
      width: 1000,
      height: 1000,
    });

    await processProfilePhoto(makeAsset(1000));

    expect(mockManipulate).toHaveBeenCalledWith(
      'file://photo.jpg',
      [{ resize: { width: 1000 } }],
      { compress: 0.7, format: 'jpeg', base64: true },
    );
  });

  it('TC-07: throws MANIPULATOR_FAILED when base64 is undefined', async () => {
    mockManipulate.mockResolvedValueOnce({ base64: undefined, uri: 'file://out.jpg', width: 1000, height: 1000 });

    await expect(processProfilePhoto(makeAsset(1000))).rejects.toThrow('MANIPULATOR_FAILED');
  });

  it('TC-08: throws INVALID_ASSET when asset.width is 0', async () => {
    await expect(processProfilePhoto(makeAsset(0))).rejects.toThrow('INVALID_ASSET');
    expect(mockManipulate).not.toHaveBeenCalled();
  });
});
