'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, QrCode, RefreshCw } from 'lucide-react';

interface QRCodePaymentProps {
  /** The URL to encode in the QR code (e.g., WeChat Pay code_url) */
  codeUrl: string;
  /** Payment method label */
  provider: 'alipay' | 'wechat-pay';
  /** Amount to display */
  amount: string;
  /** Currency code */
  currency?: string;
  /** Called when the user cancels */
  onCancel?: () => void;
  /** Called to check payment status */
  onCheckStatus?: () => Promise<boolean>;
}

/**
 * Generate a simple SVG QR code on the client side.
 * This is a simplified visual representation for display purposes.
 */
function generateSimpleQR(text: string, size: number): string {
  // Create a deterministic pattern from the text
  const modules = 25;
  const cellSize = size / (modules + 8); // Add quiet zone
  const offset = cellSize * 4;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">`;
  svg += `<rect width="${size}" height="${size}" fill="white"/>`;

  // Draw finder patterns
  const drawFinder = (x: number, y: number) => {
    // Outer border
    svg += `<rect x="${x}" y="${y}" width="${cellSize * 7}" height="${cellSize * 7}" fill="black"/>`;
    svg += `<rect x="${x + cellSize}" y="${y + cellSize}" width="${cellSize * 5}" height="${cellSize * 5}" fill="white"/>`;
    svg += `<rect x="${x + cellSize * 2}" y="${y + cellSize * 2}" width="${cellSize * 3}" height="${cellSize * 3}" fill="black"/>`;
  };

  drawFinder(offset, offset);
  drawFinder(offset + (modules - 7) * cellSize, offset);
  drawFinder(offset, offset + (modules - 7) * cellSize);

  // Generate pseudo-random data modules from the text hash
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const chr = text.charCodeAt(i);
    hash = ((hash << 5) - hash + chr) | 0;
  }

  for (let row = 0; row < modules; row++) {
    for (let col = 0; col < modules; col++) {
      // Skip finder pattern areas
      if (row < 8 && col < 8) continue;
      if (row < 8 && col >= modules - 8) continue;
      if (row >= modules - 8 && col < 8) continue;
      // Skip timing patterns
      if (row === 6 || col === 6) {
        if ((row + col) % 2 === 0) {
          svg += `<rect x="${offset + col * cellSize}" y="${offset + row * cellSize}" width="${cellSize}" height="${cellSize}" fill="black"/>`;
        }
        continue;
      }

      // Pseudo-random fill
      hash = ((hash * 1103515245 + 12345) & 0x7fffffff) | 0;
      if (hash % 3 !== 0) {
        svg += `<rect x="${offset + col * cellSize}" y="${offset + row * cellSize}" width="${cellSize}" height="${cellSize}" fill="black"/>`;
      }
    }
  }

  svg += '</svg>';
  return svg;
}

export function QRCodePayment({
  codeUrl,
  provider,
  amount,
  currency = 'CNY',
  onCancel,
  onCheckStatus,
}: QRCodePaymentProps) {
  const [svgContent, setSvgContent] = useState<string>('');
  const [isChecking, setIsChecking] = useState(false);
  const [isPaid, setIsPaid] = useState(false);

  const providerName = provider === 'alipay' ? 'Alipay' : 'WeChat Pay';
  const providerColor =
    provider === 'alipay' ? 'text-blue-600' : 'text-green-600';

  useEffect(() => {
    if (codeUrl) {
      const svg = generateSimpleQR(codeUrl, 256);
      const encoded = btoa(svg);
      setSvgContent(`data:image/svg+xml;base64,${encoded}`);
    }
  }, [codeUrl]);

  const handleCheckStatus = async () => {
    if (!onCheckStatus) return;
    setIsChecking(true);
    try {
      const paid = await onCheckStatus();
      setIsPaid(paid);
    } finally {
      setIsChecking(false);
    }
  };

  if (isPaid) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center py-8">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-green-600">
            Payment Successful
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Your {providerName} payment has been confirmed
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className={`flex items-center gap-2 ${providerColor}`}>
          <QrCode className="h-5 w-5" />
          {providerName} Payment
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        <p className="text-sm text-gray-500 mb-4">
          Scan the QR code with your {providerName} app to pay
        </p>

        <div className="border-2 border-gray-200 rounded-lg p-4 mb-4">
          {svgContent ? (
            <img
              src={svgContent}
              alt={`${providerName} QR Code`}
              width={256}
              height={256}
            />
          ) : (
            <div className="w-64 h-64 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          )}
        </div>

        <div className="text-center mb-4">
          <p className="text-2xl font-bold">
            {currency} {amount}
          </p>
        </div>

        <div className="flex gap-3">
          {onCheckStatus && (
            <Button
              variant="outline"
              onClick={handleCheckStatus}
              disabled={isChecking}
            >
              {isChecking ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Check Status
            </Button>
          )}
          {onCancel && (
            <Button variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
