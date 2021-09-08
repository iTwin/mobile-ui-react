/*---------------------------------------------------------------------------------------------
* Copyright (c) 2020 Bentley Systems, Incorporated. All rights reserved.
*--------------------------------------------------------------------------------------------*/
import * as React from "react";
import classnames from "classnames";
import { getCssVariable, getCssVariableAsNumber } from "@bentley/ui-core";
import { ColorDef } from "@bentley/imodeljs-common";
import { BottomPanelProps, HorizontalScrollableWithFades, useHorizontalScrollChildVisibleOnResize } from ".";

import "./TabBar.scss";

/** Properties for the [[Tab]] component.
 * @public
 */
export interface TabProps {
  /** The label. */
  label: string;
  /** Show with selected styling. */
  selected?: boolean;
  /** Called when clicked by the user. */
  onClick?: () => void;
  /** Component to display when the tab is selected. */
  popup?: React.ReactElement<BottomPanelProps>;
  /** If true, hide this tab, default false. */
  isHidden?: boolean;
  /** Optional badge content added to the top right of the tab. */
  badge?: React.ReactNode;
}

/** Properties for the [[TabBar]] component.
 * @public
 */
export interface TabBarProps {
  /** The current selected tab index, or undefined for no selected tab. Defaults to undefined. */
  selectedIndex?: number;
  /** The tabs to display. */
  children?: Array<React.ReactElement<TabProps>>;
}

/** A React component used as a Tab in the [[TabBar]].
 * @public
 */
export function Tab(props: TabProps) {
  return <div className="mui-tab-container" onClick={props.onClick}>
    <div className={classnames("mui-tab", props.selected && "mui-tab-selected")}>
      {props.label}
      {props.selected && !!props.badge && <div className="mui-tab-badge">{props.badge}</div>}
    </div>
  </div>;
}

/** A React component displaying a horizontal, scrollable list of Tabs.
 * @public
 */
export function TabBar(props: TabBarProps) {
  const { selectedIndex } = props;
  const contentRef = React.useRef<HTMLDivElement | null>(null);
  const children = React.Children.toArray(props.children) as Array<React.ReactElement<TabProps>>;

  // Ensure the selected tab is visible on resize.
  // Note: the first and last child of contentRef are spacers, thus the child index equals selectedIndex + 1
  useHorizontalScrollChildVisibleOnResize(contentRef.current, selectedIndex !== undefined && selectedIndex >= 0 ? selectedIndex + 1 : undefined);

  return <>
    <HorizontalScrollableWithFades
      className="mui-tab-bar"
      backgroundColor={ColorDef.fromString(getCssVariable("--muic-background-tab-bar"))}
      scrollableClassName="mui-tab-bar-scrollable"
      onSetScrollable={(scrollable) => {
        contentRef.current = scrollable;
      }}
    >
      {children && <div className="mui-tab-spacer" />}
      {children.filter((value) => !value.props.isHidden)}
      {children && <div className="mui-tab-spacer" />}
    </HorizontalScrollableWithFades>
    {children && children.map((child: React.ReactElement<TabProps>, index: number) => {
      if (!child.props.popup)
        return null;

      const popup = child.props.popup;
      if (!popup)
        return null;

      return React.cloneElement(popup, { isOpen: index === selectedIndex });
    })}
  </>;
}

/** Interface used by [[useTabsAndStandAlonePanels]]
 * @public
 */
export interface TabOrPanelDef extends Pick<TabProps, "label" | "popup" | "badge"> {
  /** If this panel is a tab or not. */
  isTab: boolean;
}

/** The object returned by [[useTabsAndStandAlonePanels]]
 * @public
 */
export interface TabsAndStandAlonePanelsAPI {
  /** Set the list of tabs/panels. This should be called before calling any other functions. */
  setPanels: (panels: TabOrPanelDef[]) => void;
  /** The selected panel index or undefined if nothing is selected. A value larger than the number of tabs is possible when a stand-alone panel is open. */
  selectedPanel: number | undefined;
  /** Sets the selected panel index. */
  setSelectedPanel: (panel: number | undefined) => void;
  /** Closes the selected panel.
   * @param openLastSelected - when true, the previous selected tab is opened, default false.
   */
  closeSelectedPanel: (openLastSelected?: boolean) => void;
  /** Opens the specified panel
   * @param labelOrIndex - the label or index of the tab/panel in the array.
   */
  openPanel: (labelOrIndex: string | number) => void;
  /** Renders the TabBar and stand-alone panels, this should be called in the parent's rendering section of code.
   * @returns A React fragment with the TabBar and the stand-alone panels.
   */
  renderTabBarAndPanels: () => JSX.Element;
  /** The --mui-bottom-panel-animation-duration CSS variable value in milliseconds. */
  openCloseTiming: number;
  /** The onAutoClose handler for a resizable panel. */
  autoCloseHandler: () => number;
}

/** A custom hook that manages the interaction between tabs and stand-alone panels.
 * @public
 */
export function useTabsAndStandAlonePanels(initialSelectedPanel?: number): TabsAndStandAlonePanelsAPI {
  const [selectedPanel, internalSetSelectedPanel] = React.useState(initialSelectedPanel);
  const [openCloseTiming, setOpenCloseTiming] = React.useState(0);
  const lastSelectedPanel = React.useRef<number>();
  const panelsRef = React.useRef<TabOrPanelDef[]>();

  const setPanels = (panels: TabOrPanelDef[]) => {
    panelsRef.current = panels;
  };

  const setSelectedPanel = (newIndex: number | undefined) => {
    internalSetSelectedPanel((current) => {
      // if we're closing (newIndex === undefined), clear lastSelectedPanel
      if (newIndex === undefined) {
        lastSelectedPanel.current = undefined;
      } else if (newIndex !== current) {
        // if the value is changing, update lastSelectedPanel but only set lastSelectedPanel for tabs
        if (current !== undefined && panelsRef.current && current < panelsRef.current.length && panelsRef.current[current].isTab) {
          lastSelectedPanel.current = current;
        }
      }
      return newIndex;
    });
  };

  const closeSelectedPanel = (openLastSelected: boolean = false) => {
    if (openLastSelected && panelsRef.current && lastSelectedPanel.current !== undefined && lastSelectedPanel.current < panelsRef.current.length) {
      internalSetSelectedPanel(lastSelectedPanel.current);
      lastSelectedPanel.current = undefined;
    } else {
      setSelectedPanel(undefined);
    }
  };

  React.useEffect(() => {
    setOpenCloseTiming(getCssVariableAsNumber("--mui-bottom-panel-animation-duration") * 1000);
  }, []);

  const autoCloseHandler = () => {
    closeSelectedPanel();
    return openCloseTiming + 100;
  };

  const getIndex = (panels: TabOrPanelDef[], labelOrIndex: string | number) => {
    if (typeof labelOrIndex === "number")
      return labelOrIndex;
    return panels.findIndex((value) => value.label === labelOrIndex);
  };

  const openPanel = (labelOrIndex: string | number) => {
    const panels = panelsRef.current ?? [];
    const idx = getIndex(panels, labelOrIndex);
    if (idx >= 0 && idx < panels.length) {
      setSelectedPanel(idx);
    }
  };

  const renderTabBarAndPanels = () => {
    const panels = panelsRef.current ?? [];
    return <>
      <TabBar selectedIndex={selectedPanel}>
        {panels.map((tab, index) => {
          const { isTab, ...props } = tab;
          return <Tab key={tab.label} {...props} selected={index === selectedPanel}
            onClick={() => setSelectedPanel(index === selectedPanel ? undefined : index)}
            isHidden={!isTab} />;
        })}
      </TabBar>
    </>;
  };

  return { setPanels, selectedPanel, setSelectedPanel, closeSelectedPanel, openPanel, renderTabBarAndPanels, openCloseTiming, autoCloseHandler };
}
