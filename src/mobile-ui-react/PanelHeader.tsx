/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import * as React from "react";
import classnames from "classnames";
import { CommonProps } from "@itwin/core-react";
import { withoutClassName } from "@itwin/mobile-sdk-core";
import { DraggableComponent, DraggableComponentCallbackProps } from "./ResizablePanel";

import "./PanelHeader.scss";

/** Properties for the [[PanelHeaderDraggableDiv]] component. */
interface PanelHeaderDraggableDivProps extends DraggableComponentCallbackProps {
  className?: string;
  children?: React.ReactNode;
  /** Only draggable when true, defaults to false. */
  draggable?: boolean;
}

/** A React component that is optionally draggable. */
function PanelHeaderDraggableDiv(props: PanelHeaderDraggableDivProps) {
  const { className, children, draggable, onDragStart, onDrag, onDragEnd } = props;
  if (draggable) {
    return <DraggableComponent {...{ onDragStart, onDrag, onDragEnd }} className={classnames("mui-panel-header-draggable", className)}>
      {children}
    </DraggableComponent>;
  }
  return <div className={classnames("mui-panel-header-draggable", "non-draggable", className)}>
    {children}
  </div>;
}

/** Properties for the [[PanelHeaderButton]] component.
 * @public
 */
export interface PanelHeaderButtonProps extends CommonProps {
  /** The button's text label. */
  label: string;
  /** Called when the button is pressed. */
  onClick: (e: React.MouseEvent) => void;
}

/** A React component representing a text button in the [[PanelHeader]]
 * @public
 */
export function PanelHeaderButton(props: PanelHeaderButtonProps) {
  const { label, onClick, className, ...others } = props;
  return <div {...others} className={className}
    onClick={(e) => {
      e.stopPropagation();
      onClick(e);
    }}>
    {label}
  </div>;
}

/** Properties for the [[PanelHeader]] component.
 * @public
 */
export interface PanelHeaderProps extends DraggableComponentCallbackProps {
  /** Optional title text. */
  title?: string;
  /** Optional left button. */
  leftButton?: PanelHeaderButtonProps;
  /** Optional right button. */
  rightButton?: PanelHeaderButtonProps;
  /** Draggable when true, defaults to false. */
  draggable?: boolean;
}

/** A React component used as a header in a panel.
 * @public
 */
export function PanelHeader(props: PanelHeaderProps) {
  const { draggable, onDragStart, onDrag, onDragEnd, title, leftButton, rightButton } = props;
  const draggableProps = { draggable, onDragStart, onDrag, onDragEnd };

  return (
    <div className="mui-panel-header-title-container">
      <div className="mui-panel-header-button-container">
        {leftButton && <PanelHeaderButton className={classnames("mui-panel-header-button-left", leftButton.className)} {...withoutClassName(leftButton)} />}
        <PanelHeaderDraggableDiv {...draggableProps} />
      </div>
      <PanelHeaderDraggableDiv className="mui-panel-header-title" {...draggableProps}>
        {title}
      </PanelHeaderDraggableDiv>
      <div className="mui-panel-header-button-container">
        <PanelHeaderDraggableDiv {...draggableProps} />
        {rightButton && <PanelHeaderButton className={classnames("mui-panel-header-button-right", rightButton.className)} {...withoutClassName(rightButton)} />}
      </div>
    </div>
  );
}
