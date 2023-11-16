import {
  isJSONString,
  isResultLikeErr,
  isResultLikeErrWithJsonValue,
  isResultLikeOk,
  isResultLikeOkWithJsonValue,
  toFxResult,
} from "./basic";

import type { Result, ResultLike } from "./basic";

/**
 * Create an object with a single key-value pair.
 *
 * Example: const newObject = objOf('a', 'v');
 * console.log(newObject);  // Outputs: { a: 'v' }
 *
 * @date 8/23/2023 - 2:12:35 AM
 *
 * @param {*} key
 * @param {*} value
 * @returns {{ [x: number]: any; }}
 */
export function objOf(key, value) {
  return { [key]: value };
}

/**
 * Extract the single key-value pair from an object.
 *
 * Example: const keyVal = keyValFrom({ a: 'v' });
 * console.log(keyVal);  // Outputs: ['a', 'v']
 *
 * @date 8/24/2023 - 10:15:35 AM
 *
 * @param {Object} obj Object with a single key-value pair.
 * @returns {Array} An array where the first element is the key and the second is the value.
 */
export function keyValFrom(obj) {
  const key = Object.keys(obj)[0];
  const value = obj[key];
  return [key, value];
}

/**
 * extend an object with a single key-value pair.
 *
 * Example: const extendedObject = assoc('b', 'w', newObject);
 * console.log(extendedObject);  // Outputs: { a: 'v', b: 'w' }
 * @date 8/23/2023 - 2:12:53 AM
 *
 * @param {*} key
 * @param {*} value
 * @param {*} obj
 * @returns {*}
 */
export function assoc(key, value, obj) {
  return { ...obj, [key]: value };
}

/**
 * Creates a Result object with a successful state.
 *
 * @template T - The type of the value to be returned.
 * @param {T} value - The value to wrap in a Result object.
 * @returns {Result<T>} - A Result object with an "ok" status and the provided value.
 * @throws {Error} - Throws an error if the provided value is an instance of the Error class.
 *
 * @example
 * const result = createOk(42);
 * console.log(result);  // Output: { ok: true, value: 42 }
 *
 * @example
 * // This will throw an error
 * const errorResult = createOk(new Error('Something went wrong'));
 */
export const createOk = <T>(value: T): { readonly ok: true; value: T } => {
  if (value instanceof Error) {
    throw new Error("createOk: value cannot be an Error");
  }
  return { ok: true, value } as { readonly ok: true; value: T };
};

/**
 * Creates a Result object with a failure state.
 *
 * @template T - The type of the error to be returned. Must be either an Error, string, number, object, array, or undefined.
 * @param {T} error - The error to wrap in a Result object.
 * @returns {{ readonly ok: false; error: Error }} - A Result object with an "ok" status set to false and an Error object.
 *
 * @throws Will throw a TypeError if an unsupported type is provided.
 *
 * @example
 * const result = createErr("Something went wrong");
 * console.log(result);  // Output: { ok: false, error: Error("Something went wrong") }
 */
export const createErr = <T>(
  error: T
): { readonly ok: false; error: Error } => {
  if (error instanceof Error) {
    return { ok: false, error } as { readonly ok: false; error: Error };
  }
  if (typeof error === "string" || typeof error === "number") {
    return { ok: false, error: new Error(String(error)) } as {
      readonly ok: false;
      error: Error;
    };
  }
  if (error === null || typeof error === "object") {
    return { ok: false, error: new Error(JSON.stringify(error)) } as {
      readonly ok: false;
      error: Error;
    };
  }
  if (Array.isArray(error)) {
    return { ok: false, error: new Error(JSON.stringify(error)) } as {
      readonly ok: false;
      error: Error;
    };
  }
  if (typeof error === "undefined") {
    return { ok: false, error: new Error("Undefined error") } as {
      readonly ok: false;
      error: Error;
    };
  }
  throw new TypeError("Unsupported type for error in createErr function");
};

export function resultOf<T>(input: T): Result<T> {
  if (input instanceof Error) {
    return createErr(input);
  } else {
    return createOk(input);
  }
}

export const createResult = resultOf;

export const identityResult = <T>(result: Result<T>): Result<T> => {
  return result;
};

const O = <T>(arg: T): ResultLike<T> => {
  return {
    ok: true,
    value: arg,
  };
};
const E = <T>(arg: string): ResultLike<T> => {
  return {
    ok: false,
    error: arg,
  };
};

const JO = <T>(arg: T) => JSON.stringify(O(arg));
const JE = <T>(arg: string) => JSON.stringify(E(arg));

type JOString = ReturnType<typeof JO>;
type JEString = ReturnType<typeof JE>;

export function unpack(resultString: JOString | JEString): ResultLike<string> {
  const resObj = JSON.parse(resultString) as ResultLike<string>;

  if (isResultLikeOkWithJsonValue(resObj)) {
    return O(JSON.parse(resObj.value)); // Use O() instead of Ok()
  }

  if (isResultLikeErrWithJsonValue(resObj)) {
    return E(JSON.parse(resObj.error));
  }

  if (isResultLikeOk(resObj as any)) {
    return O((resObj as any).value); // Use O() instead of Ok()
  }

  if (isResultLikeErr(resObj as any)) {
    return E((resObj as any).error); // Use E() instead of Err()
  }

  return E(`unpack: unknown error: ${resultString}`); // Use E() instead of Err()
}

export function unpackToString(
  resultString: JOString | JEString
): string | Error {
  if (!isJSONString(resultString)) {
    return new Error(`unpackToString: not a JSON string: ${resultString}`);
  }
  const resObj = JSON.parse(resultString) as ResultLike<string>;

  if (isResultLikeOkWithJsonValue(resObj)) {
    // return O(JSON.parse(resObj.value)); // Use O() instead of Ok()
    return JSON.parse(resObj.value);
  }

  if (isResultLikeErrWithJsonValue(resObj)) {
    // return E(JSON.parse(resObj.error));
    return new Error(JSON.parse(resObj.error));
  }

  if (isResultLikeOk(resObj as any)) {
    // return O((resObj as any).value); // Use O() instead of Ok()
    return (resObj as any).value;
  }

  if (isResultLikeErr(resObj as any)) {
    // return E((resObj as any).error); // Use E() instead of Err()
    return new Error((resObj as any).error);
  }

  return new Error(`unpack: unknown error: ${resultString}`); // Use E() instead of Err()
}

export function unpackResult<T>(res: Result<T>): T | Error {
  if (isResultLikeOk(res)) {
    return res.value;
  } else {
    return res.error;
  }
}

export function unpackJsonResult(
  resultString: JOString | JEString
): string | Error {
  const resObj = unpack(resultString);
  if (isResultLikeOk(resObj)) {
    return resObj.value;
  } else {
    return new Error(resObj.error);
  }
}

export const d7ToResult = <T>(d7: ResultLike<T>): Result<T> => {
  if (d7.ok) {
    return createOk(d7.value);
  } else {
    if (isResultLikeErr(d7)) {
      return createErr(new Error(d7.error));
    }
  }
  return createErr(new Error(`d7ToResult: unknown error: ${d7}`));
};

export const normalizeResultLike = <T>(d7: any | ResultLike<T>): Result<T> => {
  if (d7.ok === true) {
    return createOk(d7.value);
  } else {
    if (d7.ok === false && isResultLikeErr(d7)) {
      return createErr(new Error(d7.error));
    }
  }

  if (d7 instanceof Error) {
    return createErr(d7);
  }
  if (typeof d7 === "object") {
    if ("error" in d7) {
      return createErr(new Error(d7.error));
    }
    if ("value" in d7) {
      return createOk(d7.value);
    }
  }
  return createOk(d7);
};
