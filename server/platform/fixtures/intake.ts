/**
 * Category question scripts — the questions that actually change a quote.
 *
 * This is the fixture stand-in for what Ellie will ask through ADK. The shape
 * matters more than the content: each question names the field it fills, why it
 * changes the price, and what a requester can answer in one tap.
 */

export interface CategoryQuestion {
  id: string
  field: string
  ask: string
  /** Why this question exists — shown in the trace, not to the requester. */
  because: string
  quickReplies: string[]
  required: boolean
  /** Memory subject that can pre-answer this, skipping the question entirely. */
  satisfiedByMemory?: string
}

export interface Category {
  id: string
  label: string
  /** Words in a plain-language request that route to this category. */
  match: string[]
  questions: CategoryQuestion[]
}

export const categories: Category[] = [
  {
    id: 'packaging',
    label: 'Shipping cartons',
    match: ['carton', 'box', 'boxes', 'corrugated', 'packaging', 'pack'],
    questions: [
      {
        id: 'dimensions',
        field: 'Specification',
        ask: 'What internal dimensions and print do you need, and by when?',
        because: 'Board grade and tooling both follow from size; print colours change the plate cost.',
        quickReplies: ['40×30×25 cm', '60×40×40 cm', 'Match last order'],
        required: true,
      },
      {
        id: 'print',
        field: 'Print',
        ask: 'How many print colours?',
        because: 'Each additional colour adds a plate and a pass on press.',
        quickReplies: ['Single-colour print', 'Two colours', 'Plain / no print'],
        required: true,
      },
      {
        id: 'quantity',
        field: 'Quantity',
        ask: 'How many units, and is this a one-off or a recurring call-off?',
        because: 'Volume decides whether tooling amortises; call-offs change the price break.',
        quickReplies: ['1,000 units', '5,000 units', 'Recurring monthly'],
        required: true,
      },
      {
        id: 'delivery',
        field: 'Delivery',
        ask: 'When do you need them delivered?',
        because: 'Lead time under three weeks removes suppliers without stock board.',
        quickReplies: ['Within 3 weeks', 'Within 6 weeks', 'No fixed date'],
        required: true,
      },
      {
        id: 'board',
        field: 'Board grade',
        ask: 'Single-wall or double-wall board?',
        because:
          'Plant humidity of 68% makes single-wall B-flute a durability risk — already known for this site.',
        quickReplies: ['Double-wall BC', 'Single-wall B', 'Advise me'],
        required: true,
        satisfiedByMemory: 'Corrugated board specification',
      },
    ],
  },
  {
    id: 'safety-footwear',
    label: 'Safety footwear',
    match: ['shoe', 'shoes', 'boot', 'boots', 'footwear', 'ppe'],
    questions: [
      {
        id: 'environment',
        field: 'Environment',
        ask: 'Which environment will they be worn in? That decides the required protection rating.',
        because: 'Wet, cold, and outdoor sites each mandate a different rating.',
        quickReplies: ['Wet / cold store', 'Dry warehouse', 'Outdoor yard'],
        required: true,
      },
      {
        id: 'certification',
        field: 'Certification',
        ask: 'Do you need a specific certification (e.g. S3 / EN ISO 20345)?',
        because: 'Certification is pass/fail for a supplier — asking later means re-quoting.',
        quickReplies: ['S3', 'S1P', 'Not sure — advise'],
        required: true,
      },
      {
        id: 'quantity',
        field: 'Quantity',
        ask: 'How many pairs, and do you have a size breakdown?',
        because: 'Size curve drives stock availability more than total volume does.',
        quickReplies: ['500 pairs', '100 pairs', 'Size breakdown to follow'],
        required: true,
      },
      {
        id: 'delivery',
        field: 'Delivery',
        ask: 'When do you need them?',
        because: 'Under four weeks restricts to suppliers holding the size curve in stock.',
        quickReplies: ['Within 4 weeks', 'Within 8 weeks', 'No fixed date'],
        required: true,
      },
      {
        id: 'brand',
        field: 'Brand',
        ask: 'Any preferred brands, or open market?',
        because: 'Brand-locking removes most of the competitive tension in this category.',
        quickReplies: ['Open market', 'Match current brand'],
        required: false,
      },
    ],
  },
]

export const GENERIC_QUESTIONS: CategoryQuestion[] = [
  {
    id: 'what',
    field: 'Specification',
    ask: 'What exactly do you need? Include size, material, or model if you know it.',
    because: 'Nothing can be sourced without a specification.',
    quickReplies: [],
    required: true,
  },
  {
    id: 'quantity',
    field: 'Quantity',
    ask: 'How many do you need?',
    because: 'Volume decides the price break.',
    quickReplies: [],
    required: true,
  },
  {
    id: 'delivery',
    field: 'Delivery',
    ask: 'When do you need it?',
    because: 'Lead time filters the supplier pool.',
    quickReplies: [],
    required: true,
  },
]

/**
 * Specification combinations that cost money if they reach a supplier unchallenged.
 * Flagged during intake rather than discovered in the quotes.
 */
export const CONTRADICTIONS: Array<{
  id: string
  when: (answers: Record<string, string>) => boolean
  message: string
}> = [
  {
    id: 'rush-volume',
    when: (a) =>
      /3 weeks|4 weeks/i.test(a.delivery ?? '') && /5,000|10,000|recurring/i.test(a.quantity ?? ''),
    message:
      'A volume this size inside the stated lead time will price at a rush premium. Consider splitting the first call-off.',
  },
  {
    id: 'over-spec-print',
    when: (a) => /two colours/i.test(a.print ?? '') && /plain/i.test(a.dimensions ?? ''),
    message: 'Two-colour print on an otherwise plain carton adds plate cost for little benefit.',
  },
  {
    id: 'brand-lock',
    when: (a) => /match current brand/i.test(a.brand ?? ''),
    message:
      'Brand-locking removes most competitive tension. Open market usually returns a better price for the same rating.',
  },
]
