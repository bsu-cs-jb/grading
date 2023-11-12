import { urlid } from "./genid";

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
    id: urlid(),
    name: "Unnamed item",
    scoreType: "boolean",
    scoreValue: "points",
    pointValue: 1,
    ...props,
  };
}

type RubricCategoryOptional = AllOptional<RubricCategory>;

type RubricIdMap = Record<string, RubricItem[]>;

export function validateUniqueItemIds(items: RubricItem[], idMap?:RubricIdMap): [boolean, RubricIdMap] {
  if (idMap === undefined) {
    idMap = {};
  }
  let allUnique = true;
  let subItemUnique = true;

  for (const item of items) {
    if (item.id in idMap) {
      console.log(`Duplicate ${item.id}.`);
      idMap[item.id].push(item);
      allUnique = false;
    } else {
      idMap[item.id] = [item];
    }
    if (item.subItems) {
      [subItemUnique, idMap] = validateUniqueItemIds(item.subItems, idMap);
      allUnique &&= subItemUnique;
    }
  }

  return [allUnique, idMap];
}

export function validateCategories(categories: RubricCategory[]): boolean {
  let idMap: Record<string, RubricItem[]> = {};
  let allUnique = true;
  let subItemUnique = true;

  for (const category of categories) {
    [subItemUnique, idMap] = validateUniqueItemIds(category.items, idMap);
    allUnique &&= subItemUnique;
  }

  return allUnique;
}

export function validateRubric(rubric: Rubric): boolean {
  return validateCategories(rubric.categories);
}

export function makeRubricCategory(
  props?: RubricCategoryOptional,
): RubricCategory {
  const category = {
    id: urlid(),
    name: "Unnamed category",
    items: [],
    ...props,
  };

  const valid = validateUniqueItemIds(category.items);
  if (!valid) {
    console.log(`Invalid item in category ${category.name} ${category.id}`);
  }

  return category;
}

type RubricOptional = AllOptional<Rubric>;

export function makeRubric(
  props?: RubricOptional,
): Rubric {
  const rubric = {
    id: urlid(),
    name: "Unnamed rubric",
    categories: [],
    ...props,
  };

  const valid = validateCategories(rubric.categories);
  if (!valid) {
    console.log(`Invalid item in rubric ${rubric.name} ${rubric.id}`);
  }

  return rubric;
}

export interface Score {
  score: number;
  pointValue: number;
}

export function makeItemScore(item: RubricItem): RubricItemScore {
  const score:RubricItemScore = {
    id: urlid(),
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
    id: urlid(),
    categoryId: category.id,
    items: category.items.map((item) => makeItemScore(item)),
  }
}

export function makeRubricScore(rubric: Rubric): RubricScore {
  return {
    id: urlid(),
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

export function defListMap<
  U extends { [P in IdPropertyName]: string },
  T extends { id: string },
  IdPropertyName extends string,
>(
  refList: U[],
  defList: T[],
  idField: IdPropertyName,
): Array<[U, T]> {
  return refList
    .map((item: U): [U, T | undefined] => [
      item,
      defList.find((def: T) => def.id === item[idField]),
    ])
    .filter((value): value is [U, T] => value[1] !== undefined);
}

export function categoryScoreList(
  scores: RubricCategoryScore[],
  categories: RubricCategory[],
) {
  return defListMap<
    RubricCategoryScore,
    RubricCategory,
    "categoryId"
  >(scores, categories, "categoryId");
}

export function itemScoreList(
  scores: RubricItemScore[],
  items: RubricItem[],
) {
  return defListMap<RubricItemScore, RubricItem, "itemId">(
    scores,
    items,
    "itemId",
  );
}

export function updateRubricItemScore(
  itemScore: RubricItemScore,
  item: RubricItem,
  updatedItemScore: RubricItemScore,
): RubricItemScore {
  // console.log(
  //   `Updating item score ${itemScore.itemId} ${updatedItemScore.itemId}`,
  // );
  let scoreValue = itemScore.score;
  if (itemScore.itemId === updatedItemScore.itemId) {
    scoreValue = updatedItemScore.score;
  }
  let subItems = itemScore.subItems;
  if (subItems && item.subItems) {
    subItems = itemScoreList(subItems, item.subItems).map(
      ([itemScore, item]) =>
        updateRubricItemScore(itemScore, item, updatedItemScore),
    );
  }
  return {
    ...itemScore,
    score: scoreValue,
    subItems,
  };
}

export function updateRubricCategoryScore(
  score: RubricCategoryScore,
  category: RubricCategory,
  updatedItemScore: RubricItemScore,
): RubricCategoryScore {
  return {
    ...score,
    items: itemScoreList(score.items, category.items).map(
      ([itemScore, item]) =>
        updateRubricItemScore(itemScore, item, updatedItemScore),
    ),
  };
}

export function updateRubricScore(
  score: RubricScore,
  rubric: Rubric,
  updatedItemScore: RubricItemScore,
): RubricScore {
  return {
    ...score,
    categories: categoryScoreList(
      score.categories,
      rubric.categories,
    ).map(([categoryScore, category]) =>
      updateRubricCategoryScore(
        categoryScore,
        category,
        updatedItemScore,
      ),
    ),
  };
}
