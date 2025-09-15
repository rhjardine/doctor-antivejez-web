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

export type Channel = 'EMAIL' | 'SMS' | 'WHATSAPP';

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
  mediaFiles: File[];
}

const steps = [
  { id: 1, name: 'Seleccionar Contactos' },
  { id: 2, name: 'Crear Mensaje' },
  { id: 3, name: 'Revisar y Enviar' },
];

export default function NewCampaignWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedContacts, setSelectedContacts] = useState<Contact[]>([]);
  const [campaignConfig, setCampaignConfig] = useState<CampaignConfig>({
    channels: new Set<Channel>(['EMAIL']),
    message: '',
    mediaFiles: [],
    name: `Campaña ${new Date().toLocaleDateString('es-ES')}`,
  });
  const [isSending, setIsSending] = useState(false);

  const memoizedSetCampaignConfig = useCallback((value: React.SetStateAction<CampaignConfig>) => {
    setCampaignConfig(value);
  }, []);

  const goToNextStep = () => {
    if (currentStep === 1 && selectedContacts.length === 0) {
      toast.error('Debe seleccionar al menos un contacto para continuar.');
      return;
    }
    setCurrentStep((prev) => Math.min(prev + 1, steps.length));
  };

  const goToPrevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  const handleStepClick = (stepNumber: number) => {
    if (stepNumber === currentStep || isSending) return;
    if (stepNumber < currentStep) {
      setCurrentStep(stepNumber);
    } 
    else if (stepNumber === currentStep + 1) {
      goToNextStep();
    }
  };

  const handleCreateCampaign = async () => {
    setIsSending(true);
    toast.info('Encolando campaña...');

    let mediaUrls: string[] | null = null;
    
    if (campaignConfig.mediaFiles.length > 0) {
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      if (!cloudName) {
        toast.error('La configuración de Cloudinary no está completa.');
        setIsSending(false);
        return;
      }

      try {
        toast.info(`Subiendo ${campaignConfig.mediaFiles.length} archivo(s)...`);
        
        const uploadPromises = campaignConfig.mediaFiles.map(file => {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('upload_preset', 'ml_default');
          
          return fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
            method: 'POST',
            body: formData,
          }).then(response => {
            if (!response.ok) throw new Error(`Fallo la subida de ${file.name}`);
            return response.json();
          });
        });

        const uploadResults = await Promise.all(uploadPromises);
        mediaUrls = uploadResults.map(result => result.secure_url);
        
        toast.success('Todos los adjuntos subidos exitosamente.');

      } catch (error: any) {
        console.error("Error uploading attachments to Cloudinary:", error);
        toast.error(`Error al subir adjuntos: ${error.message}`);
        setIsSending(false);
        return;
      }
    }

    // ===== INICIO DE LA CORRECCIÓN =====
    // La Server Action 'sendCampaign' ahora siempre devuelve un objeto con 'success: true'.
    // Por lo tanto, eliminamos la rama 'else' que intentaba acceder a 'result.error'.
    try {
      const result = await sendCampaign(
        selectedContacts, 
        Array.from(campaignConfig.channels), 
        campaignConfig.message,
        campaignConfig.name,
        mediaUrls
      );

      // Mostramos siempre el mensaje de éxito que viene del servidor.
      toast.success(result.message);
      
      // Reseteamos el formulario.
      setCurrentStep(1);
      setSelectedContacts([]);
      setCampaignConfig({
        channels: new Set<Channel>(['EMAIL']), message: '', mediaFiles: [], name: `Campaña ${new Date().toLocaleDateString('es-ES')}`
      });

    } catch (error) {
      // Este bloque 'catch' manejará errores de red o si la Server Action falla catastróficamente.
      console.error("Error calling sendCampaign action:", error);
      toast.error("Error de conexión. No se pudo iniciar el envío.");
    } finally {
      setIsSending(false);
    }
    // ===== FIN DE LA CORRECCIÓN =====
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
        {steps.map((step, index) => {
          const isCompleted = currentStep > step.id;
          const isCurrent = currentStep === step.id;
          const canNavigate = (isCompleted || (currentStep + 1 === step.id)) && !isSending;

          return (
            <React.Fragment key={step.id}>
              <div 
                className={`flex flex-col items-center text-center ${canNavigate ? 'cursor-pointer' : 'cursor-default'}`}
                onClick={() => handleStepClick(step.id)}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                    isCurrent || isCompleted ? 'bg-primary border-primary text-white' : 'bg-white border-gray-300 text-gray-500'
                  } ${canNavigate ? 'hover:bg-primary/80' : ''}`}
                >
                  {step.id}
                </div>
                <p className={`mt-2 text-sm font-medium ${isCurrent || isCompleted ? 'text-primary' : 'text-gray-500'}`}>
                  {step.name}
                </p>
              </div>
              {index < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mt-[-20px] ${isCompleted ? 'bg-primary' : 'bg-gray-300'}`} />
              )}
            </React.Fragment>
          );
        })}
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
            disabled={isSending}
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