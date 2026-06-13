import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

/**
 * Custom twMerge config that prevents tailwind-merge from stripping
 * SonicSign's custom typography utility classes (text-section-title,
 * text-page-title, text-metric, etc.) which start with "text-" and
 * would otherwise be treated as conflicting Tailwind font-size utilities.
 */
const customTwMerge = extendTailwindMerge({
  override: {
    // Group our custom text-* typography classes separately so they
    // don't conflict with Tailwind's built-in text-{size} utilities.
    classGroups: {
      "font-size": [
        // Keep Tailwind's default text-* font-size detection
        {
          text: [
            // Custom SonicSign typography classes (NOT font sizes)
            "section-title",
            "page-title",
            "metric",
            "nav",
            "button",
            "body",
            "body-medium",
            "label",
            "card-title",
            "mono-value",
          ],
        },
      ],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return customTwMerge(clsx(inputs))
}
