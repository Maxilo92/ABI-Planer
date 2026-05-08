import * as Icons from 'lucide-react'
import { LucideIcon } from 'lucide-react'

export const CATEGORY_ICONS = {
  Tags: Icons.Tags,
  ClipboardList: Icons.ClipboardList,
  Zap: Icons.Zap,
  Trophy: Icons.Trophy,
  Calendar: Icons.Calendar,
  Users: Icons.Users,
  Hammer: Icons.Hammer,
  Laptop: Icons.Laptop,
  ShoppingCart: Icons.ShoppingCart,
  Utensils: Icons.Utensils,
  Music: Icons.Music,
  Camera: Icons.Camera,
  GraduationCap: Icons.GraduationCap,
  Heart: Icons.Heart,
  Palette: Icons.Palette,
  Megaphone: Icons.Megaphone,
  Globe: Icons.Globe,
  Truck: Icons.Truck,
  Beer: Icons.Beer,
}

export type CategoryIconName = keyof typeof CATEGORY_ICONS

export function getCategoryIcon(name?: string): LucideIcon {
  if (!name || !(name in CATEGORY_ICONS)) {
    return Icons.Tags
  }
  return CATEGORY_ICONS[name as CategoryIconName]
}
