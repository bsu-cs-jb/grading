import { IdResource, Rubric, RubricScore } from './Rubric.js';

export interface IdName {
  id: string;
  name: string;
}

export interface Student extends IdResource {
  id: string;
  name: string;
  githubUsername?: string;
  grades: CourseGradeDbObj[];
}

export interface CourseDbObj extends IdResource {
  id: string;
  name: string;
  students: IdName[];
  rubrics: IdName[];
  grades: StudentGradeDbObj[];
}

export interface Course extends IdResource {
  id: string;
  name: string;
  students: Student[];
  gradebook: StudentGrades[];
  rubrics: Rubric[];
}

export interface GradeDbObj {
  id: string;
  name: string; // Rubric Name
  rubricId: string;
}

export interface CourseGradeDbObj extends GradeDbObj {
  courseId: string;
}

export interface StudentGradeDbObj extends GradeDbObj {
  studentId: string;
  studentName: string;
}

export interface StudentGrades {
  studentId: string;
  assignments: RubricScore[];
}

export function findRubric(course:Course, rubricId:string): Rubric|undefined {
  return course.rubrics.find((rubric) => rubric.id == rubricId);
}
