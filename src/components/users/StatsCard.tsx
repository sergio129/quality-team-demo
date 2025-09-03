import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  description: string;
}

export function StatsCard({ title, value, icon: Icon, color, bgColor, description }: StatsCardProps) {
  return (
    <div className={`${bgColor} backdrop-blur-sm rounded-xl p-4 text-center transform hover:scale-105 transition-all duration-200 cursor-pointer group`}>
      <div className="flex justify-center mb-2 group-hover:animate-bounce">
        <Icon className={`h-6 w-6 ${color}`} />
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-xs text-blue-200">{title}</div>
      <div className="text-xs text-blue-100 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        {description}
      </div>
    </div>
  );
}
