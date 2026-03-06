import { getTenant } from '@/lib/tenant-server'
import { PortalHeader } from '@/components/portal/PortalHeader'
import { AIChat } from '@/components/ia/AIChat'

export default async function PortalLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const tenant = await getTenant()
    const config = tenant?.config_portal || {}

    // Injeção de cores dinâmicas via CSS Variables
    const primaryColor = config.cor_primaria || '#1A3C4A'
    const secondaryColor = config.cor_secundaria || '#2D9E6B'

    return (
        <div className="min-h-screen flex flex-col bg-[#F5F7F8]">
            {/* CSS Variables Dinâmicas */}
            <style dangerouslySetInnerHTML={{
                __html: `
                :root {
                    --primary: ${primaryColor};
                    --secondary: ${secondaryColor};
                }
            `}} />

            <PortalHeader tenantName={tenant?.nome || 'Nexori'} />

            <main className="flex-1">
                {children}
            </main>

            <footer className="bg-white border-t border-gray-100 py-12 px-6">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="text-center md:text-left">
                        <p className="font-black text-[#1A3C4A] text-xl">{tenant?.nome || 'Nexori'}</p>
                        <p className="text-gray-400 text-sm mt-1">Conectando você ao futuro da nossa comunidade.</p>
                    </div>
                    <div className="text-center md:text-right">
                        <p className="text-xs text-gray-300 font-bold uppercase tracking-widest">&copy; {new Date().getFullYear()} Nexori SaaS</p>
                    </div>
                </div>
            </footer>

            <AIChat />
        </div>
    )
}
