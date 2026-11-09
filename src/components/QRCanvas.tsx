import React, { useEffect, useRef } from 'react';
import { renderPrintableQR } from '../utils/qrExporter';

interface QRCanvasProps {
  value: string;
  size?: number;
  title?: string;
  className?: string;
}

export const QRCanvas: React.FC<QRCanvasProps> = ({ value, size = 200, title = '', className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const target = canvasRef.current;
    if (!target || !value) return;
    // Render separately so a slower previous edit cannot overwrite the latest title.
    let cancelled = false;
    const buffer = document.createElement('canvas');
    renderPrintableQR(buffer, value, size, title).then(() => {
      if (cancelled) return;
      target.width = buffer.width; target.height = buffer.height;
      target.getContext('2d')?.drawImage(buffer, 0, 0);
    }).catch(console.error);
    return () => { cancelled = true; };
  }, [value, size, title]);
  return <canvas ref={canvasRef} width={size} height={size} className={`bg-white max-w-full h-auto ${className}`} />;
};
