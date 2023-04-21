/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import * as React from "react";
import classnames from "classnames";
import { CommonProps, IconSpec } from "@itwin/core-react";
import { AlertAction } from "@itwin/mobile-sdk-core";
import { ActionSheetButton } from "./ActionSheetButton";
import { IconImage } from "./IconImage";
import { MobileUi } from "./MobileUi";

import "./CountNotification.scss";

import {
  Close as CloseSvg,
  MeatballVerticalFill as MoreSvg,
} from "./images-tsx";

/** A simple pill shaped component. */
export function Pill(props: React.HTMLAttributes<HTMLDivElement>) {
  const { className, ...others } = props;
  return <div className={classnames("mui-pill", className)} {...others} />;
}

/**
 * Properties for the more button of the {@link CountNotification} component
 * @public
 */
export interface CountNotificationMoreProps {
  /** The title for the action sheet shown by the more button */
  title?: string;
  /** The message for the action sheet shown by the more button */
  message?: string;
  /** The actions for the action sheet shown by the more button */
  actions: AlertAction[];
}

/**
 * Properties for {@link CountNotification} component
 * @public
 */
export interface CountNotificationProps extends CommonProps {
  /** Count to display */
  count: number;
  /** Label to display */
  label: string;
  /** Properties for the action sheet that happens on click. */
  moreButtonProps?: CountNotificationMoreProps;
  /** Click handler: ignored if moreButtonProps is set. */
  onClick?: () => void;
  /** IconSpec for icon to use on the right side: ignored if moreButtonProps is set. */
  iconSpec?: IconSpec;
  /** The icon size, if iconSpec is specified, default is "24px". */
  iconSize?: string;
  /**
   * The callback called when a user taps the vertical more button and then selects an action.
   *
   * It is your choice whether to use this or the onSelected field of each {@link AlertAction}.
   */
  onSelected?: (action: string | undefined) => void;
}

/**
 * Properties for {@link CloseableCountNotification} component
 * @public
 */
export interface CloseableCountNotificationProps extends CommonProps {
  /** Count to display */
  count: number;
  /** Label to display */
  label: string;
  /** Close handler that is called when the component is pressed. */
  onClose?: () => void;
}

/**
 * A React component that displays a count in a circle, along with a label, and a vertical more icon. Tapping it
 * activates an action sheet.
 *
 * Note: If there are multiple children, they will be arrayed in a horizontal flex layout.
 * @public
 */
export function CountNotification(props: CountNotificationProps) {
  return (
    <Pill className={classnames("mui-count-notification", props.className)} style={props.style}>
      <div className="mui-count-notification-count">{props.count < 100 ? props.count : MobileUi.translate("count-notification.99+")}</div>
      <div className={classnames("mui-count-notification-label", props.moreButtonProps && "mui-count-notification-label-more")}>{props.label}</div>
      {props.moreButtonProps &&
        <ActionSheetButton
          width="100%"
          className="mui-count-notification-more"
          {...props.moreButtonProps}
          iconSpec={<MoreSvg />}
          iconSize="20px"
          onSelected={props.onSelected}
        />
      }
      {props.iconSpec && !props.moreButtonProps &&
        <IconImage iconSpec={props.iconSpec} size={props.iconSize || "24px"} />
      }
      {props.onClick && !props.moreButtonProps &&
        <div className="mui-count-notification-button" onClick={(e: React.MouseEvent) => {
          e.stopPropagation();
          props.onClick?.();
        }} />
      }
    </Pill>
  );
}

/**
 * A React component that displays a count in a circle, along with a label, and an X icon. Tapping it
 * closes the component.
 *
 * @public
 */
export function CloseableCountNotification(props: CloseableCountNotificationProps) {
  const { count, label, onClose, style = {} } = props;
  const className = classnames("mui-closeable-count-notification", (count === 0) ? "mui-hidden" : undefined, props.className);

  return (
    <div className={className} style={style}>
      <CountNotification
        count={count}
        label={label}
        onClick={() => {
          onClose?.();
        }}
        iconSpec={<CloseSvg />}
        iconSize="18px"
      />
    </div>
  );
}
