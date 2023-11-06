import { Rubric, RubricScore } from "./Rubric";

export interface Student {
  id: string;
  name: string;
}

export interface Course {
  students: Student[];
  gradebook: StudentGrades[];
  rubrics: Rubric[];
}

export interface StudentGrades {
  studentId: string;
  assignments: RubricScore[];
}

