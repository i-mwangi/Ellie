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
        <button class="context-action" disabled>
          <AppIcon name="file" :size="14" /> Attach a spec sheet
        </button>
        <button class="context-action" disabled>
          <AppIcon name="globe" :size="14" /> Change language
        </button>
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
