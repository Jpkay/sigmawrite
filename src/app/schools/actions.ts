"use server";

import { z } from "zod";
import { sendEmail } from "@/lib/email";
import { captureError } from "@/lib/observability";
import { createServiceClient } from "@/lib/supabase/server";

export type SchoolInquiryState = {
  status: "idle" | "success" | "error";
  message: string;
  errors?: Record<string, string[]>;
};

const inquirySchema = z.object({
  organizationName: z.string().trim().min(2).max(160),
  organizationType: z.enum(["school", "school_group", "tutoring_center", "nonprofit", "other"]),
  country: z.string().trim().min(2).max(100),
  contactName: z.string().trim().min(2).max(120),
  contactRole: z.string().trim().min(2).max(120),
  contactEmail: z.string().trim().email().max(254),
  studentCount: z.coerce.number().int().min(1).max(100000),
  teacherCount: z.preprocess(
    (value) => (value === "" || value == null ? null : value),
    z.coerce.number().int().min(1).max(10000).nullable(),
  ),
  desiredStart: z.enum(["asap", "next_term", "next_school_year", "exploring"]),
  primaryNeed: z.enum(["grammar_writing", "french_second_language", "literacy", "exam_prep", "other"]),
  message: z.string().trim().max(2000).optional().default(""),
  language: z.enum(["fr", "en"]).default("fr"),
  captchaToken: z.string().max(4096).optional().default(""),
  website: z.string().max(0).optional().default(""),
});

const inquiryFieldNames = [
  "organizationName",
  "organizationType",
  "country",
  "contactName",
  "contactRole",
  "contactEmail",
  "studentCount",
  "teacherCount",
  "desiredStart",
  "primaryNeed",
  "message",
  "language",
  "captchaToken",
  "website",
] as const;

function getFormValue(formData: FormData, name: string) {
  const values = formData.getAll(name);
  if (values.length === 0) return undefined;
  if (values.length === 1 && typeof values[0] === "string") return values[0];
  return values;
}

function inquiryFormInput(formData: FormData) {
  return Object.fromEntries(
    inquiryFieldNames.map((name) => [name, getFormValue(formData, name)]),
  );
}

const needLabels: Record<z.infer<typeof inquirySchema>["primaryNeed"], string> = {
  grammar_writing: "Grammaire et expression écrite",
  french_second_language: "Français langue seconde",
  literacy: "Lecture et compréhension",
  exam_prep: "Préparation aux examens",
  other: "Autre besoin",
};

const startLabels: Record<z.infer<typeof inquirySchema>["desiredStart"], string> = {
  asap: "Dès que possible",
  next_term: "Au prochain trimestre",
  next_school_year: "À la prochaine rentrée",
  exploring: "Nous explorons les options",
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function verifyTurnstile(token: string) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim();
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  if (!siteKey && !secret) return true;
  if (!siteKey || !secret || !token) return false;

  try {
    const body = new URLSearchParams({ secret, response: token });
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) return false;
    const result = (await response.json()) as { success?: boolean; action?: string };
    return result.success === true && result.action === "school_inquiry";
  } catch (error) {
    captureError(error, { action: "school_inquiry_turnstile" });
    return false;
  }
}

export async function submitSchoolInquiry(
  _previousState: SchoolInquiryState,
  formData: FormData,
): Promise<SchoolInquiryState> {
  const inputValues = inquiryFormInput(formData);
  const language = inputValues.language === "en" ? "en" : "fr";
  if (typeof inputValues.website === "string" && inputValues.website.trim()) {
    return {
      status: "success",
      message: language === "en"
        ? "Thank you. Your request has been received."
        : "Merci. Votre demande a bien été reçue.",
    };
  }

  const parsed = inquirySchema.safeParse(inputValues);
  if (!parsed.success) {
    return {
      status: "error",
      message: language === "en"
        ? "Please check the information provided."
        : "Vérifiez les informations indiquées.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const input = parsed.data;
  if (!(await verifyTurnstile(input.captchaToken))) {
    return {
      status: "error",
      message: input.language === "en"
        ? "The anti-bot check expired. Please try again."
        : "La vérification anti-robot a expiré. Réessayez.",
    };
  }

  let stored = false;
  try {
    if (
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY
    ) {
      const { error } = await createServiceClient().from("school_inquiries").insert({
        organization_name: input.organizationName,
        organization_type: input.organizationType,
        country: input.country,
        contact_name: input.contactName,
        contact_role: input.contactRole,
        contact_email: input.contactEmail.toLowerCase(),
        student_count: input.studentCount,
        teacher_count: input.teacherCount,
        desired_start: input.desiredStart,
        primary_need: input.primaryNeed,
        message: input.message || null,
        preferred_language: input.language,
        source: "marketing_site",
      });
      if (error) throw error;
      stored = true;
    }
  } catch (error) {
    captureError(error, { action: "school_inquiry_store" });
  }

  const salesEmail = process.env.SCHOOL_SALES_EMAIL?.trim() || process.env.OPS_ALERT_EMAIL?.trim();
  let notified = false;
  if (salesEmail) {
    const messageText = input.message || "Aucun message complémentaire.";
    try {
      const delivery = await sendEmail({
        to: salesEmail,
        subject: `Nouvelle demande Plume — ${input.organizationName}`,
        html: `<h1>Nouvelle demande établissement</h1><p><strong>Organisation :</strong> ${escapeHtml(input.organizationName)}</p><p><strong>Type :</strong> ${escapeHtml(input.organizationType)}</p><p><strong>Pays :</strong> ${escapeHtml(input.country)}</p><p><strong>Contact :</strong> ${escapeHtml(input.contactName)} — ${escapeHtml(input.contactRole)} — ${escapeHtml(input.contactEmail)}</p><p><strong>Élèves :</strong> ${input.studentCount}</p><p><strong>Enseignants :</strong> ${input.teacherCount ?? "Non indiqué"}</p><p><strong>Besoin :</strong> ${escapeHtml(needLabels[input.primaryNeed])}</p><p><strong>Démarrage :</strong> ${escapeHtml(startLabels[input.desiredStart])}</p><p><strong>Message :</strong><br>${escapeHtml(messageText).replaceAll("\n", "<br>")}</p>`,
        text: `Nouvelle demande établissement\n\nOrganisation : ${input.organizationName}\nType : ${input.organizationType}\nPays : ${input.country}\nContact : ${input.contactName} — ${input.contactRole} — ${input.contactEmail}\nÉlèves : ${input.studentCount}\nEnseignants : ${input.teacherCount ?? "Non indiqué"}\nBesoin : ${needLabels[input.primaryNeed]}\nDémarrage : ${startLabels[input.desiredStart]}\n\n${messageText}`,
      });
      notified = delivery.sent;
    } catch (error) {
      captureError(error, { action: "school_inquiry_notify" });
    }
  }

  if (!stored && !notified) {
    return {
      status: "error",
      message: input.language === "en"
        ? "We could not save your request. Please try again in a moment."
        : "Nous n’avons pas pu enregistrer votre demande. Réessayez dans un instant.",
    };
  }

  return {
    status: "success",
    message: input.language === "en"
      ? "Thank you. We’ll review your request and get back to you shortly."
      : "Merci. Nous étudions votre demande et revenons vers vous rapidement.",
  };
}
