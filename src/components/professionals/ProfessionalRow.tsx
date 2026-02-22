import { MoreHorizontal, CreditCard, Edit2, Trash2, History } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

interface TestBalances {
    BIOFISICA: number;
    BIOQUIMICA: number;
    ORTOMOLECULAR: number;
    GENETICA: number;
}

interface ProfessionalRowProps {
    prof: {
        id: string;
        name: string;
        email: string;
        role: string;
        status: string;
        balances: TestBalances;
    };
    isAdmin?: boolean;
    onEdit: () => void;
    onDelete: () => void;
    onRecharge: () => void;
}

const BADGE_CONFIG: Record<keyof TestBalances, { label: string; color: string }> = {
    BIOFISICA: { label: 'Biofísica', color: 'bg-blue-50 text-blue-700 border border-blue-200' },
    BIOQUIMICA: { label: 'Bioquímica', color: 'bg-violet-50 text-violet-700 border border-violet-200' },
    ORTOMOLECULAR: { label: 'Ortomolecular', color: 'bg-amber-50 text-amber-700 border border-amber-200' },
    GENETICA: { label: 'Genética', color: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
};

export const ProfessionalRow = ({ prof, isAdmin, onEdit, onDelete, onRecharge }: ProfessionalRowProps) => {
    return (
        <tr className="hover:bg-slate-50/50 transition-colors border-b border-slate-100">
            <td className="p-4">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-[#293b64] text-white flex items-center justify-center font-bold text-sm">
                        {prof.name ? prof.name[0] : '?'}
                    </div>
                    <span className="font-bold text-slate-800">{prof.name}</span>
                </div>
            </td>
            <td className="p-4 text-sm font-medium text-slate-600">{prof.role}</td>
            <td className="p-4 text-center">
                <span className={`px-3 py-1 rounded-full text-xs font-black uppercase ${prof.status === 'ACTIVO' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                    {prof.status || 'INACTIVO'}
                </span>
            </td>
            <td className="p-4">
                <div className="flex flex-wrap items-center gap-2">
                    {(Object.keys(BADGE_CONFIG) as (keyof TestBalances)[]).map((type) => {
                        const balance = prof.balances[type];
                        const isLow = balance > 0 && balance < 5;
                        const isEmpty = balance <= 0;
                        return (
                            <span
                                key={type}
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${isEmpty
                                    ? 'bg-slate-100 text-slate-400 border border-slate-200'
                                    : isLow
                                        ? 'bg-rose-50 text-rose-600 border border-rose-200 animate-pulse'
                                        : BADGE_CONFIG[type].color
                                    }`}
                            >
                                {BADGE_CONFIG[type].label}
                                <span className="font-mono font-black text-sm">{balance}</span>
                            </span>
                        );
                    })}
                </div>
            </td>
            <td className="p-4 text-right">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52 rounded-2xl p-2 shadow-xl border-slate-100 bg-white">
                        <DropdownMenuItem onClick={onRecharge} className="flex gap-2 p-3 font-bold text-xs uppercase text-[#23bcef] cursor-pointer hover:bg-slate-50">
                            <CreditCard size={16} /> Recargar Créditos
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={onEdit} className="flex gap-2 p-3 font-bold text-xs uppercase text-slate-600 cursor-pointer hover:bg-slate-50">
                            <Edit2 size={16} /> Editar Datos
                        </DropdownMenuItem>
                        <DropdownMenuItem className="flex gap-2 p-3 font-bold text-xs uppercase text-slate-600 cursor-pointer hover:bg-slate-50">
                            <History size={16} /> Ver Consumo
                        </DropdownMenuItem>
                        {isAdmin && (
                            <>
                                <div className="h-[1px] bg-slate-100 my-1" />
                                <DropdownMenuItem
                                    onClick={onDelete}
                                    className="flex gap-2 p-3 font-bold text-xs uppercase text-rose-600 cursor-pointer hover:bg-rose-50"
                                >
                                    <Trash2 size={16} /> Eliminar
                                </DropdownMenuItem>
                            </>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </td>
        </tr>
    );
};
