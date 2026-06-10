/** Colour-coded category tags — Media=green, Dev=blue, etc. */
export interface CategoryStyle {
  badge: string
  cardTint: string
  iconColor: string
}

const CATEGORY_RULES: { match: (c: string) => boolean; style: CategoryStyle }[] = [
  {
    match: (c) =>
      c.includes("media") ||
      c.includes("content") ||
      c.includes("marketing") ||
      c.includes("business"),
    style: {
      badge: "bg-primary text-primary-foreground",
      cardTint: "bg-primary/10 border-primary/20 dark:bg-primary/15 dark:border-primary/25",
      iconColor: "text-primary",
    },
  },
  {
    match: (c) =>
      c.includes("dev") ||
      c.includes("web") ||
      c.includes("javascript") ||
      c.includes("frontend") ||
      c.includes("backend") ||
      c.includes("full") ||
      c.includes("programming") ||
      c.includes("code"),
    style: {
      badge: "bg-sky-600 text-white dark:bg-sky-500",
      cardTint: "bg-sky-500/10 border-sky-500/20 dark:bg-sky-500/15 dark:border-sky-500/25",
      iconColor: "text-sky-600 dark:text-sky-400",
    },
  },
  {
    match: (c) =>
      c.includes("design") || c.includes("ui") || c.includes("ux") || c.includes("creative"),
    style: {
      badge: "bg-violet-600 text-white dark:bg-violet-500",
      cardTint: "bg-violet-500/10 border-violet-500/20 dark:bg-violet-500/15 dark:border-violet-500/25",
      iconColor: "text-violet-600 dark:text-violet-400",
    },
  },
  {
    match: (c) =>
      c.includes("data") || c.includes("science") || c.includes("analytics"),
    style: {
      badge: "bg-indigo-600 text-white dark:bg-indigo-500",
      cardTint: "bg-indigo-500/10 border-indigo-500/20 dark:bg-indigo-500/15 dark:border-indigo-500/25",
      iconColor: "text-indigo-600 dark:text-indigo-400",
    },
  },
  {
    match: (c) =>
      c.includes("mobile") || c.includes("ios") || c.includes("android"),
    style: {
      badge: "bg-teal-600 text-white dark:bg-teal-500",
      cardTint: "bg-teal-500/10 border-teal-500/20 dark:bg-teal-500/15 dark:border-teal-500/25",
      iconColor: "text-teal-600 dark:text-teal-400",
    },
  },
  {
    match: (c) =>
      c.includes("career") || c.includes("freelance") || c.includes("soft"),
    style: {
      badge: "bg-rose-600 text-white dark:bg-rose-500",
      cardTint: "bg-rose-500/10 border-rose-500/20 dark:bg-rose-500/15 dark:border-rose-500/25",
      iconColor: "text-rose-600 dark:text-rose-400",
    },
  },
]

const DEFAULT_STYLE: CategoryStyle = {
  badge: "bg-primary text-primary-foreground",
  cardTint: "bg-primary/10 border-primary/20 dark:bg-primary/15 dark:border-primary/25",
  iconColor: "text-primary",
}

export function getCategoryStyle(category: string): CategoryStyle {
  const key = category.toLowerCase()
  return CATEGORY_RULES.find((r) => r.match(key))?.style ?? DEFAULT_STYLE
}

export function getCategoryBadgeClass(category: string): string {
  return getCategoryStyle(category).badge
}

/** Stat card surface variants */
export const STAT_SURFACES = {
  green: {
    card: "border-primary/20 bg-primary/8 dark:border-primary/25 dark:bg-primary/12",
    value: "text-primary",
  },
  earn: {
    card: "border-earn/25 bg-earn-bg dark:border-earn/30 dark:bg-earn-bg",
    value: "text-earn",
  },
  neutral: {
    card: "border-border/70 bg-muted/50 dark:border-border/60 dark:bg-muted/40",
    value: "text-muted-foreground",
  },
} as const
