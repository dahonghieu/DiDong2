
export const BASE_URL = 'http://192.168.1.6:8000';
export const IMAGE_URL = `${BASE_URL}/assets/image`;
export const imageUrl = (folder, filename) => encodeURI(`${IMAGE_URL}/${folder}/${filename}`);
