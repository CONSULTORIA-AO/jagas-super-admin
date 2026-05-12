import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { useVendorApprovalStore } from '@/hooks/aprovar';
import { RejectForm, RejectFormSchema } from '@/schema/aprovar.schema';
import { REJECT_REASONS } from '@/constants/aprovar';

interface RejectModalProps {
  vendorId: string;
  vendorName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function RejectModal({
  vendorId,
  vendorName,
  onClose,
  onSuccess,
}: RejectModalProps) {
  const updateVendorStatus = useVendorApprovalStore(
    (s) => s.updateVendorStatus
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RejectForm>({
    resolver: zodResolver(RejectFormSchema),
    defaultValues: { motivo: REJECT_REASONS[0], descricao: '' },
  });

  const descricao = watch('descricao') ?? '';

  // Prevent background scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: RejectForm) => {
      try {
        await api.post(`/admin/vendors/${vendorId}/reject`, data);
      } catch {
        // mock during dev
        await new Promise((r) => setTimeout(r, 800));
      }
    },
    onSuccess: () => {
      updateVendorStatus(vendorId, 'reprovado');
      onSuccess();
    },
  });

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-[fadeSlideIn_0.25s_ease]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-base font-black text-red-600 flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px]">
              report_problem
            </span>
            Motivo da Reprovação
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Body */}
        <form
          onSubmit={handleSubmit((d) => mutate(d))}
          className="p-6 flex flex-col gap-5"
        >
          <p className="text-sm text-slate-500 leading-relaxed">
            Informe por que{' '}
            <strong className="text-slate-700">{vendorName}</strong> não foi
            aprovado. O texto será enviado por e-mail ao responsável.
          </p>

          {/* Motivo */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Motivo Padrão
            </label>
            <div className="relative">
              <select
                {...register('motivo')}
                className="w-full h-11 px-4 pr-9 rounded-xl border-2 border-slate-200 text-sm text-slate-800 bg-white focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 appearance-none"
              >
                {REJECT_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-[18px]">
                expand_more
              </span>
            </div>
            {errors.motivo && (
              <p className="text-xs text-red-500">{errors.motivo.message}</p>
            )}
          </div>

          {/* Descrição */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Descrição Adicional
            </label>
            <textarea
              {...register('descricao')}
              rows={4}
              placeholder="Ex: O Alvará enviado expirou em 2023. Por favor, envie o documento actualizado."
              className={`w-full px-4 py-3 rounded-xl border-2 text-sm text-slate-800 placeholder-slate-300 resize-none focus:outline-none focus:ring-2 focus:ring-orange-100 transition-all
                ${errors.descricao ? 'border-red-300 focus:border-red-400' : 'border-slate-200 focus:border-orange-400'}`}
            />
            <div className="flex justify-between items-center">
              {errors.descricao ? (
                <p className="text-xs text-red-500">
                  {errors.descricao.message}
                </p>
              ) : (
                <span />
              )}
              <p
                className={`text-xs ${descricao.length > 480 ? 'text-red-500' : 'text-slate-400'}`}
              >
                {descricao.length}/500
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-11 rounded-xl border-2 border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 h-11 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-100 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {isPending ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  A reprovar...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">
                    cancel
                  </span>
                  Confirmar
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
