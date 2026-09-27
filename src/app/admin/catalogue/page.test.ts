import { isValidElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const f = vi.hoisted(() => ({
  requireRole: vi.fn(),
  getReviewerAccess: vi.fn(),
  getTeacherContent: vi.fn(),
  submitFeedback: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth", () => ({ requireRole: f.requireRole }));
vi.mock("@/lib/db/reviews", () => ({ getReviewerAccess: f.getReviewerAccess }));
vi.mock("@/lib/db/teacher-content", () => ({
  getTeacherContent: f.getTeacherContent,
  teacherContentKind: (value: unknown) => ["lesson", "passage", "exercise"].includes(value as string) ? value : "lesson",
  TEACHER_CONTENT_PAGE_SIZE: 20,
}));
vi.mock("@/lib/actions/teacher-content", () => ({ submitTeacherContentFeedback: f.submitFeedback }));

import AdminCataloguePage from "./page";
import AdminLayout from "../layout";
import TeacherContentPage from "../../teacher/content/page";
import { ContentCatalog } from "@/components/content-catalog";

const row = {
  id: "content-1", title: "Accord", status: "human_approved", body: ["Texte pédagogique"],
  reviewSummary: ["Avis soumis"], targetKind: "passage", releaseId: null, contentKey: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  f.requireRole.mockResolvedValue({ id: "admin-1", role: "platform_admin" });
  f.getReviewerAccess.mockResolvedValue(null);
  f.getTeacherContent.mockResolvedValue({ rows: [row], count: 41 });
});

describe("pedagogical catalogue access", () => {
  it("guards the admin page before returning the shared catalogue", async () => {
    f.requireRole.mockRejectedValueOnce(new Error("unauthorized"));
    await expect(AdminCataloguePage({ searchParams: Promise.resolve({ kind: "passage" }) })).rejects.toThrow("unauthorized");
    expect(f.getTeacherContent).not.toHaveBeenCalled();

    const page = await AdminCataloguePage({ searchParams: Promise.resolve({ kind: "passage", page: "2" }) });
    expect(f.requireRole).toHaveBeenLastCalledWith(["platform_admin"]);
    expect(isValidElement(page)).toBe(true);
    if (!isValidElement<{ audience: string; query: object }>(page)) throw new Error("Missing catalogue");
    expect(page.type).toBe(ContentCatalog);
    expect(page.props).toEqual({ audience: "admin", query: { kind: "passage", page: "2" } });
  });

  it("keeps the teacher page teacher-only", async () => {
    const page = await TeacherContentPage({ searchParams: Promise.resolve({ kind: "lesson" }) });
    expect(f.requireRole).toHaveBeenCalledWith(["teacher"]);
    if (!isValidElement<{ audience: string }>(page)) throw new Error("Missing catalogue");
    expect(page.props.audience).toBe("teacher");
  });

  it("puts the catalogue in platform admin navigation but not the school admin menu", async () => {
    const platform = await AdminLayout({ children: null });
    if (!isValidElement<{ nav: Array<{ href: string }> }>(platform)) throw new Error("Missing admin shell");
    expect(platform.props.nav).toContainEqual({ href: "/admin/catalogue", label: "Catalogue pédagogique" });
    f.requireRole.mockResolvedValue({ id: "school-1", role: "school_admin" });
    const school = await AdminLayout({ children: null });
    if (!isValidElement<{ nav: Array<{ href: string }> }>(school)) throw new Error("Missing school shell");
    expect(school.props.nav.some((item) => item.href === "/admin/catalogue")).toBe(false);
  });

  it.each(["lesson", "passage", "exercise"])("renders %s through the same loader and admin links", async (kind) => {
    const html = renderToStaticMarkup(await ContentCatalog({ audience: "admin", query: { kind, page: "2", sent: "1" } }));
    expect(f.getTeacherContent).toHaveBeenCalledWith(kind, 2);
    expect(html).toContain("Accord");
    expect(html).toContain(`href="/admin/catalogue?kind=${kind}&amp;page=1"`);
    expect(html).toContain(`href="/admin/catalogue?kind=${kind}&amp;page=3"`);
    expect(html).not.toContain("Signaler une observation");
    expect(html).not.toContain("Votre observation a été transmise");
    if (kind === "passage") expect(html).toContain("Avis soumis");
  });

  it("retains teacher-only feedback on the shared catalogue", async () => {
    const html = renderToStaticMarkup(await ContentCatalog({ audience: "teacher", query: { kind: "passage", sent: "1" } }));
    expect(html).toContain("Avis soumis");
    expect(html).toContain("Signaler une observation");
    expect(html).toContain("Votre observation a été transmise");
    expect(html).toContain('href="/teacher/content?kind=lesson"');
  });
});
