// START OF FILE: src/components/campaigns/CampaignDetails.tsx

import { getCampaignDetails } from '@/lib/actions/campaigns.actions';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Mail, Smartphone, MessageSquare, CheckCircle, XCircle, Eye, AlertTriangle, FileText } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';

const channelIcons: Record<string, React.ElementType> = {
  EMAIL: Mail,
  SMS: Smartphone,
  WHATSAPP: MessageSquare,
};

const statusIcons: Record<string, React.ElementType> = {
  Sent: CheckCircle, // Corresponde al estado 'Sent' de tu lógica de envío
  Failed: XCircle,
};

const statusColors: Record<string, string> = {
  Sent: 'text-green-600',
  Failed: 'text-red-600',
};

export default async function CampaignDetails({ campaignId }: { campaignId: string }) {
  // Obtenemos el objeto de respuesta completo
  const response = await getCampaignDetails(campaignId);

  // ===== INICIO DE LA CORRECCIÓN DE TIPOS =====
  // Verificamos si la operación fue exitosa y si existen datos.
  if (!response.success || !response.data) {
    return (
      <Button variant="outline" disabled>
        <XCircle className="w-4 h-4 mr-2" />
        Detalles no disponibles
      </Button>
    );
  }
  // A partir de aquí, TypeScript sabe que 'response.data' existe y tiene el tipo correcto.
  const campaign = response.data;
  // ===== FIN DE LA CORRECCIÓN DE TIPOS =====

  const totalProcessed = campaign.sentCount + campaign.failedCount;
  const progress = campaign.totalContacts > 0 ? (totalProcessed / campaign.totalContacts) * 100 : 0;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Eye className="w-4 h-4 mr-2" />
          Ver Detalles
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{campaign.name}</DialogTitle>
          <DialogDescription>
            Campaña enviada el {new Date(campaign.createdAt).toLocaleDateString('es-ES')}
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-grow pr-6 -mr-6">
          <div className="space-y-6 py-4">
            <Card>
              <CardHeader>
                <CardTitle>Resumen de la Campaña</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-sm text-gray-500">Estado</p>
                    <Badge>{campaign.status}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Contactos</p>
                    <p className="text-2xl font-bold">{campaign.totalContacts}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Exitosos</p>
                    <p className="text-2xl font-bold text-green-600">{campaign.sentCount}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Fallidos</p>
                    <p className="text-2xl font-bold text-red-600">{campaign.failedCount}</p>
                  </div>
                </div>
                <div>
                  <Label>Progreso General ({totalProcessed} de {campaign.totalContacts})</Label>
                  <Progress value={progress} className="w-full mt-1" />
                </div>
                <div>
                  <Label>Cuerpo del Mensaje</Label>
                  <div className="p-4 bg-slate-50 rounded-md border mt-1 max-h-40 overflow-y-auto">
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
                      <TableHead className="text-center">Canal</TableHead>
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
                          <TableCell className="flex justify-center">
                            {ChannelIcon && <ChannelIcon className="w-5 h-5 text-gray-500" />}
                          </TableCell>
                          <TableCell>
                            <div className={`flex items-center gap-2 ${color}`}>
                              {Icon && <Icon className="w-4 h-4" />}
                              <span>{msg.status}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-gray-500">
                            {msg.status === 'Failed' 
                              ? <span className='flex items-center'><AlertTriangle className='w-3 h-3 mr-1 text-orange-500'/> {msg.error || 'Error desconocido'}</span>
                              : `ID: ${msg.providerId || 'N/A'}`}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

// END OF FILE: src/components/campaigns/CampaignDetails.tsx