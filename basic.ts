import type { Operation } from "starfx";
import { call } from 'starfx';

export { Ok, Err } from "starfx";
/**
 * `Result<T>` is a discriminated union that represents the outcome of an operation
 * that could either succeed or fail.
 *
 * This type is often used as a return type for functions that could throw exceptions
 * or encounter any kind of error conditions, allowing for easy pattern matching.
 *
 * @example
 * const success: Result<number> = { ok: true, value: 42 };
 * const failure: Result<number> = { ok: false, error: new Error("Something went wrong") };
 *
 * @template T The type of the value that will be present if the operation is successful.
 *
 * @property {boolean} ok - A boolean flag that indicates success (true) or failure (false).
 * @property {T} [value] - The resulting value if the operation was successful. Undefined if `ok` is false.
 * @property {Error} [error] - An Error instance containing an error message if the operation failed. Undefined if `ok` is true.
 */
export type Result<T> =
  | { readonly ok: true; value: T }
  | { ok: false; error: Error };

/**
 * `ResultLike<T>` is similar to `Result<T>` but instead of carrying an Error instance,
 * it carries a simple error message as a string.
 *
 * This type is often used when interacting with systems (like Delphi) where an error instance is not
 * available, and only a string message is provided.
 *
 * @example
 * const success: ResultLike<number> = { ok: true, value: 42 };
 * const failure: ResultLike<number> = { ok: false, error: "Something went wrong" };
 *
 * @template T The type of the value that will be present if the operation is successful.
 *
 * @property {boolean} ok - A boolean flag that indicates success (true) or failure (false).
 * @property {T} [value] - The resulting value if the operation was successful. Undefined if `ok` is false.
 * @property {string} [error] - A string containing an error message if the operation failed. Undefined if `ok` is true.
 */
export type ResultLike<T> =
  | { readonly ok: true; value: T }
  | { ok: false; error: string };

export function isJSONString(str) {
  try {
    const obj = JSON.parse(str);
    return typeof obj === "object" && obj !== null;
  } catch (error) {
    return false;
  }
}

export function isOk<T>(
  result: Result<T>
): result is { readonly ok: true; value: T } {
  return result.ok === true;
}
export function isErr<T>(
  result: Result<T>
): result is { readonly ok: false; error: Error } {
  return result.ok === false;
}

export function isResult(p: unknown): boolean {
  return (p as Result<unknown>).ok !== undefined;
}

export function* noop(): Operation<void> {
  yield* call(function* () {
    // no-op;
  });
}

export function isResultDelphi<T>(arg: any): arg is ResultLike<T> {
  return (
    (typeof arg === "object" &&
      arg !== null &&
      "ok" in arg &&
      arg.ok === true &&
      "value" in arg) ||
    (arg.ok === false && "error" in arg)
  );
}

export function isResultLikeOk<T>(arg: any): arg is { ok: true; value: T } {
  return isResultDelphi(arg) && arg.ok === true;
}

export function isResultLikeOkWithJsonValue(
  arg: any
): arg is { ok: true; value: string } {
  return isResultLikeOk(arg) && isJSONString(arg.value);
}
export function isResultLikeErr(arg: any): arg is { ok: false; error: string } {
  return isResultDelphi(arg) && arg.ok === false && "error" in arg;
}

export function isResultLikeErrWithJsonValue(
  arg: any
): arg is { ok: false; error: string } {
  return isResultLikeErr(arg) && isJSONString(arg.error);
}

// Our enhanced Result type
export type FxResult<T> = Result<T> & {
  cata: <U>(patterns: { Ok: (value: T) => U; Err: (error: Error) => U }) => U;
};

// Converters
export function toFxResult<T>(result: Result<T>): FxResult<T> {
  const cataFunction = function <U>(patterns: {
    Ok: (value: T) => U;
    Err: (error: Error) => U;
  }): U {
    if (this.ok) {
      return patterns.Ok(this.value);
    } else {
      return patterns.Err(this.error);
    }
  };

  return { ...result, cata: cataFunction };
}

export function toResult<T>(result: FxResult<T>): Result<T> {
  const { cata, ...original } = result;
  return original;
}

// Usage
// const original: Result<string> = { ok: true, value: "Hello" };
// const enhanced = toFxResult(original);
// enhanced.cata({
//   Ok: (value) => console.log(value),
//   Err: (err) => console.error(err.message),
// });
