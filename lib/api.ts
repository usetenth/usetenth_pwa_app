import { request, toSession, type TokenPair } from "./http";
import { clearSession, getSession, setSession } from "./session";
import { telegramWebApp } from "./telegram";

export type Stage = "needs_rule" | "needs_gateway" | "needs_kyc" | "active";
export type PlanId = "steady" | "growth" | "tech" | "custom";

export interface Me {
  id: string;
  email: string | null;
  telegram_linked: boolean;
}

export interface RuleView {
  percentage: number;
  plan: PlanId;
  enabled: boolean;
}

export interface Stock {
  asset_key: string;
  symbol: string;
  name: string;
  weight_bps: number;
}

export interface PlanView {
  plan: Exclude<PlanId, "custom">;
  name: string;
  blurb: string;
  stocks: Stock[];
}

export interface AssetView {
  asset_key: string;
  symbol: string;
  name: string;
  asset_class: string | null;
}

export interface PortfolioView {
  cash: string;
  value: string;
  invested: string;
  gain: string | null;
  holdings: { name: string; amount: string }[];
}

export interface Holding {
  asset_key: string;
  symbol: string;
  name: string;
  available: string;
  price: string | null;
  value_usd: string | null;
}

export interface DepositView {
  asset: string;
  default_network: string;
  networks: { network: string; address: string }[];
}

export type OrderStatus = "in_progress" | "completed" | "failed" | "simulated";

export interface OrderView {
  id: string;
  asset: string | null;
  kind: "auto" | "manual";
  side: "buy" | "sell";
  amount_usd: string;
  status: OrderStatus;
  created_at: string;
}

export interface InvestmentView {
  id: string;
  status: OrderStatus | "skipped" | "partial";
  reason: string | null;
  deposit_usd: string;
  invested_usd: string;
  percentage: number;
  created_at: string;
  orders: { asset: string | null; amount_usd: string; status: OrderStatus }[];
}

export interface QuoteView {
  amount_usd: string;
  qty: string | null;
  price: string | null;
  fee: string | null;
}

export interface SellQuoteView {
  qty: string;
  estimated_usd: string;
  proceeds: string | null;
  price: string | null;
  fee: string | null;
}

export interface AddressView {
  id: string;
  chain_family: "evm" | "solana";
  address: string;
  label: string | null;
  usable_at: string;
  usable: boolean;
}

export interface WithdrawAsset {
  asset_key: string;
  symbol: string;
  chain: string | null;
  chain_family: "evm" | "solana";
}

export interface WithdrawalView {
  id: string;
  status: OrderStatus;
  amount_usd: string;
  to: string;
  asset: string | null;
  created_at: string;
}

export interface ConfirmView {
  method: "password" | "telegram_code";
  expires_in: number | null;
  challenge_id: string | null;
}

export interface KycView {
  status: "none" | "pending" | "verified" | "review" | "failed";
  reason: string | null;
  nin_masked: string | null;
  can_retry: boolean;
}

/** What a client sends to prove an irreversible action is really wanted: a password, or the code from Telegram. */
export interface Proof {
  password?: string;
  code?: string;
  confirmation_id?: string;
}

const get = <T>(path: string, signal?: AbortSignal) => request<T>(path, { signal });
const post = <T>(path: string, body?: unknown) => request<T>(path, { method: "POST", body: body ?? {} });
const put = <T>(path: string, body: unknown) => request<T>(path, { method: "PUT", body });

// ---- Signing in ----

export async function register(email: string, password: string): Promise<void> {
  const tokens = await request<TokenPair>("/auth/register", { method: "POST", body: { email, password }, auth: false });
  setSession(toSession(tokens, "email"));
}

export async function login(email: string, password: string): Promise<void> {
  const tokens = await request<TokenPair>("/auth/login", { method: "POST", body: { email, password }, auth: false });
  setSession(toSession(tokens, "email"));
}

export async function loginWithTelegramCode(code: string): Promise<void> {
  const tokens = await request<TokenPair>("/auth/telegram/login", { method: "POST", body: { code }, auth: false });
  setSession(toSession(tokens, "email"));
}

/** Inside Telegram the launch data is the credential: no code, no password. */
export async function signInWithTelegram(): Promise<boolean> {
  const app = telegramWebApp();
  if (!app) return false;
  const tokens = await request<TokenPair>("/auth/telegram/webapp", { method: "POST", body: { init_data: app.initData }, auth: false });
  setSession(toSession(tokens, "telegram"));
  return true;
}

export async function logout(): Promise<void> {
  const session = getSession();
  clearSession();
  if (session) await request("/auth/logout", { method: "POST", body: { refresh_token: session.refresh }, auth: false }).catch(() => undefined);
}

export const fetchMe = (signal?: AbortSignal) => get<Me>("/auth/me", signal);
export const linkTelegram = (code: string) => post<null>("/auth/telegram/link", { code });
export const addEmailLogin = (email: string, password: string) => post<null>("/auth/credentials", { email, password });

// ---- Setup ----

export const fetchStage = (signal?: AbortSignal) => get<{ stage: Stage }>("/v1/onboarding", signal).then((r) => r.stage);
export const advanceOnboarding = () => post<{ stage: Stage }>("/v1/onboarding/advance").then((r) => r.stage);
export const fetchKyc = (signal?: AbortSignal) => get<KycView>("/v1/kyc", signal);
export const submitKyc = (full_name: string, nin: string) => post<KycView>("/v1/kyc", { full_name, nin });

// ---- The tenth ----

export const fetchRule = (signal?: AbortSignal) => get<RuleView | null>("/v1/rule", signal);
export const saveRule = (percentage: number, plan: PlanId) => put<RuleView>("/v1/rule", { percentage, plan });
export const fetchPlans = (signal?: AbortSignal) => get<PlanView[]>("/v1/plans", signal);
export const fetchAssets = (signal?: AbortSignal) => get<AssetView[]>("/v1/assets", signal);
export const fetchCustomPicks = (signal?: AbortSignal) => get<Stock[]>("/v1/rule/custom", signal);
export const saveCustomPicks = (picks: { asset_key: string; weight_bps: number }[]) => put<number>("/v1/rule/custom", picks);

// ---- Notifications ----

export interface NotificationView {
  id: string;
  kind: string;
  title: string;
  body: string;
  created_at: string;
  read: boolean;
}

export interface NotificationList {
  unread: number;
  items: NotificationView[];
}

export const fetchNotifications = (signal?: AbortSignal) => get<NotificationList>("/v1/notifications", signal);
export const markNotificationsRead = () => post<null>("/v1/notifications/read");

// ---- Money in ----

export const fetchPortfolio = (signal?: AbortSignal) => get<PortfolioView>("/v1/portfolio", signal);
export const fetchHoldings = (signal?: AbortSignal) => get<Holding[]>("/v1/holdings", signal);
export const fetchDeposit = (signal?: AbortSignal) => get<DepositView>("/v1/deposit", signal);
export const fetchInvestments = (signal?: AbortSignal) => get<InvestmentView[]>("/v1/investments", signal);
export const fetchOrders = (signal?: AbortSignal) => get<OrderView[]>("/v1/orders", signal);
export const fetchOrder = (id: string, signal?: AbortSignal) => get<OrderView>(`/v1/orders/${id}`, signal);

// ---- Trading ----

export const buyQuote = (asset_key: string, amount_usd: string) => post<QuoteView>("/v1/trades/quote", { asset_key, amount_usd });
export const placeBuy = (asset_key: string, amount_usd: string, client_ref: string) => post<OrderView>("/v1/trades", { asset_key, amount_usd, client_ref });
export const sellQuote = (asset_key: string, sale: { qty?: string; all?: boolean }) => post<SellQuoteView>("/v1/sells/quote", { asset_key, ...sale });
export const placeSell = (asset_key: string, sale: { qty?: string; all?: boolean }, client_ref: string) => post<OrderView>("/v1/sells", { asset_key, ...sale, client_ref });

// ---- Money out ----

export const fetchWithdrawAssets = (signal?: AbortSignal) => get<WithdrawAsset[]>("/v1/withdraw/assets", signal);
export const fetchAddresses = (signal?: AbortSignal) => get<AddressView[]>("/v1/withdraw/addresses", signal);
export const removeAddress = (id: string) => request<null>(`/v1/withdraw/addresses/${id}`, { method: "DELETE" });
export const fetchWithdrawals = (signal?: AbortSignal) => get<WithdrawalView[]>("/v1/withdrawals", signal);
export const fetchWithdrawal = (id: string, signal?: AbortSignal) => get<WithdrawalView>(`/v1/withdrawals/${id}`, signal);

export type Action =
  | { action: "add_address"; address: string }
  | { action: "withdraw"; address_id: string; asset_key: string; amount_usd: string; client_ref: string };

/** Asks how this account confirms, and for Telegram-only accounts sends the code. */
export const confirmAction = (action: Action) => post<ConfirmView>("/v1/confirm", action);

export const fetchConfirmation = (id: string, signal?: AbortSignal) => get<{ approved: boolean; live: boolean }>(`/v1/confirm/${id}`, signal);

export const addAddress = (address: string, label: string, proof: Proof) =>
  post<AddressView>("/v1/withdraw/addresses", { address, label: label || undefined, ...proof });

export const withdraw = (body: { address_id: string; asset_key: string; amount_usd: string; client_ref: string }, proof: Proof) =>
  post<WithdrawalView>("/v1/withdrawals", { ...body, ...proof });
