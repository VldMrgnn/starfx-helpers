import { takeLeading } from 'starfx';

import { thunks } from './apis';
import { isErr } from './basic';
import { runThunk, safeThunk } from './fxhelpers';

import type { ThunkCtx, Next } from "./types";
export const exampleThunk00 = thunks.create(
	"thunks/exampleThunk00",
	{ supervisor: takeLeading },
	function* (ctx: ThunkCtx, next: Next) {
	  yield* runThunk(someThunk);
	  yield* runThunk(someOtherThunk);
	  yield* next();
	}
  );
  
  export const exampleThunk01 = thunks.create<string>(
	"thunks/exampleThunk01",
	{ supervisor: takeLeading },
	function* (ctx: ThunkCtx, next: Next) {
	  // we have to return from this thnk
	  const someResultWeNeed = yield* safeThunk(someThunkWithParameter, ctx.payload);
	  if (isErr(someResultWeNeed)) {
		// alert or log the error
		return;
	  }
	  //run and return the result
	  const furtherResult = yield* safeThunk(processValidations, someResultWeNeed);
	  ctx.result = furtherResult;
	  yield* next();
	}
  );