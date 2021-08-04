/*---------------------------------------------------------------------------------------------
* Copyright (c) 2020 Bentley Systems, Incorporated. All rights reserved.
*--------------------------------------------------------------------------------------------*/
import * as React from "react";
import classnames from "classnames";
import { IconSpec } from "@bentley/ui-core";
import { IconImage } from ".";
import "./CircularButton.scss";

/** Properties for the [[CircularButton]] component.
 * @public
 */
export interface CircularButtonProps {
  /** The outer div's class name */
  className?: string;
  /** The label text below the circle */
  label?: string;
  /** The circle color, defaults to muic-gray-9 */
  circleColor?: string;
  /** The circle color when selected/active, defaults to white */
  selectedCircleColor?: string;
  /** The click handler */
  onClick?: () => void;
  /** The size of the circle, defaults to 50 pixels */
  size?: number;
  /** The icon to display in the circle */
  iconSpec?: IconSpec;
  /** The icon size, defalts to 29 pixels */
  iconSize?: string;
  /** The icon color, defaults to white */
  iconColor?: string;
  /** The icon color when selected/active, defaults to black */
  selectedIconColor?: string;
  /** Text to display in the circle if an icon is not supplied */
  text?: string;
  /** When true, displayed with the selected colors */
  selected?: boolean;
  /** Optional "badge" content added to the top right of circular content */
  badge?: React.ReactNode;
}

/** A clickable button with a circle and an optional label.
 * @public
 */
export function CircularButton(props: CircularButtonProps) {
  const { className, label, circleColor, selectedCircleColor, onClick, size = 50, iconSpec, iconSize = "29px", iconColor, selectedIconColor, text, selected, badge } = props;
  const circleStyle: any = { "--circle-color": circleColor, "--selected-circle-color": selectedCircleColor, "width": size, "height": size };
  const iconStyle: any = { "--icon-color": iconColor, "--selected-icon-color": selectedIconColor, "width": size, "height": size };
  const badgeDiv = !!badge && <div className="mui-circular-button-badge">{badge}</div>;

  let content: React.ReactNode;
  if (iconSpec) {
    content = <div className={classnames("mui-circular-button-icon", selected && "selected")} style={iconStyle}><IconImage iconSpec={iconSpec} size={iconSize} /></div>;
  } else if (text) {
    content = <div className={classnames("mui-circular-button-icon", selected && "selected")} style={iconStyle}>{text}</div>;
  } else {
    const chipSize = size * 0.6;
    content = <div className={classnames("mui-circular-button-default-chip", selected && "selected")} style={{ width: chipSize, height: chipSize }} />;
  }

  return (
    <div className={classnames("mui-circular-button-container", className)}>
      <div className={classnames("mui-circular-button-circle", selected && "selected")} onClick={onClick} style={circleStyle}>
        {content}
        {badgeDiv}
      </div>
      {label && <div className="mui-circular-button-label">{label}</div>}
    </div>
  );
}
