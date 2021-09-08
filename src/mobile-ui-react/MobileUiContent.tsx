/*---------------------------------------------------------------------------------------------
* Copyright (c) 2020 Bentley Systems, Incorporated. All rights reserved.
*--------------------------------------------------------------------------------------------*/
import * as React from "react";
import "./MobileUiContent.scss";

export function MobileUiContent(props: any) {
  return <div className="mobile-ui-content">
    {props.children}
  </div>;
}
