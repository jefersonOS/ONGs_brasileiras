import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { AIChat } from '@/components/ia/AIChat'

export default function InternalLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-[#F5F7F8]">
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
