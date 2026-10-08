"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useShell } from "../components/shell-provider";
import { homeHref } from "../shell/navigation";
export default function Home() {
  const shell = useShell(), router = useRouter();
  const href = shell.context ? homeHref(shell.context.navigation, shell.hosted) : null;
  useEffect(() => { if (href) router.replace(href); }, [href, router]);
  return <section className="card"><h1>Home</h1>
    {shell.error ? <><p role="alert">{shell.error}</p><button onClick={shell.reload}>Retry access</button></> :
      !shell.context || href ? <p role="status">Loading your permitted workspace…</p> :
      <><p>No operational destinations are available for your current identity.</p><p>Use your account control to check your identity or ask the prototype owner to review access.</p><button onClick={shell.reload}>Refresh access</button></>}
  </section>;
}
