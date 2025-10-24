'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import Image from 'next/image';
import { FaCamera, FaArrowLeft, FaSave, FaUser, FaMapMarkerAlt, FaBriefcaseMedical, FaTimes, FaCheck, FaRedo, FaUpload } from 'react-icons/fa';

import { createPatient } from '@/lib/actions/patients.actions';
import { patientSchema, PatientFormData } from '@/utils/validation';
import { BLOOD_TYPES, MARITAL_STATUS, NATIONALITIES } from '@/lib/constants';
import { GENDER_OPTIONS } from '@/types/biophysics';
import { calculateAge } from '@/utils/date';

// --- Componente Reutilizable para Captura de Imágenes (SIN CAMBIOS) ---
// Este componente está bien diseñado y se mantiene intacto.
interface ImageUploaderProps {
  onImageCapture: (imageDataUrl: string) => void;
  onClose: () => void;
}

function ImageUploader({ onImageCapture, onClose }: ImageUploaderProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        setError("No se pudo acceder a la cámara. Por favor, verifica los permisos en tu navegador.");
      }
    };
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]); // Se añade 'stream' para re-intentar si cambia

  const handleTakePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      context?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
      const dataUrl = canvas.toDataURL('image/png');
      setCapturedImage(dataUrl);
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setError(null);
    const startCamera = async () => {
        try {
          const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
          setStream(mediaStream);
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
          }
        } catch (err) {
          setError("No se pudo acceder a la cámara.");
        }
      };
      startCamera();
  };

  const handleConfirm = () => {
    if (capturedImage) {
      onImageCapture(capturedImage);
      onClose();
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        onImageCapture(result);
        onClose();
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-xl shadow-2xl p-6 max-w-lg w-full text-center relative">
        <h3 className="text-xl font-bold text-primary-dark mb-4">Capturar Foto del Paciente</h3>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><FaTimes size={20}/></button>
        <div className="relative w-full aspect-video bg-gray-200 rounded-lg overflow-hidden mb-4">
          {error && !capturedImage && <div className="flex items-center justify-center h-full text-red-500 p-4">{error}</div>}
          {!capturedImage ? (
            <video ref={videoRef} autoPlay playsInline className={`w-full h-full object-cover ${error ? 'hidden' : ''}`}></video>
          ) : (
            <Image src={capturedImage} alt="Captura del paciente" layout="fill" objectFit="cover" />
          )}
          <canvas ref={canvasRef} className="hidden"></canvas>
        </div>
        <div className="flex justify-center gap-4">
          {!capturedImage ? (
            <>
              <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="image/png, image/jpeg, image/webp" />
              <button onClick={handleUploadClick} className="btn-secondary flex-grow flex items-center justify-center gap-2"><FaUpload /> Adjuntar Archivo</button>
              <button onClick={handleTakePhoto} className="btn-primary flex-grow flex items-center justify-center gap-2" disabled={!!error}><FaCamera /> Tomar Foto</button>
            </>
          ) : (
            <>
              <button onClick={handleRetake} className="btn-secondary flex-grow flex items-center justify-center gap-2"><FaRedo /> Tomar de Nuevo</button>
              <button onClick={handleConfirm} className="btn-success flex-grow flex items-center justify-center gap-2"><FaCheck /> Confirmar Foto</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Página Principal Refactorizada con react-hook-form ---
export default function NuevoPacientePage() {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploaderOpen, setIsUploaderOpen] = useState(false);
  const [chronologicalAge, setChronologicalAge] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    setError,
  } = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      nationality: 'Venezolano',
      historyDate: new Date().toISOString().split('T')[0],
      gender: 'MASCULINO',
      country: 'Venezuela',
      photo: '',
      observations: '',
    },
  });

  // Observar campos para lógica dinámica
  const birthDateValue = watch('birthDate');
  const photoValue = watch('photo');

  useEffect(() => {
    if (birthDateValue) {
      setChronologicalAge(calculateAge(new Date(birthDateValue)));
    } else {
      setChronologicalAge(null);
    }
  }, [birthDateValue]);

  const handleImageCapture = (imageDataUrl: string) => {
    setValue('photo', imageDataUrl, { shouldValidate: true, shouldDirty: true });
  };

  const onSubmit: SubmitHandler<PatientFormData> = async (data) => {
    setIsSubmitting(true);

    if (sessionStatus !== 'authenticated' || !session?.user?.id) {
      toast.error('Error de autenticación. No se pudo identificar al usuario.');
      setIsSubmitting(false);
      return;
    }

    try {
      const userId = session.user.id;
      const result = await createPatient({ ...data, userId });

      if (result.success && result.patient) {
        toast.success("Se ha guardado la Historia");
        router.push(`/historias/${result.patient.id}?tab=biofisica`);
      } else {
        if (result.error?.includes('identificación')) {
            setError('identification', { type: 'manual', message: result.error });
            toast.error(result.error);
        } else {
            toast.error(result.error || 'Error al crear paciente');
        }
      }
    } catch (error) {
      console.error('Error en handleSubmit:', error);
      toast.error('Ocurrió un error al crear el paciente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (sessionStatus === 'loading') {
    return <div className="flex items-center justify-center h-96"><div className="loader"></div></div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn">
      {isUploaderOpen && <ImageUploader onImageCapture={handleImageCapture} onClose={() => setIsUploaderOpen(false)} />}
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Nueva Historia Clínica</h1>
          <p className="text-gray-600 mt-1">Registra un nuevo paciente en el sistema</p>
        </div>
        <button onClick={() => router.push('/historias')} className="btn-light-blue"><FaArrowLeft /><span>Volver</span></button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Card de Información Personal con UI y validación mejorada */}
        <div className="card">
          <h2 className="form-section-header"><FaUser />Información Personal</h2>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1 flex flex-col items-center">
              <label className="label self-start">Foto</label>
              <div onClick={() => setIsUploaderOpen(true)} className="w-40 h-40 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors bg-gray-50 overflow-hidden">
                {photoValue ? (
                  <Image src={photoValue} alt="Foto del paciente" width={160} height={160} className="object-cover w-full h-full" />
                ) : (
                  <><FaCamera className="text-3xl text-gray-400 mb-2" /><span className="text-sm text-gray-500 text-center">Tomar/Adjuntar Foto</span></>
                )}
              </div>
            </div>
            <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
              <div>
                <label className="label">N° Control</label>
                <input type="text" value="Automático" readOnly className="input-disabled" />
              </div>
              <div>
                <label className="label">Identificación *</label>
                <input {...register('identification')} className={`input ${errors.identification ? 'input-error' : ''}`} placeholder="Ej: 12345678" />
                {errors.identification && <p className="error-message">{errors.identification.message}</p>}
              </div>
              <div>
                <label className="label">Nacionalidad *</label>
                <select {...register('nationality')} className="input">
                  {NATIONALITIES.map(nat => <option key={nat} value={nat}>{nat}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Fecha Historia *</label>
                <input type="date" {...register('historyDate')} className="input" />
              </div>
              <div className="md:col-span-2">
                <label className="label">Apellidos *</label>
                <input {...register('lastName')} className={`input ${errors.lastName ? 'input-error' : ''}`} placeholder="Apellidos completos" />
                {errors.lastName && <p className="error-message">{errors.lastName.message}</p>}
              </div>
              <div className="md:col-span-3">
                <label className="label">Nombres *</label>
                <input {...register('firstName')} className={`input ${errors.firstName ? 'input-error' : ''}`} placeholder="Nombres completos" />
                {errors.firstName && <p className="error-message">{errors.firstName.message}</p>}
              </div>
              <div>
                <label className="label">Fecha Nacimiento *</label>
                <input type="date" {...register('birthDate')} className="input" />
              </div>
              <div>
                <label className="label">Edad Cronológica</label>
                <input type="text" value={chronologicalAge !== null ? `${chronologicalAge} años` : ''} readOnly className="input-disabled" />
              </div>
              <div>
                <label className="label">Género *</label>
                <select {...register('gender')} className="input">
                  {GENDER_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="label">Lugar Nacimiento *</label>
                <input {...register('birthPlace')} className="input" placeholder="Ciudad, País" />
              </div>
              <div>
                <label className="label">Teléfono *</label>
                <input type="tel" {...register('phone')} className="input" placeholder="+58 414xxxx" />
              </div>
              <div>
                <label className="label">Estado Civil *</label>
                <select {...register('maritalStatus')} className="input">
                  <option value="">Seleccionar...</option>
                  {MARITAL_STATUS.map(status => <option key={status} value={status}>{status}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Profesión *</label>
                <input {...register('profession')} className="input" placeholder="Ej: Ingeniero, Médico..." />
              </div>
            </div>
          </div>
        </div>
        
        <div className="card">
          <h2 className="form-section-header"><FaMapMarkerAlt />Dirección</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="label">País *</label>
              <input {...register('country')} className="input" />
            </div>
            <div>
              <label className="label">Estado *</label>
              <input {...register('state')} className="input" placeholder="Estado/Provincia" />
            </div>
            <div>
              <label className="label">Ciudad *</label>
              <input {...register('city')} className="input" placeholder="Ciudad" />
            </div>
            <div className="md:col-span-3">
              <label className="label">Dirección *</label>
              <input {...register('address')} className="input" placeholder="Dirección completa" />
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="form-section-header"><FaBriefcaseMedical />Información Médica</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="label">Grupo Sanguíneo *</label>
              <select {...register('bloodType')} className="input">
                <option value="">Seleccionar...</option>
                {BLOOD_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
            <div>
              <label className="label">E-mail *</label>
              <input type="email" {...register('email')} className={`input ${errors.email ? 'input-error' : ''}`} placeholder="ejemplo@dominio.com" />
              {errors.email && <p className="error-message">{errors.email.message}</p>}
            </div>
            <div className="md:col-span-2">
              <label className="label">Observaciones Generales</label>
              <textarea {...register('observations')} rows={4} placeholder="Notas adicionales sobre el paciente..." className="input resize-y" />
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button type="button" onClick={() => router.push('/historias')} className="btn-secondary">Cancelar</button>
          <button type="submit" disabled={isSubmitting || sessionStatus !== 'authenticated'} className="btn-primary"><FaSave /><span>{isSubmitting ? 'Guardando...' : 'Guardar Historia'}</span></button>
        </div>
      </form>
    </div>
  );
}