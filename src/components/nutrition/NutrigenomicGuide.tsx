'use client';

import { useState } from 'react';
import { DEFAULTS_O_B, DEFAULTS_A_AB, DEFAULTS_COMUNES } from '@/lib/nutrigenomica-defaults';
import { saveAlimentacion, sendAlimentacionToPWA } from '@/app/(dashboard)/historias/[id]/actions';
import { toast } from 'sonner';
import { X, Edit2 } from 'lucide-react';

// Para simplificar, obtenemos los tipos necesarios directamente
type GrupoSanguineo = 'O_B' | 'A_AB';
type Tab = 'plan' | 'guia' | 'claves' | 'terapias';

interface Props {
    patient: any;
}

export default function NutrigenomicGuide({ patient }: Props) {
    const initialData = patient.alimentacion;
    const initialBlood = (initialData?.grupoSanguineo as GrupoSanguineo) ||
        (patient.bloodType?.includes('A') ? 'A_AB' : 'O_B');

    const [activeTab, setActiveTab] = useState<Tab>('plan');
    const [grupo, setGrupo] = useState<GrupoSanguineo>(initialBlood);
    const [tipos, setTipos] = useState({
        nino: initialData?.tipoNino ?? false,
        metabolica: initialData?.tipoMetabolica ?? false,
        antidiabetica: initialData?.tipoAntidiabetica ?? false,
        citostatica: initialData?.tipoCitostatica ?? false,
        renal: initialData?.tipoRenal ?? false,
    });

    const [saving, setSaving] = useState(false);
    const [sending, setSending] = useState(false);
    const [showSavingSuccess, setShowSavingSuccess] = useState(false);
    const [notasMedico, setNotasMedico] = useState<string>(initialData?.notasMedico || '');

    const defaultData = grupo === 'O_B' ? DEFAULTS_O_B : DEFAULTS_A_AB;

    // --- Plan Alimentario ---
    const [desayuno, setDesayuno] = useState<string[]>(initialData?.planAlimentario?.desayuno || defaultData.desayuno);
    const [almuerzo, setAlmuerzo] = useState<string[]>(initialData?.planAlimentario?.almuerzo || defaultData.almuerzo);
    const [cenaComunes, setCenaComunes] = useState<string[]>(initialData?.planAlimentario?.cenaComunes || defaultData.cena.comunes);
    const [meriendas, setMeriendas] = useState<string[]>(initialData?.planAlimentario?.meriendas || DEFAULTS_COMUNES.meriendas);

    // --- Guía General (Editable Lists) ---
    const [alimentosEvitar, setAlimentosEvitar] = useState<string[]>(
        initialData?.alimentosEvitar ? initialData.alimentosEvitar.split('\n') : DEFAULTS_COMUNES.alimentosEvitar.split('\n')
    );
    const [sustitutos, setSustitutos] = useState<string[]>(
        initialData?.sustitutos ? initialData.sustitutos.split('\n') : DEFAULTS_COMUNES.sustitutos.split('\n')
    );

    // --- Claves 5A ---
    const [claves5a, setClaves5a] = useState<any[]>(initialData?.claves5a || DEFAULTS_COMUNES.claves5a);

    // --- Terapias 4R ---
    const [terapias4r, setTerapias4r] = useState<any[]>(initialData?.terapias4r || DEFAULTS_COMUNES.terapias4r);

    // Dynamic field handlers
    const addItem = (list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>) => {
        const newItem = prompt('Añadir nuevo registro:');
        if (newItem) setList([...list, newItem]);
    };

    const removeItem = (list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>, index: number) => {
        setList(list.filter((_, i) => i !== index));
    };

    const editItem = (list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>, index: number) => {
        const newValue = prompt('Editar registro:', list[index]);
        if (newValue !== null) {
            const newList = [...list];
            newList[index] = newValue;
            setList(newList);
        }
    };

    // Sub-item handlers for nested arrays (like in 5A or 4R)
    const addSubItem = (catIndex: number, list: any[], setList: React.Dispatch<React.SetStateAction<any[]>>) => {
        const newItem = prompt('Añadir nuevo elemento:');
        if (newItem) {
            const newList = JSON.parse(JSON.stringify(list));
            newList[catIndex].items.push(newItem);
            setList(newList);
        }
    };

    const removeSubItem = (catIndex: number, itemIndex: number, list: any[], setList: React.Dispatch<React.SetStateAction<any[]>>) => {
        const newList = JSON.parse(JSON.stringify(list));
        newList[catIndex].items.splice(itemIndex, 1);
        setList(newList);
    };

    const grupoData = grupo === 'O_B' ? DEFAULTS_O_B : DEFAULTS_A_AB;

    // ─── HANDLERS ───────────────────────────────────────────────────────────────

    const handleSave = async () => {
        setSaving(true);
        try {
            await saveAlimentacion({
                patientId: patient.id,
                grupoSanguineo: grupo,
                notasMedico: notasMedico,
                ...tipos,
                planAlimentario: {
                    desayuno,
                    almuerzo,
                    cenaComunes,
                    meriendas
                },
                alimentosEvitar: alimentosEvitar.join('\n'),
                sustitutos: sustitutos.join('\n'),
                combinaciones: initialData?.combinaciones || DEFAULTS_COMUNES.combinaciones,
                actividadFisica: initialData?.actividadFisica || DEFAULTS_COMUNES.actividadFisica,
                claves5a: claves5a,
                terapias4r: terapias4r
            });
            setShowSavingSuccess(true);
            toast.success('Plan alimentario guardado correctamente');
            setTimeout(() => setShowSavingSuccess(false), 3000);
        } catch (error) {
            toast.error('Ocurrió un error al guardar el plan');
            console.error(error);
        } finally {
            setSaving(false);
        }
    };

    const handleSend = async () => {
        setSending(true);
        try {
            await sendAlimentacionToPWA({ patientId: patient.id });
            toast.success('Plan enviado a la App Móvil del paciente');
        } catch (error) {
            toast.error('Error al notificar a la PWA');
            console.error(error);
        } finally {
            setSending(false);
        }
    };

    // ─── RENDER ─────────────────────────────────────────────────────────────────
    return (
        <div className="space-y-4 pb-32 relative min-h-screen">
            {/* ── PERFIL DEL PACIENTE ─────────────────────────── */}
            <div className="bg-[#1a3a5c] rounded-2xl p-6 text-white shadow-lg">
                <h3 className="text-sm font-bold uppercase tracking-widest text-[#23bcef] mb-6 flex items-center gap-2">
                    <span>🍏</span> Perfil Nutrigenómico
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Grupo Sanguíneo */}
                    <div>
                        <label className="block text-xs uppercase tracking-wide opacity-60 mb-3">
                            Grupo Sanguíneo Base
                        </label>
                        <div className="flex gap-3">
                            {(['O_B', 'A_AB'] as const).map((g) => (
                                <button
                                    key={g}
                                    onClick={() => setGrupo(g)}
                                    className={`flex-1 py-3 px-4 rounded-xl text-sm font-black uppercase tracking-tight
                    transition-all duration-300 border-2
                    ${grupo === g
                                            ? 'bg-[#23bcef] text-white border-[#23bcef] shadow-[0_0_15px_rgba(35,188,239,0.4)] scale-[1.02]'
                                            : 'bg-white text-slate-900 border-slate-200 hover:border-[#23bcef]/30'
                                        }`}
                                >
                                    {g === 'O_B' ? 'Grupo O y B' : 'Grupo A y AB'}
                                </button>
                            ))}
                        </div>
                        {/* Aviso por inferencia */}
                        <p className="mt-2 text-[10px] text-white/40 italic">
                            Predeterminado según ficha: {patient.bloodType || 'No registrado'}
                        </p>
                    </div>

                    {/* Tipos de Alimentación */}
                    <div>
                        <label className="block text-xs uppercase tracking-wide opacity-60 mb-3">
                            Enfoques Clínicos Específicos
                        </label>
                        <div className="flex flex-wrap gap-2.5">
                            {[
                                { key: 'nino', label: 'Niño' },
                                { key: 'metabolica', label: 'Metabólica' },
                                { key: 'antidiabetica', label: 'Antidiabética' },
                                { key: 'citostatica', label: 'Citostática' },
                                { key: 'renal', label: 'Renal' },
                            ].map(({ key, label }) => (
                                <button
                                    key={key}
                                    onClick={() => setTipos(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }))}
                                    className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all border
                    ${tipos[key as keyof typeof tipos]
                                            ? 'bg-amber-500 text-black border-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                                            : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/15'
                                        }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Notas del Médico Libre */}
                <div className="mt-8 border-t border-white/10 pt-6">
                    <label className="block text-xs uppercase tracking-wide opacity-60 mb-3 flex items-center gap-2">
                        <span className="text-amber-400">📝</span> Observaciones Exclusivas del Médico
                    </label>
                    <textarea
                        value={notasMedico}
                        onChange={(e) => setNotasMedico(e.target.value)}
                        placeholder="Escriba aquí las indicaciones personalizadas..."
                        className="w-full bg-white border border-slate-200 rounded-xl p-4 text-sm text-black placeholder:text-slate-400 focus:outline-none focus:border-[#23bcef] focus:ring-2 focus:ring-[#23bcef]/20 resize-y min-h-[120px] shadow-sm font-medium leading-relaxed"
                    />
                </div>
            </div>

            {/* ── TABS ───────────────────────────────────────── */}
            <div className="flex border-b border-gray-200 mt-4 overflow-x-auto custom-scrollbar-tabs">
                {[
                    { id: 'plan', label: '📅 Plan Alimentario' },
                    { id: 'guia', label: '📖 Guía General' },
                    { id: 'claves', label: '🧬 Claves 5A' },
                    { id: 'terapias', label: '💉 Terapias 4R' },
                ].map(({ id, label }) => (
                    <button
                        key={id}
                        onClick={() => setActiveTab(id as Tab)}
                        className={`px-6 py-4 text-sm font-bold transition-all border-b-[3px] flex-shrink-0
              ${activeTab === id
                                ? 'text-[#23bcef] border-[#23bcef] bg-sky-50/30'
                                : 'text-gray-400 border-transparent hover:text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* ── CONTENIDO DE TABS ──────────────────────────── */}

            {/* TAB 1: PLAN ALIMENTARIO */}
            {activeTab === 'plan' && (
                <div className="space-y-6 pt-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
                            Mostrando pauta oficial para:
                        </span>
                        <span className="bg-[#23bcef]/10 text-[#0c7092] text-xs font-black px-3 py-1 rounded-full border border-[#23bcef]/20">
                            {grupo === 'O_B' ? 'Grupo O y B' : 'Grupo A y AB'}
                        </span>
                    </div>

                    <SectionCard
                        icon="🌅"
                        title="Desayuno"
                        color="amber"
                        items={desayuno}
                        onAdd={() => addItem(desayuno, setDesayuno)}
                        onRemove={(i) => removeItem(desayuno, setDesayuno, i)}
                        onEdit={(i) => editItem(desayuno, setDesayuno, i)}
                    />
                    <SectionCard
                        icon="☀️"
                        title="Almuerzo"
                        color="green"
                        items={almuerzo}
                        onAdd={() => addItem(almuerzo, setAlmuerzo)}
                        onRemove={(i) => removeItem(almuerzo, setAlmuerzo, i)}
                        onEdit={(i) => editItem(almuerzo, setAlmuerzo, i)}
                    />

                    <SectionCard
                        icon="🌙"
                        title="Cena"
                        color="blue"
                        items={cenaComunes}
                        onAdd={() => addItem(cenaComunes, setCenaComunes)}
                        onRemove={(i) => removeItem(cenaComunes, setCenaComunes, i)}
                        onEdit={(i) => editItem(cenaComunes, setCenaComunes, i)}
                        extraFooter={`Tendencia prioritaria: ${grupoData.cena.especifico}`}
                    />

                    <SectionCard
                        icon="🌿"
                        title="Meriendas y Variantes"
                        color="purple"
                        items={meriendas}
                        onAdd={() => addItem(meriendas, setMeriendas)}
                        onRemove={(i) => removeItem(meriendas, setMeriendas, i)}
                        onEdit={(i) => editItem(meriendas, setMeriendas, i)}
                        extraContent={
                            <div className="mt-4 pt-4 border-t border-purple-100/50 space-y-3">
                                <DetailRow label="Ensaladas libres" items={DEFAULTS_COMUNES.ensaladasLibres} color="purple-700" />
                                <DetailRow label="Aderezos" items={DEFAULTS_COMUNES.aderezos} color="purple-700" />
                                <DetailRow label="Bebidas recomendadas" items={DEFAULTS_COMUNES.bebidas} color="purple-700" />
                            </div>
                        }
                    />
                </div>
            )}

            {/* TAB 2: GUÍA GENERAL */}
            {activeTab === 'guia' && (
                <div className="space-y-6 pt-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <SectionCard
                            icon="🚫"
                            title="Alimentos a Evitar"
                            color="red"
                            items={alimentosEvitar}
                            onAdd={() => addItem(alimentosEvitar, setAlimentosEvitar)}
                            onRemove={(i) => removeItem(alimentosEvitar, setAlimentosEvitar, i)}
                            onEdit={(i) => editItem(alimentosEvitar, setAlimentosEvitar, i)}
                        />
                        <SectionCard
                            icon="✅"
                            title="Sustitutos Recomendados"
                            color="green"
                            items={sustitutos}
                            onAdd={() => addItem(sustitutos, setSustitutos)}
                            onRemove={(i) => removeItem(sustitutos, setSustitutos, i)}
                            onEdit={(i) => editItem(sustitutos, setSustitutos, i)}
                        />
                    </div>

                    <div className="bg-white border text-center border-slate-200/60 rounded-2xl p-8 shadow-sm">
                        <div className="inline-flex items-center justify-center gap-3 mb-8 bg-slate-100 px-6 py-2 rounded-full">
                            <span className="text-xl">🔗</span>
                            <h4 className="font-bold text-slate-800 tracking-wide uppercase text-sm">Reglas de Combinación de Alimentos</h4>
                        </div>
                        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 text-left">
                            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 relative overflow-hidden">
                                <p className="text-xs font-black uppercase tracking-widest text-amber-600 mb-4">Desayuno</p>
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {DEFAULTS_COMUNES.combinaciones.desayuno.alimentos.map((a) => (
                                        <span key={a} className="bg-white border border-amber-100 text-slate-700 text-[11px] font-bold px-2 py-1 rounded-md shadow-sm">{a}</span>
                                    ))}
                                </div>
                                <div className="bg-amber-100/50 p-3 rounded-xl border border-amber-100/50">
                                    <span className="text-[10px] text-amber-800 font-extrabold uppercase block mb-2">Semillas activadoras:</span>
                                    <div className="flex flex-wrap gap-1.5">
                                        {DEFAULTS_COMUNES.combinaciones.desayuno.semillas.map((s) => (
                                            <span key={s} className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">{s}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 col-span-1 xl:col-span-2 relative overflow-hidden">
                                <p className="text-xs font-black uppercase tracking-widest text-emerald-600 mb-3 block">Almuerzo</p>
                                <div className="bg-rose-100 border-l-4 border-rose-500 rounded-r-xl p-3 mb-5 inline-block w-full text-center">
                                    <p className="text-[11px] font-black text-rose-800 tracking-widest uppercase flex items-center justify-center gap-2">
                                        <span>⚠️</span> Proteínas <span>→</span> <span className="underline decoration-2 underline-offset-2">Evitar mezclar con</span> <span>←</span> Carbohidratos Integrales
                                    </p>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 text-left">
                                    <div className="bg-white border-2 border-dashed border-sky-100 rounded-xl p-4">
                                        <p className="text-[10px] font-black uppercase text-sky-500 mb-2">Grupo Proteico</p>
                                        <div className="flex flex-wrap gap-1">
                                            {DEFAULTS_COMUNES.combinaciones.almuerzo.proteinas.map((p) => (
                                                <span key={p} className="text-xs text-sky-900 bg-sky-50 px-2 py-1 rounded font-medium">{p}</span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="bg-white border-2 border-dashed border-orange-100 rounded-xl p-4">
                                        <p className="text-[10px] font-black uppercase text-orange-500 mb-2">Gpo. Carbohidratos</p>
                                        <div className="flex flex-wrap gap-1">
                                            {DEFAULTS_COMUNES.combinaciones.almuerzo.carbohidratos.map((c) => (
                                                <span key={c} className="text-xs text-orange-900 bg-orange-50 px-2 py-1 rounded font-medium">{c}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 3: CLAVES 5A */}
            {activeTab === 'claves' && (
                <div className="space-y-6 pt-2 animate-in fade-in slide-in-from-bottom-2 duration-500 max-w-4xl mx-auto">
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-black text-slate-800 mb-2">Las Claves de la Longevidad 5A</h2>
                        <p className="text-sm text-slate-500 font-medium pb-2 border-b border-slate-200 inline-block">
                            La guía definitiva para mantenerse joven, saludable y en forma
                        </p>
                    </div>

                    <div className="grid gap-5">
                        {claves5a.map((clave, index) => (
                            <div key={clave.clave}
                                className="bg-white border border-slate-100/80 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all group">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-[#23bcef]/10 flex items-center justify-center text-[#23bcef] font-black text-sm">
                                            {index + 1}
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">{clave.icono}</span>
                                            <h4 className="font-extrabold text-slate-800 text-base uppercase tracking-wide">{clave.clave}</h4>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => addSubItem(index, claves5a, setClaves5a)}
                                        className="text-[10px] font-black bg-[#23bcef] text-white px-3 py-1.5 rounded-lg active:scale-95"
                                    >
                                        + Añadir
                                    </button>
                                </div>
                                <ul className="space-y-3 pl-14">
                                    {clave.items.map((item: string, i: number) => (
                                        <li key={i} className="text-sm text-slate-600 group/item flex items-start gap-3">
                                            <span className="text-slate-400 mt-1.5 flex-shrink-0">🔸</span>
                                            <span className="flex-1">{item}</span>
                                            <button
                                                onClick={() => removeSubItem(index, i, claves5a, setClaves5a)}
                                                className="opacity-0 group-hover/item:opacity-100 text-red-400 p-1"
                                            >
                                                <X size={14} />
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* TAB 4: TERAPIAS 4R */}
            {activeTab === 'terapias' && (
                <div className="space-y-8 pt-2 animate-in fade-in slide-in-from-bottom-2 duration-500 max-w-5xl mx-auto pb-20">
                    <div className="text-center mb-10">
                        <h2 className="text-3xl font-black text-slate-800 mb-2">Terapias Proactivas 4R</h2>
                        <div className="h-1.5 w-24 bg-gradient-to-r from-[#23bcef] to-[#1a3a5c] mx-auto rounded-full" />
                    </div>

                    <div className="grid grid-cols-1 gap-10">
                        {terapias4r.map((terapia, index) => (
                            <div key={terapia.nombre} className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm relative overflow-hidden group">
                                <div className="absolute top-0 left-0 w-2 h-full bg-[#23bcef]" />
                                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-6">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3">
                                            <span className="bg-[#23bcef] text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                                                {index + 1}
                                            </span>
                                            <h3 className="text-2xl font-black text-[#1a3a5c] uppercase tracking-tight">{terapia.nombre}</h3>
                                        </div>
                                        <p className="text-[#23bcef] font-bold text-lg italic pl-11">“{terapia.slogan}”</p>
                                    </div>
                                    <button
                                        onClick={() => addSubItem(index, terapias4r, setTerapias4r)}
                                        className="self-start px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-[#1a3a5c] transition-all active:scale-95"
                                    >
                                        + Añadir Detalle
                                    </button>
                                </div>

                                <div className="pl-11 space-y-6">
                                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 italic text-slate-600 text-sm leading-relaxed">
                                        {terapia.descripcion}
                                    </div>

                                    <div className="space-y-4">
                                        <p className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-2">{terapia.infoExtra}</p>
                                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {terapia.items.map((item: string, i: number) => (
                                                <li key={i} className="flex items-start gap-3 group/item p-3 rounded-xl hover:bg-sky-50 transition-colors">
                                                    <span className="text-sky-400 mt-1">✔</span>
                                                    <span className="text-sm text-slate-700 font-medium flex-1">{item}</span>
                                                    <button
                                                        onClick={() => removeSubItem(index, i, terapias4r, setTerapias4r)}
                                                        className="opacity-0 group-hover/item:opacity-100 text-red-400 hover:text-red-600 transition-all"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Frase final */}
            <div className="mt-12 bg-gradient-to-r from-[#23bcef]/10 to-[#1a3a5c]/5 rounded-2xl p-8
                          border border-[#23bcef]/20 text-center shadow-inner relative overflow-hidden">
                <div className="absolute -top-4 -left-4 font-serif text-[#23bcef]/20 text-8xl">"</div>
                <p className="text-lg text-[#1a3a5c] italic font-semibold relative z-10 font-serif">
                    {DEFAULTS_COMUNES.frase}
                </p>
            </div>

            {/* ── BARRA DE ACCIONES FLOTANTE ── */}
            <div className="fixed bottom-0 left-[250px] right-0 bg-white/95 backdrop-blur-md border-t border-slate-200/60
                          px-8 py-5 flex items-center justify-between shadow-[0_-10px_30px_rgba(0,0,0,0.04)] z-40
                          transition-all duration-300">

                <div className="flex items-center gap-3">
                    <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-slate-100">
                        {saving || sending ? (
                            <div className="w-4 h-4 rounded-full border-2 border-[#23bcef] border-t-transparent animate-spin" />
                        ) : showSavingSuccess ? (
                            <span className="text-emerald-500 font-black animate-in zoom-in">✓</span>
                        ) : (
                            <div className="w-2 h-2 rounded-full bg-slate-300" />
                        )}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Estado de la Guía
                        </span>
                        <span className="text-xs font-semibold text-slate-700">
                            {saving ? 'Procesando cambios...' : sending ? 'Notificando paciente...' : showSavingSuccess ? 'Cambios sincronizados' : initialData?.enviada ? 'Enviada al paciente' : 'Borrador editable'}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleSave}
                        disabled={saving || sending}
                        className="px-6 py-3 text-sm font-bold text-[#1a3a5c] bg-slate-100 border border-slate-200 outline-none
                                   hover:bg-slate-200 hover:border-slate-300 rounded-xl transition-all shadow-sm
                                   flex items-center gap-2 disabled:opacity-50 active:scale-95"
                    >
                        {saving ? 'Guardando...' : '💾 Guardar Cambios'}
                    </button>

                    <button
                        onClick={handleSend}
                        disabled={saving || sending}
                        className="px-6 py-3 text-sm font-bold text-white shadow-xl shadow-[#23bcef]/20
                                   bg-gradient-to-r from-[#23bcef] to-[#1a3a5c] hover:from-[#1da7d6] hover:to-[#15305a] 
                                   rounded-xl transition-all flex items-center gap-2 disabled:opacity-50 active:scale-95 border border-[#23bcef]/50"
                    >
                        {sending ? 'Enviando...' : '📱 Sincronizar con App'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── COMPONENTES INTERNOS ───

function SectionCard({ icon, title, color, items, extraContent, extraFooter, onAdd, onRemove, onEdit }: {
    icon: string;
    title: string;
    color: 'amber' | 'green' | 'blue' | 'purple' | 'red';
    items: string[];
    extraContent?: React.ReactNode;
    extraFooter?: string;
    onAdd?: () => void;
    onRemove?: (index: number) => void;
    onEdit?: (index: number) => void;
}) {
    const colors = {
        amber: 'bg-amber-50/50 border-amber-100/60 text-amber-900 border-l-4 border-l-amber-400',
        green: 'bg-emerald-50/50 border-emerald-100/60 text-emerald-900 border-l-4 border-l-emerald-400',
        blue: 'bg-sky-50/50 border-sky-100/60 text-sky-900 border-l-4 border-l-sky-400',
        purple: 'bg-purple-50/50 border-purple-100/60 text-purple-900 border-l-4 border-l-purple-400',
        red: 'bg-red-50/50 border-red-100/60 text-red-900 border-l-4 border-l-red-400',
    };

    const titleColors = {
        amber: 'text-amber-700',
        green: 'text-emerald-700',
        blue: 'text-sky-700',
        purple: 'text-purple-700',
        red: 'text-red-700',
    };

    return (
        <div className={`${colors[color]} border-y border-r rounded-r-2xl rounded-l-md p-6 shadow-sm group/card`}>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <span className="text-2xl drop-shadow-sm">{icon}</span>
                    <h4 className={`font-extrabold text-lg uppercase tracking-wide ${titleColors[color]}`}>{title}</h4>
                </div>
                {onAdd && (
                    <button
                        onClick={onAdd}
                        className="bg-white/80 hover:bg-white text-[10px] font-black uppercase px-3 py-1.5 rounded-lg border border-current transition-all active:scale-95 flex items-center gap-1 group-hover/card:scale-110"
                    >
                        <span>+</span> Añadir
                    </button>
                )}
            </div>
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2.5 mb-4">
                {items.map((item, i) => (
                    <li key={i} className={`text-sm font-medium flex items-start gap-2.5 opacity-90 leading-snug group/item`}>
                        <span className="mt-1 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-current opacity-40"></span>
                        <span className="flex-1">{item}</span>
                        <div className="flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-all">
                            {onEdit && (
                                <button
                                    onClick={() => onEdit(i)}
                                    className="text-slate-400 hover:text-slate-600 p-1"
                                    title="Editar"
                                >
                                    <Edit2 size={12} />
                                </button>
                            )}
                            {onRemove && (
                                <button
                                    onClick={() => onRemove(i)}
                                    className="text-red-400 hover:text-red-600 p-1"
                                    title="Eliminar"
                                >
                                    <X size={14} strokeWidth={3} />
                                </button>
                            )}
                        </div>
                    </li>
                ))}
            </ul>
            {extraFooter && (
                <div className="mt-2 text-xs font-black italic opacity-60 flex items-center gap-2">
                    <span className="w-1 h-1 bg-current rounded-full"></span>
                    {extraFooter}
                </div>
            )}
            {extraContent}
        </div>
    );
}

function DetailRow({ label, items, color }: { label: string; items: string[], color: string }) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3 text-sm">
            <span className={`font-extrabold uppercase text-[10px] tracking-widest text-${color} flex-shrink-0 sm:w-36 pt-0.5`}>{label}</span>
            <span className="font-medium text-slate-600 leading-relaxed">{items.join(', ')}</span>
        </div>
    );
}