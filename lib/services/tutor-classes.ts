import * as cheerio from "cheerio";

import { getTutorClassesUrl } from "@/lib/config/env";
import { tutorClassSelectors } from "@/lib/config/tutor-class-selectors";
import type { TutorClass } from "@/lib/types/tutor-class";
import { createClassKeyFromParts } from "@/lib/utils/hash";

export async function fetchTutorClasses(): Promise<TutorClass[]> {
  const tutorClassesUrl = getTutorClassesUrl();
  const html = await fetchTutorClassesHtml(tutorClassesUrl);

  return parseTutorClasses(html, tutorClassesUrl);
}

export async function fetchTutorClassesHtml(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; tutor-class-checker/1.0)",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch tutor classes page: ${response.status} ${response.statusText}`);
  }

  return response.text();
}

export function parseTutorClasses(html: string, baseUrl: string): TutorClass[] {
  const $ = cheerio.load(html);
  const parsedClasses: TutorClass[] = [];

  $(tutorClassSelectors.listItem).each((_, element) => {
    try {
      const item = $(element);
      const linkNode = item.find(tutorClassSelectors.detailLink).first();
      const href = linkNode.attr("href");
      const url = normalizeUrl(href, baseUrl);
      const code = normalizeText(item.find(tutorClassSelectors.code).first().text());
      const postedDate = normalizeText(item.find(tutorClassSelectors.postedDate).first().text());
      const infoMap = extractInfoMap($, item);
      const subject = infoMap.get("Môn");
      const location = infoMap.get("Địa chỉ");
      const fee = infoMap.get("Học phí");
      const studyMode = infoMap.get("Hình thức học");
      const schedule = infoMap.get("Thời gian") ?? infoMap.get("Lịch học") ?? undefined;
      const rawText = normalizeText(item.text());
      const title = buildTitle({ subject, location, studyMode, code });

      if (!title) {
        throw new Error("Missing title");
      }

      parsedClasses.push({
        classKey: url ?? createClassKeyFromParts([title, location, subject, schedule]),
        title,
        url: url ?? undefined,
        location: location ?? undefined,
        subject: subject ?? undefined,
        fee: fee ?? undefined,
        schedule: schedule ?? undefined,
        rawText: rawText ?? undefined,
      });
    } catch (error) {
      console.warn("[check-classes] Skipping item due to parse error", error);
    }
  });

  return dedupeByClassKey(parsedClasses);
}

function extractInfoMap($: cheerio.CheerioAPI, item: any) {
  const infoMap = new Map<string, string>();

  item.find(tutorClassSelectors.infoParagraphs).each((_, paragraph) => {
    const paragraphNode = $(paragraph);
    const value = normalizeText(paragraphNode.find(tutorClassSelectors.infoValue).first().text());

    if (!value) {
      return;
    }

    const paragraphText = normalizeText(paragraphNode.text());
    if (!paragraphText) {
      return;
    }

    const label = paragraphText.split(":")[0]?.trim();
    if (!label) {
      return;
    }

    infoMap.set(label, value);
  });

  return infoMap;
}

function buildTitle(input: {
  subject: string | undefined;
  location: string | undefined;
  studyMode: string | undefined;
  code: string | null;
}) {
  const parts = [input.subject, input.location].filter(Boolean);
  const baseTitle = parts.join(" - ");

  if (baseTitle) {
    return baseTitle;
  }

  if (input.subject && input.studyMode) {
    return `${input.subject} - ${input.studyMode}`;
  }

  if (input.subject) {
    return input.subject;
  }

  if (input.code) {
    return `Lop ${input.code}`;
  }

  return null;
}

function dedupeByClassKey(items: TutorClass[]) {
  const seen = new Set<string>();

  return items.filter((item) => {
    if (seen.has(item.classKey)) {
      return false;
    }

    seen.add(item.classKey);
    return true;
  });
}

function normalizeText(value: string | null | undefined) {
  const normalized = value?.replace(/\s+/g, " ").trim();
  return normalized || null;
}

function normalizeUrl(href: string | undefined, baseUrl: string) {
  if (!href) {
    return null;
  }

  try {
    return new URL(href, baseUrl).toString();
  } catch {
    return null;
  }
}
