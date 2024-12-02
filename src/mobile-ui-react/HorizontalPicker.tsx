/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import * as React from "react";
import classnames from "classnames";
import { CommonProps } from "./MobileUi";

import "./HorizontalPicker.scss";

/**
 * Properties for {@link HorizontalPicker} component
 * @public
 */
export interface HorizontalPickerProps extends CommonProps {
  /** The items in the picker. */
  items: React.ReactNode[];
  /** The index of the currently selected item. */
  selectedIndex: number;
  /** Callback called when the user selects an item. */
  onItemSelected: (item: number) => void;
}

interface HorizontalPickerItemProps extends CommonProps {
  itemNode: React.ReactNode;
  onClick: () => void;
  isSelected: boolean;
}

/**
 * A React component that displays a horizontal picker, from which the user can choose the selected item. It behaves
 * like radio buttons, in that there is always one and only one selected item.
 *
 * @public
 */
export function HorizontalPicker(props: HorizontalPickerProps) {
  const { items, className, selectedIndex, onItemSelected, ...others } = props;
  return (
    <div className={classnames("mui-horizontal-picker", className)} {...others}>
      {items.map((item: React.ReactNode, index: number) => {
        return <HorizontalPickerItem
          key={index}
          itemNode={item}
          onClick={() => {
            onItemSelected(index);
          }}
          isSelected={selectedIndex === index}
        />;
      })}
    </div>
  );
}

function HorizontalPickerItem(props: HorizontalPickerItemProps) {
  const { itemNode, onClick, isSelected } = props;
  return (
    <div
      className={classnames("mui-horizontal-picker-item", isSelected && "mui-selected")}
      onClick={(e: React.MouseEvent) => {
        e.stopPropagation();
        onClick();
      }}
    >
      <div>{itemNode}</div>
    </div>
  );
}
