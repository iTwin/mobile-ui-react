/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import * as React from "react";
import "./MobileUiContent.scss";

/** Full-screen react component with padding on all four sides for device safe area. */
export function MobileUiContent(props: any) {
  return <div className="mobile-ui-content">
    {props.children}
  </div>;
}
