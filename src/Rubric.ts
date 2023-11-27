import { urlid } from './genid.js';
import { assert } from './utils.js';
import _ from 'lodash';

export interface IdResource {
  id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Score {
  score: number;
  pointValue: number;
  // number of items that have undefined score
  unscoredItems: number;
}

export interface RubricItemScore {
  id: string;
  itemId: string;
  subItems?: RubricItemScore[];
  // computedScore is for temporary use and display
  // it can always be recalculated
  computedScore?: Score;
  // only score and comments are changed by grading
  score?: number;
  comments?: string;
}

export type ScoreType = 'boolean' | 'full_half' | 'points' | 'subItems';
export type ScoreValue = 'points' | 'bonus' | 'penalty';

export interface RubricItem {
  id: string;
  name: string;
  scoreType: ScoreType;
  scoreValue: ScoreValue;
  pointValue: number;
  pointIncrement?: number;
  subItems?: RubricItem[];
}

export interface RubricCategoryScore {
  id: string;
  categoryId: string;
  items: RubricItemScore[];
  computedScore?: Score;
  comments?: string;
}

export interface RubricCategory {
  id: string;
  name: string;
  items: RubricItem[];
}

export interface RubricScore extends IdResource {
  id: string;
  rubricId: string;
  name: string; // Rubric Name
  studentId?: string;
  studentName?: string;
  courseId?: string;
  courseName?: string;
  categories: RubricCategoryScore[];
  computedScore?: Score;
  comments?: string;
}

export interface Rubric extends IdResource {
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
    name: 'Unnamed item',
    scoreType: 'boolean',
    scoreValue: 'points',
    pointValue: 1,
    ...props,
  };
}

type RubricCategoryOptional = AllOptional<RubricCategory>;

type RubricIdMap = Record<string, RubricItem[]>;

export interface RubricValidationResult {
  valid: boolean;
  duplicateItemIds: string[];
  duplicateCategoryIds: string[];
}

export interface RubricValidationStore extends RubricValidationResult {
  itemIdMap: RubricIdMap;
}

function ensureValidation(validation?: RubricValidationStore): RubricValidationStore {
  if (validation === undefined) {
    return {
      valid: true,
      itemIdMap: {},
      duplicateItemIds: [],
      duplicateCategoryIds: [],
    };
  } else {
    return validation;
  }
}

export function validateUniqueItemIds(items: RubricItem[], validation?: RubricValidationStore): RubricValidationStore {
  validation = ensureValidation(validation);

  for (const item of items) {
    if (item.id in validation.itemIdMap) {
      console.log(`Duplicate item ${validation.itemIdMap[item.id].length} ${item.id} ${item.name}.`);
      validation.itemIdMap[item.id].push(item);
      validation.valid = false;
      validation.duplicateItemIds.push(item.id);
    } else {
      validation.itemIdMap[item.id] = [item];
    }
    if (item.subItems) {
      validation = validateUniqueItemIds(item.subItems, validation);
    }
  }

  return validation;
}

export function validateCategories(categories: RubricCategory[]): RubricValidationStore {
  let validation = ensureValidation();

  for (const category of categories) {
    validation = validateUniqueItemIds(category.items, validation);
  }

  return validation;
}

export function validateRubric(rubric: Rubric): RubricValidationResult {
  return _.omit(validateCategories(rubric.categories), ['itemIdMap']);
}

export function makeRubricCategory(
  props?: RubricCategoryOptional,
): RubricCategory {
  const category = {
    id: urlid(),
    name: 'Unnamed category',
    items: [],
    ...props,
  };

  const { valid } = validateUniqueItemIds(category.items);
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
    name: 'Unnamed rubric',
    categories: [],
    ...props,
  };

  const { valid } = validateCategories(rubric.categories);
  if (!valid) {
    console.log(`Invalid item in rubric ${rubric.name} ${rubric.id}`);
  }

  return rubric;
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
  };
}

export function makeRubricScore(rubric: Rubric): RubricScore {
  return {
    id: urlid(),
    rubricId: rubric.id,
    name: rubric.name,
    categories: rubric.categories.map((category) => makeCategoryScore(category)),
  };
}

function accumulateScores(accum:Score, score: Score): Score {
  return {
    score: accum.score + score.score,
    pointValue: accum.pointValue + score.pointValue,
    unscoredItems: accum.unscoredItems + score.unscoredItems,
  };
}

type RubricTypes = RubricItem | RubricCategory | RubricItemScore | RubricCategoryScore;

export function findInRubric<T extends RubricTypes>(rubric:Rubric|RubricScore, { itemId, categoryId }: { itemId?:string; categoryId?: string }):T|undefined {
  if (categoryId) {
    return findCategory(rubric, categoryId) as T;
  } else if (itemId) {
    for (const cat of rubric.categories) {
      for (const item of cat.items) {
        if ('itemId' in item) {
          if (item.itemId === itemId) {
            return item as T;
          }
          if (item.subItems) {
            return findItem(item.subItems, itemId) as T;
          }
        } else {
          if (item.id === itemId) {
            return item as T;
          }
          if (item.subItems) {
            return findItem(item.subItems, itemId) as T;
          }
        }
      }
    }
  }
  return undefined;
}

export function findScoreItem(items: RubricItemScore[], itemId:string):RubricItemScore|undefined {
  return _.find(items, { itemId });
}

export function findCategoryScore(categories: RubricCategoryScore[], categoryId:string):RubricCategoryScore|undefined {
  return _.find(categories, { categoryId });
}

export function findItem<T extends (RubricItem|RubricItemScore)>(items: T[], id:string):T|undefined {
  if (items.length === 0) {
    console.log(`findItem(undefined, ${id})`);
    return undefined;
  } else if ('itemId' in items[0]) {
    console.log(`findItem(${items.length}, ${id}) as RubricItemScore`);
    // RubricItemScore[]
    return _.find(items, { itemId: id }) as T|undefined;
  } else {
    // Rubric
    console.log(`findItem(${items.length}, ${id}) as RubricItem`);
    return _.find(items, { id }) as T|undefined;
  }
}

export function findCategory<T extends (Rubric|RubricScore), U extends T['categories'][0]>(rubric: T, categoryId:string):U|undefined {
  if ('rubricId' in rubric) {
    // RubricScore
    return _.find(rubric.categories, { categoryId }) as U|undefined;
  } else {
    // Rubric
    return _.find(rubric.categories, { id: categoryId }) as U|undefined;
  }
}

export function scoreItemList(items: RubricItem[], scores: RubricItemScore[]): Score {
  if (items.length !== scores.length) {
    throw new Error(`items.length "${items.length} !== scores.length ${scores.length}`);
  }
  return scores.reduce(
    (accum: Score, score) => (
      accumulateScores(accum, scoreItem(items?.find((item) => item.id === score.itemId), score))),
    { score: 0, pointValue: 0, unscoredItems: 0 },
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
    const computedScore = scoreItemList(item.subItems, score.subItems);
    score.computedScore = computedScore;
    return computedScore;
  } else {

    let pointValue;
    let pointScore = 0;

    switch (item.scoreValue) {
    case 'points':
      pointValue = item.pointValue;
      break;
    case 'bonus':
      pointValue = 0;
      break;
    case 'penalty':
      pointValue = 0;
      break;
    }

    switch (item.scoreType) {
    case 'boolean':
      pointScore = score.score === undefined ? 0 : (score.score > 0 ? item.pointValue : 0);
      break;
    case 'full_half':
      pointScore =  score.score === undefined ? 0 : score.score * item.pointValue;
      break;
    case 'points':
      if (score.score === undefined) {
        pointScore = 0;
      } else if (item.pointValue < 0) {
        pointScore = -1 * score.score;
      } else {
        pointScore = score.score;
      }
      break;
    }
    score.computedScore = {
      score: pointScore,
      pointValue,
      unscoredItems: (score.score === undefined) ? 1: 0,
    };
    return score.computedScore;
  }
}

export function scoreCategory(category: RubricCategory|undefined, score: RubricCategoryScore): Score {
  if (!category) {
    throw new Error(`Category not found for score.categoryId ${score.categoryId}`);
  }
  if (category.id !== score.categoryId) {
    throw new Error(`item.id "${category.id} !== score.itemId ${score.categoryId}`);
  }
  const computedScore = scoreItemList(category.items, score.items);
  score.computedScore = computedScore;
  return computedScore;
}

export function scoreRubric(rubric: Rubric, score: RubricScore): Score {
  if (rubric.categories.length !== score.categories.length) {
    throw new Error(`rubric.categories.length "${rubric.categories.length} !== score.categories.length ${score.categories.length}`);
  }
  const computedScore = score.categories.reduce(
    (accum: Score, catScore) => (
      accumulateScores(
        accum, 
        scoreCategory(rubric.categories?.find((category) => category.id === catScore.categoryId), catScore)
      )),
    { score: 0, pointValue: 0, unscoredItems: 0 },
  );
  score.computedScore = computedScore;
  return computedScore;
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
    'categoryId'
  >(scores, categories, 'categoryId');
}

export function itemScoreList(
  scores: RubricItemScore[],
  items: RubricItem[],
) {
  return defListMap<RubricItemScore, RubricItem, 'itemId'>(
    scores,
    items,
    'itemId',
  );
}

export type ItemScoreUpdate = {
  update: 'item',
  itemId: string;
  // Optional id for debugging
  id?: string;
  updateScore?: boolean;
  score?: number;
  updateComments?: boolean;
  comments?: string;
}

export type CategoryScoreUpdate = {
  update: 'category',
  // Optional id for debugging
  id?: string;
  categoryId: string;
  updateComments?: boolean;
  comments?: string;
}

export type ScoreUpdate = ItemScoreUpdate | CategoryScoreUpdate;

export function updateRubricItemScore(
  itemScore: RubricItemScore,
  item: RubricItem,
  updatedScore?: ScoreUpdate,
): RubricItemScore {
  let scoreValue = itemScore.score;
  let updatedComments = itemScore.comments;
  if (updatedScore && updatedScore.update === 'item' && itemScore.itemId === updatedScore.itemId) {
    // console.log(
    //   `Updating item ${updatedScore.itemId} score: ${updatedScore.score} comments: ${updatedScore.comments}`,
    // );
    if (updatedScore.updateScore) {
      scoreValue = updatedScore.score;
    }
    if (updatedScore.updateComments) {
      updatedComments = updatedScore.comments;
    }
  }
  let subItems = itemScore.subItems;
  if (subItems && item.subItems) {
    subItems = itemScoreList(subItems, item.subItems).map(
      ([itemScore, item]) =>
        updateRubricItemScore(itemScore, item, updatedScore),
    );
  }
  const updatedItem: RubricItemScore = {
    ...itemScore,
    score: scoreValue,
    comments: updatedComments,
    subItems,
  };
  return updatedItem;
}

function fixItemScoreList(itemList?: RubricItem[], scoreItemList?: RubricItemScore[]): RubricItemScore[]|undefined {
  if (!itemList) {
    return undefined;
  }
  if (!scoreItemList) {
    // use makeItemScore to make the subitems
    const tempScore = makeItemScore(makeRubricItem({ subItems: itemList }));
    return tempScore.subItems || [];
  }
  const newScoreList: RubricItemScore[] = itemList.map((item: RubricItem) => {
    const foundScoreItem = findScoreItem(scoreItemList, item.id);
    if (foundScoreItem) {
      return {
        ...foundScoreItem,
        subItems: fixItemScoreList(item.subItems, foundScoreItem.subItems),
      };
    } else {
      return makeItemScore(item);
    }
  });
  return newScoreList;
}

export function updateRubricCategoryScore(
  score: RubricCategoryScore,
  category: RubricCategory,
  updatedScore?: ScoreUpdate,
): RubricCategoryScore {

  let updatedComments = score.comments;
  if (updatedScore && updatedScore.update === 'category' && score.categoryId === updatedScore.categoryId) {
    // console.log(
    //   `Updating category ${updatedScore.categoryId} comments: ${updatedScore.comments}`,
    // );
    if (updatedScore.updateComments) {
      updatedComments = updatedScore.comments;
    }
  }


  let updatedScoreItemList = fixItemScoreList(category.items, score.items);
  if (!updatedScoreItemList) {
    assert(Boolean(updatedScoreItemList));
    updatedScoreItemList = [];
  }

  return {
    ...score,
    // Could skip this if updating category comments
    items: itemScoreList(updatedScoreItemList, category.items).map(
      ([itemScore, item]) =>
        updateRubricItemScore(itemScore, item, updatedScore),
    ),
    comments: updatedComments,
  };
}

function fixCategoryScoreList(rubric: Rubric, score: RubricScore): RubricCategoryScore[] {
  const newScoreList: RubricCategoryScore[] = rubric.categories.map((category: RubricCategory) => {
    const foundScore = findCategory(score, category.id);
    if (foundScore) {
      return {
        ...foundScore,
        items: fixItemScoreList(category.items, foundScore.items) || [],
      };
    } else {
      return makeCategoryScore(category);
    }
  });
  return newScoreList;
}

/**
 * Updates RubricItemScore's score and comments
 */
export function updateRubricScore(
  score: RubricScore,
  rubric: Rubric,
  updatedScore?: ScoreUpdate,
): RubricScore {

  // TODO: handle category changes here
  const updatedCategories = fixCategoryScoreList(rubric, score);

  const updatedRubricScore = {
    ...score,
    categories: categoryScoreList(
      updatedCategories,
      rubric.categories,
    ).map(([categoryScore, category]) =>
      updateRubricCategoryScore(
        categoryScore,
        category,
        updatedScore,
      ),
    ),
  };
  scoreRubric(rubric, updatedRubricScore);
  return updatedRubricScore;
}
