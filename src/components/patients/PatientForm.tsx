'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import Image from 'next/image';
import { FaSave, FaUser, FaMapMarkerAlt, FaBriefcaseMedical, FaCamera } from 'react-icons/fa';
import { Patient } from '@prisma/client';
import { patientSchema, PatientFormData } from '@/utils/validation';
import { createPatient, updatePatient } from '@/lib/actions/patients.actions';
import { BLOOD_TYPES, MARITAL_STATUS, NATIONALITIES } from '@/lib/constants';
import { GENDER_OPTIONS } from '@/types/biophysics';
import { calculateAge } from '@/utils/date';

// La lógica del ImageUploader se puede mantener en un archivo separado o integrada si se prefiere.
// Por simplicidad, aquí asumimos que la lógica de la foto se manejará directamente.

interface PatientFormProps {
  patient?: Patient; // Si se provee 'patient', el formulario está en modo "Edición"
  onSaveSuccess?: (patientId: string) => void; // Callback para manejar el éxito
}

export default function PatientForm({ patient, onSaveSuccess }: PatientFormProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [chronologicalAge, setChronologicalAge] = useState<number | null>(null);

  const isEditMode = !!patient;

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    setError,
  } = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
    defaultValues: isEditMode
      ? {
          ...patient,
          historyDate: new Date(patient.historyDate).toISOString().split('T')[0],
          birthDate: new Date(patient.birthDate).toISOString().split('T')[0],
          photo: patient.photo ?? '',
          observations: patient.observations ?? '',
        }
      : {
          nationality: 'Venezolano',
          historyDate: new Date().toISOString().split('T')[0],
          gender: 'MASCULINO',
          country: 'Venezuela',
          photo: '',
          observations: '',
        },
  });

  // Observar el campo de fecha de nacimiento para calcular la edad dinámicamente
  const birthDateValue = watch('birthDate');
  useEffect(() => {
    if (birthDateValue) {
      setChronologicalAge(calculateAge(new Date(birthDateValue)));
    } else {
      setChronologicalAge(null);
    }
  }, [birthDateValue]);

  const onSubmit: SubmitHandler<PatientFormData> = async (data) => {
    setIsSubmitting(true);
    
    if (!session?.user?.id) {
        toast.error('Error de autenticación. Por favor, inicie sesión de nuevo.');
        setIsSubmitting(false);
        return;
    }

    try {
      let result;
      if (isEditMode) {
        result = await updatePatient(patient.id, data);
      } else {
        result = await createPatient({ ...data, userId: session.user.id });
      }

      if (result.success && result.patient) {
        toast.success(isEditMode ? 'Historia del Paciente Actualizada' : 'Paciente Creado Exitosamente');
        if (onSaveSuccess) {
          onSaveSuccess(result.patient.id);
        }
      } else {
        // Manejo de error específico para identificación duplicada
        if (result.error?.includes('identificación')) {
            setError('identification', { type: 'manual', message: result.error });
            toast.error(result.error);
        } else {
            toast.error(result.error || 'Ocurrió un error al guardar.');
        }
      }
    } catch (error) {
      toast.error('Ocurrió un error inesperado.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Lógica simple para el uploader de fotos
  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setValue('photo', e.target?.result as string, { shouldValidate: true });
      reader.readAsDataURL(file);
    }
  };
  const photoValue = watch('photo');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Card de Información Personal */}
      <div className="card">
        <h2 className="form-section-header"><FaUser />Información Personal</h2>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1 flex flex-col items-center">
            <label className="label self-start">Foto</label>
            <div className="w-40 h-40 border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer bg-gray-50 overflow-hidden relative group">
              <input type="file" accept="image/*" onChange={handlePhotoUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
              {photoValue ? (
                <Image src={photoValue} alt="Foto del paciente" layout="fill" className="object-cover" />
              ) : (
                <div className="text-center text-gray-500">
                  <FaCamera className="text-3xl mx-auto mb-2" />
                  <span className="text-sm">Adjuntar Foto</span>
                </div>
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
              <input {...register('identification')} className={`input ${errors.identification ? 'input-error' : ''}`} />
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
              <input {...register('lastName')} className={`input ${errors.lastName ? 'input-error' : ''}`} />
              {errors.lastName && <p className="error-message">{errors.lastName.message}</p>}
            </div>
            <div className="md:col-span-3">
              <label className="label">Nombres *</label>
              <input {...register('firstName')} className={`input ${errors.firstName ? 'input-error' : ''}`} />
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
                {GENDER_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="label">Lugar Nacimiento *</label>
              <input {...register('birthPlace')} className="input" />
            </div>
            <div>
              <label className="label">Teléfono *</label>
              <input type="tel" {...register('phone')} className="input" />
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
              <input {...register('profession')} className="input" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Card de Dirección */}
      <div className="card">
        <h2 className="form-section-header"><FaMapMarkerAlt />Dirección</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="label">País *</label>
            <input {...register('country')} className="input" />
          </div>
          <div>
            <label className="label">Estado *</label>
            <input {...register('state')} className="input" />
          </div>
          <div>
            <label className="label">Ciudad *</label>
            <input {...register('city')} className="input" />
          </div>
          <div className="md:col-span-3">
            <label className="label">Dirección *</label>
            <input {...register('address')} className="input" />
          </div>
        </div>
      </div>

      {/* Card de Información Médica */}
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
            <input type="email" {...register('email')} className={`input ${errors.email ? 'input-error' : ''}`} />
            {errors.email && <p className="error-message">{errors.email.message}</p>}
          </div>
          <div className="md:col-span-2">
            <label className="label">Observaciones Generales</label>
            <textarea {...register('observations')} rows={4} className="input resize-y" />
          </div>
        </div>
      </div>

      {/* Botones de Acción */}
      <div className="flex justify-end space-x-4">
        <button type="button" onClick={() => router.back()} className="btn-secondary">
          Cancelar
        </button>
        <button type="submit" disabled={isSubmitting} className="btn-primary">
          <FaSave />
          <span>{isSubmitting ? 'Guardando...' : (isEditMode ? 'Guardar Cambios' : 'Guardar Historia')}</span>
        </button>
      </div>
    </form>
  );
}