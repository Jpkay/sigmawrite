import { beforeEach, describe, expect, it, vi } from "vitest";

const f = vi.hoisted(() => ({
  role: vi.fn(),
  createClient: vi.fn(),
  createServiceClient: vi.fn(),
  authenticatedFrom: vi.fn(),
  serviceFrom: vi.fn(),
  maybeSingle: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ requireRole: f.role }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: f.createClient,
  createServiceClient: f.createServiceClient,
}));

import { getClassManagedAccounts, getUserManagementData } from "./users";

function query(data: Array<Record<string, unknown>> = [], error: { message: string } | null = null) {
  const result = { data, error };
  const builder = {
    select: vi.fn(),
    in: vi.fn(),
    order: vi.fn(),
    eq: vi.fn(),
    gt: vi.fn(),
    then: vi.fn((resolve: (value: typeof result) => unknown) => Promise.resolve(result).then(resolve)),
  };
  builder.select.mockReturnValue(builder);
  builder.in.mockReturnValue(builder);
  builder.order.mockReturnValue(builder);
  builder.eq.mockReturnValue(builder);
  builder.gt.mockReturnValue(builder);
  return builder;
}

describe("getClassManagedAccounts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    f.role.mockResolvedValue({ id: "teacher-a", role: "teacher" });
    f.createClient.mockResolvedValue({ from: f.authenticatedFrom });
    f.createServiceClient.mockReturnValue({ from: f.serviceFrom });
    f.authenticatedFrom.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({ maybeSingle: f.maybeSingle })),
      })),
    });
  });

  it("denies an RLS-hidden class before constructing the service client", async () => {
    f.maybeSingle.mockResolvedValue({ data: null, error: null });

    await expect(getClassManagedAccounts("class-hidden")).rejects.toThrow("Classe introuvable.");
    expect(f.createServiceClient).not.toHaveBeenCalled();
  });

  it("denies a failed authenticated class lookup before constructing the service client", async () => {
    f.maybeSingle.mockResolvedValue({ data: null, error: { message: "permission denied" } });

    await expect(getClassManagedAccounts("class-error")).rejects.toThrow("Classe introuvable.");
    expect(f.createServiceClient).not.toHaveBeenCalled();
  });

  it("filters enrolled student identities through authenticated RLS before reading usernames", async () => {
    const visibleStudentQuery = query([{ id: "student-visible", profile_id: "profile-visible", display_name: "Visible" }]);
    f.maybeSingle.mockResolvedValue({ data: { id: "class-a" }, error: null });
    f.authenticatedFrom
      .mockReturnValueOnce({ select: vi.fn(() => ({ eq: vi.fn(() => ({ maybeSingle: f.maybeSingle })) })) })
      .mockReturnValueOnce(visibleStudentQuery);
    f.serviceFrom.mockImplementation((table: string) => table === "enrollments"
      ? query([{ student_id: "student-visible" }, { student_id: "student-foreign" }])
      : query([{ id: "profile-visible", username: "visible-user" }]));

    await expect(getClassManagedAccounts("class-a")).resolves.toEqual([
      { profileId: "profile-visible", name: "Visible", username: "visible-user" },
    ]);
    expect(f.authenticatedFrom).toHaveBeenNthCalledWith(2, "students");
    expect(f.serviceFrom).not.toHaveBeenCalledWith("students");
  });
});

describe("getUserManagementData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    f.role.mockResolvedValue({ id: "admin-a", role: "school_admin" });
    f.createClient.mockResolvedValue({ from: f.authenticatedFrom });
    f.createServiceClient.mockReturnValue({ from: f.serviceFrom });
  });

  it("fails before constructing the service client when the profile allowlist cannot be loaded", async () => {
    f.authenticatedFrom.mockReturnValue(query([], { message: "permission denied" }));

    await expect(getUserManagementData()).rejects.toThrow("permission denied");
    expect(f.createServiceClient).not.toHaveBeenCalled();
  });

  it("shapes only profiles admitted by authenticated RLS and filters their class IDs", async () => {
    f.authenticatedFrom.mockReturnValue(query([
      { id: "admin-a", school_id: "school-a" },
      { id: "profile-student", school_id: "school-a" },
    ]));
    const rows: Record<string, Array<Record<string, unknown>>> = {
      profiles: [
        { id: "admin-a", display_name: "Admin", username: "admin", role: "school_admin", school_id: "school-a" },
        { id: "profile-student", display_name: "Student", username: "student", role: "student", school_id: "school-a" },
        { id: "profile-foreign", display_name: "Foreign", username: "foreign", role: "teacher", school_id: null },
      ],
      students: [
        { id: "student-a", profile_id: "profile-student", display_name: "Student", school_id: "school-a" },
      ],
      schools: [{ id: "school-a", name: "School A", teacher_code: null }],
      classes: [{ id: "class-a", name: "Class A", school_id: "school-a" }],
      diagnostic_pilot_enrollments: [],
      teacher_classes: [{ teacher_profile_id: "profile-foreign", class_id: "class-a" }],
      teacher_students: [],
      enrollments: [
        { student_id: "student-a", class_id: "class-a" },
        { student_id: "student-a", class_id: "class-foreign" },
      ],
      student_guardians: [],
    };
    f.serviceFrom.mockImplementation((table: string) => query(rows[table] ?? []));

    const result = await getUserManagementData();

    expect(result.accounts.map((account) => account.profileId)).toEqual(["admin-a", "profile-student"]);
    expect(result.students).toEqual([expect.objectContaining({ id: "student-a", classIds: ["class-a"] })]);
  });
});
