/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import * as React from "react";
import ReactDOM from "react-dom";
import classnames from "classnames";
import { IconSpec } from "@itwin/core-react";
import { NavigationButton, NavigationButtonProps } from "./NavigationPanel";
import "./VisibleBackButton.scss";

import { Back as BackSvg } from "./images-tsx";

/**
 * Override NavigationButtonProps without iconSpec, then add iconSpec back in as optional.
 */
export interface VisibleBackButtonProps extends Omit<NavigationButtonProps, "iconSpec"> {
  iconSpec?: IconSpec;
}

/**
 * An empty {@link NavigationButton} intended to reserve space for a {@link VisibleBackButton}.
 * @internal
 */
function VisibleBackButtonSpacer(_props: {}) {
  return <NavigationButton iconSpec="" enabled={false} />;
}

/**
 * Looks and acts like a {@link NavigationButton}, but forced into the upper left of the screen, and with a
 * z-index of 8000 so that it will be above elements that are designed to cover the NavigationPanel. It
 * also has a default value for iconSpec, as well as a default stroke-width to match.
 * NOTE: This must be the first element in the left controls of a NavigationPanel in order to work right.
 */
export function VisibleBackButton(props: VisibleBackButtonProps) {
  const { className, ...otherProps } = props;
  const buttonDiv = (
    <BackButton
      className={classnames("visible-back-button", className)}
      {...otherProps}
    />
  );
  const rootElement = document.getElementById("root");
  if (rootElement) {
    return (
      <>
        <VisibleBackButtonSpacer />
        {ReactDOM.createPortal(buttonDiv, rootElement)}
      </>
    );
  } else {
    return buttonDiv;
  }
}

/**
 * A {@link NavigationButton} that uses the "V" (down-chevron) icon.
 * @public
 */
export function BackButton(props: Omit<NavigationButtonProps, "iconSpec">) {
  const { strokeWidth = "3px", ...otherProps } = props;
  return <NavigationButton strokeWidth={strokeWidth} iconSpec={<BackSvg />} {...otherProps} />;
}
