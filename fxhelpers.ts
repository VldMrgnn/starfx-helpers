import { safe } from 'starfx';

import { isErr, toFxResult } from './basic';
import { matchCall } from './matchCall';
import { createResult } from './resultUtils';

import type { OpFn, Result } from "starfx";
import type { ThunkCtx, TOutput } from "./types";
import type { ApiCtx, Next } from "starfx";
import type { Operation } from "starfx";
import type { CreateAction, CreateActionWithPayload } from "starfx";
import type { FxResult } from "./basic";

// const evaluator = evalCall;
const evaluator = matchCall;

// call runners //

/**
 * EXECUTE RETURNING VALUE OR THROWS ERROR.
 *
 * runs a call and returns the result.
 * if the result is an error, then passes the error to the error handler.
 * according to the output, it will notify, log to console, or log to terminal.
 *
 */
export function* callExec<T>(
  fn: OpFn,
  customErrorMessage: string | null,
  output: TOutput[]
): Operation<void> | T {
  const result = (yield* safe(() => fn())) as Result<Result<string>>;
  const cresult = evaluator(result, customErrorMessage, output, true);
  return cresult;
}

/**
 * EXECUTE RETURNING VALUE OR ERROR (IT DOES'T THROW)
 *
 * runs a call and returns the result.
 * if the result is an error, then passes the error to thee advertising handler.
 * according to the output, it will notify, log to console, or log to terminal.
 *
 */
export function* callReturn<T>(
  fn: OpFn<T>,
  customErrorMessage: string | null = null,
  output: TOutput[] = ["terminal"]
): any {
  const result = yield* safe(() => fn());
  /* 
  The function itself doesn't throw in the process, but if it fails,
  this will throw an error. So we need to catch it here.
  We can interpret it as: if it's an unpacked error, then throw it.

  When do we get an unpacked error? When the whole call fails, not when we return an error.
  Somehow it makes sense, but it's not intuitive
  */
  if (isErr(result)) {

    // console.log("error in callReturn 1, analyze", fn());
    // console.log("error in callReturn 2, analyze", fn.name, fn.toString(), fn);
    // console.log("error in callReturn 3, analyze", result);

    console.log("customErrorMessage", customErrorMessage);
    throw customErrorMessage || result.error.message;
  }
  const result_ = evaluator(
    result as Result<T>,
    customErrorMessage,
    output,
    false
  );
  return result_;
}
/**
 * EXECUTE RETURNING A NON NESTED Result<T>
 *
 * runs a call and  parrses the result to a non nested Result<T>.
 * if the result is an error, then passes the error to the advertising handler,
 * according to the output, it will notify, log to console, or log to terminal.
 *
 */
export function* safeLast<T>(
  fn: OpFn<T>,
  customErrorMessage: string | null = null,
  output: TOutput[] = ["terminal"]
): any {
  const result = yield* safe(() => fn());
  const result_ = evaluator(
    result as Result<T>,
    customErrorMessage,
    output,
    false
  );
  return toFxResult(createResult(result_));
}
// thunk runners //

/**
 * EXECUTE A THUNK. DOESN'T THROW, RETURNS A Result<T>
 * A shorthand for running a thunk from within a thunk,
 * Usually we run this when we don't care about the returning value,
 * but more about if it's an error or not. We skip the unfolding.
 * It returns a Result<T> so the error can be handled if we care.
 *
 */
export const runThunk = <T, P>(
  thunk:
    | CreateAction<ThunkCtx<T, any>>
    | CreateActionWithPayload<ThunkCtx<T, any>, P>,
  args?: P
): Operation<Result<ThunkCtx<any>>> =>
  safe(() => thunk.run(thunk(args as P) as any));

/**
 * EXECUTE RETURNING RESULT<T> IF HANDLED.
 * if not, fails fast and throws an error.
 *
 * runs a call and returns the result.
 * if the result is an error, then passes the error to the error handler.
 * according to the output, it will notify, log to console, or log to terminal.
 *
 */
export const returnThunk = <T, P>(
  thunk:
    | CreateAction<ThunkCtx<T, any>>
    | CreateActionWithPayload<ThunkCtx<T, any>, P>,
  args?: P
): Operation<unknown> => callReturn(() => thunk.run(thunk(args as P) as any));
/**
 * EXECUTE THE THUNK RETURNS WITHOUT PARSING, WITHOUT FOLDING.
 * RAW, AS IT IS. THROWS ERROR IF IT FAILS.
 *
 * is the most straight forward way to run a thunk.
 * We use it when we don't care too much about the result but the flow
 * and mostly when we know what we are doing.
 *
 * runs a call and returns the result, raw, as it is.
 * if the result is an error, then passes the error to the error handler.
 * according to the output, it will notify, log to console, or log to terminal.
 * If it errors then it will throw an error.
 *
 */
export const execThunk = <T, P>(
  thunk:
    | CreateAction<ThunkCtx<T, any>>
    | CreateActionWithPayload<ThunkCtx<T, any>, P>,
  args?: P
): Operation<unknown> =>
  callExec(() => thunk.run(thunk(args as P) as any), null, ["console", "terminal"]);
/**
 * GRACEFULLY EXECUTE A THUNK. IT DOESN'T THROW. RETURNS A Result<T>, LAST UNFOLDED.
 *
 * Is the most confortable way to run a thunk. The result is a Result<T> so we can handle the error and is not nested.
 * We use it when the result defines the flow and we need to handle the error.
 *
 * if the result is an error, then passes the error to the error handler.
 * according to the output, it will notify, log to console, or log to terminal.
 *
 */
export const safeThunk = <T, P>(
  thunk:
    | CreateAction<ThunkCtx<T, any>>
    | CreateActionWithPayload<ThunkCtx<T, any>, P>,
  args?: P
): Operation<FxResult<T>> => safeLast(() => thunk.run(thunk(args as P) as any));

export const safeApi = <T, P>(
  api:
    | CreateAction<ApiCtx<T, any>>
    | CreateActionWithPayload<ApiCtx<T, any>, P>,
  args?: P
): Operation<FxResult<T>> => safeLast(() => api.run(api(args as P) as any));
