// components/campaigns/NewCampaignWizard.tsx
'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

import Step1SelectContacts from './wizard/Step1SelectContacts';
import Step2ComposeMessage from './wizard/Step2ComposeMessage';
import Step3ReviewAndSend from './wizard/Step3ReviewAndSend';

import { sendCampaign } from '@/lib/actions/campaigns.actions';

export type Channel = 'EMAIL' | 'SMS';

export interface Contact {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  origin: 'RENDER PG' | 'GODADDY MYSQL';
  consent: Channel[];
}

export interface CampaignConfig {
  name: string;
  channels: Set<Channel>;
  message: string;
  mediaFile: File | null;
}

const steps = [
  { id: 1, name: 'Seleccionar Contactos', description: 'Elige los destinatarios para tu campaña.' },
  { id: 2, name: 'Crear Mensaje', description: 'Redacta el contenido y elige los canales.' },
  { id: 3, name: 'Revisar y Enviar', description: 'Confirma los detalles antes de lanzar.' },
];

export default function NewCampaignWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedContacts, setSelectedContacts] = useState<Contact[]>([]);
  const [campaignConfig, setCampaignConfig] = useState<CampaignConfig>({
    channels: new Set<Channel>(['EMAIL']),
    message: '',
    mediaFile: null,
    name: `Campaña ${new Date().toLocaleDateString('es-ES')}`,
  });
  const [isSending, setIsSending] = useState(false);

  const memoizedSetCampaignConfig = useCallback((value: React.SetStateAction<CampaignConfig>) => {
    setCampaignConfig(value);
  }, []);

  const goToNextStep = () => setCurrentStep((prev) => Math.min(prev + 1, steps.length));
  const goToPrevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  const handleCreateCampaign = async () => {
    setIsSending(true);
    toast.info('Iniciando envío de campaña...');

    // ===== INICIO DE LA CORRECCIÓN =====
    // Se pasa el 'campaignConfig.name' a la Server Action.
    // Este valor se usará como el asunto (subject) del correo electrónico.
    const result = await sendCampaign(
      selectedContacts, 
      Array.from(campaignConfig.channels), 
      campaignConfig.message,
      campaignConfig.name
    );
    // ===== FIN DE LA CORRECCIÓN =====

    if (result.success) {
      toast.success(result.message || 'Campaña enviada exitosamente.');
      // Resetear estado para una nueva campaña
      setCurrentStep(1);
      setSelectedContacts([]);
      setCampaignConfig({
        channels: new Set<Channel>(['EMAIL']), message: '', mediaFile: null, name: `Campaña ${new Date().toLocaleDateString('es-ES')}`
      });
    } else {
      toast.error(result.error || 'Ocurrió un error al enviar la campaña.');
    }

    setIsSending(false);
  };

  const StepsComponent = () => {
    switch (currentStep) {
      case 1:
        return <Step1SelectContacts selectedContacts={selectedContacts} setSelectedContacts={setSelectedContacts} />;
      case 2:
        return <Step2ComposeMessage campaignConfig={campaignConfig} setCampaignConfig={memoizedSetCampaignConfig} />;
      case 3:
        return <Step3ReviewAndSend contacts={selectedContacts} config={campaignConfig} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-center space-x-4 md:space-x-8">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center text-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                  currentStep >= step.id ? 'bg-primary border-primary text-white' : 'bg-white border-gray-300 text-gray-500'
                }`}
              >
                {step.id}
              </div>
              <p className={`mt-2 text-sm font-medium ${currentStep >= step.id ? 'text-primary' : 'text-gray-500'}`}>
                {step.name}
              </p>
            </div>
            {index < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mt-[-20px] ${currentStep > index + 1 ? 'bg-primary' : 'bg-gray-300'}`} />
            )}
          </React.Fragment>
        ))}
      </div>
      
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border min-h-[400px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <StepsComponent />
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex justify-between items-center">
        <Button 
          variant="outline" 
          onClick={goToPrevStep} 
          disabled={currentStep === 1 || isSending}
        >
          Anterior
        </Button>
        {currentStep < steps.length ? (
          <Button 
            onClick={goToNextStep} 
            disabled={currentStep === 1 && selectedContacts.length === 0}
            className="bg-primary text-white hover:bg-primary/90"
          >
            Siguiente
          </Button>
        ) : (
          <Button 
            onClick={handleCreateCampaign} 
            disabled={isSending || selectedContacts.length === 0 || campaignConfig.message.trim() === ''} 
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {isSending ? 'Enviando...' : 'Confirmar y Enviar Campaña'}
          </Button>
        )}
      </div>
    </div>
  );
}