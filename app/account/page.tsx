"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Guard } from "@/components/Guard";
import { BOT_URL } from "@/lib/config";
import { Card, ErrorCard, Field, PrimaryButton, Screen, SecondaryButton } from "@/components/ui";
import { addEmailLogin, fetchMe, linkTelegram, logout } from "@/lib/api";
import { useLoad } from "@/lib/hooks";
import { useInTelegram } from "@/lib/telegram";

function Account() {
  const router = useRouter();
  const me = useLoad(fetchMe);
  const inTelegram = useInTelegram();
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const run = async (label: string, fn: () => Promise<unknown>, done: string) => {
    setBusy(label);
    setError(null);
    setNotice(null);
    try {
      await fn();
      setNotice(done);
      me.reload();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const signOut = async () => {
    await logout();
    router.replace("/");
  };

  const data = me.data;

  return (
    <Screen back="/portfolio" title="Account" footer={inTelegram ? undefined : <SecondaryButton onClick={signOut}>Sign out</SecondaryButton>}>
      {me.error ? <ErrorCard>{me.error}</ErrorCard> : null}
      {error ? <ErrorCard title="That did not work.">{error}</ErrorCard> : null}
      {notice ? <Card><p className="text-sm">{notice}</p></Card> : null}

      {data ? (
        <>
          <Card className="space-y-2 text-[15px]">
            <div className="flex justify-between"><span className="text-mute">Email</span><span>{data.email ?? "Not added"}</span></div>
            <div className="flex justify-between"><span className="text-mute">Telegram</span><span>{data.telegram_linked ? "Connected" : "Not connected"}</span></div>
          </Card>

          {!data.telegram_linked ? (
            <Card className="space-y-3">
              <h2 className="font-medium">Connect Telegram</h2>
              <p className="text-sm text-mute">
                Get investment updates in Telegram and use the bot too. <a href={BOT_URL} className="font-medium text-violet">Open the bot</a>, send <span className="num">/login</span>, and enter the code it gives you.
              </p>
              <Field label="Code from Telegram" autoCapitalize="characters" spellCheck={false} value={code} onChange={(e) => setCode(e.target.value)} />
              <PrimaryButton disabled={code.trim().length < 6 || busy !== null} onClick={() => run("link", () => linkTelegram(code.trim()), "Telegram is connected.")}>
                {busy === "link" ? "Connecting…" : "Connect"}
              </PrimaryButton>
            </Card>
          ) : null}

          {!data.email ? (
            <Card className="space-y-3">
              <h2 className="font-medium">Add an email and password</h2>
              <p className="text-sm text-mute">So you can also sign in on the web, and confirm withdrawals with your password.</p>
              <Field label="Email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              <Field label="Password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} hint="At least 10 characters." />
              <PrimaryButton
                disabled={!email.includes("@") || password.length < 10 || busy !== null}
                onClick={() => run("creds", () => addEmailLogin(email.trim(), password), "Email and password added.")}
              >
                {busy === "creds" ? "Saving…" : "Save"}
              </PrimaryButton>
            </Card>
          ) : null}
        </>
      ) : null}
    </Screen>
  );
}

export default function AccountPage() {
  return (
    <Guard>
      <Account />
    </Guard>
  );
}
