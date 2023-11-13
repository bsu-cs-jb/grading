import { Rubric, RubricScore } from './Rubric.js';

export interface IdName {
  id: string;
  name: string;
}

export interface Student {
  id: string;
  name: string;
  repoName?: string;
  repoUrl?: string;
}

export interface CourseDbObj {
  id: string;
  name: string;
  students: IdName[];
  rubrics: IdName[];
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

export function findRubric(course:Course, rubricId:string): Rubric|undefined {
  return course.rubrics.find((rubric) => rubric.id == rubricId);
}
