'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { createPatient } from '@/lib/actions/patients.actions';
import { toast } from 'sonner';
import { FaCamera, FaArrowLeft, FaSave, FaUser, FaMapMarkerAlt, FaBriefcaseMedical, FaTimes, FaCheck, FaRedo } from 'react-icons/fa';
import { BLOOD_TYPES, MARITAL_STATUS, NATIONALITIES } from '@/lib/constants';
import { GENDER_OPTIONS } from '@/types/biophysics';
import { calculateAge } from '@/utils/date';
import { Gender } from '@prisma/client';
import Image from 'next/image';

// --- Componente Reutilizable para Carga de Imágenes ---
interface ImageUploaderProps {
  onImageCapture: (imageDataUrl: string) => void;
  onClose: () => void;
}

function ImageUploader({ onImageCapture, onClose }: ImageUploaderProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
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
  }, [stream]);

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
      }
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
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
  };

  const handleConfirm = () => {
    if (capturedImage) {
      onImageCapture(capturedImage);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-xl shadow-2xl p-6 max-w-lg w-full text-center relative">
        <h3 className="text-xl font-bold text-primary-dark mb-4">Capturar Foto del Paciente</h3>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><FaTimes size={20}/></button>
        
        <div className="relative w-full aspect-video bg-gray-200 rounded-lg overflow-hidden mb-4">
          {error && <div className="flex items-center justify-center h-full text-red-500">{error}</div>}
          {!capturedImage ? (
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover"></video>
          ) : (
            <Image src={capturedImage} alt="Captura del paciente" layout="fill" objectFit="cover" />
          )}
          <canvas ref={canvasRef} className="hidden"></canvas>
        </div>

        <div className="flex justify-center gap-4">
          {!capturedImage ? (
            <button onClick={handleTakePhoto} className="btn-primary flex-grow flex items-center justify-center gap-2" disabled={!!error}>
              <FaCamera /> Tomar Foto
            </button>
          ) : (
            <>
              <button onClick={handleRetake} className="btn-secondary flex-grow flex items-center justify-center gap-2">
                <FaRedo /> Tomar de Nuevo
              </button>
              <button onClick={handleConfirm} className="btn-success flex-grow flex items-center justify-center gap-2">
                <FaCheck /> Confirmar Foto
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}


// --- Página Principal Modificada ---
type NewPatientFormData = {
  photo: string;
  nationality: string;
  identification: string;
  historyDate: string;
  lastName: string;
  firstName: string;
  birthDate: string;
  gender: Gender;
  birthPlace: string;
  phone: string;
  maritalStatus: string;
  profession: string;
  country: string;
  state: string;
  city: string;
  address: string;
  bloodType: string;
  email: string;
  observations: string;
};

export default function NuevoPacientePage() {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const [loading, setLoading] = useState(false);
  const [isUploaderOpen, setIsUploaderOpen] = useState(false);
  
  const [formData, setFormData] = useState<NewPatientFormData>({
    photo: '',
    nationality: 'Venezolano',
    identification: '',
    historyDate: new Date().toISOString().split('T')[0],
    lastName: '',
    firstName: '',
    birthDate: '',
    gender: 'MASCULINO',
    birthPlace: '',
    phone: '',
    maritalStatus: '',
    profession: '',
    country: 'Venezuela',
    state: '',
    city: '',
    address: '',
    bloodType: '',
    email: '',
    observations: '',
  });

  const [chronologicalAge, setChronologicalAge] = useState<number | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'gender') {
        setFormData(prev => ({ ...prev, [name]: value as Gender }));
    } else {
        setFormData(prev => ({ ...prev, [name]: value }));
    }

    if (name === 'birthDate' && value) {
      const age = calculateAge(new Date(value));
      setChronologicalAge(age);
    }
  };

  const handleImageCapture = (imageDataUrl: string) => {
    setFormData(prev => ({ ...prev, photo: imageDataUrl }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (sessionStatus !== 'authenticated' || !session?.user?.id) {
      toast.error('Error de autenticación. No se pudo identificar al usuario.');
      setLoading(false);
      return;
    }

    try {
      const userId = session.user.id;
      const result = await createPatient({ ...formData, userId });

      if (result.success && result.patient) {
        toast.success("Se ha guardado la Historia");
        router.push(`/historias/${result.patient.id}?tab=biofisica`);
      } else {
        toast.error(result.error || 'Error al crear paciente');
      }
    } catch (error) {
      console.error('Error en handleSubmit:', error);
      toast.error('Ocurrió un error al crear el paciente.');
    } finally {
      setLoading(false);
    }
  };

  if (sessionStatus === 'loading') {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="loader"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn">
      {isUploaderOpen && <ImageUploader onImageCapture={handleImageCapture} onClose={() => setIsUploaderOpen(false)} />}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Nueva Historia Clínica</h1>
          <p className="text-gray-600 mt-1">Registra un nuevo paciente en el sistema</p>
        </div>
        <button
          onClick={() => router.push('/historias')}
          className="btn-secondary flex items-center space-x-2"
        >
          <FaArrowLeft />
          <span>Volver</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Card de Información Personal */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-3"><FaUser className="text-primary"/>Información Personal</h2>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1 flex flex-col items-center">
              <label className="label self-start">Foto</label>
              <div 
                onClick={() => setIsUploaderOpen(true)}
                className="w-40 h-40 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors bg-gray-50 overflow-hidden"
              >
                {formData.photo ? (
                  <Image src={formData.photo} alt="Foto del paciente" width={160} height={160} className="object-cover w-full h-full" />
                ) : (
                  <>
                    <FaCamera className="text-3xl text-gray-400 mb-2" />
                    <span className="text-sm text-gray-500 text-center">Tomar Foto</span>
                  </>
                )}
              </div>
            </div>
            <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
              <div>
                <label className="label">N° Control</label>
                <input type="text" value="Automático" readOnly className="input bg-gray-100 cursor-not-allowed" />
              </div>
              <div>
                <label className="label">Identificación *</label>
                <input type="text" name="identification" value={formData.identification} onChange={handleInputChange} required placeholder="Ej: 12345678" className="input" />
              </div>
              <div>
                <label className="label">Nacionalidad *</label>
                <select name="nationality" value={formData.nationality} onChange={handleInputChange} required className="input">
                  {NATIONALITIES.map(nat => (
                    <option key={nat} value={nat}>{nat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Fecha Historia *</label>
                <input type="date" name="historyDate" value={formData.historyDate} onChange={handleInputChange} required className="input" />
              </div>
              <div className="md:col-span-2">
                <label className="label">Apellidos *</label>
                <input type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} required placeholder="Apellidos completos" className="input" />
              </div>
              <div className="md:col-span-3">
                <label className="label">Nombres *</label>
                <input type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} required placeholder="Nombres completos" className="input" />
              </div>
              <div>
                <label className="label">Fecha Nacimiento *</label>
                <input type="date" name="birthDate" value={formData.birthDate} onChange={handleInputChange} required className="input" />
              </div>
              <div>
                <label className="label">Edad Cronológica</label>
                <input type="text" value={chronologicalAge !== null ? `${chronologicalAge} años` : ''} readOnly className="input bg-gray-100 cursor-not-allowed" />
              </div>
              <div>
                <label className="label">Género *</label>
                <select name="gender" value={formData.gender} onChange={handleInputChange} required className="input">
                  {GENDER_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="label">Lugar Nacimiento *</label>
                <input type="text" name="birthPlace" value={formData.birthPlace} onChange={handleInputChange} required placeholder="Ciudad, País" className="input" />
              </div>
              <div>
                <label className="label">Teléfono *</label>
                <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} required placeholder="+58 414xxxx" className="input" />
              </div>
              <div>
                <label className="label">Estado Civil *</label>
                <select name="maritalStatus" value={formData.maritalStatus} onChange={handleInputChange} required className="input">
                  <option value="">Seleccionar...</option>
                  {MARITAL_STATUS.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Profesión *</label>
                <input type="text" name="profession" value={formData.profession} onChange={handleInputChange} required placeholder="Ej: Ingeniero, Médico..." className="input" />
              </div>
            </div>
          </div>
        </div>
        
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-3"><FaMapMarkerAlt className="text-primary"/>Dirección</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="label">País *</label>
              <input type="text" name="country" value={formData.country} onChange={handleInputChange} required className="input" />
            </div>
            <div>
              <label className="label">Estado *</label>
              <input type="text" name="state" value={formData.state} onChange={handleInputChange} required placeholder="Estado/Provincia" className="input" />
            </div>
            <div>
              <label className="label">Ciudad *</label>
              <input type="text" name="city" value={formData.city} onChange={handleInputChange} required placeholder="Ciudad" className="input" />
            </div>
            <div className="md:col-span-3">
              <label className="label">Dirección *</label>
              <input type="text" name="address" value={formData.address} onChange={handleInputChange} required placeholder="Dirección completa" className="input" />
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-3"><FaBriefcaseMedical className="text-primary"/>Información Médica</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="label">Grupo Sanguíneo *</label>
              <select name="bloodType" value={formData.bloodType} onChange={handleInputChange} required className="input" >
                <option value="">Seleccionar...</option>
                {BLOOD_TYPES.map(type => ( <option key={type} value={type}>{type}</option>))}
              </select>
            </div>
            <div>
              <label className="label">E-mail *</label>
              <input type="email" name="email" value={formData.email} onChange={handleInputChange} required placeholder="ejemplo@dominio.com" className="input" />
            </div>
            <div className="md:col-span-2">
              <label className="label">Observaciones Generales</label>
              <textarea name="observations" value={formData.observations} onChange={handleInputChange} rows={4} placeholder="Notas adicionales sobre el paciente..." className="input resize-y" />
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button type="button" onClick={() => router.push('/historias')} className="btn-secondary">
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading || sessionStatus !== 'authenticated'}
            className="btn-primary flex items-center space-x-2"
          >
            <FaSave />
            <span>{loading ? 'Guardando...' : 'Guardar Historia'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
