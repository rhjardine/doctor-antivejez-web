// components/campaigns/wizard/Step3ReviewAndSend.tsx
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mail, Smartphone, Paperclip } from 'lucide-react';
import { CampaignConfig, Contact } from '../NewCampaignWizard';

interface Step3ReviewAndSendProps {
  contacts: Contact[];
  config: CampaignConfig;
}

export default function Step3ReviewAndSend({ contacts, config }: Step3ReviewAndSendProps) {
  const channelCount = config.channels.size;
  const totalMessages = contacts.length * channelCount;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Paso 3: Revisar y Enviar</h2>
        <p className="text-gray-500 mt-1">Confirma los detalles de tu campaña. Una vez enviada, esta acción no se puede deshacer.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ===== INICIO DE LA CORRECCIÓN DE ESTILOS ===== */}
        <Card className="bg-card text-card-foreground">
          <CardHeader>
            <CardTitle>Resumen de la Campaña</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-300">Nombre:</span>
              <span className="font-medium">{config.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Destinatarios:</span>
              <span className="font-medium">{contacts.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Canales:</span>
              <div className="flex gap-2">
                {config.channels.has('EMAIL') && <Badge variant="secondary"><Mail className="w-3 h-3 mr-1"/>Email</Badge>}
                {config.channels.has('SMS') && <Badge variant="secondary"><Smartphone className="w-3 h-3 mr-1"/>SMS</Badge>}
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Total de Mensajes:</span>
              <span className="font-medium">{totalMessages}</span>
            </div>
            {config.mediaFile && (
              <div className="flex justify-between items-center pt-2 border-t border-gray-600">
                <span className="text-gray-300">Adjunto:</span>
                <div className="flex items-center gap-1 font-medium">
                  <Paperclip className="w-4 h-4" />
                  <span>{config.mediaFile.name}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card text-card-foreground">
          <CardHeader>
            <CardTitle>Cuerpo del Mensaje</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-slate-800 rounded-md border border-gray-600 max-h-48 overflow-y-auto">
              <p className="text-sm text-gray-200 whitespace-pre-wrap">{config.message || "(Sin mensaje)"}</p>
            </div>
          </CardContent>
        </Card>
        {/* ===== FIN DE LA CORRECCIÓN DE ESTILOS ===== */}
      </div>
    </div>
  );
}