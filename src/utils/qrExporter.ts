import QRCode from 'qrcode';

export interface DownloadQROptions {
  url: string;
  restaurantName: string;
  size?: number;
}

export const downloadRestaurantQRPNG = async ({
  url,
  restaurantName,
  size = 1400, // Alta resolución para imprenta (1400x1400px)
}: DownloadQROptions): Promise<void> => {
  try {
    const dataUrl = await QRCode.toDataURL(url, {
      width: size,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'H',
    });

    const sanitizedName = restaurantName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');

    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `QR_${sanitizedName || 'restaurante'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Error al generar la descarga del QR en PNG:', error);
  }
};
