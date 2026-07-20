import { ProductTier } from "@/types/subscriptions";

export const CREDITS_TIERS: ProductTier[] = [
  {
    name: "Taster",
    id: "tier-3-credits",
    productId: "prod_4kr19aRtC6vDoVCcaA99BB",
    priceMonthly: "$9",
    description: "3 credits — distill 1 persona or chat ~30 times.",
    creditAmount: 3,
    features: [
      "3 credits",
      "Distill 1 persona (3 credits)",
      "~30 chat messages (10/credit)",
      "Or unlock a draw-mode persona",
      "Credits never expire",
    ],
    featured: false,
    discountCode: "",
  },
  {
    name: "Brewer",
    id: "tier-6-credits",
    productId: "prod_16DiFMvfQw4AoTNcmWlDBr",
    priceMonthly: "$15",
    description: "6 credits — distill twice or chat ~60 times.",
    creditAmount: 6,
    features: [
      "6 credits",
      "Distill up to 2 personas",
      "~60 chat messages",
      "Or mix distillations and unlocks",
      "Credits never expire",
      "$2.50/credit — save 17% vs Taster",
    ],
    featured: true,
    discountCode: "",
  },
  {
    name: "Cellar",
    id: "tier-9-credits",
    productId: "prod_7SB1HghdGtVRaOnLc5Z2jG",
    priceMonthly: "$20",
    description: "9 credits — distill 3 personas or chat ~90 times.",
    creditAmount: 9,
    features: [
      "9 credits",
      "Distill up to 3 personas",
      "~90 chat messages",
      "Everything in Brewer",
      "Best value per credit",
      "$2.22/credit — save 26% vs Taster",
    ],
    featured: false,
    discountCode: "",
  },
];

/** Cost in credits to complete a brew (save a new skill) */
export const BREW_CREDIT_COST = 3;

/** Chat pricing: number of free messages per user per skill */
export const CHAT_FREE_LIMIT = 3;

/** Chat pricing: messages per credit after free limit is reached */
export const CHAT_MESSAGES_PER_CREDIT = 10;
