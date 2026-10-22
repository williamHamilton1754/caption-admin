"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin";
import { buildPrompt, isStyleKey, themeForToday } from "@/lib/captions";
import { CLAUDE_MODEL, generateCaptionsWithClaude } from "@/lib/claude";
import { createClient } from "@/lib/supabase/server";

type Result = { ok: true } | { error: string };

// Every mutation re-checks superadmin on the server. RLS checks it again in the database.
async function adminClient() {
  const { supabase, user, isAdmin } = await getAdminSession();
  return user && isAdmin ? { supabase, user } : null;
}

const DENIED: Result = { error: "Only superadmins can do that." };

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

// CREATE: ask Claude for fresh captions on an existing photo.
export async function generateCaptions(postId: number, style: string): Promise<Result> {
  const admin = await adminClient();
  if (!admin) return DENIED;
  if (!isStyleKey(style)) return { error: "Pick a caption voice." };

  const { data: post } = await admin.supabase
    .from("posts")
    .select("image_path, theme")
    .eq("id", postId)
    .maybeSingle<{ image_path: string; theme: string | null }>();
  if (!post) return { error: "That post no longer exists." };

  const { data: file, error: downloadError } = await admin.supabase.storage.from("photos").download(post.image_path);
  if (downloadError || !file) return { error: downloadError?.message ?? "Couldn't read the photo." };

  const prompt = buildPrompt(style, post.theme ?? themeForToday());
  let captions: string[];
  try {
    captions = await generateCaptionsWithClaude({
      prompt,
      image: await file.arrayBuffer(),
      mimeType: file.type || "image/jpeg",
    });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Caption generation failed." };
  }

  const { error } = await admin.supabase.from("captions").insert(
    captions.map((content) => ({
      post_id: postId,
      created_by: admin.user.id,
      content,
      source: "ai",
      style,
      prompt,
      model: CLAUDE_MODEL,
    })),
  );
  if (error) return { error: error.message };

  revalidatePath("/media");
  return { ok: true };
}

// UPDATE: fix or rewrite a caption's text. Votes are untouched.
export async function updateCaption(captionId: number, text: string): Promise<Result> {
  const admin = await adminClient();
  if (!admin) return DENIED;

  const content = text.trim().replace(/\s+/g, " ");
  if (content.length === 0 || content.length > 280) return { error: "Captions must be 1–280 characters." };

  const { data, error } = await admin.supabase.from("captions").update({ content }).eq("id", captionId).select("id");
  if (error) return { error: error.message };
  if (!data?.length) return { error: "Nothing was updated. Is the admin SQL installed?" };

  revalidatePath("/media");
  return { ok: true };
}

// DELETE one caption (its votes go with it).
export async function deleteCaption(captionId: number): Promise<Result> {
  const admin = await adminClient();
  if (!admin) return DENIED;

  const { data, error } = await admin.supabase.from("captions").delete().eq("id", captionId).select("id");
  if (error) return { error: error.message };
  if (!data?.length) return { error: "Nothing was deleted. Is the admin SQL installed?" };

  revalidatePath("/media");
  revalidatePath("/");
  return { ok: true };
}

// DELETE a whole post: its captions and votes, then the photo file in Storage.
export async function deletePost(postId: number): Promise<Result> {
  const admin = await adminClient();
  if (!admin) return DENIED;

  const { data, error } = await admin.supabase.from("posts").delete().eq("id", postId).select("image_path");
  if (error) return { error: error.message };
  if (!data?.length) return { error: "Nothing was deleted. Is the admin SQL installed?" };

  await admin.supabase.storage.from("photos").remove(data.map((p) => p.image_path));

  revalidatePath("/media");
  revalidatePath("/");
  return { ok: true };
}
