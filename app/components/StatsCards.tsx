import { LucideIcon } from "lucide-react";

interface Props {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: string; // Tailwind bg class
}

export default function StatsCard({ title, value, icon: Icon, color }: Props) {
  return (
    <div className={`${color} rounded-xl p-5 text-white flex flex-col gap-2 flex-1`}>
      <div className="flex items-center gap-2 text-sm font-medium opacity-90">
        <Icon size={18} />
        {title}
      </div>
      <div className="text-4xl font-bold">{value.toLocaleString()}</div>
    </div>
  );
}