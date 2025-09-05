// app/dashboard/campaigns/page.tsx
'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Send, History } from 'lucide-react';
import NewCampaignWizard from '@/components/campaigns/NewCampaignWizard';
import CampaignHistory from '@/components/campaigns/CampaignHistory';

export default function CampaignsPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-800">
            Gestión de Campañas
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Crea, gestiona y analiza tus campañas de comunicación multicanal.
          </p>
        </header>

        <Tabs defaultValue="new-campaign" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:w-[400px] mb-6 bg-slate-100 p-1 rounded-lg">
            <TabsTrigger 
              value="new-campaign"
              className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-md"
            >
              <Send className="w-4 h-4 mr-2" />
              Nueva Campaña
            </TabsTrigger>
            <TabsTrigger 
              value="history"
              className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-md"
            >
              <History className="w-4 h-4 mr-2" />
              Historial
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="new-campaign">
            <NewCampaignWizard />
          </TabsContent>

          <TabsContent value="history">
            <CampaignHistory />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}