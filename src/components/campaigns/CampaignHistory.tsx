// START OF FILE: src/components/campaigns/CampaignHistory.tsx

import { getCampaignHistory } from '@/lib/actions/campaigns.actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Mail, Smartphone, MessageSquare, List } from 'lucide-react';
import CampaignDetails from './CampaignDetails';

const statusConfig: Record<string, { label: string; className: string }> = {
  IN_PROGRESS: { label: 'En Progreso', className: 'bg-blue-100 text-blue-800 border-blue-200' },
  COMPLETED: { label: 'Completada', className: 'bg-green-100 text-green-800 border-green-200' },
  COMPLETED_WITH_ERRORS: { label: 'Con Errores', className: 'bg-orange-100 text-orange-800 border-orange-200' },
  FAILED: { label: 'Fallida', className: 'bg-red-100 text-red-800 border-red-200' },
};

const channelIcons: Record<string, React.ElementType> = {
  EMAIL: Mail,
  SMS: Smartphone,
  WHATSAPP: MessageSquare,
};

export default async function CampaignHistory() {
  // Obtenemos el objeto de respuesta completo
  const response = await getCampaignHistory();

  // ===== INICIO DE LA CORRECCIÓN DE TIPOS =====
  // Verificamos si la operación fue exitosa y si existen datos.
  // Si no, mostramos el estado vacío.
  if (!response.success || !response.data || response.data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No hay campañas</CardTitle>
          <CardDescription>
            Aún no se ha enviado ninguna campaña.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center p-12 text-center">
          <List className="h-16 w-16 text-gray-300 mb-4" />
          <p className="text-gray-500">
            Los resultados de tus envíos aparecerán aquí.
          </p>
        </CardContent>
      </Card>
    );
  }
  // A partir de aquí, TypeScript sabe que 'response.data' es un array de campañas.
  const campaigns = response.data;
  // ===== FIN DE LA CORRECCIÓN DE TIPOS =====

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historial de Campañas</CardTitle>
        <CardDescription>Visualiza el estado y las métricas de tus campañas. Haz clic en "Ver Detalles" para más información.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Canales</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Progreso</TableHead>
              <TableHead className="text-right">Fecha</TableHead>
              <TableHead className="text-center">Acción</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {campaigns.map(campaign => {
              const totalProcessed = campaign.sentCount + campaign.failedCount;
              const progress = campaign.totalContacts > 0 ? (totalProcessed / campaign.totalContacts) * 100 : 0;
              const statusInfo = statusConfig[campaign.status] || { label: campaign.status, className: 'bg-gray-100 text-gray-800' };
              return (
                <TableRow key={campaign.id} className="hover:bg-slate-50">
                  <TableCell className="font-medium">{campaign.name}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {campaign.channels.map(channel => {
                         const Icon = channelIcons[channel];
                         return Icon ? <Icon key={channel} className="w-5 h-5 text-gray-500" title={channel} /> : null;
                      })}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusInfo.className}>{statusInfo.label}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                       <Progress value={progress} className="w-[60%]" />
                       <span className="text-xs text-gray-600">{Math.round(progress)}%</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {totalProcessed} / {campaign.totalContacts} procesados
                    </p>
                  </TableCell>
                  <TableCell className="text-right">{new Date(campaign.createdAt).toLocaleDateString('es-ES')}</TableCell>
                  <TableCell className="text-center">
                    <CampaignDetails campaignId={campaign.id} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// END OF FILE: src/components/campaigns/CampaignHistory.tsx