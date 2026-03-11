import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { AIChat } from '@/components/ia/AIChat'
import { getTenant } from '@/lib/tenant-server'

export default async function InternalLayout({
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
        <div className="min-h-screen bg-[#F5F7F8]">
            {/* CSS Variables Dinâmicas */}
            <style dangerouslySetInnerHTML={{
                __html: `
                :root {
                    --primary: ${primaryColor};
                    --secondary: ${secondaryColor};
                }
            `}} />

            <Sidebar />
            <Header />
            <main className="pl-[220px] pt-[60px] min-h-screen">
                <div className="p-8">
                    {children}
                </div>
            </main>
            <AIChat />
        </div>
    )
}
