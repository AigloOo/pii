import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    description?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon: Icon, description }) => {
    return (
        <div className="bg-black border border-gray-800 rounded-lg p-6 flex flex-col gap-2 hover:border-gray-600 transition-colors">
            <div className="flex items-center justify-between text-gray-400">
                <span className="text-sm font-medium">{title}</span>
                <Icon size={16} />
            </div>
            <div className="text-2xl font-bold text-white font-mono">{value}</div>
            {description && <div className="text-xs text-gray-500">{description}</div>}
        </div>
    );
};
