/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import * as React from "react";
import { CommonProps, IconSpec } from "@bentley/ui-core";
import { ActionSheetProps, presentActionSheet } from "@itwin/mobile-sdk-core";
import { NavigationButton } from ".";

import { MeatballVerticalFill as MoreSvg } from "./images-tsx";

/** Properties for [[ActionSheeButton]]
 * @public
 */
export interface ActionSheetButtonProps extends ActionSheetProps, CommonProps {
  /** The icon to show on the [[ActionSheetButton]], default is three vertical dots. */
  iconSpec?: IconSpec;
  /** The size of the [[ActionSheetButton]], default is "42px". */
  size?: string;
  /** The width of the [[ActionSheetButton]], default is size if specified, "42px" otherwise. */
  width?: string;
  /** The height of the [[ActionSheetButton]], default is size if specified, "42px" otherwise. */
  height?: string;
  /** The icon size of the [[ActionSheetButton]] icon, default is "24px". */
  iconSize?: string;
  /** The callback called when a user taps the button and then selects an action.
   *
   * It is your choice whether to use this or the onSelected field of each [[AlertAction]].
   */
  onSelected?: (action: string | undefined) => void;
}

/**
 * Navigation button that shows an Action Sheet when pressed.
 *
 * Note: The action sheet functionality can be used from a different React component by utilizing [[ActionSheet]]
 * in mobile-sdk-core.
 * @public
 */
export class ActionSheetButton extends React.Component<ActionSheetButtonProps> {
  constructor(props: ActionSheetButtonProps) {
    super(props);
  }

  public static onClick = async (props: ActionSheetButtonProps, source: React.MouseEvent | DOMRect) => {
    const result = await presentActionSheet(props, "currentTarget" in source ? source.currentTarget.getBoundingClientRect() : source);
    props.onSelected?.(result);
  };

  public override render() {
    const { iconSpec, size, width, height, iconSize } = this.props;
    const onClick = async (event: React.MouseEvent) => {
      return ActionSheetButton.onClick(this.props, event);
    };
    return (
      <NavigationButton
        className={this.props.className}
        style={this.props.style}
        onClick={onClick}
        strokeWidth="1px"
        size={size}
        width={width}
        height={height}
        iconSpec={iconSpec || <MoreSvg />}
        iconSize={iconSize}
      />
    );
  }
}
