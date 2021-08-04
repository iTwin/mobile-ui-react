/*---------------------------------------------------------------------------------------------
* Copyright (c) 2020 Bentley Systems, Incorporated. All rights reserved.
*--------------------------------------------------------------------------------------------*/
import {
  AuthStatus,
  BackendError,
  BentleyError,
  BriefcaseStatus,
} from "@bentley/imodeljs-common";
import { ResponseError } from "@bentley/itwin-client";
import { MessageNotImplementedError, MobileUi } from ".";

/** Base class for showing a user friendly error.
 * For common errors, provide utility creation methods in UIError.
 * @public
 */
export class UserFriendlyError extends Error {
}

/** Class for showing errors to the end user.
 * @public
 */
export class UIError {
  [key: string]: any;
  private constructor() { }

  // Checks to see if error represents a cancelation error.
  private static isCancelation(error: any) {
    // Right now, there is only one known cancelation error, but we can add
    // more here in the future if we run into them.
    return error instanceof BackendError && error.errorNumber === BriefcaseStatus.DownloadCancelled;
  }

  private static i18n(key: string): string {
    return MobileUi.translate("ui-error." + key);
  }

  /** Creates an error for use when the internet is unreachable.
   * @returns A UserFriendlyError with a localized internet unreachable message.
   * @public
   */
  public static internetUnreachableError(): UserFriendlyError {
    return new UserFriendlyError(this.i18n("internet-unreachable"));
  }

  /** Create a UIError object from the error that is caught in an exception handler.
   * Note that this has logic detecting various error information in the given error, and creating an
   * appropriate UIError.
   * @param error: The error to convert into a UIError
   * @returns A UIError representing the given error.
   */
  public static create(error: any): UIError {
    if (error instanceof UIError) {
      return error;
    }
    let uiError = new UIError();
    if (error instanceof UserFriendlyError) {
      uiError.Message = error.message;
    } else if (error instanceof Error) {
      uiError.Description = error.message;
      if (error instanceof MessageNotImplementedError) {
        uiError.MessageNotImplemented = true;
      }
      if (error instanceof ResponseError &&
        error.hasOwnProperty("_data")) {
        const errorData = (error as any)._data;
        if (errorData.hasOwnProperty("errorId"))
          uiError.errorId = errorData.errorId;
        if (errorData.hasOwnProperty("errorMessage"))
          uiError.Description = errorData.errorMessage;
      }
      uiError.Stack = error.stack;
      const anyError: any = error;
      uiError.Line = anyError.line;
      uiError.Column = anyError.column;
    } else if (typeof error === "string") {
      uiError.Description = error;
    } else {
      for (const fieldName in error) {
        if (error.hasOwnProperty(fieldName)) {
          uiError[fieldName] = error[fieldName];
        }
      }
    }
    if (!MobileUi.isInternetReachable) {
      if (error instanceof BentleyError && error.errorNumber === AuthStatus.Error) {
        uiError = new UIError();
        uiError.Message = this.i18n("internet-unreachable");
      }
    }
    if (this.isCancelation(error)) {
      uiError.WasCanceled = true;
    }
    return uiError;
  }
}
