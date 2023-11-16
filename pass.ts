import type { Result } from "starfx";

function isResultWithValue<T>(
  result: Result<T>
): result is { ok: true; value: T } {
  return "value" in result;
}

export function pass<T>(result: Result<T>): T {
  if (!isResultWithValue(result)) {
    throw (
      result as {
        readonly ok: false;
        error: Error;
      }
    ).error;
  }
  return result.value;
}
