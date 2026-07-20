"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ExternalLink, Copy, Trash2, FlaskConical } from "lucide-react";
import { deleteSkillAction } from "@/app/actions";
import type { Skill } from "@/types/skill";

interface SkillCardProps {
  skill: Skill;
}

export function SkillCard({ skill }: SkillCardProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [copied, setCopied] = useState(false);

  const tastingUrl = `${window.location.origin}/skill/${skill.id}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(tastingUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const input = document.createElement("input");
      input.value = tastingUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteSkillAction(skill.id);
    } catch {
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const createdDate = new Date(skill.created_at);
  const daysAgo = Math.floor(
    (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <>
      <Card className="hover:border-primary/30 transition-colors">
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <FlaskConical className="w-4 h-4 text-primary" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-foreground truncate">
                  {skill.name}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {daysAgo === 0
                    ? "Today"
                    : daysAgo === 1
                      ? "Yesterday"
                      : `${daysAgo} days ago`}
                </p>
              </div>
            </div>
            <Badge variant={skill.mode === "draw" ? "default" : "secondary"}>
              {skill.mode === "draw" ? "Draw" : "Host"}
            </Badge>
          </div>

          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {skill.flavor}
          </p>

          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-4">
            <span>
              {skill.quota_used}/{skill.quota_total} tastings
            </span>
            {skill.mode === "draw" && (
              <>
                <span className="mx-1">·</span>
                <span>{skill.price_credits} credits</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1"
              onClick={() => router.push(`/skill/${skill.id}`)}
            >
              <ExternalLink className="w-3.5 h-3.5" /> View
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1"
              onClick={handleCopyLink}
            >
              <Copy className="w-3.5 h-3.5" />{" "}
              {copied ? "Copied!" : "Link"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1 text-destructive hover:text-destructive"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 删除确认对话框 */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete &ldquo;{skill.name}&rdquo;?</DialogTitle>
            <DialogDescription>
              This persona will be permanently removed. Anyone with the link
              will no longer be able to access it. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
