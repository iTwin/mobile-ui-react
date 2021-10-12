/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import * as React from "react";
import classnames from "classnames";
import { CommonProps } from "@bentley/ui-core";
import { Messenger, MobileCore } from "@itwin/mobile-sdk-core";
import { IconImage } from "./IconImage";

import "./DatePicker.scss";

import { Calendar as CalendarSvg } from "./images-tsx";

/** Properties for [[DatePicker]] component
 * @public
 */
export interface DatePickerProps extends CommonProps {
  /** The current date displayed by the picker. */
  value?: Date;
  /** The minimum allowed date. If undefined, there is no minimum date. */
  min?: Date;
  /** The maximum allowed date. If undefined, there is no maximum date. */
  max?: Date;
  /** Callback called when user selects a date. */
  onChange?: (value: Date | undefined) => void;
}

function getDateString(value: Date | undefined) {
  if (!value) return undefined;
  return `${value.getFullYear().toString()}-${(value.getMonth() + 1).toString().padStart(2, "0")}-${value.getDate().toString().padStart(2, "0")}`;
}

/**
 * A React component that displays a date picker, from which the user can choose the selected item. It behaves
 * like radio buttons, in that there is always one and only one selected item.
 *
 * @public
 */
export function DatePicker(props: DatePickerProps) {
  const { className, style, onChange, min, max } = props;
  const [value, setValue] = React.useState(props.value);
  const calendarKey = React.useMemo(() => `itm-date-picker-icon-${(++DatePicker.calenderKey).toString()}`, []);

  React.useEffect(() => {
    setValue(props.value);
  }, [props.value]);

  let datePicker;
  if (MobileCore.isIosPlatform || MobileCore.isAndroidPlatform) {
    datePicker = (
      <div className="mui-date-picker-input" onClick={async (e: React.MouseEvent) => {
        e.stopPropagation();
        const div = e.currentTarget as HTMLDivElement;
        const sourceRect = div.getBoundingClientRect();
        const messageData = {
          min,
          max,
          value,
          sourceRect,
        };
        const pickedDateString = await Messenger.query("Bentley_ITM_presentDatePicker", messageData);
        if (pickedDateString) {
          const newValue = new Date(pickedDateString);
          setValue(newValue);
          onChange?.(newValue);
        } else {
        }
      }} />
    );
  } else {
    datePicker = (
      <input
        className="mui-date-picker-input"
        type="date"
        min={getDateString(min)}
        max={getDateString(max)}
        value={getDateString(value)}
        onChange={(e) => {
          let newValue = new Date(e.target.value);
          const localNowDate = new Date();
          const utcOffset = localNowDate.getTimezoneOffset();
          // Date picker returns a UTC date; we need a local date.
          newValue.setMinutes(newValue.getMinutes() + utcOffset);
          newValue = MobileCore.clampedDate(newValue, min, max);
          setValue(newValue);
          onChange?.(newValue);
          // The (invisible) input has focus after any change, and subsequent taps on other elements cause the date
          // picker to reappear, so clear that focus.
          if (document.activeElement instanceof HTMLInputElement) {
            document.activeElement.blur();
          }
        }}
      />
    );
  }
  return (
    <div className={classnames("mui-date-picker", className)} style={style} >
      <IconImage iconSpec={<CalendarSvg key={calendarKey}/>} size="12px" margin="8px 8px 8px 8px" style={{ color: "var(--muic-active)" }} />
      <div className="mui-date-picker-value">{value?.toLocaleDateString()}</div>
      {datePicker}
    </div>
  );
}

DatePicker.calenderKey = 0;
