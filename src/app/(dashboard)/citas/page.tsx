// src/app/(dashboard)/citas/page.tsx
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import {
  FaCalendarAlt,
  FaPlus,
  FaChevronLeft,
  FaChevronRight,
  FaClock,
  FaUserMd,
  FaTimes,
  FaSave,
  FaTrash,
  FaSearch,
  FaExclamationTriangle
} from 'react-icons/fa';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  getDay,
  isBefore,
  startOfToday,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { getPaginatedPatients } from '@/lib/actions/patients.actions';
import { 
    getAppointmentsByMonth, 
    createAppointment, 
    updateAppointment, 
    deleteAppointment 
} from '@/lib/actions/appointments.actions';
import type { Patient } from '@/types';
import type { Appointment as PrismaAppointment } from '@prisma/client';

// Extender el tipo Appointment para incluir datos del paciente
type AppointmentWithPatient = PrismaAppointment & {
    patient: {
        firstName: string;
        lastName: string;
    } | null;
};

type Day = {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  appointments: AppointmentWithPatient[];
};

// --- Componente Modal para Agendar/Editar Cita ---
function AppointmentModal({
  isOpen,
  onClose,
  onSave,
  selectedDate,
  appointment,
  patients,
  userId,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  selectedDate: Date | null;
  appointment: AppointmentWithPatient | null;
  patients: Patient[];
  userId: string;
}) {
  const [patientId, setPatientId] = useState(appointment?.patientId || '');
  const [reason, setReason] = useState(appointment?.reason || '');
  const [time, setTime] = useState(
    appointment ? format(new Date(appointment.date), 'HH:mm') : '09:00'
  );

  useEffect(() => {
    if (appointment) {
      setPatientId(appointment.patientId);
      setReason(appointment.reason);
      setTime(format(new Date(appointment.date), 'HH:mm'));
    } else {
      setPatientId('');
      setReason('');
      setTime('09:00');
    }
  }, [appointment]);

  if (!isOpen || !selectedDate) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId) {
        toast.error('Debe seleccionar un paciente.');
        return;
    }
    const [hours, minutes] = time.split(':').map(Number);
    const appointmentDate = new Date(selectedDate);
    appointmentDate.setHours(hours, minutes);

    onSave({
      id: appointment?.id,
      patientId,
      reason,
      date: appointmentDate,
      userId,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4 pb-4 border-b">
          <h2 className="text-xl font-bold text-gray-800">
            {appointment ? 'Editar Cita' : 'Agendar Cita'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100">
            <FaTimes className="text-gray-500" />
          </button>
        </div>
        <p className="font-semibold text-primary mb-4">
          Fecha: {format(selectedDate, 'EEEE, d \'de\' MMMM \'de\' yyyy', { locale: es })}
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Paciente</label>
            <select
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              className="input"
              required
            >
              <option value="" disabled>Seleccione un paciente</option>
              {patients.map(p => (
                <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Hora</label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="input"
              required
            />
          </div>
          <div>
            <label className="label">Motivo de la Cita</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="input"
              rows={3}
              placeholder="Ej: Consulta de seguimiento"
              required
            />
          </div>
          <div className="flex justify-end gap-4 pt-4 border-t mt-4">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancelar
            </button>
            <button type="submit" className="btn-primary flex items-center gap-2">
              <FaSave /> {appointment ? 'Guardar Cambios' : 'Agendar Cita'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// --- Componente Modal de Confirmación para Eliminar ---
function DeleteConfirmationModal({ isOpen, onClose, onConfirm, isDeleting }: { isOpen: boolean, onClose: () => void, onConfirm: () => void, isDeleting: boolean }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full text-center relative animate-slideUp">
        <FaExclamationTriangle className="text-yellow-500 text-6xl mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-800 mb-2">Confirmar Eliminación</h3>
        <p className="text-gray-600 mb-6">¿Estás seguro de que deseas eliminar esta cita? Esta acción no se puede deshacer.</p>
        <div className="flex justify-center gap-4">
          <button onClick={onClose} className="btn-secondary" disabled={isDeleting}>Cancelar</button>
          <button onClick={onConfirm} className="btn-danger" disabled={isDeleting}>
            {isDeleting ? 'Eliminando...' : 'Sí, Eliminar'}
          </button>
        </div>
      </div>
    </div>
  );
}


// --- Componente Principal de la Página de Citas ---
export default function CitasPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [appointments, setAppointments] = useState<AppointmentWithPatient[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentWithPatient | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { data: session } = useSession();

  const fetchAppointments = useCallback(async () => {
    if (session?.user?.id) {
      setLoading(true);
      try {
        const result = await getAppointmentsByMonth(session.user.id, currentMonth);
        if (result.success && result.appointments) {
          setAppointments(result.appointments as AppointmentWithPatient[]);
        } else {
          toast.error('No se pudieron cargar las citas.');
        }
      } catch (error) {
        toast.error('Error de conexión al cargar citas.');
      } finally {
        setLoading(false);
      }
    }
  }, [session, currentMonth]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  useEffect(() => {
    const loadPatients = async () => {
      if (session?.user?.id) {
        try {
          const result = await getPaginatedPatients({ userId: session.user.id, limit: 1000 });
          if (result.success && result.patients) {
            setPatients(result.patients as Patient[]);
          }
        } catch (error) {
          toast.error('No se pudieron cargar los pacientes.');
        }
      }
    };
    loadPatients();
  }, [session]);

  const daysInMonth = useMemo<Day[]>(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end }).map(date => ({
      date,
      isCurrentMonth: true,
      isToday: isSameDay(date, new Date()),
      appointments: appointments.filter(a => isSameDay(a.date, date)),
    }));
  }, [currentMonth, appointments]);

  const weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  const handleDayClick = (date: Date) => {
    if (isBefore(date, startOfToday()) && !isSameDay(date, startOfToday())) return;
    setSelectedDate(date);
    setSelectedAppointment(null);
    setIsModalOpen(true);
  };
  
  const handleAppointmentClick = (appointment: AppointmentWithPatient, date: Date) => {
    setSelectedDate(date);
    setSelectedAppointment(appointment);
    setIsModalOpen(true);
  };

  const handleSaveAppointment = async (data: any) => {
    setIsSaving(true);
    try {
      let result;
      if (data.id) {
        // Actualizar
        result = await updateAppointment(data.id, data);
      } else {
        // Crear
        result = await createAppointment(data);
      }

      if (result.success) {
        toast.success(data.id ? 'Cita actualizada correctamente' : 'Cita agendada correctamente');
        fetchAppointments();
        setIsModalOpen(false);
      } else {
        toast.error(result.error || 'Ocurrió un error.');
      }
    } catch (error) {
      toast.error('Error de conexión al guardar la cita.');
    } finally {
      setIsSaving(false);
    }
  };

  const openDeleteModal = (appointment: AppointmentWithPatient) => {
    setSelectedAppointment(appointment);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteAppointment = async () => {
    if (!selectedAppointment) return;
    setIsSaving(true);
    try {
        const result = await deleteAppointment(selectedAppointment.id);
        if (result.success) {
            toast.success('Cita eliminada correctamente');
            fetchAppointments();
            setIsDeleteModalOpen(false);
            setSelectedAppointment(null);
        } else {
            toast.error(result.error || 'No se pudo eliminar la cita.');
        }
    } catch (error) {
        toast.error('Error de conexión al eliminar la cita.');
    } finally {
        setIsSaving(false);
    }
  };


  return (
    <>
      <AppointmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveAppointment}
        selectedDate={selectedDate}
        appointment={selectedAppointment}
        patients={patients}
        userId={session?.user?.id || ''}
      />
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteAppointment}
        isDeleting={isSaving}
      />
      <div className="space-y-6 animate-fadeIn">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestión de Citas</h1>
            <p className="text-gray-600 mt-1">Calendario interactivo para agendar y gestionar citas.</p>
          </div>
          <button
            onClick={() => {
              setSelectedDate(new Date());
              setSelectedAppointment(null);
              setIsModalOpen(true);
            }}
            className="btn-primary flex items-center gap-2"
          >
            <FaPlus /> Nueva Cita
          </button>
        </div>

        <div className="card p-0">
          {/* Header del Calendario */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 rounded-full hover:bg-gray-100">
                <FaChevronLeft />
              </button>
              <h2 className="text-xl font-semibold w-48 text-center">
                {format(currentMonth, 'MMMM yyyy', { locale: es })}
              </h2>
              <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 rounded-full hover:bg-gray-100">
                <FaChevronRight />
              </button>
            </div>
            <button onClick={() => setCurrentMonth(new Date())} className="btn-secondary text-sm py-2">
              Hoy
            </button>
          </div>

          {/* Grid del Calendario */}
          <div className="grid grid-cols-7">
            {weekDays.map(day => (
              <div key={day} className="text-center font-medium text-gray-500 py-3 border-b">
                {day}
              </div>
            ))}
            {Array.from({ length: getDay(startOfMonth(currentMonth)) }).map((_, i) => (
              <div key={`empty-${i}`} className="border-r border-b min-h-[128px]"></div>
            ))}

            {daysInMonth.map(day => (
              <div
                key={day.date.toString()}
                className={`border-r border-b min-h-[128px] p-2 flex flex-col transition-colors ${
                  isBefore(day.date, startOfToday()) && !isSameDay(day.date, startOfToday())
                    ? 'bg-gray-50 text-gray-400'
                    : 'hover:bg-primary/5 cursor-pointer'
                }`}
                onClick={() => handleDayClick(day.date)}
              >
                <span
                  className={`font-semibold ${
                    day.isToday ? 'bg-primary text-white rounded-full w-7 h-7 flex items-center justify-center' : ''
                  }`}
                >
                  {format(day.date, 'd')}
                </span>
                <div className="mt-1 space-y-1 overflow-y-auto text-xs">
                    {day.appointments.map(app => (
                        <div 
                            key={app.id} 
                            className="bg-teal-100 text-teal-800 p-1 rounded-md cursor-pointer group relative"
                            onClick={(e) => { e.stopPropagation(); handleAppointmentClick(app, day.date); }}
                        >
                            <p className="truncate font-semibold">{format(app.date, 'HH:mm')} - {app.patient?.firstName}</p>
                            <p className="truncate">{app.reason}</p>
                            <button 
                                onClick={(e) => { e.stopPropagation(); openDeleteModal(app); }}
                                className="absolute top-0 right-0 p-1 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <FaTrash />
                            </button>
                        </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
