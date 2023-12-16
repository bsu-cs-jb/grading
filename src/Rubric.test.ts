import { expect, test, describe, beforeEach } from '@jest/globals';

import {
  Rubric,
  RubricScore,
  RubricItem,
  validateUniqueItemIds,
  validateCategories,
  validateRubric,
  updateRubricScore,
  findCategory,
  findItem,
  findInRubric,
  scoreRubric,
  makeRubric,
  makeRubricScore,
  makeRubricCategory,
  makeRubricItem,
  Score,
} from './Rubric.js';

// TODO: Make into fixture
function makeTestRubric() {
  return makeRubric({
    categories: [
      makeRubricCategory({
        id: 'cat-0',
        items: [
          makeRubricItem({
            id: 'cat-0-item-0',
            scoreType: 'boolean',
            pointValue: 2,
          }),
          makeRubricItem({
            id: 'cat-0-item-1',
            scoreType: 'full_half',
            pointValue: 1,
          }),
          makeRubricItem({
            id: 'cat-0-item-2',
            scoreType: 'points',
            pointValue: 4,
          }),
        ],
      }),
      makeRubricCategory({
        id: 'cat-1',
        items: [
          makeRubricItem({
            id: 'cat-1-item-0',
            subItems: [
              makeRubricItem({
                id: 'cat-1-item-0-subItem-0',
                scoreType: 'full_half',
                pointValue: 1,
              }),
              makeRubricItem({
                id: 'cat-1-item-0-subItem-1',
                scoreType: 'boolean',
                pointValue: 0.5,
              }),
            ],
          }),
          makeRubricItem({
            id: 'cat-1-item-1',
            scoreType: 'full_half',
            pointValue: 2,
          }),
          makeRubricItem({
            id: 'cat-1-item-2',
            scoreType: 'points',
            pointValue: 2,
          }),
          makeRubricItem({
            id: 'cat-1-item-3',
            scoreType: 'points',
            scoreValue: 'bonus',
            pointValue: 2,
          }),
          makeRubricItem({
            id: 'cat-1-item-4',
            scoreType: 'points',
            scoreValue: 'penalty',
            pointValue: -1,
          }),
        ],
      }),
    ],
  });
}

test('make score', () => {
  const rubric = makeTestRubric();
  const rubricScore = makeRubricScore(rubric);
  expect(rubricScore).toHaveProperty('id');
  expect(rubricScore).toHaveProperty('rubricId', rubric.id);
  expect(rubricScore).toHaveProperty('categories');
  expect(rubricScore).toHaveProperty('categories.length', 2);
  expect(rubricScore).toHaveProperty('categories.0.id');
  expect(rubricScore).toHaveProperty(
    'categories.0.categoryId',
    rubric.categories[0].id,
  );
  expect(rubricScore).toHaveProperty('categories.0.items.length', 3);
  expect(rubricScore).toHaveProperty('categories.0.items.0.id');
  expect(rubricScore).toHaveProperty(
    'categories.0.items.0.itemId',
    rubric.categories[0].items[0].id,
  );
  expect(rubricScore).toHaveProperty('categories.0.items.0.score', undefined);
  expect(rubricScore).toHaveProperty('categories.0.items.1.id');
  expect(rubricScore).toHaveProperty(
    'categories.0.items.1.itemId',
    rubric.categories[0].items[1].id,
  );
  expect(rubricScore).toHaveProperty('categories.0.items.2.id');
  expect(rubricScore).toHaveProperty(
    'categories.0.items.2.itemId',
    rubric.categories[0].items[2].id,
  );
  expect(rubricScore).toHaveProperty('categories.1.id');
  expect(rubricScore).toHaveProperty(
    'categories.1.categoryId',
    rubric.categories[1].id,
  );
  expect(rubricScore).toHaveProperty('categories.1.items.0.id');
  expect(rubricScore).toHaveProperty(
    'categories.1.items.0.itemId',
    rubric.categories[1].items[0].id,
  );
  expect(rubricScore).toHaveProperty('categories.1.items.0.score', undefined);
  expect(rubricScore).toHaveProperty('categories.1.items.0.subItems.length', 2);
  expect(rubricScore).toHaveProperty('categories.1.items.0.subItems.0.id');

  if (rubric.categories[1].items[0].subItems) {
    expect(rubricScore).toHaveProperty(
      'categories.1.items.0.subItems.0.itemId',
      rubric.categories[1].items[0].subItems[0].id,
    );
    expect(rubricScore).toHaveProperty(
      'categories.1.items.0.subItems.1.itemId',
      rubric.categories[1].items[0].subItems[1].id,
    );
  }
  expect(rubricScore).toHaveProperty('categories.1.items.0.subItems.1.id');
});

test('score rubric', () => {
  const rubric = makeTestRubric();
  const rubricScore = makeRubricScore(rubric);

  let score: Score = scoreRubric(rubric, rubricScore);
  // with no points earned or lost, score should be 0
  expect(score).toHaveProperty('score', 0);
  expect(score).toHaveProperty('pointValue', 12.5);

  // +2 full points of 2 pt item
  rubricScore.categories[0].items[0].score = 1;
  // +0.5 half of 1 point item
  rubricScore.categories[0].items[1].score = 0.5;
  // +2 pts out of 4 point
  rubricScore.categories[0].items[2].score = 2;

  score = scoreRubric(rubric, rubricScore);
  expect(score).toHaveProperty('score', 4.5);
  expect(score).toHaveProperty('pointValue', 12.5);
  expect(score).toHaveProperty('unscoredItems', 6);

  // +0.5 half of a 1.0 subItem
  if (rubricScore.categories[1].items[0].subItems) {
    rubricScore.categories[1].items[0].subItems[0].score = 0.5;
    // +0.5 full points on subItem worth 0.5
    rubricScore.categories[1].items[0].subItems[1].score = 1;
  }
  // +1 half of a 2 point item
  rubricScore.categories[1].items[1].score = 0.5;
  // +1 point out of 2 points
  rubricScore.categories[1].items[2].score = 1;
  score = scoreRubric(rubric, rubricScore);
  expect(score).toHaveProperty('score', 7.5);
  expect(score).toHaveProperty('pointValue', 12.5);
  expect(score).toHaveProperty('unscoredItems', 2);

  // +1 point bonus out of 2
  rubricScore.categories[1].items[3].score = 1;
  // -2 point penalty out of -1
  rubricScore.categories[1].items[4].score = 2;

  score = scoreRubric(rubric, rubricScore);
  expect(score).toHaveProperty('score', 6.5);
  expect(score).toHaveProperty('pointValue', 12.5);
  expect(score).toHaveProperty('unscoredItems', 0);
});

test('update rubric score', () => {
  const rubric = makeTestRubric();
  let rubricScore = makeRubricScore(rubric);

  let score: Score = scoreRubric(rubric, rubricScore);
  // with no points earned or lost, score should be 0
  expect(score).toHaveProperty('score', 0);
  expect(score).toHaveProperty('pointValue', 12.5);
  expect(score).toHaveProperty('unscoredItems', 9);

  // +2 points out of 4
  rubricScore = updateRubricScore(rubricScore, rubric, {
    update: 'item',
    itemId: 'cat-0-item-2',
    updateScore: true,
    score: 2,
    updateComments: true,
    comments: 'Good job',
  });

  score = scoreRubric(rubric, rubricScore);
  expect(score).toHaveProperty('score', 2);
  expect(score).toHaveProperty('pointValue', 12.5);
  expect(score).toHaveProperty('unscoredItems', 8);
  expect(rubricScore).toHaveProperty('categories.0.items.2.score', 2);
  expect(rubricScore).toHaveProperty(
    'categories.0.items.2.comments',
    'Good job',
  );

  // Update comment only
  rubricScore = updateRubricScore(rubricScore, rubric, {
    update: 'item',
    itemId: 'cat-0-item-2',
    updateScore: false,
    score: 0,
    updateComments: true,
    comments: 'Looks good now',
  });

  score = scoreRubric(rubric, rubricScore);
  expect(score).toHaveProperty('score', 2);
  expect(score).toHaveProperty('pointValue', 12.5);
  expect(score).toHaveProperty('unscoredItems', 8);
  expect(rubricScore).toHaveProperty('categories.0.items.2.score', 2);
  expect(rubricScore).toHaveProperty(
    'categories.0.items.2.comments',
    'Looks good now',
  );

  // +0.5 for full score on half point item
  rubricScore = updateRubricScore(rubricScore, rubric, {
    update: 'item',
    itemId: 'cat-1-item-0-subItem-1',
    updateScore: true,
    score: 1,
    comments: 'Ignore this change',
  });

  score = scoreRubric(rubric, rubricScore);
  expect(score).toHaveProperty('score', 2.5);
  expect(score).toHaveProperty('pointValue', 12.5);
  expect(score).toHaveProperty('unscoredItems', 7);
  expect(rubricScore).toHaveProperty(
    'categories.1.items.0.subItems.1.itemId',
    'cat-1-item-0-subItem-1',
  );
  expect(rubricScore).toHaveProperty(
    'categories.1.items.0.subItems.1.score',
    1,
  );
  expect(rubricScore).toHaveProperty(
    'categories.1.items.0.subItems.1.comments',
    undefined,
  );

  // reset to undefined
  rubricScore = updateRubricScore(rubricScore, rubric, {
    update: 'item',
    itemId: 'cat-0-item-2',
    updateScore: true,
    score: undefined,
    updateComments: true,
    comments: undefined,
  });

  score = scoreRubric(rubric, rubricScore);
  expect(score).toHaveProperty('score', 0.5);
  expect(score).toHaveProperty('pointValue', 12.5);
  expect(score).toHaveProperty('unscoredItems', 8);
  expect(rubricScore).toHaveProperty('categories.0.items.2.score', undefined);
  expect(rubricScore).toHaveProperty(
    'categories.0.items.2.comments',
    undefined,
  );
});

test('update rubric category comments', () => {
  const rubric = makeTestRubric();
  let rubricScore = makeRubricScore(rubric);

  let score: Score = scoreRubric(rubric, rubricScore);
  // with no points earned or lost, score should be 0
  expect(score).toHaveProperty('score', 0);
  expect(score).toHaveProperty('pointValue', 12.5);
  expect(score).toHaveProperty('unscoredItems', 9);

  rubricScore = updateRubricScore(rubricScore, rubric, {
    update: 'category',
    categoryId: 'cat-1',
    updateComments: true,
    comments: 'Needs work',
  });

  score = scoreRubric(rubric, rubricScore);
  expect(score).toHaveProperty('score', 0);
  expect(score).toHaveProperty('pointValue', 12.5);
  expect(score).toHaveProperty('unscoredItems', 9);
  expect(rubricScore).toHaveProperty('categories.1.categoryId', 'cat-1');
  expect(rubricScore).toHaveProperty('categories.1.comments', 'Needs work');
});

test('validate rubric items', () => {
  let items: RubricItem[] = [];

  items = [
    makeRubricItem({ id: 'cat-0-item-0' }),
    makeRubricItem({ id: 'cat-0-item-1' }),
  ];
  let { valid } = validateUniqueItemIds(items);
  expect(valid).toBeTruthy();

  items = [
    makeRubricItem({ id: 'cat-0-item-0' }),
    makeRubricItem({ id: 'cat-0-item-0' }),
  ];
  valid = validateUniqueItemIds(items).valid;
  expect(valid).toBeFalsy();

  items = [
    makeRubricItem({ id: 'cat-0-item-0' }),
    makeRubricItem({
      id: 'cat-0-item-1',
      subItems: [
        makeRubricItem({ id: 'cat-0-subItem-0' }),
        makeRubricItem({ id: 'cat-0-subItem-1' }),
      ],
    }),
  ];
  valid = validateUniqueItemIds(items).valid;
  expect(valid).toBeTruthy();

  items = [
    makeRubricItem({ id: 'cat-0-item-0' }),
    makeRubricItem({
      id: 'cat-0-item-1',
      subItems: [
        makeRubricItem({ id: 'cat-0-subItem-0' }),
        makeRubricItem({ id: 'cat-0-item-0' }),
      ],
    }),
  ];
  valid = validateUniqueItemIds(items).valid;
  expect(valid).toBeFalsy();
});

test('validate rubric', () => {
  let valid: boolean = true;

  const rubric = makeTestRubric();
  valid = validateRubric(rubric).valid;
  expect(valid).toBeTruthy();

  const categories = [
    makeRubricCategory({
      items: [
        makeRubricItem({ id: 'cat-0-item-0' }),
        makeRubricItem({ id: 'cat-0-item-1' }),
      ],
    }),
    makeRubricCategory({
      items: [
        makeRubricItem({ id: 'cat-0-item-0' }),
        makeRubricItem({ id: 'cat-1-item-1' }),
      ],
    }),
  ];
  valid = validateCategories(categories).valid;
  expect(valid).toBeFalsy();
});

describe('update score when rubric changes', () => {
  let rubric: Rubric;
  let rubricScore: RubricScore;
  let score: Score;

  beforeEach(() => {
    rubric = makeTestRubric();
    rubricScore = makeRubricScore(rubric);
    // score an item to test removal and update
    rubricScore = updateRubricScore(rubricScore, rubric, {
      update: 'item',
      itemId: 'cat-1-item-0-subItem-0',
      updateScore: true,
      score: 1,
    });
    score = scoreRubric(rubric, rubricScore);

    // with no points earned or lost, score should be 0
    expect(score).toHaveProperty('score', 1);
    expect(score).toHaveProperty('pointValue', 12.5);
    expect(score).toHaveProperty('unscoredItems', 8);
  });

  test('item added', () => {
    // add an item
    findCategory(rubric, 'cat-0')?.items.push(
      makeRubricItem({
        id: 'cat-0-item-new',
        scoreType: 'boolean',
        pointValue: 2,
      }),
    );
    rubricScore = updateRubricScore(rubricScore, rubric);

    score = scoreRubric(rubric, rubricScore);
    expect(score).toHaveProperty('score', 1);
    expect(score).toHaveProperty('pointValue', 14.5);
    expect(score).toHaveProperty('unscoredItems', 9);
    expect(rubric).toHaveProperty('categories.0.items.length', 4);
    expect(rubricScore).toHaveProperty('categories.0.items.length', 4);
    expect(rubricScore).toHaveProperty('categories.0.items.3.score', undefined);

    // +2 points
    rubricScore = updateRubricScore(rubricScore, rubric, {
      update: 'item',
      itemId: 'cat-0-item-new',
      updateScore: true,
      score: 1,
    });

    score = scoreRubric(rubric, rubricScore);
    expect(score).toHaveProperty('score', 3);
    expect(score).toHaveProperty('pointValue', 14.5);
    expect(score).toHaveProperty('unscoredItems', 8);
    expect(rubricScore).toHaveProperty('categories.0.items.3.score', 1);
    expect(rubricScore).toHaveProperty(
      'categories.0.items.3.computedScore.score',
      2,
    );
    expect(rubricScore).toHaveProperty(
      'categories.0.items.3.computedScore.pointValue',
      2,
    );
  });

  test('subitem added', () => {
    // add a subitem
    const cat1 = findCategory(rubric, 'cat-1');
    expect(cat1).toBeDefined();
    if (cat1) {
      const item0 = findItem(cat1.items, 'cat-1-item-0');
      // console.log('Looking for item:', item0, cat1.items);
      expect(item0).toBeDefined();
      expect(item0?.subItems).toBeDefined();
      if (item0 && item0.subItems) {
        item0.subItems.push(
          makeRubricItem({
            id: 'cat-1-item-0-subItem-new',
            name: 'New subItem',
            scoreType: 'full_half',
            pointValue: 3,
          }),
        );
      }
    }
    rubricScore = updateRubricScore(rubricScore, rubric, {
      update: 'item',
      itemId: 'cat-1-item-0-subItem-new',
      updateScore: true,
      score: 0.5,
    });

    score = scoreRubric(rubric, rubricScore);
    expect(score).toHaveProperty('score', 2.5);
    expect(score).toHaveProperty('pointValue', 15.5);
    expect(score).toHaveProperty('unscoredItems', 8);
    expect(rubric).toHaveProperty('categories.1.items.0.subItems.length', 3);
    expect(rubricScore).toHaveProperty(
      'categories.1.items.0.subItems.length',
      3,
    );

    let item = findInRubric(rubric, { itemId: 'cat-1-item-0-subItem-new' });
    expect(item).toBeDefined();
    expect(item).toHaveProperty('pointValue', 3);
    item = findInRubric(rubricScore, { itemId: 'cat-1-item-0-subItem-new' });
    expect(item).toBeDefined();
    expect(item).toHaveProperty('itemId', 'cat-1-item-0-subItem-new');
  });

  test('item removed', () => {
    // Then remove the item from the rubric
    findCategory(rubric, 'cat-0')?.items.shift();
    rubricScore = updateRubricScore(rubricScore, rubric);

    score = scoreRubric(rubric, rubricScore);
    expect(score).toHaveProperty('score', 1);
    expect(score).toHaveProperty('pointValue', 10.5);
    expect(score).toHaveProperty('unscoredItems', 7);
    expect(rubric).toHaveProperty('categories.0.items.length', 2);
    expect(rubricScore).toHaveProperty('categories.0.items.length', 2);

    let item = findInRubric(rubric, { itemId: 'cat-0-item-0' });
    expect(item).toBeUndefined();
    item = findInRubric(rubricScore, { itemId: 'cat-0-item-0' });
    expect(item).toBeUndefined();
  });

  test('category added', () => {
    // add a category
    rubric.categories.push(
      makeRubricCategory({
        id: 'cat-new',
        items: [
          makeRubricItem({
            id: 'cat-new-item-0',
            scoreType: 'boolean',
            pointValue: 2,
          }),
          makeRubricItem({
            id: 'cat-new-item-1',
            scoreType: 'full_half',
            scoreValue: 'penalty',
            pointValue: -1,
          }),
          makeRubricItem({
            id: 'cat-new-item-2',
            scoreType: 'points',
            scoreValue: 'bonus',
            pointValue: 4,
          }),
        ],
      }),
    );
    rubricScore = updateRubricScore(rubricScore, rubric);

    score = scoreRubric(rubric, rubricScore);
    expect(score).toHaveProperty('score', 1);
    expect(score).toHaveProperty('pointValue', 14.5);
    expect(score).toHaveProperty('unscoredItems', 11);
    expect(rubricScore).toHaveProperty('categories.2.items.length', 3);
  });

  test('category removed', () => {
    // remove a category
    rubric.categories.pop();
    rubricScore = updateRubricScore(rubricScore, rubric);

    score = scoreRubric(rubric, rubricScore);
    expect(score).toHaveProperty('score', 0);
    expect(score).toHaveProperty('pointValue', 7);
    expect(score).toHaveProperty('unscoredItems', 3);
  });
});
