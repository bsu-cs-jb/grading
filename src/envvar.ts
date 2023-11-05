const TRUTH_VALUES = ['true', '1', 'yes']

export function getConfigBoolean(
  name:  string,
  default_: boolean,
  truth_values: string[] = TRUTH_VALUES,
): boolean {
  const value = process.env[name];
  if (value === undefined || value === "") {
    return default_;
  }
  const normValue = value.trim().toLowerCase();
  if (truth_values.includes(normValue)) {
    return true;
  } else {
    return false;
  }
}

export function getConfig<T>(name: string, default_:T):T{
  const value = process.env[name];
  if (value === undefined) {
    return default_;
  } else {
    return value as T;
  }
}

export const LOG_LEVELS = <const>["INFO","DEBUG","ERROR"];
export type LOG_LEVEL = typeof LOG_LEVELS[number];

function isInArray<T, A extends T>(
  item: T,
  array: ReadonlyArray<A>
): item is A {
  return array.includes(item as A);
}

function isLogLevel_1(value: string): value is LOG_LEVEL {
  return LOG_LEVELS.includes(value as any);
}

export function isType<T extends string>(value: string, values:readonly T[]): value is T {
  return values.includes(value as any);
}

export function makeIsStringUnion<T extends string>(values: readonly T[]) {
  return (value: string): value is T => {
    return values.includes(value as any);
  }
}

const isLogLevel = makeIsStringUnion(LOG_LEVELS);
const DEFAULT_LOG_LEVEL = "DEBUG";

export interface BaseConfig {
  LOGGING_ENABLED: boolean;
  LOG_LEVEL: LOG_LEVEL;
}

export class BaseConfigImpl {
  public get LOGGING_ENABLED():boolean {
    return getConfigBoolean("LOGGING_ENABLED", true);

  }
  public get LOG_LEVEL():LOG_LEVEL {
    const value = getConfig("LOG_LEVEL", DEFAULT_LOG_LEVEL).toUpperCase();
    if (isLogLevel(value)) {
      return value;
    } else {
      return DEFAULT_LOG_LEVEL;
    }
  }
}
