import QRCode from 'qrcode';

export async function renderPrintableQR(canvas: HTMLCanvasElement, url: string, size: number, title = '') {
  const qr = document.createElement('canvas');
  await QRCode.toCanvas(qr, url, { width: size, margin: 4, errorCorrectionLevel: 'H' });
  const label = title.trim();
  const band = label ? Math.round(size * 0.14) : 0;
  canvas.width = size;
  canvas.height = size + band;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No se puede dibujar el QR.');
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  if (label) {
    const inset = Math.round(size * 0.015);
    ctx.fillStyle = '#000000';
    ctx.fillRect(inset, inset, size - inset * 2, band - inset);
    let fontSize = Math.round(size * 0.065);
    ctx.font = `900 ${fontSize}px Arial, sans-serif`;
    while (ctx.measureText(label).width > size * 0.9 && fontSize > 1) {
      fontSize--; ctx.font = `900 ${fontSize}px Arial, sans-serif`;
    }
    ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(label, size / 2, (band + inset) / 2);
  }
  ctx.drawImage(qr, 0, band);
  ctx.strokeStyle = '#000000'; ctx.lineWidth = Math.max(1, size * 0.006);
  ctx.strokeRect(ctx.lineWidth / 2, ctx.lineWidth / 2, size - ctx.lineWidth, canvas.height - ctx.lineWidth);
}

export interface DownloadQROptions {
  url: string;
  restaurantName: string;
  title?: string;
  size?: number;
}

export async function downloadRestaurantQRPNG({ url, restaurantName, title = '', size = 1400 }: DownloadQROptions): Promise<void> {
  const canvas = document.createElement('canvas');
  await renderPrintableQR(canvas, url, size, title);
  const sanitizedName = restaurantName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  const link = document.createElement('a');
  link.href = canvas.toDataURL('image/png');
  link.download = `QR_${sanitizedName || 'restaurante'}.png`;
  document.body.appendChild(link); link.click(); link.remove();
}
