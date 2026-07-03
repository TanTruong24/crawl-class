import { Resend } from "resend";

import { getEmailConfig } from "@/lib/config/env";
import type { TutorClass } from "@/lib/types/tutor-class";

export async function sendNewClassesEmail(classes: TutorClass[]) {
  if (classes.length === 0) {
    return;
  }

  const { resendApiKey, emailFrom, emailTo } = getEmailConfig();
  const resend = new Resend(resendApiKey);

  const { error } = await resend.emails.send({
    from: emailFrom,
    to: [emailTo],
    subject: `[Tutor Classes] ${classes.length} lop moi`,
    html: buildTutorClassesEmailHtml(classes),
  });

  if (error) {
    throw new Error(`Failed to send email via Resend: ${error.message}`);
  }
}

function buildTutorClassesEmailHtml(classes: TutorClass[]) {
  const itemsHtml = classes
    .map((item) => {
      const detailUrl = item.url ? `<a href="${escapeHtml(item.url)}">${escapeHtml(item.url)}</a>` : "N/A";

      return `
        <li style="margin-bottom:16px;">
          <div><strong>${escapeHtml(item.title)}</strong></div>
          <div>Mon hoc: ${escapeHtml(item.subject ?? "N/A")}</div>
          <div>Khu vuc: ${escapeHtml(item.location ?? "N/A")}</div>
          <div>Hoc phi: ${escapeHtml(item.fee ?? "N/A")}</div>
          <div>Thoi gian: ${escapeHtml(item.schedule ?? "N/A")}</div>
          <div>Link chi tiet: ${detailUrl}</div>
        </li>
      `;
    })
    .join("");

  return `
    <div>
      <p>Danh sach lop gia su moi vua duoc tim thay:</p>
      <ul>
        ${itemsHtml}
      </ul>
    </div>
  `;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
