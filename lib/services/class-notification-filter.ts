import { getNotificationSubjectKeywords } from "@/lib/config/env";
import type { TutorClass } from "@/lib/types/tutor-class";

export function shouldNotifyForClass(tutorClass: TutorClass) {
  const notificationSubjectKeywords = getNotificationSubjectKeywords().map(normalizeVietnameseText);
  const searchableText = normalizeVietnameseText(
    [tutorClass.subject, tutorClass.title, tutorClass.rawText].filter(Boolean).join(" "),
  );

  return notificationSubjectKeywords.some((keyword) => searchableText.includes(keyword));
}

function normalizeVietnameseText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}
