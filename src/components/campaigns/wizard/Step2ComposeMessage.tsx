// components/campaigns/wizard/Step2ComposeMessage.tsx
'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Mail, Smartphone, Paperclip, X } from 'lucide-react';
import { CampaignConfig, Channel } from '../NewCampaignWizard';

interface Step2ComposeMessageProps {
  campaignConfig: CampaignConfig;
  setCampaignConfig: React.Dispatch<React.SetStateAction<CampaignConfig>>;
}

export default function Step2ComposeMessage({ campaignConfig, setCampaignConfig }: Step2ComposeMessageProps) {
  
  const handleChannelChange = (channel: Channel, checked: boolean) => {
    setCampaignConfig(prev => {
      const newChannels = new Set(prev.channels);
      if (checked) {
        newChannels.add(channel);
      } else {
        newChannels.delete(channel);
      }
      return { ...prev, channels: newChannels };
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCampaignConfig(prev => ({ ...prev, mediaFile: e.target.files![0] }));
    }
  };

  const clearFile = () => {
    setCampaignConfig(prev => ({ ...prev, mediaFile: null }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Paso 2: Crear Mensaje</h2>
        <p className="text-gray-500 mt-1">Redacta el contenido, elige los canales de envío y adjunta archivos si es necesario.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Columna Izquierda: Canales y Nombre */}
        <div className="space-y-6">
          <div>
            <Label className="font-semibold">Canales de Envío</Label>
            <div className="mt-2 space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="channel-email" 
                  checked={campaignConfig.channels.has('EMAIL')}
                  onCheckedChange={(checked) => handleChannelChange('EMAIL', !!checked)}
                />
                <Label htmlFor="channel-email" className="flex items-center gap-2 cursor-pointer">
                  <Mail className="w-5 h-5 text-gray-600" /> Email
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="channel-sms" 
                  checked={campaignConfig.channels.has('SMS')}
                  onCheckedChange={(checked) => handleChannelChange('SMS', !!checked)}
                />
                <Label htmlFor="channel-sms" className="flex items-center gap-2 cursor-pointer">
                  <Smartphone className="w-5 h-5 text-gray-600" /> SMS
                </Label>
              </div>
            </div>
          </div>
          <div>
            <Label htmlFor="campaign-name" className="font-semibold">Nombre de la Campaña (Interno)</Label>
            <Input 
              id="campaign-name"
              value={campaignConfig.name}
              onChange={(e) => setCampaignConfig(prev => ({ ...prev, name: e.target.value }))}
              className="mt-2"
            />
          </div>
        </div>

        {/* Columna Derecha: Mensaje y Adjunto */}
        <div className="space-y-6">
          <div>
            <Label htmlFor="message-body" className="font-semibold">Cuerpo del Mensaje</Label>
            <Textarea 
              id="message-body"
              rows={8}
              placeholder="Escribe tu mensaje aquí..."
              value={campaignConfig.message}
              onChange={(e) => setCampaignConfig(prev => ({ ...prev, message: e.target.value }))}
              className="mt-2"
            />
          </div>
          <div>
            <Label className="font-semibold">Adjunto (Opcional)</Label>
            {campaignConfig.mediaFile ? (
              <div className="mt-2 flex items-center justify-between bg-slate-100 p-2 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Paperclip size={16} />
                  <span>{campaignConfig.mediaFile.name}</span>
                </div>
                <Button onClick={clearFile} variant="ghost" size="icon" className="h-6 w-6">
                  <X size={16} />
                </Button>
              </div>
            ) : (
              <div className="mt-2">
                <Input id="file-upload" type="file" onChange={handleFileChange} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}