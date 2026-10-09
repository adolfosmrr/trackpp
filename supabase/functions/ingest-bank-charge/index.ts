import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2.112.3"

const MAX_BODY_BYTES = 32_768
const MAX_CLOCK_SKEW_SECONDS = 300
const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"
const BANK_CHARGE_CHANNEL_ID = "bank-charges"
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const SOURCES = new Set(["naranja", "naranjax", "galicia", "other"])

type IngestBody = {
  gmailAccount: string
  messageId: string
  source: "naranja" | "naranjax" | "galicia" | "other"
  amount: string
  currency: string
  merchant: string | null
  cardLast4: string | null
  chargedAt: string | null
  raw: unknown
}

Deno.serve(async (request) => {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, 405)
  }

  const declaredLength = Number(request.headers.get("content-length"))
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    return json({ error: "Payload is too large" }, 413)
  }

  const rawBody = await request.text()
  if (new TextEncoder().encode(rawBody).byteLength > MAX_BODY_BYTES) {
    return json({ error: "Payload is too large" }, 413)
  }

  const authorized = await authorize(request, rawBody)
  if (authorized !== true) {
    return authorized
  }

  let payload: unknown
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return json({ error: "Body must be JSON" }, 400)
  }

  let body: IngestBody
  try {
    body = parseBody(payload)
  } catch (error) {
    return json({ error: errorMessage(error, "Invalid payload") }, 400)
  }

  let userId: string
  try {
    userId = resolveUserId(body.gmailAccount)
  } catch (error) {
    console.error("[ingest-bank-charge] account map", errorMessage(error, "config"))
    return json({ error: "Server configuration error" }, 500)
  }

  if (!userId) {
    return json({ error: "Gmail account is not allowed" }, 403)
  }

  const supabase = createServiceClient()
  if (!supabase) {
    return json({ error: "Server configuration error" }, 500)
  }

  const externalRef = `gmail:${body.gmailAccount}:${body.messageId}`
  const { data: inserted, error: insertError } = await supabase
    .from("pending_bank_charges")
    .insert({
      user_id: userId,
      source: body.source,
      external_ref: externalRef,
      amount: body.amount,
      currency: body.currency,
      merchant: body.merchant,
      card_last4: body.cardLast4,
      charged_at: body.chargedAt,
      raw: body.raw,
      status: "pending",
    })
    .select("id")
    .maybeSingle()

  if (insertError) {
    if (insertError.code === "23505") {
      const existingId = await findChargeId(supabase, externalRef)
      if (!existingId) {
        return json({ error: "Duplicate charge could not be loaded" }, 500)
      }
      return json({ status: "duplicate", id: existingId }, 200)
    }

    if (insertError.code === "23503") {
      return json({ error: "Mapped user does not have a profile" }, 422)
    }

    console.error("[ingest-bank-charge] insert", insertError.code)
    return json({ error: "Could not store the charge" }, 500)
  }

  if (!inserted?.id) {
    return json({ error: "Could not store the charge" }, 500)
  }

  try {
    await notifyUser(supabase, userId, inserted.id, body)
  } catch (error) {
    console.error("[ingest-bank-charge] push", errorMessage(error, "push failed"))
  }

  return json({ status: "created", id: inserted.id }, 201)
})

async function authorize(request: Request, rawBody: string): Promise<true | Response> {
  const secret = Deno.env.get("INGEST_SECRET")
  if (!secret) {
    console.error("[ingest-bank-charge] INGEST_SECRET is not set")
    return json({ error: "Server configuration error" }, 500)
  }

  const timestampHeader = request.headers.get("x-ingest-timestamp")?.trim() ?? ""
  const signatureHeader = request.headers.get("x-ingest-signature")?.trim() ?? ""
  if (!/^\d{10}$/.test(timestampHeader) || !/^[0-9a-f]{64}$/i.test(signatureHeader)) {
    return json({ error: "Invalid signature" }, 401)
  }

  const timestamp = Number(timestampHeader)
  const now = Math.floor(Date.now() / 1000)
  if (Math.abs(now - timestamp) > MAX_CLOCK_SKEW_SECONDS) {
    return json({ error: "Stale signature" }, 401)
  }

  const expected = await hmacHex(secret, `${timestampHeader}.${rawBody}`)
  if (!safeEqualHex(expected, signatureHeader)) {
    return json({ error: "Invalid signature" }, 401)
  }

  return true
}

function parseBody(payload: unknown): IngestBody {
  if (!isRecord(payload)) {
    throw new Error("Body must be a JSON object")
  }

  const gmailAccount = requiredString(payload.gmail_account, "gmail_account").toLowerCase()
  if (!gmailAccount.includes("@") || gmailAccount.length > 320) {
    throw new Error("gmail_account must be an email")
  }

  const messageId = requiredString(payload.message_id, "message_id")
  if (/\s/.test(messageId) || messageId.length > 200) {
    throw new Error("message_id is invalid")
  }

  const source = requiredString(payload.source, "source")
  if (!SOURCES.has(source)) {
    throw new Error("source must be naranja, naranjax, galicia, or other")
  }

  return {
    gmailAccount,
    messageId,
    source: source as IngestBody["source"],
    amount: parseAmount(payload.amount),
    currency: parseCurrency(payload.currency),
    merchant: optionalText(payload.merchant, 200),
    cardLast4: parseCardLast4(payload.card_last4),
    chargedAt: parseChargedAt(payload.charged_at),
    raw: parseRaw(payload.raw),
  }
}

function resolveUserId(gmailAccount: string): string | null {
  const rawMap = Deno.env.get("ACCOUNT_MAP")
  if (!rawMap) {
    throw new Error("ACCOUNT_MAP is not set")
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(rawMap)
  } catch {
    throw new Error("ACCOUNT_MAP is not valid JSON")
  }

  if (!isRecord(parsed)) {
    throw new Error("ACCOUNT_MAP must be a JSON object")
  }

  for (const [email, userId] of Object.entries(parsed)) {
    if (typeof userId !== "string" || !UUID_PATTERN.test(userId)) {
      throw new Error("ACCOUNT_MAP contains a value that is not a uuid")
    }
    if (email.trim().toLowerCase() === gmailAccount) {
      return userId
    }
  }

  return null
}

function createServiceClient(): SupabaseClient | null {
  const url = Deno.env.get("SUPABASE_URL")
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  if (!url || !serviceRoleKey) {
    console.error("[ingest-bank-charge] Supabase service credentials are missing")
    return null
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

async function findChargeId(supabase: SupabaseClient, externalRef: string) {
  const { data, error } = await supabase
    .from("pending_bank_charges")
    .select("id")
    .eq("external_ref", externalRef)
    .maybeSingle()

  if (error || !data?.id) {
    return null
  }

  return data.id as string
}

async function notifyUser(
  supabase: SupabaseClient,
  userId: string,
  chargeId: string,
  body: IngestBody,
) {
  const { data, error } = await supabase
    .from("push_tokens")
    .select("expo_push_token")
    .eq("user_id", userId)

  if (error) {
    throw new Error(error.message)
  }

  const tokens = (data ?? [])
    .map((row) => row.expo_push_token)
    .filter((token): token is string =>
      typeof token === "string" && /^Expo(nent)?PushToken\[[^\]]+\]$/.test(token)
    )

  if (tokens.length === 0) {
    return
  }

  const merchant = (body.merchant ?? "un comercio").slice(0, 80)
  const title = `Nuevo gasto: ${formatAmount(body.amount, body.currency)} en ${merchant}`
  const accessToken = Deno.env.get("EXPO_ACCESS_TOKEN")
  const staleTokens: string[] = []

  for (let index = 0; index < tokens.length; index += 100) {
    const chunk = tokens.slice(index, index + 100)
    const messages = chunk.map((token) => ({
      to: token,
      title,
      body: "¿A qué espacio lo cargo?",
      sound: "default",
      priority: "high",
      channelId: BANK_CHARGE_CHANNEL_ID,
      data: {
        type: "pending_charge",
        chargeId,
        userId,
      },
    }))

    const headers: Record<string, string> = {
      accept: "application/json",
      "content-type": "application/json",
    }
    if (accessToken) {
      headers.authorization = `Bearer ${accessToken}`
    }

    const response = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers,
      body: JSON.stringify(messages),
      signal: AbortSignal.timeout(10_000),
    })
    const payload = await response.json().catch(() => null)
    if (!response.ok) {
      console.error("[ingest-bank-charge] expo push http", response.status)
      continue
    }

    const tickets = isRecord(payload) && Array.isArray(payload.data) ? payload.data : []
    tickets.forEach((ticket, ticketIndex) => {
      if (!isRecord(ticket)) return
      const details = isRecord(ticket.details) ? ticket.details : null
      if (details?.error === "DeviceNotRegistered") {
        const token = chunk[ticketIndex]
        if (token) staleTokens.push(token)
      }
    })
  }

  if (staleTokens.length > 0) {
    const { error: deleteError } = await supabase
      .from("push_tokens")
      .delete()
      .in("expo_push_token", staleTokens)
    if (deleteError) {
      console.error("[ingest-bank-charge] token cleanup", deleteError.code)
    }
  }
}

function parseAmount(value: unknown): string {
  if (typeof value === "number" && Number.isFinite(value)) {
    const amount = value.toFixed(2)
    if (Number(amount) <= 0) {
      throw new Error("amount must be greater than zero")
    }
    if (Number(amount) > 1_000_000_000) {
      throw new Error("amount is too large")
    }
    return amount
  }

  if (typeof value === "string" && /^\d+(\.\d{1,2})?$/.test(value)) {
    const amount = Number(value)
    if (Number.isFinite(amount) && amount > 0 && amount <= 1_000_000_000) {
      const [whole, fraction = ""] = value.split(".")
      return `${whole}.${fraction.padEnd(2, "0")}`
    }
  }

  throw new Error("amount must be a positive number with up to 2 decimals")
}

function parseCurrency(value: unknown): string {
  if (value === undefined || value === null || value === "") {
    return "ARS"
  }
  if (typeof value !== "string" || !/^[A-Za-z]{3}$/.test(value)) {
    throw new Error("currency must be a 3-letter code")
  }
  return value.toUpperCase()
}

function parseCardLast4(value: unknown): string | null {
  if (value === undefined || value === null || value === "") {
    return null
  }
  if (typeof value !== "string") {
    throw new Error("card_last4 must be a string")
  }
  const digits = value.replace(/\D/g, "")
  if (digits.length < 4) {
    throw new Error("card_last4 must include 4 digits")
  }
  return digits.slice(-4)
}

function parseChargedAt(value: unknown): string | null {
  if (value === undefined || value === null || value === "") {
    return null
  }
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error("charged_at must be YYYY-MM-DD")
  }
  const [year, month, day] = value.split("-").map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new Error("charged_at is not a valid date")
  }
  return value
}

function parseRaw(value: unknown): unknown {
  if (value === undefined) return null
  const encoded = JSON.stringify(value)
  if (encoded && encoded.length > 24_000) {
    throw new Error("raw is too large")
  }
  return value
}

function optionalText(value: unknown, maxLength: number): string | null {
  if (value === undefined || value === null || value === "") return null
  if (typeof value !== "string") {
    throw new Error("merchant must be a string")
  }
  const text = value.trim().replace(/\s+/g, " ")
  if (!text) return null
  return text.slice(0, maxLength)
}

function requiredString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${field} is required`)
  }
  return value.trim()
}

function formatAmount(amount: string, currency: string): string {
  const [whole, fraction = "00"] = amount.split(".")
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
  const visible = fraction === "00" ? grouped : `${grouped},${fraction}`
  return currency === "ARS" ? `$${visible}` : `${currency} ${visible}`
}

async function hmacHex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  )
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message))
  return [...new Uint8Array(signature)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
}

function safeEqualHex(expected: string, received: string): boolean {
  const left = expected.toLowerCase()
  const right = received.toLowerCase()
  if (left.length !== right.length) return false
  let mismatch = 0
  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index)
  }
  return mismatch === 0
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback
}

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  })
}
