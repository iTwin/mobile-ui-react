/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import * as React from "react";
import classnames from "classnames";
import { CommonProps, getCssVariableAsNumber, UiEvent } from "@bentley/ui-core";
import { Optional } from "@itwin/mobile-sdk-core";
import {
  makeRefHandler,
  MutableHtmlDivRefOrFunction,
  PanelHeader,
  PanelHeaderProps,
  ResizablePanel,
  ResizablePanelProps,
  useUiEvent,
  useWindowEvent,
} from ".";
import "./BottomPanel.scss";

/** Type for arguments sent to [[BottomPanelEvents.onResize]].
 * @public
 */
export interface BottomPanelResizeArgs {
  /** The height of the panel */
  currentHeight: number;
  /** The location of the new top of the panel */
  top: number;
  /** App-specific data attached to the associated bottom panel. */
  appData: any | undefined;
}

/** Type for arguments sent to [[BottomPanelEvents.onResizing]].
 * @public
 */
export interface BottomPanelResizingArgs {
  /** The new location of the top of the panel */
  top: number;
  /** App-specific data attached to the associated bottom panel. */
  appData: any | undefined;
}

/** Type for arguments sent to [[BottomPanelEvents.onOpen]] and [[BottomPanelEvents.onClose]].
 * @public
 */
export interface BottomPanelOpenCloseArgs {
  /** The HTMLDivElement for the panel being opened or closed */
  div: HTMLDivElement | null;
  /** The height of the open panel */
  height: number;
  /** The top of the open panel */
  top: number;
  /** App-specific data attached to the associated bottom panel. */
  appData: any | undefined;
}

/** Class that holds events sent by bottom panels.
 * @public
 */
export class BottomPanelEvents {
  /** Event that is emitted after a bottom panel has resized */
  public static readonly onResize = new UiEvent<BottomPanelResizeArgs>();
  /** Event that is emitted while a bottom panel is resizing */
  public static readonly onResizing = new UiEvent<BottomPanelResizingArgs>();
  /** Event that is emitted when a bottom panel is opened */
  public static readonly onOpen = new UiEvent<BottomPanelOpenCloseArgs>();
  /** Event that is emitted when a bottom panel is closed */
  public static readonly onClose = new UiEvent<BottomPanelOpenCloseArgs>();
}

/** A custom hook function that returns the top of the currently open panel. See [[BottomPanelEvents]] */
export function useBottomPanelTop() {
  const [top, setTop] = React.useState<number>();

  useUiEvent((args: BottomPanelResizeArgs) => {
    setTop(args.top);
  }, BottomPanelEvents.onResize);

  useUiEvent((args: BottomPanelOpenCloseArgs) => {
    setTop(args.top);
  }, BottomPanelEvents.onOpen);

  useUiEvent((_args: BottomPanelOpenCloseArgs) => {
    setTop(undefined);
  }, BottomPanelEvents.onClose);

  return top;
}

/** Properties for the [[BottomPanel]] component.
 * @public
 */
export interface BottomPanelProps extends CommonProps {
  children?: React.ReactNode;
  /** Displayed when true. */
  isOpen?: boolean;
  /** Called when isOpen becomes true.
   * @param height - The height of the panel.
   */
  onOpen?: (height: number) => void;
  /** Called when isOpen becomes false.
   * @param height - The height of the panel.
   */
  onClose?: (height: number) => void;
  /** Set to true when the component is not part of a [[TabBar]]. Default false. */
  isStandAlone?: boolean;
  /** Set to true to remove curved borders, transparency and blur. Default false. */
  isSplitScreen?: boolean;
  /** The opacity of the panel (between 0.0 and 1.0), default 1.0 */
  opacity?: string;
  /** The background blur radius in pixels, default unset. Only applies when opacity is less than 1. */
  blur?: string;
  /** App-specific data attached to the bottom panel. */
  appData?: any;
}

/** A React component representing a panel that slides up from the bottom.
 * @public
 */
export const BottomPanel = React.forwardRef((props: BottomPanelProps, forwardedRef: MutableHtmlDivRefOrFunction) => {
  const { className, style, children, isOpen, onOpen, onClose, isSplitScreen, isStandAlone, opacity, blur, appData } = props;
  const ref = React.useRef<HTMLDivElement | null>(null);
  const [opened, setOpened] = React.useState(false);
  // NOTE: This MUST be here. If it is inside the useEffect call, the actual value will not be read
  // until after the animation has already started.
  const oldTop = ref.current?.getBoundingClientRect().top;

  React.useEffect(() => {
    if (!opened && ref.current && isOpen) {
      const height = ref.current.clientHeight;
      onOpen?.(height);
      setOpened(true);
      // If we get this far oldTop will not be undefined, but the compiler doesn't know that.
      if (oldTop !== undefined) {
        // The 0ms setTimeout below is used to ensure that when one tab opening causes another tab to close, the onOpen
        // event will always be emitted after the onClose event.
        setTimeout(() => {
          BottomPanelEvents.onOpen.emit({ div: ref.current, height, top: oldTop - height, appData });
        }, 0);
      }
    }
  }, [isOpen, appData, onOpen, ref, opened, oldTop]);

  React.useEffect(() => {
    if (opened && ref.current && !isOpen) {
      const height = ref.current.clientHeight;
      onClose?.(height);
      setOpened(false);
      // If we get this far oldTop will not be undefined, but the compiler doesn't know that.
      if (oldTop !== undefined) {
        BottomPanelEvents.onClose.emit({ div: ref.current, height, top: oldTop + height, appData });
      }
    }
  }, [isOpen, appData, onClose, ref, opened, oldTop]);

  const bodyStyle: any = {
    "--bottom-panel-opacity": opacity,
    "--bottom-panel-blur": blur,
  };
  return (
    <div
      ref={makeRefHandler(forwardedRef, ref)}
      className={classnames("mui-bottom-panel", className, isOpen && "opening", isStandAlone && "mui-bottom-panel-overlay", isSplitScreen && "mui-bottom-panel-split-screen")}
      style={style} >
      <div className="mui-bottom-panel-body" style={bodyStyle}>
        {children}
      </div>
      {/* Safari screws up with a box-shadow and blur, so this works around it by having the box shadow in a different div */}
      <div className="mui-bottom-panel-shadow" />
    </div >);
});
BottomPanel.displayName = "BottomPanel";

/** Properties for the [[ResizableBottomPanel]] component.
 * @public
 */
export interface ResizableBottomPanelProps extends BottomPanelProps, Optional<ResizablePanelProps, "heightState"> {
  /** Height at which the panel is closed automaticallay, defaults to 110 pixels. */
  autoCloseHeight?: number;
  /** Called when the panel should be automatically closed. This must be supplied for the automatic close functionality to work as the callback
   * is responsible for setting the state necessary to no longer display the component.
   * @returns true or a non-zero number to automatically close the component (and in turn cancel the resize).
   * When a number is returned, it represents the delay (in milliseconds) before the panel's height
   * is restored to the original size, which can be useful to allow animations to settle.
   */
  onAutoClose?: () => boolean | number;
}

/** A React component representing a resizable panel that slides up from the bottom.
 * @public
 */
export function ResizableBottomPanel(props: ResizableBottomPanelProps) {
  const { onResized, onResizing, header, children, minInitialHeight, maxInitialHeight, autoCloseHeight = 110, onAutoClose, onClose, reloadedEvent, heightCanExceedContents, heightState, className, flickUpHeight, appData, ...theRest } = props;
  const [height, setHeight] = React.useState<string | number>();
  const [calculatedInitialHeight, setCalculatedInitialHeight] = React.useState<number>();
  const [minHeight, setMinHeight] = React.useState(props.minHeight);
  const [maxHeight, setMaxHeight] = React.useState(props.maxHeight);
  const [autoClosed, setAutoClosed] = React.useState(false);
  const [flickingDown, setFlickingDown] = React.useState(false);
  const ref = React.useRef<HTMLDivElement | null>(null);

  const updateCalculatedInitialHeight = (div: HTMLDivElement) => {
    const rect = div.getBoundingClientRect();
    // If rect.bottom is larger than the screen height (window.outerHeight), assume the panel is translated 100% down and use the rect.top to calculate the bottom offset
    const bottomOffset = window.outerHeight - (rect.bottom > window.outerHeight ? rect.top : rect.bottom);
    const initHeight = (window.outerHeight / 2) - bottomOffset;
    setCalculatedInitialHeight(initHeight);
  };

  React.useEffect(() => {
    if (ref.current && maxInitialHeight === undefined && calculatedInitialHeight === undefined) {
      updateCalculatedInitialHeight(ref.current);
    }
  }, [ref, maxInitialHeight, calculatedInitialHeight]);

  React.useEffect(() => {
    if (ref.current) {
      setMinHeight(props.minHeight === undefined ? parseFloat(getComputedStyle(ref.current).minHeight) : props.minHeight);
    }
  }, [ref, props.minHeight]);

  React.useEffect(() => {
    if (ref.current) {
      setMaxHeight(props.maxHeight === undefined ? parseFloat(getComputedStyle(ref.current).maxHeight) : props.maxHeight);
    }
  }, [ref, props.maxHeight]);

  // This needs to be a React callback to prevent it from triggering re-renders when it doesn't need to. Before making
  // this a React callback, the handler itself was undefined if onAutoClose was undefined. Now, anyone calling this
  // handler needs to check if onAutoClose is defined before making the call, where before they checked if
  // onAutoCloseHandler was defined.
  const onAutoCloseHandler = React.useCallback(() => {
    if (!onAutoClose) return false;
    setAutoClosed(true);
    return onAutoClose();
  }, [onAutoClose]);

  const onResizedHandler = React.useCallback((currentHeight: number, top: number) => {
    if (props.isOpen) {
      BottomPanelEvents.onResize.emit({ currentHeight, top, appData });
      if (onAutoClose && currentHeight <= autoCloseHeight) {
        return onAutoCloseHandler();
      }
    }
    return onResized?.(currentHeight, top) ?? false;
  }, [autoCloseHeight, appData, onAutoClose, onAutoCloseHandler, onResized, props.isOpen]);

  const onResizingHandler = (top: number) => {
    if (props.isOpen)
      BottomPanelEvents.onResizing.emit({ top, appData });
    onResizing?.(top);
  };

  const onWindowResize = React.useCallback(() => {
    if (ref.current && maxInitialHeight === undefined && calculatedInitialHeight !== undefined) {
      updateCalculatedInitialHeight(ref.current);
    }
    if (ref.current && props.maxHeight === undefined) {
      setMaxHeight(parseFloat(getComputedStyle(ref.current).maxHeight));
    }
    if (props.isOpen) {
      // fire the resize handlers after a timeout to ensure the resize animations have completed.
      setTimeout(() => {
        if (ref.current) {
          const rect = ref.current.getBoundingClientRect();
          onResizedHandler(rect.height, rect.top);
        }
      }, 500);
    }
  }, [calculatedInitialHeight, maxInitialHeight, onResizedHandler, props.isOpen, props.maxHeight]);

  useWindowEvent("resize", onWindowResize);

  const onCloseHandler = (closeHeight: number) => {
    if (!autoClosed)
      onClose?.(closeHeight);
    setAutoClosed(false);
  };

  const onFlickDownHandler = (onAutoCloseHandler || props.onFlickDown) && (() => {
    setFlickingDown(true);
    let result = true;
    let autoCloseResult: number | boolean | undefined;
    if (props.onFlickDown) {
      result = props.onFlickDown();
    } else {
      autoCloseResult = onAutoCloseHandler?.();
    }
    setTimeout(() => {
      setFlickingDown(false);
    }, 50 + (typeof autoCloseResult === "number" ? autoCloseResult : getCssVariableAsNumber("--mui-bottom-panel-animation-duration") * 1000));
    return result;
  });

  return (
    <BottomPanel
      className={classnames(className, flickingDown && "flicking")}
      onClose={onCloseHandler} ref={ref}
      appData={appData}
      {...theRest}>
      <ResizablePanel
        onResized={onResizedHandler}
        onResizing={onResizingHandler}
        onFlickDown={onFlickDownHandler}
        flickUpHeight={flickUpHeight}
        heightState={heightState ?? [height, setHeight]}
        header={header}
        minHeight={minHeight}
        minInitialHeight={minInitialHeight}
        maxInitialHeight={maxInitialHeight ?? calculatedInitialHeight}
        maxHeight={maxHeight}
        reloadedEvent={reloadedEvent}
        heightCanExceedContents={heightCanExceedContents}
      >
        {children}
      </ResizablePanel>
    </BottomPanel>
  );
}

/** Properties for the [[ResizablePanelWithHeader]] component.
 * @public
 */
export interface ResizablePanelWithHeaderProps extends Omit<ResizableBottomPanelProps, "header"> {
  /** The panel header properties. */
  panelHeader: Omit<PanelHeaderProps, "draggable">;
}

/** A simple wrapper of the ResizableBottomPanel that always has a draggable PanelHeader.
 * @public
 */
export function ResizablePanelWithHeader(props: ResizablePanelWithHeaderProps) {
  const { panelHeader, children, ...others } = props;
  return <ResizableBottomPanel
    {...others}
    header={
      <PanelHeader draggable {...panelHeader} />}
  >
    {children}
  </ResizableBottomPanel >;
}
