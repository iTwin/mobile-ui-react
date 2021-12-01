/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import * as React from "react";
import classnames from "classnames";
import { ClassNameProps, CommonProps, IconSpec } from "@bentley/ui-core";
import { ConditionalBooleanValue, ConditionalStringValue } from "@bentley/ui-abstract";
import { SyncUiEventArgs } from "@bentley/ui-framework";
import { IconImage } from "./IconImage";
import { useSyncUiEvent } from "./MobileUi";
import "./NavigationPanel.scss";

import {
  CloseCircle as CloseCircleSvg,
  Close as CloseSvg,
  MinimizeCircle as MinimizeCircleSvg,
  Minimize as MinimizeSvg,
} from "./images-tsx";

/** Properties for the [[NavigationPanel]] component.
 * @public
 */
export interface NavigationPanelProps extends ClassNameProps {
  /** The left side components. */
  left?: React.ReactNode;
  /** The right side components. */
  right?: React.ReactNode;
}

/** A React component representing a horizontal container of [[NavigationButton]] components.
 * @public
 */
export function NavigationPanel(props: NavigationPanelProps) {
  return <div className={classnames("mui-navigation-panel", props.className)}>
    <div className="mui-navigation-gradient" />
    {<div className="mui-navigation-panel-section">{props.left}</div>}
    {<div className="mui-navigation-panel-section">{props.right}</div>}
  </div>;
}

/** Properties for the [[NavigationButton]] component.
 * @public
 */
export interface NavigationButtonProps extends CommonProps {
  /** The icon. */
  iconSpec: IconSpec;
  /** The button size, default is "42px". */
  size?: string;
  /** The width, default is size if specified, "42px" otherwise. */
  width?: string;
  /** The height, default is size if specified, "42px" otherwise. */
  height?: string;
  /** The icon size, default is "24px". */
  iconSize?: string;
  /** The enabled/disabled state, default is true. */
  enabled?: boolean;
  /** The icon color, default is muic-foreground-navigation-button. */
  color?: string;
  /** The icon stroke width, default is 2px.  */
  strokeWidth?: string;
  /** If set to true, disables the shadow, default is false. */
  noShadow?: boolean;
  /** The click handler. */
  onClick?: (e: React.MouseEvent) => void;
  // onTouchStart?: (e: React.TouchEvent) => void;
}

/** A React component representing a clickable button, usually placed in the [[NavigationPanel]]
 * @public
 */
export function NavigationButton(props: NavigationButtonProps) {
  const { className, color, strokeWidth, noShadow = false, style, enabled = true, size, width, height } = props;
  return <div
    className={classnames("mui-navigation-button", !enabled && "disabled", noShadow && "no-shadow", className)}
    style={{ width: width ?? size ?? "42px", height: height ?? size ?? "42px", color, strokeWidth, ...style }}
    // Note: The below commented out onTouchStart will be needed if we add :active tracking. For some
    // unknown reason, it fixes an iOS Safari glitch when tracking the :active state of a DOM element.
    // onTouchStart={props.onTouchStart ? props.onTouchStart : () => { }}
    onClick={enabled ? (e) => {
      e.stopPropagation();
      props.onClick && props.onClick(e);
    } : undefined}>
    <IconImage iconSpec={props.iconSpec} size={props.iconSize || "24px"} />
  </div>;
}

/**
 * A [[NavigationButton]] that uses the "X" (close) icon, intended for use with nested frontstages.
 * @public
 */
export function CloseButton(props: Omit<NavigationButtonProps, "iconSpec">) {
  const { strokeWidth = "2px", ...otherProps } = props;
  return <NavigationButton strokeWidth={strokeWidth} iconSpec={<CloseSvg />} {...otherProps} />;
}

/**
 * A [[NavigationButton]] that uses the "v" (down chevron) icon.
 * @public
 */
export function MinimizeButton(props: Omit<NavigationButtonProps, "iconSpec">) {
  const { strokeWidth = "3px", ...otherProps } = props;
  return <NavigationButton strokeWidth={strokeWidth} iconSpec={<MinimizeSvg />} {...otherProps} />;
}

/**
 * A [[NavigationButton]] that uses the "v" (down chevron) inside a filled circle icon.
 * @public
 */
export function CircularMinimizeButton(props: Omit<NavigationButtonProps, "iconSpec">) {
  const { strokeWidth = "2px", ...otherProps } = props;
  return <NavigationButton strokeWidth={strokeWidth} iconSpec={<MinimizeCircleSvg />} {...otherProps} />;
}

/**
 * A [[NavigationButton]] that uses the "X" (diagonal cross) inside a filled circle icon.
 * @public
 */
export function CircularCloseButton(props: Omit<NavigationButtonProps, "iconSpec">) {
  const { strokeWidth = "2px", ...otherProps } = props;
  return <NavigationButton strokeWidth={strokeWidth} iconSpec={<CloseCircleSvg />} {...otherProps} />;
}

/**
 * A [[NavigationButton]] that has no shadow and has a foreground color that is black in light mode and white in dark mode.
 * @public
 */
export function ToolButton(props: Omit<NavigationButtonProps, "color" | "noShadow">) {
  return <NavigationButton {...props} color="var(--muic-foreground)" noShadow />;
}

/** Properties for the [[ConditionalNavigationButton]] component.
 * @public
 */
export interface ConditionalNavigationButtonProps extends NavigationButtonProps {
  /** Controls if the button is displayed, default true. */
  isVisible?: ConditionalBooleanValue | boolean;
}

/** A React component composing a [[NavigationButton]] with conditional visibility and icon specification.
 * @public
 */
export function ConditionalNavigationButton(props: ConditionalNavigationButtonProps) {
  const { isVisible = true, iconSpec, ...others } = props;
  const [displayed, setDisplayed] = React.useState<boolean>();
  const [localIconSpec, setLocalIconSpec] = React.useState<IconSpec>();

  React.useEffect(() => {
    if (isVisible instanceof ConditionalBooleanValue) {
      isVisible.refresh();
    }
    setDisplayed(ConditionalBooleanValue.getValue(isVisible));

    if (iconSpec instanceof ConditionalStringValue) {
      iconSpec.refresh();
      setLocalIconSpec(iconSpec.value);
    } else {
      setLocalIconSpec(iconSpec);
    }
  }, [isVisible, iconSpec]);

  useSyncUiEvent((args: SyncUiEventArgs) => {
    if (isVisible instanceof ConditionalBooleanValue && ConditionalBooleanValue.refreshValue(isVisible, args.eventIds)) {
      setDisplayed(isVisible.value);
    }
    if (iconSpec instanceof ConditionalStringValue && ConditionalStringValue.refreshValue(iconSpec, args.eventIds)) {
      setLocalIconSpec(iconSpec.value);
    }
  });

  return <>
    {displayed && <NavigationButton iconSpec={localIconSpec} {...others} />}
  </>;
}
