import { supabase } from "./supabase";
import type { Badge } from "@/types/database";

/**
 * Fetch a badge by its ID from the badge table
 * @param badgeId - The badge ID to fetch
 * @returns Badge object or null if not found
 */
export async function getBadgeById(badgeId: number): Promise<Badge | null> {
  const { data, error } = await supabase
    .from("badge")
    .select("*")
    .eq("badge_id", badgeId)
    .single();

  if (error) {
    console.error("Error fetching badge:", error);
    return null;
  }

  return data;
}

/**
 * Fetch all available badges
 * @returns Array of all badges
 */
export async function getAllBadges(): Promise<Badge[]> {
  const { data, error } = await supabase
    .from("badge")
    .select("*")
    .order("badge_id", { ascending: true });

  if (error) {
    console.error("Error fetching badges:", error);
    return [];
  }

  return data || [];
}