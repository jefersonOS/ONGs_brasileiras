import Link from 'next/link'
import {
    ArrowRight, BarChart3, BookOpen, Building2, CheckCircle,
    FileText, Globe, Heart, LayoutDashboard, MessageSquare,
    Shield, Sparkles, Users, Zap
} from 'lucide-react'

export const metadata = {
    title: 'Nexori — Plataforma de Gestão para ONGs',
    description: 'Gerencie sua organização social com tecnologia moderna. Cursos, atividades, prestações de contas e muito mais em um só lugar.',
}

const FEATURES = [
    {
        icon: LayoutDashboard,
        title: 'Dashboard Completo',
        desc: 'Visão 360° da sua organização: indicadores, projetos, impacto social e financeiro em tempo real.',
    },
    {
        icon: BookOpen,
        title: 'Gestão de Cursos',
        desc: 'Crie cursos profissionalizantes, gerencie turmas, emita certificados e acompanhe inscrições com facilidade.',
    },
    {
        icon: Users,
        title: 'Portal Público da ONG',
        desc: 'Cada organização ganha um portal exclusivo com suas cores e identidade para atrair beneficiários.',
    },
    {
        icon: FileText,
        title: 'Planos de Trabalho',
        desc: 'Importe modelos em PDF, preencha com IA e exporte em Word — pronto para submeter ao governo.',
    },
    {
        icon: BarChart3,
        title: 'Prestação de Contas',
        desc: 'Relatórios financeiros, comprovantes e documentos organizados e prontos para auditoria.',
    },
    {
        icon: Sparkles,
        title: 'IA Integrada',
        desc: 'Assistente inteligente que ajuda a redigir projetos, planos, relatórios e responde dúvidas dos beneficiários.',
    },
    {
        icon: Shield,
        title: 'Multi-Tenant Seguro',
        desc: 'Dados de cada organização completamente isolados. Segurança e conformidade com a LGPD.',
    },
    {
        icon: Globe,
        title: 'Domínio Próprio',
        desc: 'Configure um subdomínio exclusivo ou use seu próprio domínio para o portal da ONG.',
    },
]

const STEPS = [
    { num: '01', title: 'Crie sua conta', desc: 'Registre sua ONG gratuitamente em menos de 2 minutos.' },
    { num: '02', title: 'Configure o portal', desc: 'Defina as cores, logo e identidade visual da sua organização.' },
    { num: '03', title: 'Convide sua equipe', desc: 'Adicione colaboradores com permissões personalizadas.' },
    { num: '04', title: 'Comece a impactar', desc: 'Publique cursos, atividades e gerencie tudo em um só lugar.' },
]

const PLANS = [
    {
        name: 'Essencial',
        price: 'Gratuito',
        period: 'para sempre',
        highlight: false,
        features: [
            '1 organização',
            'Até 3 usuários',
            'Portal público básico',
            '50 beneficiários',
            'Suporte por e-mail',
        ],
        cta: 'Começar grátis',
        href: '/signup',
    },
    {
        name: 'Profissional',
        price: 'R$ 197',
        period: 'por mês',
        highlight: true,
        features: [
            '1 organização',
            'Usuários ilimitados',
            'Portal com domínio próprio',
            'Beneficiários ilimitados',
            'IA assistente ativa',
            'Planos de trabalho com IA',
            'Suporte prioritário',
        ],
        cta: 'Assinar agora',
        href: '/signup?plano=pro',
    },
    {
        name: 'Rede',
        price: 'R$ 497',
        period: 'por mês',
        highlight: false,
        features: [
            'Até 10 organizações',
            'Usuários ilimitados',
            'Portal para cada ONG',
            'Relatórios consolidados',
            'IA sem limites',
            'Onboarding dedicado',
            'SLA garantido',
        ],
        cta: 'Falar com vendas',
        href: '/signup?plano=rede',
    },
]

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-white font-sans">

            {/* ── NAVBAR ── */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-[#1A3C4A] flex items-center justify-center">
                            <Heart className="w-4 h-4 text-[#2D9E6B]" />
                        </div>
                        <span className="font-black text-xl text-[#1A3C4A] tracking-tighter">Nexori</span>
                    </div>
                    <div className="hidden md:flex items-center gap-8 text-sm font-bold text-gray-500">
                        <a href="#funcionalidades" className="hover:text-[#1A3C4A] transition-colors">Funcionalidades</a>
                        <a href="#como-funciona" className="hover:text-[#1A3C4A] transition-colors">Como funciona</a>
                        <a href="#planos" className="hover:text-[#1A3C4A] transition-colors">Planos</a>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href="/login" className="text-sm font-bold text-gray-600 hover:text-[#1A3C4A] transition-colors">
                            Entrar
                        </Link>
                        <Link href="/signup" className="px-4 py-2 bg-[#2D9E6B] text-white text-sm font-black rounded-xl hover:bg-[#1A3C4A] transition-all shadow-lg shadow-green-600/20">
                            Criar conta grátis
                        </Link>
                    </div>
                </div>
            </nav>

            {/* ── HERO ── */}
            <section className="pt-32 pb-24 px-6 bg-gradient-to-br from-[#1A3C4A] via-[#1A3C4A] to-[#0f2530] text-white relative overflow-hidden">
                <div className="absolute inset-0 opacity-5 pointer-events-none"
                    style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />
                <div className="absolute -right-32 -top-32 w-[600px] h-[600px] rounded-full bg-[#2D9E6B]/10 blur-3xl pointer-events-none" />
                <div className="absolute -left-32 -bottom-32 w-[400px] h-[400px] rounded-full bg-[#2D9E6B]/5 blur-3xl pointer-events-none" />

                <div className="max-w-5xl mx-auto text-center relative z-10">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#2D9E6B]/20 border border-[#2D9E6B]/30 text-[#2D9E6B] text-xs font-black uppercase tracking-widest mb-8">
                        <Zap className="w-3.5 h-3.5" /> Plataforma SaaS para Terceiro Setor
                    </div>

                    <h1 className="text-5xl md:text-7xl font-black leading-[1.05] tracking-tighter mb-8">
                        Gerencie sua ONG com{' '}
                        <span className="text-[#2D9E6B]">tecnologia</span>{' '}
                        que gera impacto
                    </h1>

                    <p className="text-xl text-white/60 max-w-2xl mx-auto font-medium mb-12 leading-relaxed">
                        Portal público exclusivo, cursos, atividades, planos de trabalho com IA e prestação de contas — tudo em uma plataforma feita para quem transforma comunidades.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link href="/signup"
                            className="px-8 py-4 bg-[#2D9E6B] text-white font-black text-sm uppercase tracking-widest rounded-2xl hover:bg-[#26875a] transition-all shadow-2xl shadow-green-600/30 flex items-center gap-2 group">
                            Criar conta gratuita <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <a href="#funcionalidades"
                            className="px-8 py-4 bg-white/10 text-white font-black text-sm uppercase tracking-widest rounded-2xl hover:bg-white/20 transition-all border border-white/10">
                            Ver funcionalidades
                        </a>
                    </div>

                    <div className="mt-16 flex flex-wrap items-center justify-center gap-8 text-white/40 text-xs font-bold uppercase tracking-widest">
                        <span className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-[#2D9E6B]" /> Sem cartão de crédito</span>
                        <span className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-[#2D9E6B]" /> LGPD Compliant</span>
                        <span className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-[#2D9E6B]" /> Suporte em português</span>
                        <span className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-[#2D9E6B]" /> IA inclusa</span>
                    </div>
                </div>
            </section>

            {/* ── NÚMEROS ── */}
            <section className="py-16 px-6 bg-gray-50 border-y border-gray-100">
                <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                    {[
                        { num: '500+', label: 'ONGs atendidas' },
                        { num: '80 mil', label: 'Beneficiários' },
                        { num: '12 mil', label: 'Cursos realizados' },
                        { num: '99.9%', label: 'Disponibilidade' },
                    ].map(item => (
                        <div key={item.label}>
                            <p className="text-4xl font-black text-[#1A3C4A]">{item.num}</p>
                            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mt-1">{item.label}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── FUNCIONALIDADES ── */}
            <section id="funcionalidades" className="py-28 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-20">
                        <div className="inline-flex items-center gap-2 text-[#2D9E6B] font-black uppercase text-xs tracking-widest mb-4">
                            <Sparkles className="w-4 h-4" /> Tudo que sua ONG precisa
                        </div>
                        <h2 className="text-5xl font-black text-[#1A3C4A] tracking-tighter">
                            Uma plataforma completa
                        </h2>
                        <p className="text-gray-400 text-lg mt-4 max-w-xl mx-auto">
                            Do portal público à prestação de contas, tudo integrado e pronto para usar.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {FEATURES.map(f => (
                            <div key={f.title}
                                className="p-6 rounded-[28px] bg-white border border-gray-100 hover:border-[#2D9E6B]/20 hover:shadow-xl hover:shadow-[#2D9E6B]/5 transition-all group">
                                <div className="w-12 h-12 rounded-2xl bg-[#1A3C4A]/5 flex items-center justify-center mb-4 group-hover:bg-[#2D9E6B]/10 transition-colors">
                                    <f.icon className="w-6 h-6 text-[#1A3C4A] group-hover:text-[#2D9E6B] transition-colors" />
                                </div>
                                <h3 className="font-black text-[#1A3C4A] mb-2">{f.title}</h3>
                                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── PORTAL EXCLUSIVO DESTAQUE ── */}
            <section className="py-28 px-6 bg-[#1A3C4A] relative overflow-hidden">
                <div className="absolute inset-0 opacity-5"
                    style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
                <div className="max-w-6xl mx-auto relative z-10 flex flex-col lg:flex-row items-center gap-16">
                    <div className="flex-1 text-white">
                        <div className="inline-flex items-center gap-2 text-[#2D9E6B] font-black uppercase text-xs tracking-widest mb-6">
                            <Globe className="w-4 h-4" /> Portal Exclusivo
                        </div>
                        <h2 className="text-5xl font-black tracking-tighter leading-tight mb-6">
                            Sua ONG com endereço próprio na internet
                        </h2>
                        <p className="text-white/60 text-lg leading-relaxed mb-8">
                            Cada organização ganha um portal público exclusivo no endereço <strong className="text-white">suaong.nexori.com.br</strong> — ou configure seu próprio domínio. Beneficiários acessam cursos e atividades diretamente.
                        </p>
                        <ul className="space-y-3">
                            {[
                                'Cores e logo personalizadas da sua ONG',
                                'Cursos e atividades visíveis publicamente',
                                'Inscrições online sem burocracia',
                                'Chat com IA para atender beneficiários',
                            ].map(item => (
                                <li key={item} className="flex items-center gap-3 text-white/80 font-medium">
                                    <CheckCircle className="w-5 h-5 text-[#2D9E6B] shrink-0" /> {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="flex-1 w-full max-w-md">
                        <div className="bg-white rounded-[32px] p-6 shadow-2xl">
                            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
                                <div className="w-10 h-10 rounded-xl bg-[#2D9E6B] flex items-center justify-center">
                                    <Heart className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <p className="font-black text-[#1A3C4A] text-sm">Instituto Esperança</p>
                                    <p className="text-xs text-gray-400">esperanca.nexori.com.br</p>
                                </div>
                            </div>
                            <div className="space-y-3">
                                {['Informática Básica', 'Costura e Bordado', 'Inglês para Iniciantes'].map((curso, i) => (
                                    <div key={curso} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-[#1A3C4A]/10 flex items-center justify-center">
                                                <BookOpen className="w-4 h-4 text-[#1A3C4A]" />
                                            </div>
                                            <span className="text-sm font-bold text-gray-700">{curso}</span>
                                        </div>
                                        <span className="text-[10px] font-black text-[#2D9E6B] uppercase bg-green-50 px-2 py-1 rounded-full">
                                            {i === 2 ? 'Novo' : 'Aberto'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4 p-3 bg-[#2D9E6B]/10 rounded-xl border border-[#2D9E6B]/20">
                                <div className="flex items-center gap-2">
                                    <MessageSquare className="w-4 h-4 text-[#2D9E6B]" />
                                    <span className="text-xs font-bold text-[#1A3C4A]">Assistente IA ativo</span>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Olá! Como posso ajudar você hoje?</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── COMO FUNCIONA ── */}
            <section id="como-funciona" className="py-28 px-6 bg-gray-50">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-20">
                        <div className="inline-flex items-center gap-2 text-[#2D9E6B] font-black uppercase text-xs tracking-widest mb-4">
                            <Zap className="w-4 h-4" /> Simples assim
                        </div>
                        <h2 className="text-5xl font-black text-[#1A3C4A] tracking-tighter">
                            Em 4 passos sua ONG está no ar
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {STEPS.map(step => (
                            <div key={step.num}
                                className="flex items-start gap-6 p-8 bg-white rounded-[28px] border border-gray-100 shadow-sm">
                                <span className="text-5xl font-black text-[#1A3C4A]/10 leading-none shrink-0">{step.num}</span>
                                <div>
                                    <h3 className="text-lg font-black text-[#1A3C4A] mb-2">{step.title}</h3>
                                    <p className="text-gray-500 font-medium">{step.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── PLANOS ── */}
            <section id="planos" className="py-28 px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-20">
                        <div className="inline-flex items-center gap-2 text-[#2D9E6B] font-black uppercase text-xs tracking-widest mb-4">
                            <Building2 className="w-4 h-4" /> Preços transparentes
                        </div>
                        <h2 className="text-5xl font-black text-[#1A3C4A] tracking-tighter">
                            Escolha seu plano
                        </h2>
                        <p className="text-gray-400 text-lg mt-4">
                            Comece grátis e escale conforme sua organização cresce.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
                        {PLANS.map(plan => (
                            <div key={plan.name}
                                className={`rounded-[32px] p-8 border ${plan.highlight
                                    ? 'bg-[#1A3C4A] border-[#1A3C4A] text-white shadow-2xl shadow-[#1A3C4A]/30 scale-105'
                                    : 'bg-white border-gray-100'}`}>
                                {plan.highlight && (
                                    <div className="inline-flex items-center gap-1 text-[#2D9E6B] bg-[#2D9E6B]/10 border border-[#2D9E6B]/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
                                        <Zap className="w-3 h-3" /> Mais popular
                                    </div>
                                )}
                                <h3 className={`text-xl font-black mb-2 ${plan.highlight ? 'text-white' : 'text-[#1A3C4A]'}`}>
                                    {plan.name}
                                </h3>
                                <div className="mb-6">
                                    <span className={`text-4xl font-black ${plan.highlight ? 'text-white' : 'text-[#1A3C4A]'}`}>
                                        {plan.price}
                                    </span>
                                    <span className={`text-sm font-medium ml-2 ${plan.highlight ? 'text-white/50' : 'text-gray-400'}`}>
                                        {plan.period}
                                    </span>
                                </div>
                                <ul className="space-y-3 mb-8">
                                    {plan.features.map(feat => (
                                        <li key={feat} className={`flex items-center gap-3 text-sm font-medium ${plan.highlight ? 'text-white/80' : 'text-gray-600'}`}>
                                            <CheckCircle className={`w-4 h-4 shrink-0 ${plan.highlight ? 'text-[#2D9E6B]' : 'text-[#2D9E6B]'}`} />
                                            {feat}
                                        </li>
                                    ))}
                                </ul>
                                <Link href={plan.href}
                                    className={`block text-center py-3 px-6 rounded-2xl font-black text-sm uppercase tracking-widest transition-all ${plan.highlight
                                        ? 'bg-[#2D9E6B] text-white hover:bg-[#26875a] shadow-lg shadow-green-600/30'
                                        : 'bg-[#1A3C4A]/5 text-[#1A3C4A] hover:bg-[#1A3C4A] hover:text-white'}`}>
                                    {plan.cta}
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CTA FINAL ── */}
            <section className="py-28 px-6 bg-gradient-to-br from-[#2D9E6B] to-[#1A3C4A]">
                <div className="max-w-3xl mx-auto text-center text-white">
                    <h2 className="text-5xl font-black tracking-tighter mb-6 leading-tight">
                        Sua ONG merece a melhor tecnologia
                    </h2>
                    <p className="text-xl text-white/70 mb-10 font-medium">
                        Junte-se a centenas de organizações que já transformam mais vidas com o Nexori.
                    </p>
                    <Link href="/signup"
                        className="inline-flex items-center gap-2 px-10 py-5 bg-white text-[#1A3C4A] font-black text-sm uppercase tracking-widest rounded-2xl hover:shadow-2xl hover:scale-105 transition-all group">
                        Começar agora, é gratuito <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>
            </section>

            {/* ── FOOTER ── */}
            <footer className="py-12 px-6 bg-[#0f2530] text-white/40">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-xl bg-[#2D9E6B]/20 flex items-center justify-center">
                            <Heart className="w-3.5 h-3.5 text-[#2D9E6B]" />
                        </div>
                        <span className="font-black text-white/80 tracking-tighter">Nexori</span>
                    </div>
                    <div className="flex items-center gap-6 text-xs font-bold uppercase tracking-widest">
                        <Link href="/login" className="hover:text-white transition-colors">Entrar</Link>
                        <Link href="/signup" className="hover:text-white transition-colors">Criar conta</Link>
                    </div>
                    <p className="text-xs font-bold">
                        &copy; {new Date().getFullYear()} Nexori. Todos os direitos reservados.
                    </p>
                </div>
            </footer>

        </div>
    )
}
