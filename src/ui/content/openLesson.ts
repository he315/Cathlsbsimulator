// Open a lesson in the Academy by id, wherever it lives (loads the curriculum chunk first).
import { useUiStore } from "../../state/useUiStore";
import { loadContent } from "./useContent";

export async function openLesson(lessonId: string): Promise<boolean> {
  const c = await loadContent();
  for (const t of c.TRACKS)
    for (const m of t.modules)
      if (m.lessons.some((l) => l.id === lessonId)) {
        useUiStore.getState().openPathway({ trackId: t.id, moduleId: m.id, lessonId, tab: "lessons" });
        return true;
      }
  return false;
}
