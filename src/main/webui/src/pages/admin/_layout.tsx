import { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    LogOut,
    Menu,
    Package,
    ShoppingBag,
    Sparkles,
    X,
} from 'lucide-react';
import { BrandMark } from '../../components/BrandMark';
import { useAuth } from '../../context/AuthContext';
import { api, isImpersonating } from '../../services/api';

const navigation = [
    { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { label: 'Pedidos', path: '/admin/pedidos', icon: ShoppingBag },
    { label: 'Produtos & Estoque', path: '/admin/produtos', icon: Package },
    { label: 'Agente de IA & Loja', path: '/admin/configuracoes', icon: Sparkles },
];

const pageTitles: Record<string, string> = {
    '/admin': 'Visão geral',
    '/admin/pedidos': 'Pedidos',
    '/admin/produtos': 'Produtos & Estoque',
    '/admin/configuracoes': 'Agente de IA & Configurações da Loja',
};

export function AdminLayout() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const { session, login, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const title = pageTitles[location.pathname] ?? 'Painel administrativo';
    const supportMode = isImpersonating();

    const exitSupport = () => {
        const original = api.encerrarSuporte();
        if (original) login(original);
        navigate('/superadmin');
    };

    const sidebar = (
        <div className="flex h-full flex-col justify-between bg-white">
            <div>
                <div className="flex items-center justify-between border-b border-[#EAE1D5] px-5 py-4">
                    <button
                        type="button"
                        onClick={() => navigate('/admin')}
                        aria-label="Ir para o dashboard"
                        className="rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B45309]"
                    >
                        <BrandMark />
                    </button>
                    <button
                        type="button"
                        onClick={() => setMobileMenuOpen(false)}
                        aria-label="Fechar menu"
                        className="rounded-lg p-1.5 text-[#6B574A] hover:bg-[#FAF7F2] lg:hidden"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="border-b border-[#F2EAE0] px-5 py-4">
                    <p className="text-xs font-medium text-[#856F60]">Confeitaria ativa</p>
                    <p className="mt-0.5 truncate font-display text-base font-semibold text-[#291D16]">
                        {session?.nome || 'Minha confeitaria'}
                    </p>
                </div>

                <nav className="space-y-1 p-3" aria-label="Navegação principal">
                    {navigation.map(({ label, path, icon: Icon }) => (
                        <NavLink
                            key={path}
                            to={path}
                            end={path === '/admin'}
                            onClick={() => setMobileMenuOpen(false)}
                            className={({ isActive }) =>
                                `flex w-full items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors ${
                                    isActive
                                        ? 'bg-[#FAF3E8] text-[#9A3412]'
                                        : 'text-[#5C4A3E] hover:bg-[#FAF7F2] hover:text-[#291D16]'
                                }`
                            }
                        >
                            <Icon className="h-4 w-4 shrink-0" />
                            <span>{label}</span>
                        </NavLink>
                    ))}
                </nav>
            </div>

            <div className="flex items-center justify-between gap-2 border-t border-[#EAE1D5] p-4">
                <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-[#291D16]">
                        {session?.nome || 'Confeiteira'}
                    </p>
                    <p className="truncate text-[11px] text-[#7A6658]">
                        {session?.email}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => {
                        logout();
                        navigate('/login');
                    }}
                    title="Sair da conta"
                    aria-label="Sair da conta"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#7A6658] transition-colors hover:bg-[#FAF7F2] hover:text-[#291D16]"
                >
                    <LogOut className="h-4 w-4" />
                </button>
            </div>
        </div>
    );

    return (
        <div className="flex min-h-screen bg-[#FAF7F2] text-[#291D16]">
            <aside className="hidden w-64 shrink-0 border-r border-[#EAE1D5] bg-white lg:block">
                <div className="sticky top-0 h-screen">{sidebar}</div>
            </aside>

            {mobileMenuOpen && (
                <div className="fixed inset-0 z-40 flex lg:hidden">
                    <button
                        type="button"
                        aria-label="Fechar menu"
                        className="fixed inset-0 bg-[#291D16]/40 backdrop-blur-[1px]"
                        onClick={() => setMobileMenuOpen(false)}
                    />
                    <aside className="relative z-10 h-full w-72 max-w-[85vw] border-r border-[#EAE1D5] bg-white shadow-xl">
                        {sidebar}
                    </aside>
                </div>
            )}

            <div className="flex min-w-0 flex-1 flex-col">
                {supportMode && (
                    <div
                        role="status"
                        className="flex flex-wrap items-center justify-between gap-2 bg-[#B45309] px-4 py-2 text-sm text-white sm:px-6 lg:px-8"
                    >
                        <span>
                            Modo suporte: você está acessando a loja <strong>{session?.nome}</strong> como superadmin.
                        </span>
                        <button
                            type="button"
                            onClick={exitSupport}
                            className="rounded-md bg-white/15 px-3 py-1 font-semibold hover:bg-white/25"
                        >
                            Sair do suporte
                        </button>
                    </div>
                )}
                <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-[#EAE1D5] bg-white/95 px-4 py-3.5 backdrop-blur-sm sm:px-6 lg:px-8">

                    <button
                        type="button"
                        onClick={() => setMobileMenuOpen(true)}
                        aria-label="Abrir menu lateral"
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#EAE1D5] bg-[#FAF7F2] text-[#291D16] lg:hidden"
                    >
                        <Menu className="h-4.5 w-4.5" />
                    </button>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 text-xs text-[#7A6658]">
                            <span className="truncate">PudimFlow</span>
                            <span aria-hidden="true">/</span>
                            <span className="truncate font-medium text-[#5C4A3E]">{title}</span>
                        </div>
                        <h1 className="truncate font-display text-lg font-semibold text-[#291D16] sm:text-xl">
                            {title}
                        </h1>
                    </div>
                </header>

                <main className="flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
