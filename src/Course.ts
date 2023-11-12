import { Rubric, RubricScore } from "./Rubric.js";

export interface Student {
  id: string;
  name: string;
  repoName?: string;
  repoUrl?: string;
}

export interface Course {
  id: string;
  name: string;
  students: Student[];
  gradebook: StudentGrades[];
  rubrics: Rubric[];
}

export interface StudentGrades {
  studentId: string;
  assignments: RubricScore[];
}
