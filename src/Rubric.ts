import { genid } from "./utils";

export interface RubricItem {
  id: string;
  category?: string;
  name: string;
  pointValue?: number;
  earned: boolean;
  subItems?: RubricItem[];
}

export interface RubricCategory {
  id: string;
  name: string;
  items: RubricItem[];
}

export interface Rubric {
  id: string;
  name: string;
  items: RubricItem[];
  categories: RubricCategory[];
}
// Create a new type but make all of the properties optional
type AllOptional<Type> = {
  [Property in keyof Type]?: Type[Property];
};

type RubricItemOptional = AllOptional<RubricItem>;

export function makeRubricItem(
  props?: RubricItemOptional,
): RubricItem {
  return {
    id: genid(),
    name: "Unnamed item",
    earned: false,
    ...props,
  };
}

type RubricCategoryOptional = AllOptional<RubricCategory>;

export function makeRubricCategory(
  props?: RubricCategoryOptional,
): RubricCategory {
  return {
    id: genid(),
    name: "Unnamed category",
    items: [],
    ...props,
  };
}

interface Score {
  score: number;
  points: number;
}

export function categoryScore(category: RubricCategory): Score {
  return category.items.reduce(
    ({ score, points }, item) => ({
      score:
        score +
        (item.pointValue && item.earned ? item.pointValue : 0),
      points: points + (item.pointValue ? item.pointValue : 0),
    }),
    { score: 0, points: 0 },
  );
}

export function rubricScore(rubric: Rubric): Score {
  return rubric.categories.reduce(
    ({ score, points }, category) => {
      const { score: catScore, points: catPoints } =
        categoryScore(category);
      return {
        score: score + catScore,
        points: points + catPoints,
      };
    },
    { score: 0, points: 0 },
  );
}
