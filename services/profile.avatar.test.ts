/**
 * La foto de perfil exige sesion (nexus-SEC-04). Un <Image uri> no manda el Authorization, el
 * servidor respondia 401 y la foto "no se guardaba" aunque si estaba guardada. Ahora se pide por
 * apiClient y se muestra como data URI.
 */
jest.mock('./api.client', () => {
  const client = { get: jest.fn() };
  return { __esModule: true, default: client, apiClient: client };
});

import apiClient from './api.client';
import { profileService } from './profile.service';

const get = apiClient.get as jest.Mock;

describe('profileService.fetchAvatar', () => {
  beforeEach(() => get.mockReset());

  it('pide la foto por apiClient como bytes y la devuelve como data URI', async () => {
    get.mockResolvedValue({
      data: new Uint8Array([0xff, 0xd8, 0xff, 0xe0]).buffer,
      headers: { 'content-type': 'image/jpeg' },
    });

    await expect(profileService.fetchAvatar(13)).resolves.toBe('data:image/jpeg;base64,/9j/4A==');
    expect(get).toHaveBeenCalledWith('/profile/13/avatar', { responseType: 'arraybuffer' });
  });

  it('sin foto (404 o vacia) devuelve null', async () => {
    get.mockRejectedValueOnce({ status: 404 });
    await expect(profileService.fetchAvatar(13)).resolves.toBeNull();

    get.mockResolvedValueOnce({ data: new ArrayBuffer(0), headers: {} });
    await expect(profileService.fetchAvatar(13)).resolves.toBeNull();
  });
});
