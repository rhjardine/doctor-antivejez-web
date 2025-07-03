'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { createPatient } from '@/lib/actions/patients.actions';
import { toast } from 'sonner';
import { FaCamera, FaArrowLeft, FaSave, FaArrowRight } from 'react-icons/fa'; // Importar FaArrowRight
import { BLOOD_TYPES, MARITAL_STATUS, NATIONALITIES } from '@/lib/constants';
import { GENDER_OPTIONS } from '@/types/biophysics';
import { calculateAge } from '@/utils/date';
import { Gender } from '@prisma/client';
import Link from 'next/link';

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
  const [showPatientExistsMessage, setShowPatientExistsMessage] = useState(false); // Nuevo estado para el mensaje
  const [existingPatientId, setExistingPatientId] = useState(''); // Nuevo estado para la identificación del paciente existente

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
    // Si cambia la identificación, ocultar el mensaje de paciente existente
    if (name === 'identification') {
      setShowPatientExistsMessage(false);
      setExistingPatientId('');
    }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setShowPatientExistsMessage(false); // Resetear el mensaje al intentar guardar de nuevo

    if (sessionStatus !== 'authenticated' || !session?.user?.id) {
      toast.error('Error de autenticación. No se pudo identificar al usuario.');
      setLoading(false);
      return;
    }

    try {
      const userId = session.user.id;
      const result = await createPatient({ ...formData, userId });

      if (result.success && result.patient) {
        toast.success("¡Historia guardada exitosamente! Redirigiendo a la sección de Tests.");
        router.push(`/historias/${result.patient.id}?tab=biofisica`);
      } else {
        // --- Lógica para manejar el error de paciente existente o errores generales ---
        // result.errorCode viene del backend (patients.actions.ts)
        if (result.errorCode === 'PATIENT_EXISTS') {
          setExistingPatientId(formData.identification); // Guardar la identificación que causó el conflicto
          setShowPatientExistsMessage(true); // Activar la visibilidad del mensaje
          toast.warning(result.error || 'El paciente ya existe.'); // Mostrar un toast de advertencia
        } else {
          toast.error(result.error || 'Error al crear paciente');
        }
        // --- Fin lógica de error ---
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
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Nueva Historia Clínica</h1>
          <p className="text-gray-600 mt-1">Registra un nuevo paciente en el sistema</p>
        </div>
        <button
          onClick={() => router.push('/historias')}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
        >
          <FaArrowLeft />
          <span>Volver</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Información Personal</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <label className="label">Foto</label>
              <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors">
                <FaCamera className="text-2xl text-gray-400 mb-2" />
                <span className="text-sm text-gray-500">Subir foto</span>
              </div>
            </div>
            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Nacionalidad *</label>
                <select name="nationality" value={formData.nationality} onChange={handleInputChange} required className="input">
                  {NATIONALITIES.map(nat => (
                    <option key={nat} value={nat}>{nat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Identificación *</label>
                <input type="text" name="identification" value={formData.identification} onChange={handleInputChange} required placeholder="Ej: 12345678" className="input" />
              </div>
              <div>
                <label className="label">Fecha Historia *</label>
                <input type="date" name="historyDate" value={formData.historyDate} onChange={handleInputChange} required className="input" />
              </div>
              <div>
                <label className="label">Apellidos *</label>
                <input type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} required placeholder="Apellidos completos" className="input" />
              </div>
              <div>
                <label className="label">Nombres *</label>
                <input type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} required placeholder="Nombres completos" className="input" />
              </div>
              <div>
                <label className="label">Fecha Nacimiento *</label>
                <input type="date" name="birthDate" value={formData.birthDate} onChange={handleInputChange} required className="input" />
              </div>
              <div>
                <label className="label">Edad Cronológica</label>
                <input type="text" value={chronologicalAge !== null ? `${chronologicalAge} años` : ''} readOnly className="input bg-gray-100" />
              </div>
              <div>
                <label className="label">Género *</label>
                <select name="gender" value={formData.gender} onChange={handleInputChange} required className="input">
                  {GENDER_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              <div>
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

        {/* --- NUEVA SECCIÓN DE MENSAJE DE PACIENTE EXISTENTE --- */}
        {showPatientExistsMessage && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 p-4 rounded-lg flex items-center justify-between animate-fadeIn">
            <div>
              <p className="font-semibold">¡Paciente Existente!</p>
              <p className="text-sm">Ya existe un paciente con la identificación {existingPatientId}.</p>
              <p className="text-sm mt-1">Inicie la búsqueda por cédula o ID en la sección de pacientes.</p>
            </div>
            <Link
              href={`/historias?search=${existingPatientId}`} // Redirige a la sección de historias con el ID de búsqueda
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors flex items-center space-x-2"
            >
              <span>Buscar Paciente</span>
              <FaArrowRight />
            </Link>
          </div>
        )}
        {/* --- FIN NUEVA SECCIÓN --- */}

        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Dirección</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Información Médica</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <textarea name="observations" value={formData.observations} onChange={handleInputChange} rows={4} placeholder="Notas adicionales sobre el paciente..." className="input resize-none" />
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button type="button" onClick={() => router.push('/historias')} className="px-6 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading || sessionStatus !== 'authenticated'}
            className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaSave />
            <span>{loading ? 'Guardando...' : 'Guardar Historia'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}