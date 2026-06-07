"use client";

import { FormEvent, useMemo, useState } from "react";

type PlanTier = "free" | "pro" | "enterprise";

type Message = {
  role: "user" | "assistant";
  content: string;
  routedTo?: string;
  traceId?: string;
};

type Trace = {
  trace_id: string;
  session_id: string;
  routed_to: string;
  tool_calls: { tool_name: string; args: Record<string, unknown>; result: unknown }[];
  retrieved_chunk_ids: string[];
  latency_ms: number;
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "https://concierge-support-adk.onrender.com";

const starterPrompts = [
  "How do I rotate a deploy key?",
  "What is my plan tier?",
  "Show my recent builds.",
];

export default function Home() {
  const [userId, setUserId] = useState("u_demo_pro");
  const [planTier, setPlanTier] = useState<PlanTier>("pro");
  const [sessionId, setSessionId] = useState("");
  const [input, setInput] = useState(starterPrompts[0]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [trace, setTrace] = useState<Trace | null>(null);
  const [health, setHealth] = useState<"unknown" | "online" | "offline">("unknown");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const canSend = useMemo(() => input.trim().length > 0 && !isLoading, [input, isLoading]);

  async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...init?.headers,
      },
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.detail?.detail || body?.detail || `Request failed: ${response.status}`);
    }

    return response.json() as Promise<T>;
  }

  async function checkHealth() {
    setError("");
    try {
      await request<{ status: string }>("/healthz");
      setHealth("online");
    } catch (err) {
      setHealth("offline");
      setError(err instanceof Error ? err.message : "Unable to reach the API.");
    }
  }

  async function ensureSession() {
    if (sessionId) {
      return sessionId;
    }

    const session = await request<{ session_id: string; user_id: string }>("/v1/sessions", {
      method: "POST",
      body: JSON.stringify({ user_id: userId, plan_tier: planTier }),
    });
    setSessionId(session.session_id);
    return session.session_id;
  }

  async function sendMessage(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    const content = input.trim();
    if (!content) {
      return;
    }

    setIsLoading(true);
    setError("");
    setTrace(null);
    setMessages((current) => [...current, { role: "user", content }]);
    setInput("");

    try {
      const activeSessionId = await ensureSession();
      const chat = await request<{ reply: string; routed_to: string; trace_id: string }>(
        `/v1/chat/${activeSessionId}`,
        {
          method: "POST",
          body: JSON.stringify({ content }),
        },
      );

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: chat.reply,
          routedTo: chat.routed_to,
          traceId: chat.trace_id,
        },
      ]);

      const traceResponse = await request<Trace>(`/v1/traces/${chat.trace_id}`);
      setTrace(traceResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  }

  function resetSession() {
    setSessionId("");
    setMessages([]);
    setTrace(null);
    setError("");
  }

  return (
    <main className="min-h-screen bg-[#f6f7f3] text-[#18201c]">
      <section className="mx-auto grid min-h-screen w-full max-w-7xl gap-6 px-4 py-5 sm:px-6 lg:grid-cols-[340px_1fr] lg:px-8">
        <aside className="flex flex-col gap-4 rounded-lg border border-[#d9ddd4] bg-white p-4 shadow-sm">
          <div>
            <p className="text-sm font-medium text-[#657067]">AI Support Concierge</p>
            <h1 className="mt-2 text-3xl font-semibold leading-tight tracking-normal">
              Concierge Support ADK
            </h1>
            <p className="mt-3 text-sm leading-6 text-[#657067]">
              FastAPI backend with ADK routing, persisted session state, local RAG, account tools,
              and structured traces.
            </p>
          </div>

          <div className="grid gap-3">
            <label className="grid gap-1 text-sm font-medium">
              User ID
              <input
                className="h-10 rounded-md border border-[#cfd5cc] bg-white px-3 text-sm outline-none focus:border-[#315f55]"
                value={userId}
                onChange={(event) => setUserId(event.target.value)}
              />
            </label>

            <label className="grid gap-1 text-sm font-medium">
              Plan
              <select
                className="h-10 rounded-md border border-[#cfd5cc] bg-white px-3 text-sm outline-none focus:border-[#315f55]"
                value={planTier}
                onChange={(event) => setPlanTier(event.target.value as PlanTier)}
              >
                <option value="free">Free</option>
                <option value="pro">Pro</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </label>
          </div>

          <div className="grid gap-2 border-t border-[#e3e6df] pt-4 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[#657067]">API</span>
              <span
                className={`rounded-full px-2 py-1 text-xs font-medium ${
                  health === "online"
                    ? "bg-[#dceee6] text-[#1d5f44]"
                    : health === "offline"
                      ? "bg-[#f6d9d5] text-[#8a2d23]"
                      : "bg-[#ecefe8] text-[#5d655e]"
                }`}
              >
                {health}
              </span>
            </div>
            <p className="break-all font-mono text-xs text-[#657067]">{API_BASE_URL}</p>
            <button className="control-button" type="button" onClick={checkHealth}>
              Check health
            </button>
            <button className="control-button" type="button" onClick={resetSession}>
              New session
            </button>
          </div>

          <div className="border-t border-[#e3e6df] pt-4">
            <p className="text-sm font-medium">Try</p>
            <div className="mt-2 grid gap-2">
              {starterPrompts.map((prompt) => (
                <button
                  className="rounded-md border border-[#d9ddd4] px-3 py-2 text-left text-sm text-[#33413a] transition hover:border-[#315f55] hover:bg-[#f4f8f2]"
                  key={prompt}
                  type="button"
                  onClick={() => setInput(prompt)}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <section className="grid min-h-[720px] grid-rows-[1fr_auto] overflow-hidden rounded-lg border border-[#d9ddd4] bg-white shadow-sm">
          <div className="grid gap-0 lg:grid-cols-[1fr_360px]">
            <div className="flex min-h-0 flex-col">
              <div className="border-b border-[#e3e6df] px-5 py-4">
                <p className="text-sm text-[#657067]">
                  Session{" "}
                  <span className="font-mono text-xs">
                    {sessionId || "created on first message"}
                  </span>
                </p>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-5">
                {messages.length === 0 ? (
                  <div className="grid h-full place-items-center text-center">
                    <div>
                      <h2 className="text-2xl font-semibold tracking-normal">
                        Ask a support question
                      </h2>
                      <p className="mt-2 max-w-md text-sm leading-6 text-[#657067]">
                        The demo will create a session, route the turn, return the answer, and
                        fetch the trace for inspection.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {messages.map((message, index) => (
                      <article
                        className={`max-w-[820px] rounded-lg px-4 py-3 ${
                          message.role === "user"
                            ? "ml-auto bg-[#315f55] text-white"
                            : "mr-auto border border-[#d9ddd4] bg-[#f8faf6]"
                        }`}
                        key={`${message.role}-${index}`}
                      >
                        <p className="text-sm leading-6">{message.content}</p>
                        {message.traceId ? (
                          <p className="mt-2 font-mono text-xs text-[#657067]">
                            {message.routedTo} / {message.traceId}
                          </p>
                        ) : null}
                      </article>
                    ))}
                    {isLoading ? (
                      <div className="mr-auto rounded-lg border border-[#d9ddd4] bg-[#f8faf6] px-4 py-3 text-sm text-[#657067]">
                        Routing through ADK...
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            </div>

            <aside className="border-t border-[#e3e6df] bg-[#fbfcf9] p-5 lg:border-l lg:border-t-0">
              <h2 className="text-lg font-semibold tracking-normal">Trace</h2>
              {trace ? (
                <div className="mt-4 grid gap-4 text-sm">
                  <dl className="grid grid-cols-2 gap-3">
                    <div>
                      <dt className="text-[#657067]">Route</dt>
                      <dd className="font-medium">{trace.routed_to}</dd>
                    </div>
                    <div>
                      <dt className="text-[#657067]">Latency</dt>
                      <dd className="font-medium">{trace.latency_ms} ms</dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="text-[#657067]">Trace ID</dt>
                      <dd className="break-all font-mono text-xs">{trace.trace_id}</dd>
                    </div>
                  </dl>

                  <div>
                    <p className="font-medium">Retrieved chunks</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {trace.retrieved_chunk_ids.length > 0 ? (
                        trace.retrieved_chunk_ids.map((chunkId) => (
                          <span
                            className="rounded-full bg-[#e8eee6] px-2 py-1 font-mono text-xs"
                            key={chunkId}
                          >
                            {chunkId}
                          </span>
                        ))
                      ) : (
                        <span className="text-[#657067]">None</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="font-medium">Tool calls</p>
                    <pre className="mt-2 max-h-64 overflow-auto rounded-md bg-[#18201c] p-3 text-xs leading-5 text-[#e8eee6]">
                      {JSON.stringify(trace.tool_calls, null, 2)}
                    </pre>
                  </div>
                </div>
              ) : (
                <p className="mt-3 text-sm leading-6 text-[#657067]">
                  Send a message to see routing, retrieved chunks, tool calls, and latency.
                </p>
              )}
            </aside>
          </div>

          <form className="border-t border-[#e3e6df] bg-white p-4" onSubmit={sendMessage}>
            {error ? (
              <p className="mb-3 rounded-md border border-[#efc4bd] bg-[#fff2f0] px-3 py-2 text-sm text-[#8a2d23]">
                {error}
              </p>
            ) : null}
            <div className="flex flex-col gap-3 sm:flex-row">
              <textarea
                className="min-h-24 flex-1 resize-none rounded-md border border-[#cfd5cc] px-3 py-3 text-sm leading-6 outline-none focus:border-[#315f55]"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask about deploy keys, billing, builds, runners, or account status..."
              />
              <button
                className="h-12 rounded-md bg-[#315f55] px-5 text-sm font-semibold text-white transition hover:bg-[#244940] disabled:cursor-not-allowed disabled:bg-[#a8b3ac] sm:h-auto sm:w-32"
                disabled={!canSend}
                type="submit"
              >
                {isLoading ? "Sending" : "Send"}
              </button>
            </div>
          </form>
        </section>
      </section>
    </main>
  );
}
