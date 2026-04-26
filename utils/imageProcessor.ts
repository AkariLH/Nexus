import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import type { ImagePickerAsset } from 'expo-image-picker';

const SIZE_LIMIT = 1_048_576;
const MIN_WIDTH = 200;
const INIT_QUALITY = 0.7;
const QUALITY_STEP = 0.1;
const QUALITY_FLOOR = 0.2;

export async function processProfilePhoto(asset: ImagePickerAsset): Promise<string> {
  if (!asset.width || asset.width <= 0) {
    throw new Error('INVALID_ASSET');
  }

  let width = asset.width;
  let quality = INIT_QUALITY;

  while (true) {
    const result = await manipulateAsync(
      asset.uri,
      [{ resize: { width } }],
      { compress: quality, format: SaveFormat.JPEG, base64: true },
    );

    if (!result.base64) {
      throw new Error('MANIPULATOR_FAILED');
    }

    const dataUri = `data:image/jpeg;base64,${result.base64}`;

    if (dataUri.length <= SIZE_LIMIT) {
      return dataUri;
    }

    if (quality > QUALITY_FLOOR) {
      quality = Math.round((quality - QUALITY_STEP) * 10) / 10;
    } else {
      quality = INIT_QUALITY;
      width = Math.floor(width / 2);
      if (width < MIN_WIDTH) {
        throw new Error('IMAGE_TOO_LARGE');
      }
    }
  }
}
