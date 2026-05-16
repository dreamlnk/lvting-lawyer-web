"use client";
import { useEffect } from "react";

export default function ViewCounter({ articleId }: { articleId: number }) {
  useEffect(() => {
    fetch(`/api/articles/${articleId}/view`, { method: "POST" }).catch(() => {});
  }, [articleId]);
  return null;
}
