'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { FaSave, FaTimes } from 'react-icons/fa';
import { Patient } from '@prisma/client';
import { patientSchema, PatientFormData } from '@/utils/validation';
import { updatePatient } from '@/lib/actions/patients.actions';
import { BLOOD_TYPES, MARITAL_STATUS, NATIONALITIES } from '@/lib/constants';
import { GENDER_OPTIONS } from '@/types/biophysics';

interface PatientEditFormProps {
  patient: Patient;
  onClose: () => void;
}

export default function PatientEditForm({ patient, onClose }: PatientEditFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      ...patient,
      historyDate: new Date(patient.historyDate).toISOString().split('T')[0],
      birthDate: new Date(patient.birthDate).toISOString().split('T')[0],
    },
  });

  const onSubmit: SubmitHandler<PatientFormData> = async (data) => {
    setIsSubmitting(true);
    try {
      const result = await updatePatient(patient.id, data);
      if (result.success) {
        toast.success('Historia del Paciente Actualizada');
        onClose(); // Cierra el formulario y refresca los datos en la vista principal
        router.refresh(); // Refresca la data en el servidor
      } else {
        toast.error(result.error || 'Error al actualizar la historia');
      }
    } catch (error) {
      toast.error('Ocurrió un error inesperado');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="card animate-fadeIn">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Editando Historia Médica</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-200"
          >
            <FaTimes className="text-gray-600" />
          </button>
        </div>

        {/* Sección de Información Personal */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Información Personal</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="label">Nacionalidad</label>
              <select {...register('nationality')} className="input">
                {NATIONALITIES.map(nat => <option key={nat} value={nat}>{nat}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Identificación</label>
              <input {...register('identification')} className="input" />
              {errors.identification && <p className="text-red-500 text-sm mt-1">{errors.identification.message}</p>}
            </div>
            <div>
              <label className="label">Fecha Historia</label>
              <input type="date" {...register('historyDate')} className="input" />
            </div>
            <div>
              <label className="label">Apellidos</label>
              <input {...register('lastName')} className="input" />
            </div>
            <div>
              <label className="label">Nombres</label>
              <input {...register('firstName')} className="input" />
            </div>
            <div>
              <label className="label">Fecha Nacimiento</label>
              <input type="date" {...register('birthDate')} className="input" />
            </div>
             <div>
              <label className="label">Género</label>
              <select {...register('gender')} className="input">
                {GENDER_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>
             <div>
              <label className="label">Lugar Nacimiento</label>
              <input {...register('birthPlace')} className="input" />
            </div>
            <div>
              <label className="label">Estado Civil</label>
              <select {...register('maritalStatus')} className="input">
                {MARITAL_STATUS.map(status => <option key={status} value={status}>{status}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Profesión</label>
              <input {...register('profession')} className="input" />
            </div>
          </div>
        </div>

        {/* Sección de Contacto y Dirección */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Contacto y Dirección</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="label">Teléfono</label>
              <input {...register('phone')} className="input" />
            </div>
            <div>
              <label className="label">Email</label>
              <input type="email" {...register('email')} className="input" />
            </div>
             <div>
              <label className="label">País</label>
              <input {...register('country')} className="input" />
            </div>
            <div>
              <label className="label">Estado/Provincia</label>
              <input {...register('state')} className="input" />
            </div>
            <div>
              <label className="label">Ciudad</label>
              <input {...register('city')} className="input" />
            </div>
            <div className="lg:col-span-3">
              <label className="label">Dirección</label>
              <input {...register('address')} className="input" />
            </div>
          </div>
        </div>

        {/* Sección Médica y Observaciones */}
        <div className="border-t pt-6">
           <h3 className="text-lg font-semibold text-gray-800 mb-4">Información Médica</h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="label">Grupo Sanguíneo</label>
                <select {...register('bloodType')} className="input">
                   {BLOOD_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="label">Observaciones</label>
                <textarea {...register('observations')} rows={4} className="input" />
              </div>
           </div>
        </div>

        <div className="flex justify-end space-x-4 pt-4">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancelar
          </button>
          <button type="submit" disabled={isSubmitting} className="btn-primary flex items-center space-x-2">
            <FaSave />
            <span>{isSubmitting ? 'Guardando...' : 'Guardar Cambios'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
