import React, { useState } from 'react';
import {
  ArrowRight,
  Store,
  Lock,
  Mail,
  AlertCircle,
  ChefHat,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ASSET_IMAGES } from '../services/assetPaths';
import { API_BASE_URL } from '../services/api';
import { BrandMark } from '../components/AdminLayout';
import { ResilientImage } from '../components/ResilientImage';

export function LoginPage() {
  const { login, navigate, storeSlug } = useApp();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, senha);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Não foi possível autenticar. Verifique suas credenciais ou o servidor.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen grid-cols-1 bg-[#FAF7F2] lg:grid-cols-12">
      {/* Left Artisanal Editorial Showcase */}
      <div className="relative hidden overflow-hidden bg-[#291D16] lg:col-span-6 lg:flex lg:flex-col lg:justify-between">
        <ResilientImage
          src={ASSET_IMAGES.hero}
          alt="Pudim artesanal de leite condensado com calda brilhante de caramelo"
          className="absolute inset-0 h-full w-full object-cover opacity-75"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#21150F]/92 via-[#291D16]/45 to-[#291D16]/35" />

        <div className="relative z-10 p-10">
          <div className="inline-flex items-center gap-2.5 text-[#FAF7F2]">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#D97706] text-white">
              <ChefHat className="h-5 w-5" />
            </div>
            <span className="font-display text-xl font-semibold tracking-tight">
              PudimFlow
            </span>
          </div>
        </div>

        <div className="relative z-10 max-w-xl p-10 pb-12 text-[#FAF7F2]">
          <p className="text-sm font-medium text-amber-200/90">
            Operação de confeitaria artesanal
          </p>
          <h1
            className="mt-3 font-display text-4xl font-semibold leading-tight tracking-tight text-white"
            style={{ textWrap: 'balance' }}
          >
            Do primeiro atendimento no WhatsApp ao ponto perfeito na cozinha.
          </h1>
          <p className="mt-4 text-base leading-relaxed text-[#E7DDD1]">
            Organize sua fila de produção em tempo real, acompanhe a margem de cada sabor
            e deixe a inteligência artificial anotar encomendas enquanto você confeita.
          </p>

          <div className="mt-8 grid grid-cols-3 gap-6 border-t border-white/15 pt-6 text-sm">
            <div>
              <p className="font-mono text-lg font-semibold text-white tabular-nums">
                Multi-Tenant
              </p>
              <p className="mt-0.5 text-xs text-[#D6C8B8]">Cardápio por slug exclusivo</p>
            </div>
            <div>
              <p className="font-mono text-lg font-semibold text-white tabular-nums">
                Tempo Real
              </p>
              <p className="mt-0.5 text-xs text-[#D6C8B8]">Kanban direto na cozinha</p>
            </div>
            <div>
              <p className="font-mono text-lg font-semibold text-white tabular-nums">
                WhatsApp IA
              </p>
              <p className="mt-0.5 text-xs text-[#D6C8B8]">Atendimento com seu tom de voz</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Authentication Panel */}
      <div className="flex flex-col justify-between px-6 py-8 sm:px-12 lg:col-span-6 lg:px-16 lg:py-12">
        <div className="flex items-center justify-between">
          <div className="lg:hidden">
            <BrandMark />
          </div>
          <button
            type="button"
            onClick={() => storeSlug && navigate(`/${storeSlug}`)}
            className="ml-auto inline-flex items-center gap-2 text-sm font-medium text-[#B45309] transition-colors hover:text-[#92400E] whitespace-nowrap"
          >
            <Store className="h-4 w-4" />
            <span>Ver Cardápio Público</span>
          </button>
        </div>

        <div className="mx-auto my-10 w-full max-w-md">
          <div>
            <h2 className="font-display text-3xl font-semibold tracking-tight text-[#291D16]">
              Entrar no painel
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[#6B574A]">
              Acesse a cozinha, estoque e agente de IA da sua pudimeria.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {error && (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-900"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-700" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label
                htmlFor="login-email"
                className="block text-sm font-medium text-[#291D16]"
              >
                E-mail profissional
              </label>
              <div className="relative mt-1.5">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8C7768]" />
                <input
                  id="login-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="voce@suapudimeria.com.br"
                  className="w-full rounded-xl border border-[#DFD4C6] bg-white py-2.5 pl-10 pr-4 text-sm text-[#291D16] placeholder-[#9E8B7C] transition-colors focus:border-[#B45309] focus:outline-none focus:ring-2 focus:ring-[#B45309]/15"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="login-password"
                className="block text-sm font-medium text-[#291D16]"
              >
                Senha
              </label>
              <div className="relative mt-1.5">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8C7768]" />
                <input
                  id="login-password"
                  type="password"
                  required
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="Sua senha de acesso"
                  className="w-full rounded-xl border border-[#DFD4C6] bg-white py-2.5 pl-10 pr-4 text-sm text-[#291D16] placeholder-[#9E8B7C] transition-colors focus:border-[#B45309] focus:outline-none focus:ring-2 focus:ring-[#B45309]/15"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#B45309] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#92400E] disabled:opacity-60"
            >
              <span>{loading ? 'Entrando...' : 'Entrar na plataforma'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

        </div>

        <div className="mx-auto w-full max-w-md border-t border-[#E8DFD3] pt-4 text-center text-xs text-[#7A6658]">
          API: {API_BASE_URL}
        </div>
      </div>
    </div>
  );
}
