import { genid } from "./genid";

export interface RubricItemScore {
  id: string;
  itemId: string;
  score?: number;
  subItems?: RubricItemScore[];
}

export type ScoreType = "boolean" | "full_half" | "points";
export type ScoreValue = "points" | "bonus" | "penalty";

export interface RubricItem {
  id: string;
  name: string;
  scoreType: ScoreType;
  scoreValue: ScoreValue;
  pointValue: number;
  subItems?: RubricItem[];
}

export interface RubricCategoryScore {
  id: string;
  categoryId: string;
  items: RubricItemScore[];
}

export interface RubricCategory {
  id: string;
  name: string;
  items: RubricItem[];
}

export interface RubricScore {
  id: string;
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
    scoreValue: "points",
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

type RubricOptional = AllOptional<Rubric>;

export function makeRubric(
  props?: RubricOptional,
): Rubric {
  return {
    id: genid(),
    name: "Unnamed rubric",
    categories: [],
    ...props,
  };
}

export interface Score {
  score: number;
  pointValue: number;
}

export function makeItemScore(item: RubricItem): RubricItemScore {
  const score:RubricItemScore = {
    id: genid(),
    itemId: item.id,
    score: undefined,
  };
  if (item.subItems) {
    score.subItems = item.subItems.map((item) => makeItemScore(item));
  }
  return score;
}

export function makeCategoryScore(category: RubricCategory): RubricCategoryScore {
  return {
    id: genid(),
    categoryId: category.id,
    items: category.items.map((item) => makeItemScore(item)),
  }
}

export function makeRubricScore(rubric: Rubric): RubricScore {
  return {
    id: genid(),
    rubricId: rubric.id,
    categories: rubric.categories.map((category) => makeCategoryScore(category)),
  }
}

function accumulateScores(accum:Score, score: Score): Score {
  return {
    score: accum.score + score.score,
    pointValue: accum.pointValue + score.pointValue,
  };
}

export function scoreItemList(items: RubricItem[], scores: RubricItemScore[]): Score {
  if (items.length !== scores.length) {
    throw new Error(`items.length "${items.length} !== scores.length ${scores.length}`);
  }
  return scores.reduce(
    (accum: Score, score) => (
      accumulateScores(accum, scoreItem(items?.find((item) => item.id === score.itemId), score))),
    { score: 0, pointValue: 0 },
  );
}

export function scoreItem(item: RubricItem|undefined, score: RubricItemScore): Score {
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
    return scoreItemList(item.subItems, score.subItems);
  } else {
    let pointValue;
    switch (item.scoreValue) {
      case "points":
        pointValue = item.pointValue;
        break;
      case "bonus":
        pointValue = 0;
        break;
      case "penalty":
        pointValue = 0;
        break;
    }
    switch (item.scoreType) {
      case "boolean":
        return {
          score: score.score === undefined ? 0 : (score.score > 0 ? item.pointValue : 0),
          pointValue,
        };
      case "full_half":
        return {
          score: score.score === undefined ? 0 : score.score * item.pointValue,
          pointValue,
        };
      case "points":
        let pointScore = 0;
        if (score.score === undefined) {
          pointScore = 0;
        } else if (item.pointValue < 0) {
          pointScore = -1 * score.score;
        } else {
          pointScore = score.score;
        }
        return {
          score: pointScore,
          pointValue,
        };
    }
  }
}

export function scoreCategory(category: RubricCategory|undefined, score: RubricCategoryScore): Score {
  if (!category) {
    throw new Error(`Category not found for score.categoryId ${score.categoryId}`);
  }
  if (category.id !== score.categoryId) {
    throw new Error(`item.id "${category.id} !== score.itemId ${score.categoryId}`);
  }
  return scoreItemList(category.items, score.items);
}

export function scoreRubric(rubric: Rubric, score: RubricScore): Score {
  if (rubric.categories.length !== score.categories.length) {
    throw new Error(`rubric.categories.length "${rubric.categories.length} !== score.categories.length ${score.categories.length}`);
  }
  return score.categories.reduce(
    (accum: Score, catScore) => (
      accumulateScores(
        accum, 
        scoreCategory(rubric.categories?.find((category) => category.id === catScore.categoryId), catScore)
      )),
    { score: 0, pointValue: 0 },
  );
}
