"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { createSkillAction } from "@/app/actions";
import { Loader2, ArrowRight, ArrowLeft, Plus, X, Upload } from "lucide-react";
import type { DistillResponse } from "@/types/skill";
import { useCredits } from "@/hooks/use-credits";
import { BREW_CREDIT_COST } from "@/config/subscriptions";

type Step = 1 | 2 | 3;

// ── 个性标签库（个人化/经验性，非通用职场标签）──
const PERSONALITY_TAGS: { category: string; tags: { label: string; hint: string }[] }[] = [
  {
    category: "Voice",
    tags: [
      { label: "Direct", hint: "I say what I mean, no sugarcoating" },
      { label: "Thoughtful", hint: "I pause before speaking, weigh my words" },
      { label: "Playful", hint: "I use humor, analogies, and don't take myself too seriously" },
      { label: "Reserved", hint: "I speak less than others, but when I do, it counts" },
    ],
  },
  {
    category: "Mind",
    tags: [
      { label: "Analytical", hint: "I break things down, look for patterns, trust data over instinct" },
      { label: "Intuitive", hint: "I go with my gut — years of experience shaped it" },
      { label: "Systems thinker", hint: "I see how everything connects, not just the parts" },
      { label: "Big picture", hint: "I care more about why and whether than how" },
    ],
  },
  {
    category: "Pace",
    tags: [
      { label: "Fast & decisive", hint: "I make calls quickly, iterate, fix later if needed" },
      { label: "Careful & thorough", hint: "I'd rather be right than fast — I check everything" },
      { label: "Pragmatic", hint: "I do what works, not what's theoretically perfect" },
      { label: "Idealistic", hint: "I hold a high bar — good enough isn't good enough" },
    ],
  },
  {
    category: "Vibe",
    tags: [
      { label: "Warm", hint: "People feel safe around me — I listen before I judge" },
      { label: "Skeptical", hint: "I question first, believe later — healthy distrust" },
      { label: "Enthusiastic", hint: "When I care about something, my energy is contagious" },
      { label: "Steady", hint: "I'm the calm in the storm — unflappable, reliable" },
    ],
  },
];

export default function BrewPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);

  // ── Step 1 状态 ──
  const [name, setName] = useState("");
  const [material, setMaterial] = useState("");

  // ── Step 2 状态 ──
  const [flavor, setFlavor] = useState("");
  const [voiceSamples, setVoiceSamples] = useState<string[]>(["", "", "", "", ""]);
  const [rules, setRules] = useState<string[]>(["", "", ""]);
  const [boundaries, setBoundaries] = useState<string[]>(["", ""]);

  // ── Step 3 状态 ──
  const [mode, setMode] = useState<"host" | "draw">("host");
  const [quotaTotal, setQuotaTotal] = useState(50);
  const [priceCredits, setPriceCredits] = useState(10);

  // ── 个性标签 ──
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // ── UI 状态 ──
  const [distilling, setDistilling] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // ── 文件上传状态 ──
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);

  // ── 积分 ──
  const { credits } = useCredits();

  // ── 文件上传处理 ──
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setError("");

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append("files", files[i]);
    }

    try {
      const res = await fetch("/api/upload/extract", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "File extraction failed.");
      }

      const data = await res.json();
      const newText = data.combinedText as string;

      // 追加到现有文本
      setMaterial((prev) =>
        prev.trim() ? `${prev}\n\n${newText}` : newText
      );
      setUploadedFiles((prev) => [
        ...prev,
        ...Array.from(files).map((f) => f.name),
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to extract text from files.");
    } finally {
      setUploading(false);
      // 重置 input 以便重新选择相同文件
      e.target.value = "";
    }
  };

  // ── 萃取风味 ──
  const handleDistill = async () => {
    if (!material.trim()) {
      setError("Please paste some source material first.");
      return;
    }
    if (material.trim().length < 10) {
      setError("Material is too short. Please enter at least 10 characters.");
      return;
    }

    setError("");
    setDistilling(true);

    // 将个性标签追加到原料末尾，帮助 AI 校准
    const tagHints = selectedTags
      .map((tag) => {
        for (const cat of PERSONALITY_TAGS) {
          const found = cat.tags.find((t) => t.label === tag);
          if (found) return `${tag}: ${found.hint}`;
        }
        return tag;
      })
      .join("; ");

    const enrichedMaterial = tagHints
      ? `${material.trim()}\n\n[Self-described traits: ${tagHints}]`
      : material.trim();

    try {
      const res = await fetch("/api/distill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ material: enrichedMaterial }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Extraction failed. Please try again.");
      }

      const data: DistillResponse = await res.json();
      setFlavor(data.flavor);
      setVoiceSamples(
        data.voice_samples && data.voice_samples.length >= 5
          ? data.voice_samples
          : [...(data.voice_samples || []), "", "", "", "", ""].slice(0, 5)
      );
      setRules(data.rules.length >= 3 ? data.rules : [...data.rules, "", "", ""].slice(0, 5));
      setBoundaries(
        data.boundaries && data.boundaries.length >= 2
          ? data.boundaries.slice(0, 3)
          : [...(data.boundaries || []), ""].slice(0, 3)
      );
      setStep(2);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Distillation interrupted. Please try again.");
    } finally {
      setDistilling(false);
    }
  };

  // ── 铁律编辑 ──
  const updateRule = (index: number, value: string) => {
    setRules((prev) => prev.map((r, i) => (i === index ? value : r)));
  };

  const addRule = () => {
    setRules((prev) => (prev.length < 5 ? [...prev, ""] : prev));
  };

  const removeRule = (index: number) => {
    setRules((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  };

  // ── 语料编辑 ──
  const updateVoiceSample = (index: number, value: string) => {
    setVoiceSamples((prev) => prev.map((s, i) => (i === index ? value : s)));
  };

  const addVoiceSample = () => {
    setVoiceSamples((prev) => (prev.length < 5 ? [...prev, ""] : prev));
  };

  const removeVoiceSample = (index: number) => {
    setVoiceSamples((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  };

  // ── 边界编辑 ──
  const updateBoundary = (index: number, value: string) => {
    setBoundaries((prev) => prev.map((b, i) => (i === index ? value : b)));
  };

  const addBoundary = () => {
    setBoundaries((prev) => (prev.length < 3 ? [...prev, ""] : prev));
  };

  const removeBoundary = (index: number) => {
    setBoundaries((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  };

  // ── 完成酝酿 ──
  const handleSubmit = async () => {
    if (!name.trim()) {
      setError("Please enter a name for your persona.");
      return;
    }
    const validRules = rules.filter((r) => r.trim());
    if (validRules.length === 0) {
      setError("You need at least one brewing rule.");
      return;
    }

    setError("");
    setSubmitting(true);

    const formData = new FormData();
    formData.append("name", name.trim());
    formData.append("flavor", flavor.trim());
    formData.append("voice_samples", JSON.stringify(voiceSamples.filter((s) => s.trim())));
    formData.append("rules", JSON.stringify(validRules));
    formData.append("boundaries", JSON.stringify(boundaries.filter((s) => s.trim())));
    formData.append("material", material.trim());
    formData.append("mode", mode);
    formData.append("quota_total", quotaTotal.toString());
    formData.append("price_credits", priceCredits.toString());

    try {
      await createSkillAction(formData);
      // createSkillAction 成功后内部 redirect，不会走这里
    } catch {
      setError("Failed to complete the brew. Please try again.");
      setSubmitting(false);
    }
  };

  // ── 步骤指示器 ──
  const steps = [
    { num: 1, label: "Your Story" },
    { num: 2, label: "Your Voice" },
    { num: 3, label: "Mint It" },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <div className="container max-w-2xl mx-auto px-4 py-16 md:py-24">
        {/* 步骤条 */}
        <div className="flex items-center justify-center gap-4 mb-12">
          {steps.map((s, i) => (
            <div key={s.num} className="flex items-center gap-2">
              <span
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= s.num
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground"
                }`}
              >
                {step > s.num ? "✓" : s.num}
              </span>
              <span
                className={`text-sm hidden sm:inline ${
                  step >= s.num ? "text-foreground font-medium" : "text-muted-foreground"
                }`}
              >
                {s.label}
              </span>
              {i < steps.length - 1 && (
                <div className={`w-8 h-px ${step > s.num ? "bg-primary" : "bg-border"}`} />
              )}
            </div>
          ))}
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="mb-8 p-4 rounded-lg bg-destructive/10 text-destructive text-sm">
            {error}
            <button onClick={() => setError("")} className="float-right opacity-50 hover:opacity-100">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ── 步骤 1：投入原料 ── */}
        {step === 1 && (
          <div className="space-y-8">
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-2">
                What shaped the way you think?
              </h1>
              <p className="text-muted-foreground">
                Your expertise isn't a list of facts — it's stories, instincts, hard-won
                lessons, and the voice you've developed over years. Share what made you
                who you are.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Whose mind are we minting?</Label>
                <Input
                  id="name"
                  placeholder="e.g. Lena's Design Instincts"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={100}
                />
              </div>

              {/* 个性标签选择器 */}
              <div className="space-y-3">
                <Label>How would you describe your style? (optional)</Label>
                <p className="text-xs text-muted-foreground -mt-1">
                  Pick any that fit — this helps the AI capture your voice more accurately.
                </p>
                {PERSONALITY_TAGS.map((cat) => (
                  <div key={cat.category} className="space-y-1.5">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {cat.category}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {cat.tags.map((tag) => {
                        const isSelected = selectedTags.includes(tag.label);
                        return (
                          <button
                            key={tag.label}
                            type="button"
                            onClick={() =>
                              setSelectedTags((prev) =>
                                isSelected
                                  ? prev.filter((t) => t !== tag.label)
                                  : [...prev, tag.label]
                              )
                            }
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs transition-colors ${
                              isSelected
                                ? "bg-primary text-primary-foreground"
                                : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80"
                            }`}
                            title={tag.hint}
                          >
                            {tag.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <Label htmlFor="material">Your Source Material</Label>

                {/* 文件上传区域 */}
                <label
                  className={`flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
                    uploading
                      ? "border-primary/50 bg-primary/5 pointer-events-none"
                      : "border-border hover:border-primary/50 hover:bg-muted/50"
                  }`}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                      <span className="text-sm text-muted-foreground">
                        Extracting text...
                      </span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-6 h-6 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Drop your files here — notes, articles, transcripts
                      </span>
                      <span className="text-xs text-muted-foreground/60">
                        .txt .md .pdf .docx — up to 4 MB each
                      </span>
                    </>
                  )}
                  <input
                    type="file"
                    multiple
                    accept=".txt,.md,.pdf,.docx"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>

                {/* 已上传文件列表 */}
                {uploadedFiles.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {uploadedFiles.map((f, i) => (
                      <span
                        key={i}
                        className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                )}

                <Textarea
                  id="material"
                  placeholder="Your notebooks, rants, hard-won lessons, the way you explain things to friends — anything that sounds like you. The more personal, the better the result."
                  value={material}
                  onChange={(e) => setMaterial(e.target.value)}
                  rows={12}
                  className="resize-y"
                />
                <p className="text-xs text-muted-foreground">
                  {material.length > 0
                    ? `${material.length} characters — the richer the material, the truer the persona.`
                    : "At least 10 characters required"}
                </p>
              </div>
            </div>

            <Button
              onClick={handleDistill}
              disabled={distilling || material.trim().length < 10}
              className="gap-2"
              size="lg"
            >
              {distilling ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Reading your story...
                </>
              ) : (
                <>
                  Distill my essence
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        )}

        {/* ── 步骤 2：定型风味 ── */}
        {step === 2 && (
          <div className="space-y-8">
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-2">
                This is the first draft of you
              </h1>
              <p className="text-muted-foreground">
                Based on what you shared, here's how we'd describe your thinking style
                and the rules you live by. Does this sound like you? Edit until it feels
                right — this is what people will experience when they talk to your persona.
              </p>
            </div>

            <div className="space-y-8">
              <div className="space-y-2">
                <Label htmlFor="flavor">Flavor Profile</Label>
                <Textarea
                  id="flavor"
                  value={flavor}
                  onChange={(e) => setFlavor(e.target.value)}
                  rows={4}
                  className="resize-y"
                />
                <p className="text-xs text-muted-foreground">
                  First-person, 80-120 words. This is how your persona introduces itself — their identity, voice, and what they care about.
                </p>
              </div>

              {/* Voice Samples — how they actually talk */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Voice Samples</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      How would you respond in these situations? Direct quotes — match your real voice. These calibrate the AI's tone.
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={addVoiceSample}
                    disabled={voiceSamples.length >= 5}
                    className="gap-1 h-7 flex-shrink-0 ml-2"
                  >
                    <Plus className="w-3 h-3" /> Add
                  </Button>
                </div>

                {voiceSamples.map((sample, i) => (
                  <div key={i} className="flex gap-2 items-start">
                    <span className="text-sm text-muted-foreground w-5 pt-2.5 flex-shrink-0">
                      {i + 1}.
                    </span>
                    <Input
                      value={sample}
                      onChange={(e) => updateVoiceSample(i, e.target.value)}
                      placeholder={
                        i === 0
                          ? `Someone asks a basic question: "Look, I've been doing this for years. The short answer is..."`
                          : i === 1
                          ? `Someone disagrees: "I hear you, but here's what you're missing..."`
                          : i === 2
                          ? `Someone asks for advice: "Honestly? There's no perfect answer, but here's what I'd do..."`
                          : i === 3
                          ? `Someone compliments your work: "Thanks. It came from a mistake I made years ago actually..."`
                          : `A scenario unique to you...`
                      }
                      maxLength={200}
                    />
                    {voiceSamples.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeVoiceSample(i)}
                        className="h-9 w-9 flex-shrink-0 text-muted-foreground hover:text-destructive"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              {/* Brewing Rules */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Brewing Rules</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Non-negotiable principles. How you make decisions, what you never compromise on. Each under 30 words.
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={addRule}
                    disabled={rules.length >= 5}
                    className="gap-1 h-7 flex-shrink-0 ml-2"
                  >
                    <Plus className="w-3 h-3" /> Add rule
                  </Button>
                </div>

                {rules.map((rule, i) => (
                  <div key={i} className="flex gap-2 items-start">
                    <span className="text-sm text-muted-foreground w-5 pt-2.5 flex-shrink-0">
                      {i + 1}.
                    </span>
                    <Input
                      value={rule}
                      onChange={(e) => updateRule(i, e.target.value)}
                      placeholder={`Rule ${i + 1}: e.g. When the data doesn't support your gut feeling, say so out loud`}
                      maxLength={100}
                    />
                    {rules.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeRule(i)}
                        className="h-9 w-9 flex-shrink-0 text-muted-foreground hover:text-destructive"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              {/* Honest Boundaries */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Honest Boundaries</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      What won't you do? What do you admit not knowing? A persona that pretends omniscience feels fake. These make you real.
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={addBoundary}
                    disabled={boundaries.length >= 3}
                    className="gap-1 h-7 flex-shrink-0 ml-2"
                  >
                    <Plus className="w-3 h-3" /> Add
                  </Button>
                </div>

                {boundaries.map((boundary, i) => (
                  <div key={i} className="flex gap-2 items-start">
                    <span className="text-sm text-muted-foreground w-5 pt-2.5 flex-shrink-0">
                      {i + 1}.
                    </span>
                    <Input
                      value={boundary}
                      onChange={(e) => updateBoundary(i, e.target.value)}
                      placeholder={
                        i === 0
                          ? `"That's not my area — you should talk to..."`
                          : i === 1
                          ? `"I've never dealt with that, so I can't say."`
                          : `"I won't give advice on this because I don't have enough context."`
                      }
                      maxLength={100}
                    />
                    {boundaries.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeBoundary(i)}
                        className="h-9 w-9 flex-shrink-0 text-muted-foreground hover:text-destructive"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-4">
              <Button variant="outline" onClick={() => setStep(1)} className="gap-2" size="lg">
                <ArrowLeft className="w-4 h-4" /> Back
              </Button>
              <Button onClick={() => setStep(3)} className="gap-2" size="lg">
                Looks like me
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ── 步骤 3：确认 + Mode/定价 ── */}
        {step === 3 && (
          <div className="space-y-8">
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-2">
                One last look before we mint your mind
              </h1>
              <p className="text-muted-foreground">
                This is the persona the world will meet. Choose how you want to share it.
              </p>
            </div>

            {/* 预览卡片 */}
            <div className="space-y-4 p-6 rounded-xl border bg-card">
              <div>
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                  Name
                </h3>
                <p className="text-foreground font-semibold">{name || "(untitled)"}</p>
              </div>

              <div>
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                  Flavor Profile
                </h3>
                <p className="text-sm text-foreground leading-relaxed">{flavor || "(empty)"}</p>
              </div>

              {voiceSamples.filter((s) => s.trim()).length > 0 && (
                <div>
                  <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                    Voice Samples
                  </h3>
                  <ul className="space-y-1.5">
                    {voiceSamples
                      .filter((s) => s.trim())
                      .map((sample, i) => (
                        <li key={i} className="text-sm text-muted-foreground italic pl-3 border-l-2 border-primary/30">
                          "{sample}"
                        </li>
                      ))}
                  </ul>
                </div>
              )}

              <div>
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  Brewing Rules
                </h3>
                <ul className="space-y-1">
                  {rules
                    .filter((r) => r.trim())
                    .map((rule, i) => (
                      <li key={i} className="text-sm text-foreground flex gap-2">
                        <span className="text-primary font-medium">{i + 1}.</span>
                        {rule}
                      </li>
                    ))}
                </ul>
              </div>

              {boundaries.filter((b) => b.trim()).length > 0 && (
                <div>
                  <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                    Honest Boundaries
                  </h3>
                  <ul className="space-y-1">
                    {boundaries
                      .filter((b) => b.trim())
                      .map((boundary, i) => (
                        <li key={i} className="text-sm text-foreground flex gap-2">
                          <span className="text-muted-foreground">{i + 1}.</span>
                          {boundary}
                        </li>
                      ))}
                  </ul>
                </div>
              )}
            </div>

            {/* ── 模式选择 ── */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">How do you want to share this?</Label>

              <div className="grid sm:grid-cols-2 gap-3">
                {/* Host 模式 */}
                <button
                  type="button"
                  onClick={() => setMode("host")}
                  className={`text-left p-4 rounded-xl border-2 transition-colors ${
                    mode === "host"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-muted-foreground/30"
                  }`}
                >
                  <div className="font-semibold text-foreground mb-1">
                    🍶 Host It
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Anyone with the link can taste it. You set how many free
                    tastings. Great for sharing your expertise publicly.
                  </p>
                  {mode === "host" && (
                    <div className="mt-3 flex items-center gap-2">
                      <Label className="text-xs text-muted-foreground whitespace-nowrap">
                        Free tastings:
                      </Label>
                      <Input
                        type="number"
                        min={10}
                        max={500}
                        value={quotaTotal}
                        onChange={(e) => setQuotaTotal(parseInt(e.target.value) || 50)}
                        className="w-20 h-8 text-sm"
                      />
                    </div>
                  )}
                </button>

                {/* Draw 模式 */}
                <button
                  type="button"
                  onClick={() => setMode("draw")}
                  className={`text-left p-4 rounded-xl border-2 transition-colors ${
                    mode === "draw"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-muted-foreground/30"
                  }`}
                >
                  <div className="font-semibold text-foreground mb-1">
                    📦 Draw It
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Someone pays credits to unlock permanent access. You set the
                    price. Great for high-value, exclusive knowledge.
                  </p>
                  {mode === "draw" && (
                    <div className="mt-3 flex items-center gap-2">
                      <Label className="text-xs text-muted-foreground whitespace-nowrap">
                        Price (credits):
                      </Label>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={priceCredits}
                        onChange={(e) => setPriceCredits(parseInt(e.target.value) || 0)}
                        className="w-20 h-8 text-sm"
                      />
                    </div>
                  )}
                </button>
              </div>
            </div>

            {/* 积分消耗提示 */}
            <div className="p-4 rounded-lg bg-muted/50 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  Cost to mint
                </span>
                <span className="font-medium text-foreground">
                  {BREW_CREDIT_COST} credit
                </span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-muted-foreground">
                  Your balance
                </span>
                <span className={`font-medium ${(credits?.remaining_credits ?? 0) < BREW_CREDIT_COST ? "text-destructive" : "text-foreground"}`}>
                  {credits?.remaining_credits ?? 0} credits
                </span>
              </div>
              {(credits?.remaining_credits ?? 0) < BREW_CREDIT_COST && (
                <p className="text-destructive text-xs mt-2">
                  You don't have enough credits.{" "}
                  <a href="/#pricing" className="underline">
                    Get more credits →
                  </a>
                </p>
              )}
            </div>

            <div className="flex gap-4">
              <Button variant="outline" onClick={() => setStep(2)} className="gap-2" size="lg">
                <ArrowLeft className="w-4 h-4" /> Edit
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting || (credits?.remaining_credits ?? 0) < BREW_CREDIT_COST}
                className="gap-2"
                size="lg"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Minting...
                  </>
                ) : (
                  <>
                    Mint this persona
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
