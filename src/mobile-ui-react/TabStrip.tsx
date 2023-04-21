/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import * as React from "react";
import classnames from "classnames";
import { HorizontalScrollableWithFades } from "./ScrollableWithFades";

import "./TabStrip.scss";

/**
 * Properties for the {@link TabStrip} component.
 * @public
 */
export interface TabStripProps {
  /** The tab labels */
  tabs: string[];
  /** The selected tab */
  selectedIndex?: number;
  /** Called when a tab is clicked, typically sets the selectedIndex state */
  onTabClick?: (index: number) => void;
  /** Optional classname */
  className?: string;
  /** Value that when changed triggers an update to the display of the fades */
  fadeDisplayTrigger?: any;
}

/**
 * A React component that is a list of clickable tabs.
 * @public
 */
export function TabStrip(props: TabStripProps) {
  const { tabs, selectedIndex, onTabClick, className, fadeDisplayTrigger } = props;

  return <>
    <HorizontalScrollableWithFades
      className={classnames("mui-tab-strip", className)}
      scrollableClassName={"mui-tab-strip-tabs"}
      fadeDisplayTrigger={fadeDisplayTrigger}
    >
      {tabs.map((tab, index) => {
        return <div
          key={tab}
          className={classnames("mui-tab-strip-tab", index === selectedIndex && "mui-tab-strip-tab-selected")}
          onClick={() => onTabClick?.(index)}
        >{tab}</div>;
      })}
    </HorizontalScrollableWithFades>
  </>;
}

/**
 * Properties for a single tab in the {@link TabSheet} component.
 * @public
 */
export interface TabSheetTab {
  /** The tab label */
  label: string;
  /** The tab contents, shown after (below) the tabs. */
  contents?: React.ReactNode;
}

/**
 * Properties for  the {@link TabSheet} component.
 * @public
 */
export interface TabSheetProps {
  /** The tabs to display in the component. */
  tabs: TabSheetTab[];
  /** Called when a tab is clicked */
  onTabClick?: (index: number) => void;
  /** When true, hide the tab contents using CSS rather than not rendering it. This allows the components' states to be maintained when switching between tabs. */
  hideUsingCss?: boolean;
  /** Optional classname to use for each of the tab contents elements. */
  contentsClassName?: string;
  /** Optional settings that apply to the tab strip. */
  tabStripOptions?: {
    /** Optional classname to use for the tab strip. */
    className?: string;
    /** Optional element to show to the right of the tab strip */
    rightElement?: React.ReactElement;
    /** Optional value that when changed triggers an update to the display of the fades in the tab strip */
    fadeDisplayTrigger?: any;
  };
}

/**
 * A React component with a {@link TabStrip} and contents below it.
 * @public
 */
export function TabSheet(props: TabSheetProps) {
  const { tabs, onTabClick, hideUsingCss, contentsClassName, tabStripOptions = {} } = props;
  const { className: tabStripClassName, rightElement: tabStripRightElement, fadeDisplayTrigger: tabStripFadeDisplayTrigger } = tabStripOptions;
  const [selectedIndex, setSelectedIndex] = React.useState(0);

  let contents: React.ReactNode = null;
  if (hideUsingCss) {
    contents = <>
      {tabs.map((tab, index) => {
        return <div
          key={tab.label}
          className={classnames("mui-tab-strip-tab-contents", contentsClassName, index !== selectedIndex && "mui-hidden")}
        >
          {tab.contents}
        </div>;
      })}
    </>;
  } else if (!hideUsingCss && selectedIndex < tabs.length) {
    contents = tabs[selectedIndex].contents;
  }

  return <>
    <div className="mui-tab-strip-container">
      <TabStrip
        className={tabStripClassName}
        tabs={tabs.map((tab) => tab.label)}
        selectedIndex={selectedIndex}
        fadeDisplayTrigger={tabStripFadeDisplayTrigger}
        onTabClick={(index) => {
          setSelectedIndex(index);
          onTabClick?.(index);
        }}
      />
      {tabStripRightElement}
    </div>
    {contents}
  </>;
}
