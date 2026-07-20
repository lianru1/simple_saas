"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/utils/supabase/client";
import { Send, Loader2, AlertCircle, FlaskConical, Download, Copy, Share2, Lock, Unlock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Skill, ChatMessage } from "@/types/skill";

export default function SkillPage() {
  const { id } = useParams<{ id: string }>();
  const [skill, setSkill] = useState<Skill | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");

  // ── 聊天状态 ──
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [chatError, setChatError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState(false);
  const [purchased, setPurchased] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  // ── 获取 Skill 数据 + 购买状态 ──
  useEffect(() => {
    async function fetchSkill() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("skills")
        .select("*")
        .eq("id", id)
        .single<Skill>();

      if (error || !data) {
        setFetchError("Skill not found. It may have been removed or the link is incorrect.");
      } else {
        setSkill(data);

        // 检查是否创建者
        const { data: authData } = await supabase.auth.getUser();
        const currentUser = authData?.user;
        if (currentUser?.id === data.user_id) {
          setIsOwner(true);
        }

        // 检查是否已购买（Draw 模式）
        if (currentUser && data.mode === "draw" && currentUser.id !== data.user_id) {
          const { data: purchase } = await supabase
            .from("purchases")
            .select("id")
            .eq("user_id", currentUser.id)
            .eq("skill_id", data.id)
            .maybeSingle();
          if (purchase) {
            setPurchased(true);
          }
        }
      }
      setLoading(false);
    }

    fetchSkill();
  }, [id]);

  // ── 自动滚到底部 ──
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── 发送消息 ──
  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;

    setChatError("");

    // 添加用户消息
    const userMsg: ChatMessage = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setSending(true);

    // 添加空的 assistant 消息骨架
    const assistantMsg: ChatMessage = { role: "assistant", content: "" };
    setMessages((prev) => [...prev, assistantMsg]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skillId: id, message: text }),
      });

      if (!res.ok) {
        const errText = await res.text();
        // 从消息列表中移除空的 assistant 消息
        setMessages((prev) => prev.filter((m) => m !== assistantMsg));
        if (res.status === 403) {
          setChatError("Tastings exhausted for this persona.");
        } else {
          setChatError(errText || "Failed to send message. Please try again.");
        }
        setSending(false);
        return;
      }

      // ── 流式读取 ──
      const reader = res.body?.getReader();
      if (!reader) {
        setChatError("Unable to read the response stream.");
        setSending(false);
        return;
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // 更新 assistant 消息内容
        setMessages((prev) =>
          prev.map((m) =>
            m === assistantMsg ? { ...m, content: buffer } : m
          )
        );
      }
    } catch (e) {
      setMessages((prev) => prev.filter((m) => m !== assistantMsg));
      setChatError("Chat service is temporarily unavailable. Please try again later.");
      console.error("Chat error:", e);
    } finally {
      setSending(false);
      // 重新聚焦输入框
      inputRef.current?.focus();
    }
  };

  // ── 加载态 ──
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="container max-w-2xl mx-auto px-4 py-16">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-96 mb-12" />
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-12 w-3/4" />
          </div>
        </div>
      </div>
    );
  }

  // ── 未找到 ──
  if (fetchError || !skill) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3 p-8">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground">{fetchError}</p>
          <Button variant="outline" onClick={() => (window.location.href = "/")}>
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  // ── 下载 Skill（Draw 模式）──
  const handleDownload = () => {
    if (!skill) return;
    const voiceSection = skill.voice_samples?.length
      ? `\n## Voice Samples\n${skill.voice_samples.map((s: string) => `- "${s}"`).join("\n")}`
      : "";
    const boundarySection = skill.boundaries?.length
      ? `\n## Honest Boundaries\n${skill.boundaries.map((b: string) => `- ${b}`).join("\n")}`
      : "";
    const content = `# ${skill.name}

## Flavor Profile
${skill.flavor}
${voiceSection}
## Core Principles
${skill.rules.map((r: string, i: number) => `${i + 1}. ${r}`).join("\n")}
${boundarySection}
## Source Material (excerpt)
${skill.material?.slice(0, 3000) ?? "(No source material provided)"}

---
Distilled by skmint · ${new Date().toISOString().split("T")[0]}
`;
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${skill.name.replace(/[^a-zA-Z0-9]/g, "_")}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── 复制分享链接 ──
  const handleCopyLink = async () => {
    const url = `${window.location.origin}/skill/${id}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const input = document.createElement("input");
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── 购买 Draw Skill ──
  const handlePurchase = async () => {
    if (!skill || purchasing) return;
    setPurchasing(true);
    try {
      const res = await fetch("/api/skills/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skillId: skill.id }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPurchased(true);
      } else {
        setChatError(data.error || "Purchase failed. Please try again.");
      }
    } catch {
      setChatError("Purchase service is temporarily unavailable.");
    } finally {
      setPurchasing(false);
    }
  };

  // ── 配额状态 ──
  const quotaPct = skill.quota_total > 0
    ? Math.round((skill.quota_used / skill.quota_total) * 100)
    : 0;
  const quotaExhausted = skill.quota_used >= skill.quota_total;
  // Draw 模式非创建者未购买 → 显示付费墙
  const showPaywall = skill.mode === "draw" && !isOwner && !purchased;

  return (
    <div className="min-h-screen flex flex-col">
      {/* ── 头部 ── */}
      <div className="border-b bg-card">
        <div className="container max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-3 mb-1">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <FlaskConical className="w-4 h-4 text-primary" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg font-semibold text-foreground truncate">
                  {skill.name}
                </h1>
                <p className="text-xs text-muted-foreground line-clamp-1">{skill.flavor}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Badge variant={skill.mode === "draw" ? "default" : "secondary"}>
                {skill.mode === "draw" ? "Draw" : "Host"}
              </Badge>
              {/* Draw 已购买：下载按钮 */}
              {skill.mode === "draw" && purchased && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  onClick={handleDownload}
                >
                  <Download className="w-3.5 h-3.5" /> Download
                </Button>
              )}
              {/* Draw 未购买：解锁按钮 */}
              {skill.mode === "draw" && !isOwner && !purchased && (
                <Button
                  size="sm"
                  className="gap-1"
                  onClick={handlePurchase}
                  disabled={purchasing}
                >
                  {purchasing ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Unlock className="w-3.5 h-3.5" />
                  )}{" "}
                  Unlock ({skill.price_credits} credits)
                </Button>
              )}
              {/* Host 模式 / 创建者：分享按钮 */}
              {(skill.mode === "host" || isOwner) && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  onClick={handleCopyLink}
                >
                  {copied ? (
                    <>Copied!</>
                  ) : (
                    <>
                      <Share2 className="w-3.5 h-3.5" /> Share
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
          {/* 配额条（创建者和已购买者不显示限制） */}
          {!isOwner && !purchased && (
            <div className="flex items-center gap-2 mt-3">
              <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    quotaExhausted ? "bg-destructive" : "bg-primary"
                  }`}
                  style={{ width: `${Math.min(quotaPct, 100)}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground flex-shrink-0">
                {skill.quota_used}/{skill.quota_total} tastings
              </span>
            </div>
          )}
          {isOwner && (
            <p className="text-xs text-muted-foreground mt-2">
              This is your persona. Chat pricing still applies — 3 free messages, then 1 credit per 10.
            </p>
          )}
          {purchased && (
            <p className="text-xs text-primary mt-2">
              You own this persona — download anytime. Chat pricing still applies.
            </p>
          )}
        </div>
      </div>

      {/* ── 聊天区 ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="container max-w-2xl mx-auto px-4 py-8">
          {messages.length === 0 ? (
            /* 欢迎状态 */
            <div className="text-center py-16">
              {/* Draw 付费墙 */}
              {showPaywall && (
                <div className="mb-8 p-6 border border-primary/20 rounded-lg bg-primary/5 max-w-sm mx-auto">
                  <Lock className="w-8 h-8 text-primary mx-auto mb-3" />
                  <h3 className="font-semibold text-foreground mb-2">
                    Unlock {skill.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    This is a limited-edition persona. Buy once, own forever —
                    download and export anytime.
                  </p>
                  <p className="text-lg font-bold text-primary mb-4">
                    {skill.price_credits} credits
                  </p>
                  <Button
                    className="w-full gap-2"
                    onClick={handlePurchase}
                    disabled={purchasing}
                  >
                    {purchasing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Unlocking…
                      </>
                    ) : (
                      <>
                        <Unlock className="w-4 h-4" /> Unlock Permanent Access
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground/60 mt-3">
                    You can also try 3 free messages before deciding.
                  </p>
                </div>
              )}
              {!showPaywall && (
                <>
                  <p className="text-muted-foreground text-sm mb-1">
                    This is what it's like to talk to{" "}
                    <span className="text-foreground font-medium">{skill.name}</span>
                  </p>
                  <p className="text-muted-foreground/60 text-xs">
                    A mind, not a machine. Say hello.
                  </p>
                </>
              )}
            </div>
          ) : (
            /* 消息列表 */
            <div className="space-y-4">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] px-4 py-2.5 rounded-xl text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">
                      {msg.content || (
                        msg.role === "assistant" && sending ? "..." : ""
                      )}
                    </p>
                  </div>
                </div>
              ))}

              {/* AI 正在输入（首次消息还未返回内容时） */}
              {sending && messages[messages.length - 1]?.role === "assistant" && !messages[messages.length - 1]?.content && (
                <div className="flex justify-start">
                  <div className="bg-secondary max-w-[85%] px-4 py-2.5 rounded-xl">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* ── 输入区 ── */}
      <div className="border-t bg-card sticky bottom-0">
        <div className="container max-w-2xl mx-auto px-4 py-5">
          {chatError && (
            <div className="flex items-center gap-2 mb-2">
              <p className="text-xs text-destructive flex-1">{chatError}</p>
              <button
                className="text-xs text-primary hover:underline flex-shrink-0"
                onClick={() => setChatError("")}
              >
                Dismiss
              </button>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex gap-2"
          >
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                quotaExhausted && !isOwner && !purchased
                  ? "Tastings exhausted — sign in or get credits to continue"
                  : `Ask ${skill.name} something only they would know...`
              }
              disabled={sending || (quotaExhausted && !isOwner && !purchased)}
              className="flex-1"
            />
            <Button
              type="submit"
              disabled={sending || !input.trim() || (quotaExhausted && !isOwner && !purchased)}
              size="icon"
            >
              {sending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </form>

          <p className="text-xs text-muted-foreground/60 mt-2 text-center">
            3 free messages, then 1 credit per 10 messages. A portion goes to the creator.
          </p>
        </div>
      </div>
    </div>
  );
}
