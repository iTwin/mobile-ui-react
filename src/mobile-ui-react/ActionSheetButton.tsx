/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import * as React from "react";
import { IconSpec } from "@itwin/core-react";
import { ActionSheetProps, presentActionSheet } from "@itwin/mobile-sdk-core";
import { NavigationButton } from "./NavigationPanel";
import { CommonProps } from "./MobileUi";

/**
 * Properties for {@link ActionSheetButton}
 * @public
 */
export interface ActionSheetButtonProps extends ActionSheetProps, CommonProps {
  /** The icon to show on the {@link ActionSheetButton}, default is three vertical dots. */
  iconSpec?: IconSpec;
  /** The size of the {@link ActionSheetButton}, default is "42px". */
  size?: string;
  /** The width of the {@link ActionSheetButton}, default is size if specified, "42px" otherwise. */
  width?: string;
  /** The height of the {@link ActionSheetButton}, default is size if specified, "42px" otherwise. */
  height?: string;
  /** The icon size of the {@link ActionSheetButton} icon, default is "24px". */
  iconSize?: string;
  /**
   * The callback called when a user taps the button and then selects an action.
   *
   * It is your choice whether to use this or the onSelected field of each `AlertAction`.
   */
  onSelected?: (action: string | undefined) => void;
}

/**
 * Navigation button that shows an Action Sheet when pressed.
 *
 * Note: The action sheet functionality can be used from a different React component by utilizing {@link presentActionSheet}
 * in mobile-sdk-core.
 * @public
 */
export function ActionSheetButton(props: ActionSheetButtonProps) {
  const { className, style, iconSpec, size, width, height, iconSize } = props;
  let actualIconSize = iconSize;
  if (iconSize === undefined && iconSpec === undefined) {
    actualIconSize = "16px";
  }
  return (
    <NavigationButton
      className={className}
      style={style}
      onClick={async (event) => { await ActionSheetButton.onClick(props, event); }}
      strokeWidth="1px"
      size={size}
      width={width}
      height={height}
      iconSpec={iconSpec || "icon-more-vertical-2"}
      iconSize={actualIconSize}
    />
  );
}

/**
 * Act as though an {@link ActionSheetButton} with the given props had been clicked. This will show
 * an action sheet using the native UI and call `props.onSelected` with the user's selection.
 * @param props The {@link ActionSheetButtonProps} to use to show the action sheet.
 * @param source The mouse event that triggered the click (whose target's rectangle will be used
 * for the action sheet), or the DOM rectangle of the source component that wants to show the action
 * sheet.
 */
ActionSheetButton.onClick = async (props: ActionSheetButtonProps, source: React.MouseEvent | DOMRect) => {
  const result = await presentActionSheet(props, "currentTarget" in source ? source.currentTarget.getBoundingClientRect() : source);
  props.onSelected?.(result);
};
