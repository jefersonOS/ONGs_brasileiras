import { LucideIcon } from 'lucide-react'

interface MetricCardProps {
    title: string
    value: string | number
    icon: LucideIcon
    subtitle?: string
    trend?: {
        value: string
        isPositive: boolean
    }
}

export function MetricCard({ title, value, icon: Icon, subtitle, trend }: MetricCardProps) {
    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex flex-col hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-500">{title}</h3>
                <div className="p-2 bg-[#F5F7F8] rounded-md">
                    <Icon className="w-5 h-5 text-[#1A3C4A]" />
                </div>
            </div>

            <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-[#1A3C4A]">{value}</span>
                {trend && (
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${trend.isPositive ? 'text-green-700 bg-green-100' : 'text-red-700 bg-red-100'}`}>
                        {trend.value}
                    </span>
                )}
            </div>

            {subtitle && (
                <p className="text-xs text-gray-400 mt-2">{subtitle}</p>
            )}
        </div>
    )
}
