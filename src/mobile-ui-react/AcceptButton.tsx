/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import * as React from "react";
import classnames from "classnames";
import { CenterDiv } from "./CenterDiv";
import { IconImage } from "./IconImage";

import "./AcceptButton.scss";

import {
  Arrow as ArrowSvg,
  Confirmation as ConfirmationSvg,
} from "./images-tsx";

/** Properties for the [[AcceptButton]] component.
 * @public
 */
export interface AcceptButtonProps {
  className?: string;
  onClick?: () => void;
  label?: string;
  useCheckIcon?: boolean;
}

/** A React component representing a button with a label and a circular icon to its right.
 * @public
 */
export function AcceptButton(props: AcceptButtonProps) {
  const { className, onClick, label, useCheckIcon } = props;
  return <div className={classnames("mui-accept-button-container", className)}>
    {label && <div className="mui-accept-button-label" onClick={onClick}>{label}</div>}
    <CenterDiv className="mui-accept-button-circle" onClick={onClick}>
      <IconImage size="23px" iconSpec={useCheckIcon ? <ConfirmationSvg /> : <ArrowSvg />} />
    </CenterDiv>
  </div>;
}
