export type RequiredEnvKey =
  | "CRON_SECRET"
  | "TUTOR_CLASSES_URL"
  | "SUPABASE_URL"
  | "SUPABASE_SERVICE_ROLE_KEY"
  | "RESEND_API_KEY"
  | "EMAIL_FROM"
  | "EMAIL_TO";

export function getRequiredEnv(key: RequiredEnvKey): string {
  const value = process.env[key];

  if (!value || value.trim().length === 0) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value.trim();
}

export function getClassCheckerConfig() {
  return {
    cronSecret: getRequiredEnv("CRON_SECRET"),
    tutorClassesUrl: getRequiredEnv("TUTOR_CLASSES_URL"),
    supabaseUrl: getRequiredEnv("SUPABASE_URL"),
    supabaseServiceRoleKey: getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
    resendApiKey: getRequiredEnv("RESEND_API_KEY"),
    emailFrom: getRequiredEnv("EMAIL_FROM"),
    emailTo: getRequiredEnv("EMAIL_TO"),
  };
}

export function getTutorClassesUrl() {
  return getRequiredEnv("TUTOR_CLASSES_URL");
}

export function getSupabaseConfig() {
  return {
    supabaseUrl: getRequiredEnv("SUPABASE_URL"),
    supabaseServiceRoleKey: getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
  };
}

export function getEmailConfig() {
  return {
    resendApiKey: getRequiredEnv("RESEND_API_KEY"),
    emailFrom: getRequiredEnv("EMAIL_FROM"),
    emailTo: getRequiredEnv("EMAIL_TO"),
  };
}
