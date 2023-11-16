import { isErr, isOk, isResult } from './basic';

import type { Result } from "starfx";

/**
 * Transforms a Result<T> into a Result<U> using the provided mapping function.
 * If the input is an "Ok" variant, applies the function to its value.
 * If it's an "Err" variant, returns the original error.
 *
 * @template T - The original type contained in the Result.
 * @template U - The new type to be contained in the Result.
 * @param {Result<T>} result - The original Result to transform.
 * @param {(value: T) => U} fn - Function to apply to the "Ok" value.
 * @returns {Result<U>} A new Result containing the transformed value or the original error.
 */
export function mapResult<T, U>(
  result: Result<T>,
  fn: (value: T) => U
): Result<U> {
  if (isOk(result)) {
    return {
      ok: true,
      value: fn(result.value as T),
    };
  } else {
    return {
      ok: false,
      error: result.error,
    };
  }
}

export function mapUnknown<T, U>(
  result: Result<T>,
  fn: (value: T) => U
): Result<U> {
  if (isOk(result)) {
    const intermediate = fn(result.value as T);
    if (isResult(intermediate)) {
      return mapUnknown(intermediate as Result<T>, fn);
    }

    return {
      ok: true,
      value: intermediate as U,
    };
  } else {
    return {
      ok: false,
      error: result.error,
    };
  }
}

/**
 * Transforms a Result by applying one of two provided mapping functions.
 * If the Result is "Ok", the mapValue function is applied to the contained value.
 * If the Result is "Err", the mapErr function is applied to the contained error.
 *
 * @template A - The original type contained in the "Ok" variant of the Result.
 * @template B - The new type to be contained in the "Ok" variant of the Result.
 *
 * @param {Result<A>} result - The original Result object.
 * @param {(error: Error) => Error} mapErr - Function to map the error.
 * @param {(value: A) => B} mapValue - Function to map the value.
 *
 * @returns {Result<B>} - A new Result object containing either the mapped value or error.
 *
 * @example
 *
 * const successResult: Result<number> = { ok: true, value: 42 };
 * const failureResult: Result<number> = { ok: false, error: new Error("Something went wrong") };
 *
 * const mappedSuccess = bimap(successResult, e => new Error(`New: ${e.message}`), x => x * 2);
 * const mappedFailure = bimap(failureResult, e => new Error(`New: ${e.message}`), x => x * 2);
 */
export function bimapResult<A, B>(
  result: Result<A>,
  mapErr: (error: Error) => Error,
  mapValue: (value: A) => B
): Result<B> {
  if (result.ok) {
    return {
      ok: true,
      value: mapValue(result.value),
    };
  } else if (result.ok === false && "error" in result) {
    // Type guard to narrow down the type
    return {
      ok: false,
      error: mapErr(result.error),
    };
  }
  // Handle unexpected case where neither value nor error exists (should never occur if Result is well-formed)
  throw new Error("Malformed Result object");
}

/**
 * Transforms a Result to an "Ok" variant by applying one of two provided mapping functions.
 * If the Result is "Err", the first function is applied to the error to produce an "Ok" variant.
 * If the Result is "Ok", the second function is applied to the value to produce a new "Ok" variant.
 *
 * @template A - The original type contained in the "Ok" variant of the Result.
 * @template B - The new type to be contained in the "Ok" variant of the Result.
 * @template E - The type contained in the "Err" variant of the Result.
 *
 * @param {Result<A, E>} result - The original Result object.
 * @param {(error: E) => B} mapErrToOk - Function to map the error to an "Ok" variant.
 * @param {(value: A) => B} mapOk - Function to map the value to a new "Ok" variant.
 *
 * @returns {Result<B>} - A new "Ok" Result object containing the mapped value.
 */
export function coalesceResult<A, B, E>(
  result: { readonly ok: true; value: A } | { readonly ok: false; error: E },
  mapErrToOk: (error: E) => B,
  mapOk: (value: A) => A
): { readonly ok: true; value: A | B } {
  if (result.ok) {
    return {
      ok: true,
      value: mapOk(result.value),
    };
  } else if ("error" in result) {
    return {
      ok: true,
      value: mapErrToOk(result.error),
    };
  }
  throw new Error("Malformed Result object");
}

/**
 * Returns the value contained in a Result if it's an "Ok" variant, or a default value or the result of an error function otherwise.
 *
 * @template A - The type contained in the "Ok" variant of the Result.
 * @template B - The type of the default value or the return type of the error function.
 * @template E - The type contained in the "Err" variant of the Result.
 *
 * @param {Result<A, E>} result - The original Result object.
 * @param {B | ((error: E) => B)} defaultValueOrFunc - Either a default value or a function that takes an error and returns a default value.
 *
 * @returns {A | B} - The value contained in the Result if it's an "Ok" variant, or the default value or the result of the error function otherwise.
 *
 * @example
 * const okResult = { ok: true, value: 42 };
 * const errResult = { ok: false, error: "Something went wrong" };
 *
 * console.log(valueOr(okResult, 0));  // Output: 42
 * console.log(valueOr(errResult, 0)); // Output: 0
 * console.log(valueOr(errResult, (error) => `Handled error: ${error}`)); // Output: "Handled error: Something went wrong"
 */ export function valueOr<A, B>(
  result: Result<A>,
  defaultValueOrFunc: B | ((error: Error) => B)
): A | B {
  if (isOk(result)) {
    return result.value;
  } else if (isErr(result)) {
    if (typeof defaultValueOrFunc === "function") {
      return (defaultValueOrFunc as (error: Error) => B)(result.error);
    } else {
      return defaultValueOrFunc;
    }
  }
  console.error("Malformed Result object");
  throw new Error("Malformed Result object");
}
