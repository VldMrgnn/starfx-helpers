import type { ApiCtx, Result } from "starfx";
import type { ThunkCtx } from "./types"


import { isJSONString, isResult } from './basic';

import type { TOutput } from "./types";
const isErr = <T>(
  result: Result<T>
): result is { readonly ok: false; error: Error } => {
  return result?.ok === false && "error" in result;
};

const isObjectWithKeys = (
  obj: unknown,
  keys: string[]
): obj is Record<string, unknown> =>
  typeof obj === "object" && obj !== null && keys.every((key) => key in obj);

const isApiCtx = (arg: unknown): arg is ApiCtx =>
  isObjectWithKeys(arg, ["key", "name", "json"]) &&
  isObjectWithKeys(arg.json, ["ok", "data"]);

const isThunkCtx = (arg: unknown): arg is ThunkCtx =>
  isObjectWithKeys(arg, ["action", "actionFn", "key", "name", "result"]) &&
  isObjectWithKeys(arg.result, ["ok"]);

function normalizeError(error) {
  if (error instanceof Error) return error;

  if (typeof error === "object" && error !== null) {
    if ("message" in error) return normalizeError(error.message);
    return new Error(JSON.stringify(error));
  }

  if (typeof error === "string") {
    if (isJSONString(error)) return normalizeError(JSON.parse(error));
    return new Error(error);
  }

  return new Error(JSON.stringify(error));
}

function unpackResult<T>(result: Result<T>): [string | null, T | null] {
  if (result.ok) {
    const value = result.value;

    if (isApiCtx(value)) {
      return unpackResult({
        ok: value.json.ok,
        value: value?.json?.data,
      } as Result<any>);
    }

    if (isThunkCtx(value)) {
      return unpackResult(value.result);
    }

    if (typeof value === "string" && isJSONString(value)) {
      const parsedValue = JSON.parse(value);
      if (isResult(parsedValue)) {
        return unpackResult(parsedValue);
      }
    }

    return [null, value];
  } else if (isErr(result)) {
    //that is for the case of an error Result stringified from the endpoint. not an error but a stringified error.
    //{ok: false , error: {message: "some error message"}} | {ok: false , error: "some error message"}
    const extractErrStr = normalizeError(result.error).message;
    return [extractErrStr, null]; // It's an error, return or handle it accordingly.
  }
  return ["Malformed Result object", null];
}

export function matchCall<T>(
  result: Result<T> | unknown,
  customErrorMessage: string | undefined | null,
  output: TOutput[],
  throws = true
): T | Error {
  if (result === undefined || result === null) {
    return result as T;
  }
  if (typeof result === "string") {
    if (isJSONString(result)) {
      const parsedResult = JSON.parse(result);
      if (isResult(parsedResult)) {
        return matchCall(parsedResult, customErrorMessage, output, throws);
      }
    } else {
      return result as T;
    }
  }
  if (isResult(result)) {
    const value = unpackResult(result as Result<T>);
    const [err, val] = value;
    if (err) {
      return matchCall(new Error(err), customErrorMessage, output, throws);
    } else {
      return matchCall(val, customErrorMessage, output, throws);
    }
  } else {
    // any type of something else
    if (result instanceof Error) {
      const newErrMsg1 = result?.message || String(result) || "unknown error";
      return new Error(newErrMsg1);
    } else {
      return result as T;
    }
  }
}
