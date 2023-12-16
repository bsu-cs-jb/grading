const TRUTH_VALUES = ['true', '1', 'yes', 'on'];

export function getConfigBoolean(
  name: string,
  default_: boolean,
  truth_values: string[] = TRUTH_VALUES,
): boolean {
  const value = process.env[name];
  if (value === undefined || value === '') {
    return default_;
  }
  const normValue = value.trim().toLowerCase();
  if (normValue === '') {
    return default_;
  }
  if (truth_values.includes(normValue)) {
    return true;
  } else {
    return false;
  }
}

export function getConfig<T>(
  name: string,
  default_: T,
  convert: (value: string) => T = (v) => v as T,
): T {
  const value = process.env[name];
  if (value === undefined) {
    return default_;
  } else {
    return convert(value);
  }
}

export const LOG_LEVELS = <const>['INFO', 'DEBUG', 'ERROR'];
export type LOG_LEVEL = (typeof LOG_LEVELS)[number];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function isInArray<T, A extends T>(
  item: T,
  array: ReadonlyArray<A>,
): item is A {
  return array.includes(item as A);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function isLogLevel_1(value: string): value is LOG_LEVEL {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return LOG_LEVELS.includes(value as any);
}

export function isType<T extends string>(
  value: string,
  values: readonly T[],
): value is T {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return values.includes(value as any);
}

export function makeIsStringUnion<T extends string>(values: readonly T[]) {
  return (value: string): value is T => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return values.includes(value as any);
  };
}

const isLogLevel = makeIsStringUnion(LOG_LEVELS);
const DEFAULT_LOG_LEVEL = 'DEBUG';

export interface BaseConfig {
  LOGGING_ENABLED: boolean;
  LOG_LEVEL: LOG_LEVEL;
}

export class BaseConfigImpl {
  public get LOGGING_ENABLED(): boolean {
    return getConfigBoolean('LOGGING_ENABLED', true);
  }

  public get LOG_LEVEL(): LOG_LEVEL {
    const value = getConfig('LOG_LEVEL', DEFAULT_LOG_LEVEL).toUpperCase();
    if (isLogLevel(value)) {
      return value;
    } else {
      return DEFAULT_LOG_LEVEL;
    }
  }
}
