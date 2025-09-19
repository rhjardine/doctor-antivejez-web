'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Mail, Smartphone, MessageSquare, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

// Tipos de datos basados en nuestro diseño de schema
type Channel = 'EMAIL' | 'SMS' | 'WHATSAPP';
interface CampaignMessage {
  id: string;
  contactName: string;
  channel: Channel;
  status: 'Sent' | 'Failed' | 'Delivered';
  error?: string;
  sentAt: string;
}
interface CampaignDetailsData {
  id: string;
  name: string;
  messageBody: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'FAILED';
  channels: Channel[];
  totalContacts: number;
  sentCount: number;
  failedCount: number;
  createdAt: string;
  messages: CampaignMessage[];
}

// Datos simulados para construir la UI
const mockCampaignDetails: CampaignDetailsData = {
  id: 'cam_123',
  name: 'Promoción Bienestar Septiembre',
  messageBody: 'Hola {{1}},\n\nTe recordamos nuestra promoción especial de bienestar para el mes de septiembre. Agenda tu evaluación de vitalidad y recibe un 20% de descuento.',
  status: 'COMPLETED',
  channels: ['EMAIL', 'SMS'],
  totalContacts: 150,
  sentCount: 148,
  failedCount: 2,
  createdAt: new Date().toISOString(),
  messages: [
    { id: 'msg_1', contactName: 'Ana García', channel: 'EMAIL', status: 'Delivered', sentAt: new Date().toISOString() },
    { id: 'msg_2', contactName: 'Ana García', channel: 'SMS', status: 'Delivered', sentAt: new Date().toISOString() },
    { id: 'msg_3', contactName: 'Carlos Rodríguez', channel: 'EMAIL', status: 'Failed', error: 'Invalid email address', sentAt: new Date().toISOString() },
    { id: 'msg_4', contactName: 'Carlos Rodríguez', channel: 'SMS', status: 'Delivered', sentAt: new Date().toISOString() },
    // ... más mensajes
  ],
};

const channelIcons: Record<Channel, React.ElementType> = {
  EMAIL: Mail,
  SMS: Smartphone,
  WHATSAPP: MessageSquare,
};

const statusIcons: Record<CampaignMessage['status'], React.ElementType> = {
  Delivered: CheckCircle,
  Sent: CheckCircle,
  Failed: XCircle,
};

const statusColors: Record<CampaignMessage['status'], string> = {
  Delivered: 'text-green-600',
  Sent: 'text-blue-600',
  Failed: 'text-red-600',
};

export default function CampaignDetails({ campaignId }: { campaignId: string }) {
  // En el futuro, aquí haremos una llamada a una Server Action para obtener los datos reales
  const campaign = mockCampaignDetails;
  const progress = campaign.totalContacts > 0 ? ((campaign.sentCount + campaign.failedCount) / campaign.totalContacts) * 100 : 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{campaign.name}</CardTitle>
          <CardDescription>
            Campaña enviada el {new Date(campaign.createdAt).toLocaleDateString('es-ES')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-sm text-gray-500">Estado</p>
              <Badge>{campaign.status}</Badge>
            </div>
            <div>
              <p className="text-sm text-gray-500">Contactos Totales</p>
              <p className="text-2xl font-bold">{campaign.totalContacts}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Envíos Exitosos</p>
              <p className="text-2xl font-bold text-green-600">{campaign.sentCount}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Envíos Fallidos</p>
              <p className="text-2xl font-bold text-red-600">{campaign.failedCount}</p>
            </div>
          </div>
          <div>
            <Label>Progreso General</Label>
            <Progress value={progress} className="w-full mt-1" />
          </div>
          <div>
            <Label>Cuerpo del Mensaje</Label>
            <div className="p-4 bg-slate-50 rounded-md border mt-1">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{campaign.messageBody}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Registro de Envíos Individuales</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contacto</TableHead>
                <TableHead>Canal</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Detalles</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaign.messages.map((msg) => {
                const Icon = statusIcons[msg.status];
                const color = statusColors[msg.status];
                const ChannelIcon = channelIcons[msg.channel];
                return (
                  <TableRow key={msg.id}>
                    <TableCell className="font-medium">{msg.contactName}</TableCell>
                    <TableCell>
                      <ChannelIcon className="w-5 h-5 text-gray-500" />
                    </TableCell>
                    <TableCell>
                      <div className={`flex items-center gap-2 ${color}`}>
                        <Icon className="w-4 h-4" />
                        <span>{msg.status}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-gray-500">
                      {msg.status === 'Failed' ? msg.error : `Enviado a las ${new Date(msg.sentAt).toLocaleTimeString()}`}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}