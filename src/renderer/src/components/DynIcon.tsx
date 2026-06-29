import {
  Car,
  Home,
  HeartPulse,
  Building2,
  Stethoscope,
  Plane,
  Shield,
  Phone,
  MessageCircle,
  Mail,
  Users,
  MessageSquare,
  type LucideIcon,
} from "lucide-react";

const MAP: Record<string, LucideIcon> = {
  car: Car,
  home: Home,
  "heart-pulse": HeartPulse,
  "building-2": Building2,
  stethoscope: Stethoscope,
  plane: Plane,
  shield: Shield,
  phone: Phone,
  "message-circle": MessageCircle,
  mail: Mail,
  users: Users,
  "message-square": MessageSquare,
};

export function DynIcon({
  name,
  size = 18,
  className,
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  const Cmp = MAP[name] ?? Shield;
  return <Cmp size={size} className={className} />;
}
