/*---------------------------------------------------------------------------------------------
* Copyright (c) 2020 Bentley Systems, Incorporated. All rights reserved.
*--------------------------------------------------------------------------------------------*/
import * as React from "react";
import { CommonProps, IconSpec } from "@bentley/ui-core";
import { ActionSheet, ActionSheetProps } from "@itwin/mobile-core";
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
}

/**
 * Navigation button that shows an Action Sheet when pressed.
 * Note: The action sheet functionality can be used from a different React component by utilizing the public static
 * registerActions, unregisterActions, and nextSenderId functions.
 * @public
 */
export class ActionSheetButton extends React.Component<ActionSheetButtonProps> {
  private _senderId: number;
  constructor(props: ActionSheetButtonProps) {
    super(props);
    this._senderId = ActionSheet.nextSenderId;
  }

  public override componentWillUnmount() {
    ActionSheet.unregisterActions(this._senderId);
  }

  public static onClick = async (senderId: number, props: ActionSheetButtonProps, source: React.MouseEvent | DOMRect) => {
    return ActionSheet.show(props, "currentTarget" in source ? source.currentTarget.getBoundingClientRect() : source, senderId);
  }

  public override render() {
    const { iconSpec, size, width, height, iconSize } = this.props;
    const onClick = async (e: React.MouseEvent) => {
      return ActionSheetButton.onClick(this._senderId, this.props, e);
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
