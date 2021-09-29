/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import * as React from "react";
import classnames from "classnames";
import { CommonProps } from "@bentley/ui-core";
import "./CenterDiv.scss";

/** Properties for [[CenterDiv]] component
 * @public
 */
interface CenterDivProps extends CommonProps, React.DOMAttributes<HTMLDivElement> {
  /** Set to true to have the [[CenterDiv]] fill 100% of its parent. Default: no */
  fill?: boolean;
  /** Children of this node */
  children?: React.ReactNode;
}

/** A React component that centers its child both horizontally and vertically.
 *
 * Note: If there are multiple children, they will be arrayed in a horizontal flex layout.
 * @public
 */
export function CenterDiv(props: CenterDivProps) {
  const { fill, children, className, ...others } = props;
  return <div className={classnames("mui-center-div", fill && "mui-fill", className)} {...others} ><div>{children}</div></div>;
}
