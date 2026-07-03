import { NextRequest, NextResponse } from "next/server";

import { getRequiredEnv } from "@/lib/config/env";
import { sendNewClassesEmail } from "@/lib/services/email-service";
import { shouldNotifyForClass } from "@/lib/services/class-notification-filter";
import { fetchTutorClasses } from "@/lib/services/tutor-classes";
import {
  createTutorClassesRepository,
  type TutorClassesRepository,
} from "@/lib/repositories/tutor-classes-repository";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const expectedToken = getRequiredEnv("CRON_SECRET");
    const token = request.nextUrl.searchParams.get("token");

    if (token !== expectedToken) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    console.info("[check-classes] Starting class check");

    const parsedClasses = await fetchTutorClasses();
    console.info(`[check-classes] Parsed ${parsedClasses.length} classes`);

    const repository = createTutorClassesRepository();
    const { newClasses, emailCandidates } = await classifyClasses(repository, parsedClasses);

    console.info(`[check-classes] Found ${newClasses.length} new classes`);
    console.info(
      `[check-classes] ${emailCandidates.length} classes matched programming notification filter`,
    );

    await repository.insertNewClasses(newClasses);

    let emailedCount = 0;

    if (emailCandidates.length > 0) {
      try {
        await sendNewClassesEmail(emailCandidates);
        await repository.markClassesAsEmailed(emailCandidates.map((item) => item.classKey));
        emailedCount = emailCandidates.length;
        console.info(`[check-classes] Email sent successfully for ${emailedCount} classes`);
      } catch (error) {
        console.error("[check-classes] Failed to send email", error);
      }
    } else {
      console.info("[check-classes] No new classes to email");
    }

    return NextResponse.json({
      success: true,
      totalFound: parsedClasses.length,
      newCount: newClasses.length,
      emailedCount,
    });
  } catch (error) {
    console.error("[check-classes] Unexpected error", error);

    const message = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 },
    );
  }
}

async function classifyClasses(
  repository: TutorClassesRepository,
  parsedClasses: Awaited<ReturnType<typeof fetchTutorClasses>>,
) {
  if (parsedClasses.length === 0) {
    return {
      newClasses: [],
      emailCandidates: [],
    };
  }

  const classKeys = parsedClasses.map((item) => item.classKey);
  const existingKeys = await repository.findExistingClassKeys(classKeys);
  const pendingEmailKeys = await repository.findPendingEmailClassKeys(classKeys);
  const newClasses = parsedClasses.filter((item) => !existingKeys.has(item.classKey));
  const pendingEmailClasses = parsedClasses.filter((item) => pendingEmailKeys.has(item.classKey));
  const notificationCandidates = [...newClasses, ...pendingEmailClasses].filter(shouldNotifyForClass);

  return {
    newClasses,
    emailCandidates: dedupeClassesByKey(notificationCandidates),
  };
}

function dedupeClassesByKey(items: Awaited<ReturnType<typeof fetchTutorClasses>>) {
  const seen = new Set<string>();

  return items.filter((item) => {
    if (seen.has(item.classKey)) {
      return false;
    }

    seen.add(item.classKey);
    return true;
  });
}
