/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import * as React from "react";
import classnames from "classnames";
import { CommonProps } from "@itwin/core-react";
import { UiFramework } from "@itwin/appui-react";
import { SvgStatusWarning } from "@itwin/itwinui-icons-react";
import { getCssVariableAsNumberOrDefault, MobileCore, Optional } from "@itwin/mobile-sdk-core";
import { CloseButton } from "./NavigationPanel";
import { MobileUi } from "./MobileUi";

import "./ModalEntryFormDialog.scss";

/**
 * Properties for each field in a {@link ModalEntryFormDialog} component.
 * @public
 */
export interface ModalEntryFormFieldProps {
  /** The field name. */
  name: string;
  /** The initial value for the field. */
  initialValue?: string;
  /** Whether or not the field is required, default is false. */
  isRequired?: boolean;
  /** Whether or not white space should be trimmed off the beginning and end of entered text, default is false. */
  autoTrim?: boolean;
  /**
   * The characters that are not allowed to be entered.
   *
   * **Note:** When passing a string, each character in the string will be considered forbidden.
   * When passing an array of strings, each element of the array must be a single forbidden
   * character. If you need to include compound characters, pass them using a string array.
   */
  forbiddenCharacters?: string[] | string;
  /** Callback every time the field value changes. */
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

/**
 * One value returned by {@link ModalEntryFormDialog} component.
 * @public
 */
export interface ModalEntryFormValue {
  /** The current value */
  value: string | undefined;
  /** Warning to to show under `value`'s field */
  warning?: string;
}

/**
 * Properties for the {@link ModalDialog} component.
 * @public
 */
// @todo AppUI deprecation
// eslint-disable-next-line @typescript-eslint/no-deprecated
export interface ModalDialogProps extends CommonProps {
  /** Content. */
  children: React.ReactNode;
  /** Title of the dialog. */
  title: string;
  /** Text to show on the Cancel button, default is "Cancel" (localized). Set to an empty string to hide it. */
  cancelTitle?: string;
  /** Text to show on the OK button, default is "OK" (localized). Set to an empty string to hide it. */
  okTitle?: string;
  /**
   * Callback called when user taps OK button. Return true to accept, or false to fail.
   * Note: Component owner is responsible for closing the dialog when OK is accepted.
   */
  onOK: () => Promise<boolean>;
  /**
   * Callback called when user taps Cancel button.
   * Note: Component owner is responsible for closing the dialog.
   */
  onCancel: () => void;
}

/**
 * Properties passed to the {@link ModalDialog.run} function.
 * This just uses {@link ModalDialogProps}, but makes onOK and onCancel optional.
 * @public
 */
export type ModalDialogRunProps = Optional<ModalDialogProps, "onOK" | "onCancel">;

/**
 * Properties for the {@link ModalEntryFormDialog} component.
 * @public
 */
export interface ModalEntryFormDialogProps extends Omit<ModalDialogProps, "children" | "onOK"> {
  /** Array of fields to display in the dialog. */
  fields: ModalEntryFormFieldProps[];
  /**
   * Callback called when user taps OK button. Return true to accept, or false to fail.
   * Note: Component owner is responsible for closing the dialog when OK is accepted.
   */
  onOK: (values: ModalEntryFormValue[]) => Promise<boolean>;
  /**
   * Callback called with the user taps OK and there is an error (like one or more required fields is blank).
   * The callback should show the given error message to the user and wait for them to acknowledge it.
   */
  onError: (message: string) => Promise<void>;
}

/**
 * Properties passed to the {@link ModalEntryFormDialog.run} function.
 * This just uses {@link ModalEntryFormDialogProps}, but makes onOK and onCancel optional.
 * @public
 */
export type ModalEntryFormDialogRunProps = Optional<ModalEntryFormDialogProps, "onOK" | "onCancel">;

/**
 * @internal
 */
interface ModalEntryFormFieldPropsInternal extends ModalEntryFormFieldProps {
  onEnter: () => void;
  onFocus: () => void;
  index: number;
  isDisabled?: boolean;
  isFocused?: boolean;
  value: string;
  warning?: string;
}

/**
 * @internal
 */
function ModalEntryFormField(props: ModalEntryFormFieldPropsInternal) {
  const { name, value, isRequired = false, onEnter, onFocus, index, isDisabled, isFocused, warning } = props;
  const labelClassNames = classnames("mui-modal-entry-form-field-label", isRequired && "mui-required");

  const handleKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onEnter();
      e.currentTarget.blur();
    }
  };

  return (
    <div className="mui-modal-entry-form-field">
      <div className="mui-modal-entry-form-field-label-row">
        <div className={labelClassNames}>{name}</div>
        {isRequired && <div className={classnames(labelClassNames, "mui-required-red")}>&nbsp;*</div>}
      </div>
      <input
        className={classnames("mui-modal-entry-form-field-input", warning && "mui-modal-entry-form-field-input-warning")}
        id={ModalEntryFormField.idForName(name)}
        type="text"
        onChange={props.onChange}
        onKeyUp={handleKeyUp}
        onFocus={onFocus}
        autoFocus={isFocused && !MobileCore.isIosPlatform} // eslint-disable-line jsx-a11y/no-autofocus
        autoComplete="off"
        autoCapitalize="off"
        autoCorrect="off"
        disabled={isDisabled}
        tabIndex={index + 1}
        value={value}
      />
      {warning && <div className="mui-modal-entry-form-warning">
        <span><SvgStatusWarning className="mui-modal-entry-form-warning-icon"/>{warning}</span>
      </div>}
    </div>
  );
}

/**
 * @internal
 */
ModalEntryFormField.idForName = (name: string) => {
  return `ModalEntryFormField-${name}`;
};

/**
 * A React component representing a modal dialog. This fills the screen with a darkening background and centers the dialog.
 * @public
 */
export function ModalDialog(props: ModalDialogProps) {
  const { title, className, onCancel, onOK, cancelTitle, okTitle, children } = props;
  const [fadedOut, setFadedOut] = React.useState(true);
  const [waitingToClose, setWaitingToClose] = React.useState(false);

  React.useEffect(() => {
    // Create the dialog with fadedOut set, then switch it off after it has been created, which will trigger the half
    // second fade-in animation.
    setTimeout(() => {
      setFadedOut(false);
    }, 0);
  }, []);

  const handleOK = React.useCallback(async () => {
    if (waitingToClose)
      return false;
    setWaitingToClose(true);
    try {
      if (await onOK()) {
        setFadedOut(true);
        return true;
      }
    } finally {
      setWaitingToClose(false);
    }
    return false;
  }, [onOK, waitingToClose]);

  const handleCancel = React.useCallback(() => {
    if (waitingToClose)
      return;
    setWaitingToClose(true);
    setFadedOut(true);
    onCancel();
  }, [onCancel, waitingToClose]);

  const cancelClassName = classnames("mui-modal-button", waitingToClose && "mui-modal-button-disabled");
  const okClassName = classnames("mui-modal-button", "mui-default", waitingToClose && "mui-modal-button-disabled");
  return (
    <div className={classnames("mui-modal-dialog-screen-cover", fadedOut && "mui-faded-out")}>
      <div className="mui-modal-dialog-parent">
        <div className={classnames("mui-modal-dialog", className)}>
          {cancelTitle !== "" && <CloseButton className="mui-modal-close-button"
            onClick={() => {
              handleCancel();
            }}
            iconSize={"16px"}
          />}
          <div className="mui-modal-title">{title}</div>
          {children}
          <div className="mui-modal-button-row">
            {cancelTitle !== "" && <div
              className={cancelClassName}
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                handleCancel();
              }}
            >
              {cancelTitle ?? MobileCore.translate("general.cancel")}
            </div>}
            {okTitle !== "" && <div
              className={okClassName}
              onClick={async (e: React.MouseEvent) => {
                e.stopPropagation();
                await handleOK();
              }}
            >
              {okTitle ?? MobileCore.translate("general.ok")}
            </div>}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * A React component representing an entry form dialog. This fills the screen with a darkening background
 * and centers the dialog (moving it up to avoid the virtual keyboard).
 * @public
 */
export function ModalEntryFormDialog(props: ModalEntryFormDialogProps) {
  const { onOK, onError: showError, fields, ...theRest } = props;
  const [values, setValues] = React.useState<ModalEntryFormValue[]>(fields.map((field) => ({ value: field.initialValue })));
  const [waitingToClose, setWaitingToClose] = React.useState(false);
  const [focusIndex, setFocusIndex] = React.useState(0);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number, onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void) => {
    // React wants inputs to be either fully controlled, or fully uncontrolled. In other words, if we are passing a
    // value to an input, we must fully control that value. This is also why the value that is passed to the field is
    // set to empty string when undefined is passed in.
    // https://reactjs.org/docs/forms.html#controlled-components
    const input = e.currentTarget;

    const rawForbiddenCharacters = fields[index].forbiddenCharacters;
    const forbiddenCharacters = typeof rawForbiddenCharacters === "string" ? [...rawForbiddenCharacters] : rawForbiddenCharacters;
    const valueContainsForbiddenChars = forbiddenCharacters?.some((x) => input.value?.includes(x));
    const newValue = valueContainsForbiddenChars ? {
      ...values[index],
      warning: MobileUi.translate("modal-entry-form.forbidden-characters", { symbols: forbiddenCharacters?.join(" "), interpolation: { escapeValue: false } }),
    } : {
      // Note: empty string evaluates to false when checked for ?:. This uses undefined instead of empty string.
      value: input.value ? input.value : undefined,
    };
    setValues((prevValues) => prevValues.map((prevValue, prevIndex) => prevIndex === index ? newValue : prevValue));
    onChange?.(e);
  };

  const handleOK = async () => {
    if (waitingToClose) {
      return false;
    }
    const missingValues: string[] = [];
    for (let i = 0; i < fields.length; ++i) {
      const field = fields[i];
      const value = values[i];
      if (!!field.autoTrim && value.value !== undefined) {
        value.value = value.value.trim();
      }
      if (field.isRequired) {
        if (!value.value || value.value.length === 0) {
          missingValues.push(field.name);
        }
      }
    }
    if (missingValues.length > 0) {
      if (missingValues.length === 1) {
        await showError(MobileUi.translate("modal-entry-form.required-field", { field: missingValues[0] }));
      } else {
        await showError(MobileUi.translate("modal-entry-form.required-fields", { fields: missingValues.join(", ") }));
      }
      return false;
    }
    setWaitingToClose(true);
    try {
      return await onOK(values);
    } finally {
      setWaitingToClose(false);
    }
  };

  const handleEnter = async () => {
    await handleOK();
  };

  const handleFocus = (index: number) => {
    setFocusIndex(index);
  };

  return (
    <ModalDialog onOK={handleOK} {...theRest} >
      {fields.map((fieldProps: ModalEntryFormFieldProps, index) => {
        return (
          <ModalEntryFormField
            key={index}
            isDisabled={waitingToClose}
            isFocused={focusIndex === index}
            index={index}
            {...fieldProps}
            value={values[index].value ?? ""}
            warning={values[index].warning}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              handleChange(e, index, fieldProps.onChange);
            }}
            onEnter={handleEnter}
            onFocus={() => handleFocus(index)}
          />
        );
      })}
    </ModalDialog>
  );
}

interface OKCancelHandlers<T> {
  onOK: (value: T) => Promise<boolean>;
  onCancel: () => void;
}

async function showModalDialog<T, P extends OKCancelHandlers<T>>(props: P, render: (newProps: P) => React.ReactNode) {
  return new Promise<T | undefined>((resolve) => {
    const fadeDuration = getCssVariableAsNumberOrDefault("--mui-fade-duration", .5) * 1000;

    const handleOK = async (value: T) => {
      if (!(await props.onOK(value))) {
        return false;
      }
      // Wait for half second while the dialog fades out before removing it.
      setTimeout(() => {
        UiFramework.dialogs.modal.close();
      }, fadeDuration);
      resolveAndCleanup(value);
      return true;
    };

    const handleCancel = () => {
      props.onCancel();
      // Wait for half second while the dialog fades out before removing it.
      setTimeout(() => {
        UiFramework.dialogs.modal.close();
      }, fadeDuration);
      resolveAndCleanup(undefined);
    };

    const resolveAndCleanup = (result: T | undefined) => {
      MobileUi.onClose.removeListener(onClose);
      resolve(result);
    };

    const onClose = () => {
      // Mobile UI is closing, so close the dialog immediately.
      UiFramework.dialogs.modal.close();
      resolveAndCleanup(undefined);
    };

    MobileUi.onClose.addListener(onClose);
    UiFramework.dialogs.modal.open(render({
      ...props,
      onOK: handleOK,
      onCancel: handleCancel,
    }));
  });
}

/**
 * A convenience function to open (and close when appropriate) a {@link ModalEntryFormDialog} using {@link UiFramework.dialogs.modal}.
 * @public
 * @param props The properties used to create the ModalEntryFormDialog component.
 * @returns An array of ModalEntryFormValue objects.
 */
ModalEntryFormDialog.run = async (props: ModalEntryFormDialogRunProps) => {
  const dialogProps: ModalEntryFormDialogProps = {
    onOK: async () => true,
    onCancel: () => { },
    ...props,
  };
  return showModalDialog<ModalEntryFormValue[], ModalEntryFormDialogProps>(dialogProps, (newProps) => <ModalEntryFormDialog {...newProps} />);
};

/**
 * A convenience function to open (and close when appropriate) a {@link ModalDialog} using {@link UiFramework.dialogs.modal}.
 * @public
 * @param props The properties used to create the ModalDialog component.
 * @returns True if the OK button was pressed, False otherwise.
 */
ModalDialog.run = async (props: ModalDialogRunProps) => {
  let okPressed = false;
  const dialogProps: ModalDialogProps = {
    onCancel: () => { },
    ...props,
    onOK: async () => {
      if (!!props.onOK && !(await props.onOK()))
        return false;
      okPressed = true;
      return true;
    },
  };
  await showModalDialog<void, ModalDialogProps>(dialogProps, (newProps) => <ModalDialog {...newProps} />);
  return okPressed;
};

/**
 * A convenience function to open (and close when appropriate) a {@link ModalDialog} using {@link UiFramework.dialogs.modal}.
 * @public
 * @param contents The ReactNode to show in the alert dialog.
 * @param title The title for the dialog.
 * @param okTitle Optional text for the OK button.
 * @param cancelTitle Optional text for the Cancel button. Default value is an empty string which hides the button.
 * @returns True if the OK button was pressed, False otherwise.
 */
ModalDialog.showAlert = async (contents: React.ReactNode, title: string, okTitle?: string, cancelTitle: string = "") => {
  return ModalDialog.run({ children: contents, title, okTitle, cancelTitle });
};
