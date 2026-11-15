import { LESSONS_A, MODULES_A } from "@/content/curriculum-a";
import { LESSONS_B, MODULES_B } from "@/content/curriculum-b";
import { LESSONS_C, MODULES_C } from "@/content/curriculum-c";
import type { Lesson, Module, Question } from "@/content/types";

export const MODULES: Module[] = [...MODULES_A, ...MODULES_B, ...MODULES_C];
export const LESSONS: Lesson[] = [...LESSONS_A, ...LESSONS_B, ...LESSONS_C];

export function getModule(id: string): Module | undefined {
  return MODULES.find((module) => module.id === id);
}

export function getLesson(id: string): Lesson | undefined {
  return LESSONS.find((lesson) => lesson.id === id);
}

export function lessonsFor(moduleId: string): Lesson[] {
  return LESSONS.filter((lesson) => lesson.moduleId === moduleId);
}

export function orderedLessons(): Lesson[] {
  return MODULES.flatMap((module) => lessonsFor(module.id));
}

export function findQuestion(id: string): { lesson: Lesson; question: Question } | null {
  for (const lesson of LESSONS) {
    const question = lesson.questions.find((item) => item.id === id);
    if (question) return { lesson, question };
  }
  return null;
}

export function neighborLessons(id: string): { prev: Lesson | null; next: Lesson | null } {
  const all = orderedLessons();
  const index = all.findIndex((lesson) => lesson.id === id);
  if (index < 0) return { prev: null, next: null };
  return { prev: all[index - 1] ?? null, next: all[index + 1] ?? null };
}
