/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import * as React from "react";
import classnames from "classnames";
import { ColorDef } from "@itwin/core-common";
import { ClassNameProps, useScroll, useWindowEvent } from "./MobileUi";
import { getCssVariable } from "@itwin/mobile-sdk-core";

import "./ScrollableWithFades.scss";

// Note: a VerticalScrollableWithFades may be added in the future, and it would have the same props.

/**
 * Properties for the {@link HorizontalScrollableWithFades} component.
 * @public
 */
export interface ScrollableWithFadesProps extends ClassNameProps {
  backgroundColor?: ColorDef;
  /** The views to go into the scrollable element */
  children: React.ReactNode;
  /** The optional className to add to the scrollable element */
  scrollableClassName?: string;
  /** The optional className to add to the fade elements */
  fadesClassName?: string;
  /** Callback called when scrollable is created or destroyed */
  onSetScrollable?: (scrollable: HTMLDivElement | null) => void;
  /** Value that when changed triggers an update to the display of the fades */
  fadeDisplayTrigger?: any;
}

/**
 * A React component that fades out the left and right regions of a scrollable if there is more content in that
 * direction.
 * In other words, if the element is scrolled all the way to the right, then there will be no fade applied to the left
 * side. If the element is scrolled all the way to the left, there will be no fade applied to the right side.
 * Note: if this component is given a ref, it is attached to the scrollable element, not the top-level element.
 * @public
 */
export function HorizontalScrollableWithFades(props: ScrollableWithFadesProps) {
  const { backgroundColor = ColorDef.fromString(getCssVariable("--muic-background")), children, fadesClassName, scrollableClassName, className, fadeDisplayTrigger } = props;
  const [leftEnabled, setLeftEnabled] = React.useState(false);
  const [rightEnabled, setRightEnabled] = React.useState(false);
  const scrollableRef = React.useRef<HTMLDivElement | null>(null);

  const updateEnabled = React.useCallback(() => {
    if (!scrollableRef.current) return;
    const element = scrollableRef.current;
    setLeftEnabled(element.scrollLeft > 0);
    const contentWidth = element.scrollWidth - element.offsetWidth;
    setRightEnabled(contentWidth > element.scrollLeft);
  }, []);

  useScroll(scrollableRef.current, updateEnabled);
  useWindowEvent("resize", updateEnabled);

  React.useEffect(() => {
    updateEnabled();
  }, [updateEnabled, fadeDisplayTrigger]);

  const { r, g, b } = backgroundColor.colors;
  const fadeStyle: any = {};
  fadeStyle["--background-r"] = r.toString();
  fadeStyle["--background-g"] = g.toString();
  fadeStyle["--background-b"] = b.toString();

  return (
    <div className={className}>
      <div className="mui-horizontal-scrollable-with-fades-relative">
        <div className={classnames("mui-fade-left", !leftEnabled && "mui-faded-out", fadesClassName)} style={fadeStyle} />
        <div
          className={classnames("mui-horizontal-scrollable-with-fades-scrollable", scrollableClassName)}
          ref={(element: HTMLDivElement | null) => {
            scrollableRef.current = element;
            props.onSetScrollable?.(element);
          }}
        >
          {children}
        </div>
        <div className={classnames("mui-fade-right", !rightEnabled && "mui-faded-out", fadesClassName)} style={fadeStyle} />
      </div>
    </div>
  );
}
