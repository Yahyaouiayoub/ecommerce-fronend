import type { ComponentType } from "react"
import type { LucideProps } from "lucide-react"
import {
  Truck,
  ShieldCheck,
  Leaf,
  Lock,
  Package,
  RefreshCw,
  Gift,
  Zap,
  Globe,
  CreditCard,
  Headphones,
  Award,
  Clock,
  HeartHandshake,
  Sparkles,
  ShoppingBag,
  Wallet,
  Bot,
  BadgeCheck,
  Star,
} from "lucide-react"

export interface IconEntry {
  key: string
  label: string
  icon: ComponentType<LucideProps>
  keywords: string[]
}

/**
 * Map of available icons for homepage feature cards.
 * Each entry has a unique key, a human-readable label, the lucide-react component,
 * and search keywords for filtering.
 */
export const ICON_MAP: Record<string, IconEntry> = {
  truck: {
    key: "truck",
    label: "Delivery Truck",
    icon: Truck,
    keywords: ["shipping", "delivery", "transport", "truck", "free shipping"],
  },
  shield_check: {
    key: "shield_check",
    label: "Shield Check",
    icon: ShieldCheck,
    keywords: ["secure", "protection", "safety", "shield", "guarantee"],
  },
  leaf: {
    key: "leaf",
    label: "Leaf",
    icon: Leaf,
    keywords: ["eco", "sustainable", "green", "environment", "natural"],
  },
  lock: {
    key: "lock",
    label: "Lock",
    icon: Lock,
    keywords: ["secure", "payment", "checkout", "privacy", "safe"],
  },
  package_icon: {
    key: "package_icon",
    label: "Package",
    icon: Package,
    keywords: ["shipping", "box", "parcel", "delivery", "packaging"],
  },
  refresh_cw: {
    key: "refresh_cw",
    label: "Refresh / Return",
    icon: RefreshCw,
    keywords: ["return", "refund", "exchange", "money back", "30 days"],
  },
  gift: {
    key: "gift",
    label: "Gift",
    icon: Gift,
    keywords: ["gift", "free", "bonus", "present", "surprise"],
  },
  zap: {
    key: "zap",
    label: "Zap / Flash",
    icon: Zap,
    keywords: ["flash", "fast", "lightning", "speed", "quick"],
  },
  globe: {
    key: "globe",
    label: "Globe / Worldwide",
    icon: Globe,
    keywords: ["worldwide", "global", "international", "world", "shipping"],
  },
  credit_card: {
    key: "credit_card",
    label: "Credit Card",
    icon: CreditCard,
    keywords: ["payment", "card", "credit", "debit", "secure payment"],
  },
  headphones: {
    key: "headphones",
    label: "Headphones / Support",
    icon: Headphones,
    keywords: ["support", "help", "service", "customer", "assistance"],
  },
  award: {
    key: "award",
    label: "Award",
    icon: Award,
    keywords: ["award", "quality", "premium", "best", "guaranteed"],
  },
  clock: {
    key: "clock",
    label: "Clock / Fast Delivery",
    icon: Clock,
    keywords: ["fast", "delivery", "time", "speed", "quick"],
  },
  heart_handshake: {
    key: "heart_handshake",
    label: "Heart Handshake",
    icon: HeartHandshake,
    keywords: ["trust", "support", "care", "service", "satisfaction"],
  },
  sparkles: {
    key: "sparkles",
    label: "Sparkles / New",
    icon: Sparkles,
    keywords: ["new", "special", "offer", "premium", "exclusive"],
  },
  shopping_bag: {
    key: "shopping_bag",
    label: "Shopping Bag",
    icon: ShoppingBag,
    keywords: ["shop", "bag", "purchase", "store", "cart"],
  },
  wallet: {
    key: "wallet",
    label: "Wallet / Pricing",
    icon: Wallet,
    keywords: ["price", "money", "wallet", "affordable", "value"],
  },
  badge_check: {
    key: "badge_check",
    label: "Badge Check",
    icon: BadgeCheck,
    keywords: ["verified", "trusted", "authentic", "genuine", "guaranteed"],
  },
  star: {
    key: "star",
    label: "Star",
    icon: Star,
    keywords: ["rating", "review", "quality", "top", "best"],
  },
}

/**
 * Get the available icon entries as a sorted array for display.
 */
export function getIconList(): IconEntry[] {
  return Object.values(ICON_MAP).sort((a, b) => a.label.localeCompare(b.label))
}

/**
 * Get an icon component by its key.
 */
export function getIconByKey(key: string): ComponentType<LucideProps> | null {
  return ICON_MAP[key]?.icon ?? null
}
