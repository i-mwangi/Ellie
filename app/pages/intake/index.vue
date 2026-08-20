<script setup lang="ts">
interface Turn {
  from: 'requester' | 'ellie'
  text: string
  quickReplies?: string[]
}

interface IntakeResponse {
  blocked: boolean
  category: { id: string; label: string } | null
  reply: string
  because: string | null
  quickReplies: string[]
  awaiting: string | null
  remembered: Array<{ field: string; value: string; provenance: string }>
  flags: Array<{ id: string; message: string }>
  rfq: {
    title: string
    status: string
    fields: Array<{
      id: string
      label: string
      value: string
      answered: boolean
      fromMemory: boolean
    }>
    complete: boolean
  } | null
}

const EXAMPLES = [
  'I need to buy shipping cartons for the Izmir plant.',
  'We need safety shoes for the warehouse team.',
]

const turns = ref<Turn[]>([])
const draft = ref('')
const answers = ref<Record<string, string>>({})
const awaiting = ref<string | null>(null)
const categoryId = ref<string | undefined>()
const latest = ref<IntakeResponse | null>(null)
const sending = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const LANGS = ['EN', 'TR', 'DE', 'VI']
const rfqLang = ref('EN')
const attachment = ref<{ filename: string; accepted: boolean; extracted: Record<string, string>; redactions: number; reason?: string } | null>(null)

/** Which of the seven stages the conversation is currently in. */
const activeStep = computed(() => {
  if (!turns.value.length) return 0
  if (latest.value?.rfq?.complete) return 6
  if (latest.value?.flags.length) return 3
  if (turns.value.length > 2) return 2
  return 1
})

/** The RFQ is written in whichever language procurement picks, independent of both parties. */
const RFQ_TEXT: Record<string, Record<string, string>> = {
  packaging: {
    EN: 'Shipping cartons, double-wall BC, 3-week delivery.',
    TR: 'Sevkiyat kolileri, çift oluklu BC, 3 hafta teslimat.',
    DE: 'Versandkartons, doppelwellig BC, Lieferung in 3 Wochen.',
    VI: 'Thùng carton sóng BC hai lớp, giao trong 3 tuần.',
  },
  footwear: {
    EN: '500 pairs S3 safety shoes, 4-week delivery.',
    TR: '500 çift S3 iş ayakkabısı, 4 hafta teslimat.',
    DE: '500 Paar S3-Sicherheitsschuhe, Lieferung in 4 Wochen.',
    VI: '500 đôi giày bảo hộ S3, giao trong 4 tuần.',
  },
}

const translation = computed(() => {
  if (!latest.value?.category) return null
  return latest.value.category.id === 'packaging'
    ? {
        requester: { lang: 'TR', text: 'İzmir fabrikası için sevkiyat kolileri gerekiyor.' },
        rfq: { lang: rfqLang.value, text: RFQ_TEXT.packaging[rfqLang.value] ?? RFQ_TEXT.packaging.EN },
        supplier: { lang: 'VI', text: 'Thùng carton sóng BC, giao trong 3 tuần.' },
      }
    : {
        requester: { lang: 'TR', text: 'Depo ekibi için 500 çift iş ayakkabısı.' },
        rfq: { lang: rfqLang.value, text: RFQ_TEXT.footwear[rfqLang.value] ?? RFQ_TEXT.footwear.EN },
        supplier: { lang: 'VI', text: '500 đôi giày bảo hộ S3, giao trong 4 tuần.' },
      }
})

async function onFile(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  const text = await file.text()
  attachment.value = await $fetch('/api/intake/attach', {
    method: 'POST',
    body: { filename: file.name, text },
  })
  // Anything the file settled is treated as answered.
  for (const [key, value] of Object.entries(attachment.value?.extracted ?? {})) {
    answers.value[key] = value
  }
}

async function send(text: string) {
  if (!text.trim() || sending.value) return
  sending.value = true

  turns.value.push({ from: 'requester', text })
  draft.value = ''

  // The turn being answered is whatever Ellie last asked.
  if (awaiting.value) answers.value[awaiting.value] = text

  try {
    const res = await $fetch<IntakeResponse>('/api/intake/message', {
      method: 'POST',
      body: { text, answers: answers.value, categoryId: categoryId.value },
    })

    latest.value = res
    awaiting.value = res.awaiting
    if (res.category) categoryId.value = res.category.id

    turns.value.push({
      from: 'ellie',
      text: res.reply,
      quickReplies: res.quickReplies,
    })
  } finally {
    sending.value = false
  }
}

function reset() {
  turns.value = []
  answers.value = {}
  awaiting.value = null
  categoryId.value = undefined
  latest.value = null
  attachment.value = null
}
</script>

<template>
  <PageShell
    title="Intake with AI"
    subtitle="Conversational request capture"
    timestamp="A sentence in, a sourceable request out"
  >
    <template #context>
      <div class="context-meta">
        <div>
          <div class="meta-label"><AppIcon name="inbox" :size="11" /> Category</div>
          <span class="chip blue">{{ latest?.category?.label ?? 'NOT SET' }}</span>
        </div>
        <div>
          <div class="meta-label"><AppIcon name="activity" :size="11" /> Status</div>
          <span class="chip" :class="latest?.rfq?.complete ? 'green' : 'amber'">
            {{ latest?.rfq?.status ?? 'WAITING' }}
          </span>
        </div>
      </div>

      <nav class="context-nav">
        <NuxtLink to="/intake" class="context-link">
          <AppIcon name="inbox" :size="14" /> Conversation
        </NuxtLink>
        <NuxtLink to="/rfq" class="context-link">
          <AppIcon name="briefcase" :size="14" /> Sourcing
        </NuxtLink>
        <NuxtLink to="/fleet/memory" class="context-link">
          <AppIcon name="database" :size="14" /> Memory Bank
        </NuxtLink>
      </nav>

      <div class="context-actions">
        <button class="context-action" @click="reset">
          <AppIcon name="refresh" :size="14" /> Start a new request
        </button>
        <button class="context-action" @click="fileInput?.click()">
          <AppIcon name="file" :size="14" /> Attach a spec sheet
        </button>
        <div class="context-action" style="gap: 8px">
          <AppIcon name="globe" :size="14" /> RFQ language
          <select v-model="rfqLang" style="width: auto; margin-left: auto; padding: 2px 6px">
            <option v-for="lang in LANGS" :key="lang" :value="lang">{{ lang }}</option>
          </select>
        </div>
      </div>
    </template>

    <template #aside>
      <IdentityPanel />

      <div v-if="latest?.remembered.length" class="aside-card">
        <div class="aside-head">
          <span class="label"><AppIcon name="database" :size="13" /> Recalled</span>
          <span class="chip green">{{ latest.remembered.length }}</span>
        </div>
        <div class="aside-body">
          <div v-for="fact in latest.remembered" :key="fact.field">
            <p class="tiny" style="font-weight: 500">{{ fact.field }}</p>
            <p class="tiny faint">{{ fact.provenance }}</p>
          </div>
          <p class="tiny muted">Answered from a previous cycle — never asked again.</p>
        </div>
      </div>
    </template>

    <StepRail :active="activeStep" />

    <p class="tiny faint" style="margin-bottom: 8px">Ellie</p>
    <p class="lede" style="margin-bottom: 16px">
      Describe what you need in plain language. Ellie asks the questions that actually change the
      quote for that category, and the RFQ assembles itself as you talk.
    </p>

    <div v-if="!turns.length" class="card" style="margin-bottom: 14px">
      <p class="small muted">Start with a sentence, not a form.</p>
      <div class="stack" style="margin-top: 10px; gap: 6px">
        <button v-for="example in EXAMPLES" :key="example" class="example" @click="send(example)">
          <AppIcon name="inbox" :size="13" />
          <span class="small">“{{ example }}”</span>
        </button>
      </div>
      <p class="tiny faint" style="margin-top: 10px">
        <AppIcon name="file" :size="11" /> Or forward an email — Ellie picks it up as a request
      </p>
    </div>

    <label v-if="!turns.length" class="attach">
      <AppIcon name="file" :size="14" />
      <span class="small">Attach a spec sheet, drawing, or old invoice</span>
      <input ref="fileInput" type="file" accept=".txt,.md,.csv,.json" hidden @change="onFile" />
    </label>

    <div v-if="attachment" class="banner" style="margin-bottom: 14px">
      <div class="banner-head" :class="attachment.accepted ? '' : 'danger'">
        <span class="row" style="gap: 6px">
          <AppIcon :name="attachment.accepted ? 'checkCircle' : 'alert'" :size="14" />
          {{ attachment.filename }}
        </span>
      </div>
      <div class="banner-body">
        <p v-if="!attachment.accepted" class="small muted">{{ attachment.reason }}</p>
        <template v-else>
          <p class="small muted">
            Screened and read. {{ Object.keys(attachment.extracted).length }} field(s) filled from
            the file<span v-if="attachment.redactions">, {{ attachment.redactions }} redaction(s)
            applied</span>.
          </p>
          <div class="row" style="margin-top: 8px">
            <span v-for="(v, k) in attachment.extracted" :key="k" class="chip blue mono">
              {{ k }}: {{ v }}
            </span>
          </div>
        </template>
      </div>
    </div>

    <ChatTurn
      v-for="(turn, i) in turns"
      :key="i"
      :from="turn.from"
      :text="turn.text"
      :quick-replies="turn.quickReplies"
      @pick="send"
    />

    <div v-if="latest?.rfq" style="margin-top: 14px">
      <RfqDraft
        :title="latest.rfq.title"
        :status="latest.rfq.status"
        :fields="latest.rfq.fields"
      />
    </div>

    <div v-for="flag in latest?.flags ?? []" :key="flag.id" class="banner" style="margin-top: 10px">
      <div class="banner-head warn">
        <span class="row" style="gap: 6px">
          <AppIcon name="alert" :size="14" /> Flagged before it goes out
        </span>
      </div>
      <div class="banner-body">
        <p class="small muted">{{ flag.message }}</p>
      </div>
    </div>

    <div v-if="translation && latest?.rfq" style="margin-top: 12px">
      <TranslationPanel
        :requester="translation.requester"
        :rfq="translation.rfq"
        :supplier="translation.supplier"
      />
    </div>

    <div v-if="latest?.rfq?.complete" class="banner" style="margin-top: 10px">
      <div class="banner-head">
        <span class="row" style="gap: 6px">
          <AppIcon name="checkCircle" :size="14" /> Request complete — routed to procurement
        </span>
      </div>
      <div class="banner-body">
        <p class="small muted">
          Nothing was re-typed. The brief carries into sourcing intact, and you never saw a supplier
          name or a price — procurement owns that channel.
        </p>
        <div class="row" style="margin-top: 11px; justify-content: flex-end">
          <NuxtLink to="/rfq" class="btn primary">
            Open sourcing <AppIcon name="chevronRight" :size="13" />
          </NuxtLink>
        </div>
      </div>
    </div>

    <form class="composer" @submit.prevent="send(draft)">
      <input v-model="draft" type="text" placeholder="Describe what you need…" />
      <button class="btn primary" type="submit" :disabled="sending || !draft.trim()">
        <AppIcon name="send" :size="13" />
      </button>
    </form>
  </PageShell>
</template>

<style scoped>
.example {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  text-align: left;
  border: 1px solid var(--border);
  background: var(--canvas);
  border-radius: var(--radius);
  padding: 9px 12px;
  color: var(--text-2);
}

.example:hover {
  border-color: var(--accent-border);
  background: var(--accent-soft);
}

.attach {
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px dashed var(--border-strong);
  border-radius: var(--radius);
  padding: 10px 12px;
  margin-bottom: 14px;
  color: var(--muted);
  cursor: pointer;
}

.attach:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.composer {
  display: flex;
  gap: 8px;
  margin-top: 18px;
  position: sticky;
  bottom: 0;
  background: var(--canvas);
  padding: 10px 0;
}
</style>
