import type { SupabaseClient } from "@supabase/supabase-js"
import {
  encodeProjectMaterial,
  projectToMaterialRow,
  type MaterialRow,
} from "@/lib/assessment-materials"
import { mapCourseProject } from "@/lib/assessments"

const PROJECT_COLUMN_RE = /project_/i

export function isCourseProjectColumnError(
  error: { code?: string; message?: string } | null,
): boolean {
  if (!error) return false
  return error.code === "PGRST204" || PROJECT_COLUMN_RE.test(error.message || "")
}

export type SavedProject = {
  project_title: string | null
  project_description: string | null
  project_instructions: string | null
  project_format: string | null
}

export async function saveCourseProject(
  admin: SupabaseClient,
  courseId: string,
  project: {
    title: string
    description?: string | null
    instructions?: string | null
    format?: string | null
  } | null,
  replace: boolean,
): Promise<{ saved: boolean; project: SavedProject | null; viaMaterial: boolean }> {
  if (!project?.title?.trim()) {
    if (!replace) return { saved: false, project: null, viaMaterial: false }

    const cleared: SavedProject = {
      project_title: null,
      project_description: null,
      project_instructions: null,
      project_format: null,
    }

    const { error } = await admin
      .from("courses")
      .update(cleared)
      .eq("id", courseId)

    if (!error) {
      await admin
        .from("course_materials")
        .delete()
        .eq("course_id", courseId)
        .eq("type", "project")
      return { saved: true, project: cleared, viaMaterial: false }
    }

    if (isCourseProjectColumnError(error)) {
      await admin
        .from("course_materials")
        .delete()
        .eq("course_id", courseId)
        .eq("type", "project")
      return { saved: true, project: cleared, viaMaterial: true }
    }

    return { saved: false, project: null, viaMaterial: false }
  }

  const payload = {
    project_title: project.title.trim(),
    project_description: project.description?.trim() || null,
    project_instructions: project.instructions?.trim() || null,
    project_format:
      project.format?.trim() ||
      "Submit GitHub repo + live demo URLs and a project summary.",
  }

  const { error } = await admin.from("courses").update(payload).eq("id", courseId)

  if (!error) {
    await admin
      .from("course_materials")
      .delete()
      .eq("course_id", courseId)
      .eq("type", "project")
    return {
      saved: true,
      project: payload,
      viaMaterial: false,
    }
  }

  if (!isCourseProjectColumnError(error)) {
    console.error("saveCourseProject:", error)
    return { saved: false, project: null, viaMaterial: false }
  }

  await admin.from("course_materials").delete().eq("course_id", courseId).eq("type", "project")

  const row = projectToMaterialRow(courseId, {
    title: payload.project_title,
    description: payload.project_description,
    instructions: payload.project_instructions,
    format: payload.project_format,
  })

  const { error: matError } = await admin.from("course_materials").insert(row)
  if (matError) {
    console.error("saveCourseProject material fallback:", matError)
    return { saved: false, project: null, viaMaterial: true }
  }

  return {
    saved: true,
    project: payload,
    viaMaterial: true,
  }
}

export function projectFromCourseRow(
  courseRow: Record<string, unknown>,
  materials: MaterialRow[],
): SavedProject | null {
  const fromColumns = mapCourseProject(courseRow)
  if (fromColumns) {
    return {
      project_title: fromColumns.title,
      project_description: fromColumns.description,
      project_instructions: fromColumns.instructions,
      project_format: fromColumns.format,
    }
  }

  const material = materials.find((m) => m.type === "project")
  if (!material) return null

  if (!material.url.startsWith("data:application/json")) return null

  try {
    const comma = material.url.indexOf(",")
    const raw = JSON.parse(decodeURIComponent(material.url.slice(comma + 1))) as Record<
      string,
      unknown
    >
    return {
      project_title: String(raw.title || material.title || "").trim() || null,
      project_description: raw.description ? String(raw.description).trim() : null,
      project_instructions: raw.instructions ? String(raw.instructions).trim() : null,
      project_format: raw.format ? String(raw.format).trim() : null,
    }
  } catch {
    return {
      project_title: material.title,
      project_description: null,
      project_instructions: null,
      project_format: null,
    }
  }
}

export { encodeProjectMaterial }
