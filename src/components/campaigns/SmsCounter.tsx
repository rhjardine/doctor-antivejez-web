// src/components/campaigns/SmsCounter.tsx
'use client';

import React from 'react';
import { MessageSquare, AlertTriangle } from 'lucide-react';

// Caracteres estándar del alfabeto GSM-7. Los caracteres extendidos se manejan por separado.
const gsm7Chars = "@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞ\x1bÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà";
const gsm7ExtendedChars = "^{}\\[~]|€";

interface SmsCounterProps {
  message: string;
}

export default function SmsCounter({ message }: SmsCounterProps) {
  let encoding: 'GSM-7' | 'UCS-2' = 'GSM-7';
  let charCount = 0;
  let segmentCount = 0;
  let charsPerSegment = 160;
  let charsPerNextSegment = 153;

  // Primero, determinamos la codificación
  for (let i = 0; i < message.length; i++) {
    const char = message[i];
    if (!gsm7Chars.includes(char) && !gsm7ExtendedChars.includes(char)) {
      encoding = 'UCS-2'; // Se detecta un caracter no GSM (tilde, emoji, etc.)
      break;
    }
  }

  // Luego, calculamos el número de caracteres y segmentos
  if (encoding === 'UCS-2') {
    charCount = message.length;
    charsPerSegment = 70;
    charsPerNextSegment = 67;
    if (charCount > charsPerSegment) {
      segmentCount = Math.ceil(charCount / charsPerNextSegment);
    } else {
      segmentCount = 1;
    }
  } else { // Codificación GSM-7
    for (let i = 0; i < message.length; i++) {
      const char = message[i];
      if (gsm7ExtendedChars.includes(char)) {
        charCount += 2; // Caracteres extendidos cuentan como dos
      } else {
        charCount += 1;
      }
    }
    charsPerSegment = 160;
    charsPerNextSegment = 153;
    if (charCount > charsPerSegment) {
      segmentCount = Math.ceil(charCount / charsPerNextSegment);
    } else {
      segmentCount = 1;
    }
  }
  
  // Si el mensaje está vacío, el conteo es cero
  if (message.length === 0) {
    charCount = 0;
    segmentCount = 0;
  }

  return (
    <div className="text-xs text-gray-500 mt-2 p-2 bg-slate-50 rounded-md border">
      <div className="flex justify-between items-center">
        <span>Caracteres: {charCount}</span>
        <div className="flex items-center gap-2">
          <MessageSquare className="w-3 h-3" />
          <span>Segmentos SMS: <span className="font-bold">{segmentCount}</span></span>
          <span className={`font-semibold ${encoding === 'UCS-2' ? 'text-orange-600' : 'text-green-600'}`}>
            ({encoding})
          </span>
        </div>
      </div>
      {encoding === 'UCS-2' && (
        <div className="mt-1 text-orange-600 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          <span>Contenido no estándar detectado (tildes, etc.). Límite por segmento reducido.</span>
        </div>
      )}
      {segmentCount > 2 && (
         <div className="mt-1 text-yellow-600 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          <span>Mensaje largo. Se facturarán {segmentCount} SMS por destinatario.</span>
        </div>
      )}
    </div>
  );
}