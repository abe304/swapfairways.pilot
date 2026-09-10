"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function callRpc(fn: "approve_request" | "reject_request" | "mark_request_played", requestId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc(fn, { p_request_id: requestId });
  revalidatePath("/mis-rondas");
  revalidatePath("/ofertas");
  revalidatePath("/creditos");
  if (error) return { error: error.message };
  return { success: true };
}

export async function approveRequest(requestId: string) {
  return callRpc("approve_request", requestId);
}

export async function rejectRequest(requestId: string) {
  return callRpc("reject_request", requestId);
}

export async function markPlayed(requestId: string) {
  return callRpc("mark_request_played", requestId);
}
