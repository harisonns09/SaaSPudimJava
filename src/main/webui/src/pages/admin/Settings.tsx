import { FormEvent, useEffect, useState } from 'react';
import { LoaderCircle, Save } from 'lucide-react';
import { api } from '../../services/api';
import { StoreConfig } from '../../types';

interface FormState {
    nomeLoja: string;
    subtitulo: string;
    taxaEntregaPadrao: string;
    abertaParaEncomendas: boolean;
    infinitepayHandle: string;
}

interface Feedback {
    type: 'success' | 'error';
    message: string;
}

const inputClass =
    'w-full rounded-lg border border-[#EAE1D5] bg-white px-3 py-2 text-sm text-[#291D16] placeholder:text-[#A0907F] focus:border-[#B45309] focus:outline-none';

function toForm(config: StoreConfig): FormState {
    return {
        nomeLoja: config.nomeLoja ?? '',
        subtitulo: config.subtitulo ?? '',
        taxaEntregaPadrao: config.taxaEntregaPadrao != null ? String(config.taxaEntregaPadrao) : '',
        abertaParaEncomendas: config.abertaParaEncomendas,
        infinitepayHandle: config.infinitepayHandle ?? '',
    };
}

export function SettingsPage() {
    const [config, setConfig] = useState<StoreConfig | null>(null);
    const [form, setForm] = useState<FormState | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [feedback, setFeedback] = useState<Feedback | null>(null);

    useEffect(() => {
        api
            .getStoreConfig()
            .then((data) => {
                setConfig(data);
                setForm(toForm(data));
            })
            .catch((error: unknown) =>
                setFeedback({
                    type: 'error',
                    message: error instanceof Error ? error.message : 'Não foi possível carregar a loja.',
                }),
            )
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (!feedback) return;
        const timer = window.setTimeout(() => setFeedback(null), 4000);
        return () => window.clearTimeout(timer);
    }, [feedback]);

    const update = <K extends keyof FormState>(field: K, value: FormState[K]) =>
        setForm((current) => (current ? { ...current, [field]: value } : current));

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!form) return;

        const taxaTexto = form.taxaEntregaPadrao.trim().replace(',', '.');
        const taxa = taxaTexto === '' ? null : Number(taxaTexto);
        if (taxa !== null && (Number.isNaN(taxa) || taxa < 0)) {
            setFeedback({ type: 'error', message: 'Informe uma taxa de entrega válida (zero ou maior).' });
            return;
        }

        setSaving(true);
        setFeedback(null);
        try {
            const saved = await api.updateStoreConfig({
                nomeLoja: form.nomeLoja.trim(),
                subtitulo: form.subtitulo.trim() || null,
                taxaEntregaPadrao: taxa,
                abertaParaEncomendas: form.abertaParaEncomendas,
                infinitepayHandle: form.infinitepayHandle.trim() || null,
            });
            setConfig(saved);
            setForm(toForm(saved));
            setFeedback({ type: 'success', message: 'Configurações salvas.' });
        } catch (error) {
            setFeedback({
                type: 'error',
                message: error instanceof Error ? error.message : 'Não foi possível salvar as configurações.',
            });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center gap-2 text-sm text-[#7A6658]">
                <LoaderCircle className="h-4 w-4 animate-spin" /> Carregando configurações...
            </div>
        );
    }

    if (!config || !form) {
        return (
            <div role="alert" className="rounded-lg bg-[#FEF2F2] px-4 py-3 text-sm text-[#991B1B]">
                {feedback?.message ?? 'Não foi possível carregar a loja.'}
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="max-w-2xl space-y-5">
            {feedback && (
                <div
                    role="status"
                    className={`rounded-lg px-4 py-3 text-sm font-medium ${
                        feedback.type === 'success' ? 'bg-[#ECFDF3] text-[#166534]' : 'bg-[#FEF2F2] text-[#991B1B]'
                    }`}
                >
                    {feedback.message}
                </div>
            )}

            <section className="space-y-4 rounded-xl border border-[#EAE1D5] bg-white p-5">
                <h2 className="font-display text-base font-semibold text-[#291D16]">Dados da loja</h2>

                <label className="block space-y-1">
                    <span className="text-xs font-medium text-[#5C4A3E]">Nome da loja *</span>
                    <input
                        required
                        value={form.nomeLoja}
                        onChange={(event) => update('nomeLoja', event.target.value)}
                        className={inputClass}
                    />
                </label>

                <label className="block space-y-1">
                    <span className="text-xs font-medium text-[#5C4A3E]">Subtítulo</span>
                    <input
                        value={form.subtitulo}
                        onChange={(event) => update('subtitulo', event.target.value)}
                        placeholder="Ex.: Pudins artesanais feitos com carinho"
                        className={inputClass}
                    />
                </label>

                <div className="block space-y-1">
                    <span className="text-xs font-medium text-[#5C4A3E]">Endereço público da loja</span>
                    <p className="rounded-lg bg-[#FAF7F2] px-3 py-2 text-sm text-[#7A6658]">/{config.slug}</p>
                    <p className="text-xs text-[#A0907F]">
                        Definido no cadastro e não pode ser alterado, pois links já enviados aos clientes dependem dele.
                    </p>
                </div>
            </section>

            <section className="space-y-4 rounded-xl border border-[#EAE1D5] bg-white p-5">
                <h2 className="font-display text-base font-semibold text-[#291D16]">Entregas e pedidos</h2>

                <label className="block space-y-1">
                    <span className="text-xs font-medium text-[#5C4A3E]">Taxa de entrega padrão (R$)</span>
                    <input
                        inputMode="decimal"
                        value={form.taxaEntregaPadrao}
                        onChange={(event) => update('taxaEntregaPadrao', event.target.value)}
                        placeholder="0,00"
                        className={inputClass}
                    />
                </label>

                <label className="flex items-center gap-3">
                    <input
                        type="checkbox"
                        checked={form.abertaParaEncomendas}
                        onChange={(event) => update('abertaParaEncomendas', event.target.checked)}
                        className="h-4 w-4 accent-[#B45309]"
                    />
                    <span className="text-sm text-[#291D16]">Aceitando encomendas no cardápio público</span>
                </label>
            </section>

            <section className="space-y-4 rounded-xl border border-[#EAE1D5] bg-white p-5">
                <h2 className="font-display text-base font-semibold text-[#291D16]">Pagamento online (InfinitePay)</h2>

                <label className="block space-y-1">
                    <span className="text-xs font-medium text-[#5C4A3E]">InfiniteTag</span>
                    <input
                        value={form.infinitepayHandle}
                        onChange={(event) => update('infinitepayHandle', event.target.value)}
                        placeholder="sua-tag (sem o $)"
                        className={inputClass}
                    />
                    <p className="text-xs text-[#A0907F]">Sem InfiniteTag, os pedidos são criados sem cobrança online.</p>
                </label>
            </section>

            <div className="flex justify-end">
                <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#B45309] px-4 py-2 text-sm font-semibold text-white hover:bg-[#9A3412] disabled:opacity-50"
                >
                    {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Salvar alterações
                </button>
            </div>
        </form>
    );
}
