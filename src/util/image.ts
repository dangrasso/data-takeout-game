
export function makeImage(src: string): HTMLImageElement {
  const img = new Image();
  img.src = src;
  return img;
}

export async function promiseLoadedImage(src: string): Promise<HTMLImageElement> {
  return new Promise<HTMLImageElement>((resolve) => {
    const img = new Image();
    img.src = src;
    img.onload = () => resolve(img);
  });
}
