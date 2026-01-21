
export const BASE_URL = 'http:///10.60.218.161:8000';
export const IMAGE_URL = `${BASE_URL}/assets/image`;
export const imageUrl = (folder, filename) => encodeURI(`${IMAGE_URL}/${folder}/${filename}`);
