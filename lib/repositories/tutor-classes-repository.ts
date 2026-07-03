import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { getSupabaseConfig } from "@/lib/config/env";
import type { TutorClass } from "@/lib/types/tutor-class";

type TutorClassesInsertRow = {
  class_key: string;
  title: string;
  url: string | null;
  location: string | null;
  subject: string | null;
  fee: string | null;
  schedule: string | null;
  raw_text: string | null;
  first_seen_at: string;
};

export interface TutorClassesRepository {
  findExistingClassKeys(classKeys: string[]): Promise<Set<string>>;
  findPendingEmailClassKeys(classKeys: string[]): Promise<Set<string>>;
  insertNewClasses(classes: TutorClass[]): Promise<void>;
  markClassesAsEmailed(classKeys: string[]): Promise<void>;
}

export function createTutorClassesRepository(): TutorClassesRepository {
  const { supabaseUrl, supabaseServiceRoleKey } = getSupabaseConfig();
  const client = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return new SupabaseTutorClassesRepository(client);
}

class SupabaseTutorClassesRepository implements TutorClassesRepository {
  constructor(private readonly client: SupabaseClient) {}

  async findExistingClassKeys(classKeys: string[]): Promise<Set<string>> {
    if (classKeys.length === 0) {
      return new Set();
    }

    const { data, error } = await this.client
      .from("tutor_classes")
      .select("class_key")
      .in("class_key", classKeys);

    if (error) {
      throw new Error(`Failed to query existing class keys: ${error.message}`);
    }

    return new Set((data ?? []).map((row) => row.class_key as string));
  }

  async findPendingEmailClassKeys(classKeys: string[]): Promise<Set<string>> {
    if (classKeys.length === 0) {
      return new Set();
    }

    const { data, error } = await this.client
      .from("tutor_classes")
      .select("class_key")
      .in("class_key", classKeys)
      .is("emailed_at", null);

    if (error) {
      throw new Error(`Failed to query pending email class keys: ${error.message}`);
    }

    return new Set((data ?? []).map((row) => row.class_key as string));
  }

  async insertNewClasses(classes: TutorClass[]): Promise<void> {
    if (classes.length === 0) {
      return;
    }

    const now = new Date().toISOString();
    const rows: TutorClassesInsertRow[] = classes.map((item) => ({
      class_key: item.classKey,
      title: item.title,
      url: item.url ?? null,
      location: item.location ?? null,
      subject: item.subject ?? null,
      fee: item.fee ?? null,
      schedule: item.schedule ?? null,
      raw_text: item.rawText ?? null,
      first_seen_at: now,
    }));

    const { error } = await this.client.from("tutor_classes").insert(rows);

    if (error) {
      throw new Error(`Failed to insert new classes: ${error.message}`);
    }
  }

  async markClassesAsEmailed(classKeys: string[]): Promise<void> {
    if (classKeys.length === 0) {
      return;
    }

    const { error } = await this.client
      .from("tutor_classes")
      .update({ emailed_at: new Date().toISOString() })
      .in("class_key", classKeys);

    if (error) {
      throw new Error(`Failed to mark classes as emailed: ${error.message}`);
    }
  }
}
