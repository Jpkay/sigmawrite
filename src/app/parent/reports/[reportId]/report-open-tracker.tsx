"use client";
import { useEffect } from "react";
import { track } from "@/lib/analytics";
export function ReportOpenTracker({ reportId }: { reportId: string }) { useEffect(() => track("parent_report_opened", { report_id: reportId }), [reportId]); return null; }
