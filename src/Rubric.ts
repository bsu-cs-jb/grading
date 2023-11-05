import { genid } from "./genid";

export interface RubricItemScore {
  itemId: string;
  score: number;
  subItems?: RubricItemScore[];
}

export type ScoreType = "boolean" | "full_half" | "points";

export interface RubricItem {
  id: string;
  name: string;
  scoreType: ScoreType;
  pointValue: number;
  subItems?: RubricItem[];
}

export interface RubricCategoryScore {
  categoryId: string;
  items: RubricItemScore[];
}

export interface RubricCategory {
  id: string;
  name: string;
  items: RubricItem[];
}

export interface RubricScore {
  rubricId: string;
  categories: RubricCategoryScore[];
}

export interface Rubric {
  id: string;
  name: string;
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
    scoreType: "boolean",
    pointValue: 1,
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

export interface Score {
  score: number;
  pointValue: number;
}

function accumulateScores(accum:Score, score: Score): Score {
  return {
    score: accum.score + score.score,
    pointValue: accum.pointValue + score.pointValue,
  };
}

export function itemListScore(items: RubricItem[], scores: RubricItemScore[]): Score {
  if (items.length !== scores.length) {
    throw new Error(`items.length "${items.length} !== scores.length ${scores.length}`);
  }
  return scores.reduce(
    (accum: Score, score) => (
      accumulateScores(accum, itemScore(items?.find((item) => item.id === score.itemId), score))),
    { score: 0, pointValue: 0 },
  );
}

export function itemScore(item: RubricItem|undefined, score: RubricItemScore): Score {
  if (!item) {
    throw new Error(`item not found for score.itemId ${score.itemId}`);
  }
  if (item.id !== score.itemId) {
    throw new Error(`item.id "${item.id} !== score.itemId ${score.itemId}`);
  }
  if (item.subItems) {
    if (!score.subItems) {
      throw new Error('item.subItems but no score.subItems');
    }
    return itemListScore(item.subItems, score.subItems);
  } else {
    switch (item.scoreType) {
      case "boolean":
        return {
          score: score.score > 0 ? item.pointValue : 0,
          pointValue: item.pointValue,
        };
      case "full_half":
        return {
          score: score.score * item.pointValue,
          pointValue: item.pointValue,
        };
      case "points":
        return {
          score: score.score,
          pointValue: item.pointValue,
        };
    }
  }
}

export function categoryScore(category: RubricCategory|undefined, score: RubricCategoryScore): Score {
  if (!category) {
    throw new Error(`Category not found for score.categoryId ${score.categoryId}`);
  }
  if (category.id !== score.categoryId) {
    throw new Error(`item.id "${category.id} !== score.itemId ${score.categoryId}`);
  }
  return itemListScore(category.items, score.items);
}

export function rubricScore(rubric: Rubric, score: RubricScore): Score {
  if (rubric.categories.length !== score.categories.length) {
    throw new Error(`rubric.categories.length "${rubric.categories.length} !== score.categories.length ${score.categories.length}`);
  }
  return score.categories.reduce(
    (accum: Score, catScore) => (
      accumulateScores(
        accum, 
        categoryScore(rubric.categories?.find((category) => category.id === catScore.categoryId), catScore)
      )),
    { score: 0, pointValue: 0 },
  );
}
