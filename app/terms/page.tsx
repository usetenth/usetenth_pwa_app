import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Screen } from "@/components/ui";

export const metadata: Metadata = { title: "How it works, terms and privacy" };

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-4 rounded-2xl border border-line bg-card/90 p-5 shadow-sm">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-mute [&_b]:font-medium [&_b]:text-ink [&_li]:pl-1 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">{children}</div>
    </section>
  );
}

const jump = "rounded-full border border-line bg-card px-4 py-2 text-sm font-medium transition active:scale-95";

export default function TermsPage() {
  return (
    <Screen back title="How it works, terms and privacy">
      <nav className="flex flex-wrap gap-2">
        <a href="#how" className={jump}>How it works</a>
        <a href="#terms" className={jump}>Terms</a>
        <a href="#privacy" className={jump}>Privacy</a>
      </nav>
      <p className="px-1 text-sm text-mute">Last updated 14 November 2026.</p>

      <Section id="how" title="How usetenth works">
        <ol>
          <li><b>You choose a tenth.</b> Pick 5%, 10% or 20% of each payment you receive, and a mix of stocks to put it in. You can change both at any time.</li>
          <li><b>You get a wallet.</b> We open a wallet for you with our trading partner, True Markets. It has a deposit address. Payments you send there are yours.</li>
          <li><b>We invest your tenth.</b> When a payment arrives, we set your tenth aside and buy tokenized stocks with it. The rest of the payment stays in your balance, and you can withdraw it whenever you like.</li>
          <li><b>Your key signs, within limits.</b> Every order needs a digital signature. We create a key just for you, keep it encrypted, and use it only to carry out what you have set up: investing your tenth, trades you ask for and withdrawals you confirm. Daily and per-order limits apply.</li>
          <li><b>Withdrawals are protected.</b> Money can only go to addresses you have saved. A new address waits 24 hours before it can be used, and each withdrawal needs your approval.</li>
          <li><b>We keep you informed.</b> You get a message and a notification for every payment, investment and withdrawal.</li>
        </ol>
      </Section>

      <Section id="terms" title="Terms of operation">
        <ul>
          <li><b>Not financial advice.</b> usetenth is a tool that follows your instructions. We do not recommend any investment.</li>
          <li><b>Investing carries risk.</b> The value of stocks can fall as well as rise, and you can lose some or all of what you invest. Past results do not predict future ones.</li>
          <li><b>What you are buying.</b> Tokenized stocks are digital tokens that follow the price of company shares. They are not the shares themselves, and they may not carry voting or other shareholder rights.</li>
          <li><b>Our partners.</b> Wallets, trading and settlement are provided by True Markets and its partners, so their terms and availability apply as well. Prices and fees come from their live quotes.</li>
          <li><b>Your responsibilities.</b> Send only the supported stablecoin on the network shown with your address. Anything else can be lost permanently and we cannot recover it. Keep your sign-in details private, give us true information and use only your own accounts and addresses.</li>
          <li><b>Verification.</b> We check your identity before your tenth is switched on. We may decline, pause or close an account to follow the law or protect other people.</li>
          <li><b>Limits and minimums.</b> Orders have minimum sizes. A payment that is too small to invest from stays in your balance. Limits on investing, selling and withdrawing protect your money.</li>
          <li><b>Timing.</b> Transfers depend on blockchain networks and our partners. We do not promise how fast they complete.</li>
          <li><b>Pauses and changes.</b> We may pause investing or withdrawals for safety or maintenance. Your balance stays yours. We may update these terms and will tell you in the app when we do.</li>
          <li><b>Liability.</b> To the extent the law allows, we are not responsible for market losses, network failures or the actions of third parties.</li>
        </ul>
      </Section>

      <Section id="privacy" title="Privacy">
        <ul>
          <li><b>What we keep.</b> Your email or Telegram details, the name and ID number (NIN) you give us for verification, your wallet addresses, and a record of your payments, investments and withdrawals.</li>
          <li><b>Your ID number.</b> We keep it encrypted only until a decision is made, then erase it. We keep a scrambled fingerprint so the same number cannot open two accounts, and show only the last digits to you.</li>
          <li><b>Why we use it.</b> To run the service, to follow the law, and to keep accounts secure.</li>
          <li><b>Who sees it.</b> Our trading partner True Markets, our identity-check provider and Telegram, only as much as each needs to do its job. We do not sell your data.</li>
          <li><b>How we protect it.</b> Signing keys are encrypted. Passwords and sign-in tokens are stored scrambled.</li>
          <li><b>Your choices.</b> You can ask us to correct or delete your information, except where the law says we must keep it. Message us through the usetenth bot.</li>
        </ul>
      </Section>
    </Screen>
  );
}
