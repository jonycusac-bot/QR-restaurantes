import React, { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

interface QRCanvasProps {
  value: string;
  size?: number;
  className?: string;
}

export const QRCanvas: React.FC<QRCanvasProps> = ({
  value,
  size = 200,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !value) return;

    QRCode.toCanvas(
      canvasRef.current,
      value,
      {
        width: size,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
        errorCorrectionLevel: 'H',
      },
      (error) => {
        if (error) {
          console.error('Error generating QR:', error);
        }
      }
    );
  }, [value, size]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className={`rounded-lg bg-white p-1.5 ${className}`}
    />
  );
};
