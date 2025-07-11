/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import * as React from "react";
import classnames from "classnames";
import { Point2d, XAndY } from "@itwin/core-geometry";
import { CommonProps } from "@itwin/core-react";
import { getCssVariableAsNumber, ReloadedEvent } from "@itwin/mobile-sdk-core";
import { ReactUseState, useIsMountedRef, useWindowEvent } from "./MobileUi";
import "./ResizablePanel.scss";

/**
 * Properties for {@link ResizablePanel} component
 * @public
 */
// @todo AppUI deprecation
// eslint-disable-next-line @typescript-eslint/no-deprecated
export interface ResizablePanelProps extends CommonProps {
  /** The children */
  children?: React.ReactNode;
  /**
   * Called when the panel is resized.
   * @param currentHeight - The current height of the component.
   * @param top - The current top of the client bounding rect of the component.
   * @returns true or a non-zero number to cancel the resize.
   * When a number is returned, it represents the delay (in milliseconds) before the panel's height
   * is restored to the original size, which can be useful to allow animations to settle.
   */
  onResized?: (currentHeight: number, top: number) => boolean | number;
  /**
   * Called when the panel is resizing.
   * @param top - The current top of the client bounding rect of the component.
   */
  onResizing?: (top: number) => void;
  /**
   * Called when the panel is flicked down. If not supplied, flick up/down gestures are not active.
   * @returns true if flick down closes panel, false otherwise.
   */
  onFlickDown?: () => boolean;
  /** The height to use when flicked up, default "100vh" */
  flickUpHeight?: number;
  /** An optional header element to add below the drag handle */
  header?: React.ReactElement<DraggableComponentCallbackProps>;
  /** The minimum height of the panel */
  minHeight?: number;
  /** The minimum initial height of the panel */
  minInitialHeight?: number;
  /** The maximum initial height of the panel */
  maxInitialHeight?: number;
  /** The maximum height of the panel */
  maxHeight?: number;
  /** An optional UiEvent to cause a resize when emitted. */
  reloadedEvent?: ReloadedEvent;
  /** When true, the panel can be taller than its contents, default false. */
  heightCanExceedContents?: boolean;
  /** The height state (getter and setter). */
  heightState: ReactUseState<string | number | undefined>;
}

/** Returns the last child's scrollHeight less its clientHeight */
function getChildExtraScrollableHeight(el: HTMLElement) {
  if (el.childElementCount) {
    const child = el.children[el.childElementCount - 1];
    // child.scrollHeight should be the height to fit all its content but it doesn't seem to always be correct.
    // When we have a single element in the scrollable div, we'll use the maximum value of its clientHeight and child.scrollHeight.
    let singleChildHeight = 0;
    if (child.childElementCount === 1)
      singleChildHeight = child.children[0].clientHeight;
    return Math.max(Math.max(child.scrollHeight, singleChildHeight) - child.clientHeight, 0);
  }
  return 0;
}

/**
 * A React component that supports vertical resizing via a drag handle.
 * @public
 */
export function ResizablePanel(props: ResizablePanelProps) {
  const [height, setHeight] = props.heightState;
  const divRef = React.useRef<HTMLDivElement>(null);
  const [startHeight, setStartHeight] = React.useState(0);
  const [startTop, setStartTop] = React.useState(0);
  const { minHeight = 0, maxInitialHeight = 0, minInitialHeight = 0 } = props;
  const [maxHeight, setMaxHeight] = React.useState(props.maxHeight);
  const [initialMaxHeightSet, setInitialMaxHeightSet] = React.useState(false);
  const { children, className, header, style = {}, reloadedEvent, onResized } = props;
  const { height: _removedHeight, maxHeight: _removedMaxHeight, ...otherStyles } = style;
  const [lastDragInfo, setLastDragInfo] = React.useState({ dragged: 0, time: Date.now(), speed: 0 });
  const [flickingUp, setFlickingUp] = React.useState(false);
  const isMountedRef = useIsMountedRef();

  /**
   * Sets maxHeight, ensuring it is never larger than any of these 3 values:
   * - newMaxHeight
   * - props.maxHeight (if specified)
   * - window.outerHeight - 100 (100 less than the overall window height)
   */
  const updateMaxHeight = React.useCallback((newMaxHeight: number) => {
    const safeAreaOffsets = getCssVariableAsNumber("--itm-safe-area-top") + getCssVariableAsNumber("--itm-safe-area-bottom");
    let newVal = window.outerHeight - 100 - safeAreaOffsets;
    if (!props.heightCanExceedContents)
      newVal = Math.min(newMaxHeight, newVal);
    if (props.maxHeight)
      newVal = Math.min(newVal, props.maxHeight);
    setMaxHeight(newVal);
    return newVal;
  }, [props.maxHeight, props.heightCanExceedContents]);

  const setHeightAndCallOnResized = React.useCallback((newHeight: number) => {
    setHeight(newHeight);
    if (divRef.current && onResized) {
      const rect = divRef.current.getBoundingClientRect();
      const diff = newHeight - rect.height;
      onResized(newHeight, rect.top - diff);
    }
  }, [onResized, setHeight]);

  /** Sets the maxHeight when initially loaded based on minInitialHeight and maxInitialHeight. */
  React.useLayoutEffect(() => {
    if (divRef.current && !initialMaxHeightSet) {
      setInitialMaxHeightSet(true);
      let currHeight = divRef.current.clientHeight;
      if (maxInitialHeight && currHeight > maxInitialHeight) {
        currHeight = maxInitialHeight;
      } else if (minInitialHeight && currHeight < minInitialHeight) {
        currHeight = minInitialHeight;
        if (props.heightCanExceedContents) {
          setHeightAndCallOnResized(currHeight);
        }
      }
      updateMaxHeight(currHeight);
    }
  }, [minInitialHeight, maxInitialHeight, initialMaxHeightSet, updateMaxHeight, props.heightCanExceedContents, setHeightAndCallOnResized]);

  const onWindowResize = React.useCallback(() => {
    setTimeout(() => {
      if (!isMountedRef.current) return;
      const safeAreaOffsets = getCssVariableAsNumber("--itm-safe-area-top") + getCssVariableAsNumber("--itm-safe-area-bottom");
      const newMaxHeight = window.outerHeight - 100 - safeAreaOffsets;
      if (maxHeight !== undefined && maxHeight > newMaxHeight)
        setMaxHeight(newMaxHeight);
    }, 0);
  }, [maxHeight, isMountedRef]);

  useWindowEvent("resize", onWindowResize);

  /** Returns the desired height of the divRef (so there's nothing scrollable) */
  const getOptimalHeight = React.useCallback(() => {
    if (divRef.current) {
      const extraHeight = getChildExtraScrollableHeight(divRef.current);
      return divRef.current.clientHeight + extraHeight;
    }
    return 0;
  }, [divRef]);

  /** Updates the height and maxHeight when reloadedEvent is emitted. */
  React.useEffect(() => {
    const handleReloaded = () => {
      let newHeight = getOptimalHeight();
      if (newHeight > 0 && height !== newHeight) {
        let updateHeight = true;
        if (maxInitialHeight) {
          if ((height === undefined || (height && (typeof height === "number") && height <= maxInitialHeight))) {
            newHeight = Math.min(newHeight, maxInitialHeight);
          } else {
            updateHeight = false;
          }
        }
        if (minInitialHeight && (height === undefined || (height && (typeof height === "number") && height >= minInitialHeight))) {
          newHeight = Math.max(newHeight, minInitialHeight);
          updateHeight = true;
        }
        newHeight = updateMaxHeight(newHeight);
        if (updateHeight) {
          setHeightAndCallOnResized(newHeight);
        }
      }
    };
    return reloadedEvent?.addListener(handleReloaded);
  }, [reloadedEvent, getOptimalHeight, height, minInitialHeight, maxInitialHeight, updateMaxHeight, setHeightAndCallOnResized]);

  const onDragStart = () => {
    if (props.onFlickDown) {
      setLastDragInfo({ dragged: 0, time: Date.now(), speed: 0 });
    }
    if (divRef.current) {
      setStartHeight(divRef.current.clientHeight);
      setStartTop(divRef.current.getBoundingClientRect().top);
      updateMaxHeight(getOptimalHeight());
    }
  };

  const onDrag = (dragged: number) => {
    if (props.onFlickDown) {
      const dist = dragged - lastDragInfo.dragged;
      if (dist !== 0) {
        const now = Date.now();
        const time = now - lastDragInfo.time;
        setLastDragInfo({ dragged, time: now, speed: dist / time });
      }
    }
    if (startHeight) {
      const newHeight = startHeight - dragged;
      if (newHeight >= minHeight) {
        setHeight(newHeight);
        if (divRef.current) {
          const top = divRef.current.getBoundingClientRect().top;
          props.onResizing?.(top);
        }
      }
    }
  };

  const onDragEnd = () => {
    if (props.onFlickDown) {
      const lastDragSpeed = lastDragInfo.speed;
      if (Math.abs(lastDragSpeed) > 0.5) { // arbitrary speed value, could become a prop, lower is more sensitive
        const delayTime = (getCssVariableAsNumber("--mui-bottom-panel-animation-duration") * 1000) + 50;
        if (lastDragSpeed < 0) {
          // animate the height change by momentarily setting flickingUp to true
          setFlickingUp(true);
          setHeight(props.flickUpHeight ?? "100vh"); // using 100vh so it will be constrained by its maxHeight
          setTimeout(() => {
            if (!isMountedRef.current) return;
            setFlickingUp(false);
            if (divRef.current && onResized)
              onResized(divRef.current.clientHeight, divRef.current.getBoundingClientRect().top);
          }, delayTime);
        } else {
          if (onResized)
            onResized(startHeight, startTop);
          if (props.onFlickDown()) {
            // restore the height when the dragging started after panel is closed.
            setTimeout(() => {
              if (!isMountedRef.current) return;
              setHeight(startHeight);
            }, delayTime);
          }
        }
        return;
      }
    }

    if (divRef.current) {
      // get the actual height of the element rather than the dragged height as it might be outside the min/max range
      const newHeight = divRef.current.clientHeight;
      if (newHeight === startHeight)
        return;
      if (onResized) {
        const top = divRef.current.getBoundingClientRect().top;
        const result = onResized(newHeight, top);
        if (result !== undefined && result !== false) {
          const delay = typeof (result) === "number" ? result : 0;
          if (delay) {
            // reset the panel's size after a delay (to allow any closing animations to be done).
            setTimeout(() => {
              if (!isMountedRef.current) return;
              setHeight(startHeight);
            }, delay);
          } else {
            setHeight(startHeight);
          }
          return;
        }
      }
      updateMaxHeight(newHeight);
    }
  };

  return (
    <>
      <div className={classnames("mui-resizable-panel", className, flickingUp && "mui-panel-animate-height")} ref={divRef} style={{ ...otherStyles, height, minHeight, maxHeight }}>
        <VerticalDragHandle onDragStart={onDragStart} onDrag={onDrag} onDragEnd={onDragEnd} />
        {header && React.cloneElement(header, { onDragStart, onDrag: (dragged: XAndY) => onDrag(dragged.y), onDragEnd })}
        {children}
      </div>
      {/* with a short distance flick up on the Views panel a click would sometimes occur, this div will receive the click and do nothing */}
      {flickingUp && <div className="mui-panel-pointer-event-blocker" />}
    </>
  );
}

interface VerticalDragHandleProps {
  onDragStart?: (initial: number) => void;
  onDrag?: (dragged: number) => void;
  onDragEnd?: () => void;
}

function VerticalDragHandle(props: VerticalDragHandleProps) {
  const onDragStart = (initialPosition: XAndY) => {
    props.onDragStart?.(initialPosition.y);
  };
  const onDrag = (dragged: XAndY) => {
    props.onDrag?.(dragged.y);
  };
  return <DraggableComponent className="mui-drag-container" onDragStart={onDragStart} onDrag={onDrag} onDragEnd={props.onDragEnd}>
    <div className="mui-drag-handle" />
  </DraggableComponent>;
}

/**
 * Callback functions for any draggable component. See {@link DraggableComponentProps}.
 * @public
 */
export interface DraggableComponentCallbackProps {
  /**
   * Called when dragging starts.
   * @param initialPosition - The x,y of the drag point.
   */
  onDragStart?: (initialPosition: XAndY) => void;
  /**
   * Called while dragging.
   * @param dragged - The x,y of the current drag point.
   */
  onDrag?: (dragged: XAndY) => void;
  /** Called when dragging ends. */
  onDragEnd?: () => void;
}

/**
 * Properties for {@link DraggableComponent} component.
 * @public
 */
export interface DraggableComponentProps extends DraggableComponentCallbackProps {
  className?: string;
  children?: React.ReactNode;
}

/** A React component that is draggable. */
export function DraggableComponent(props: DraggableComponentProps) {
  const [lastPosition, setLastPosition] = React.useState<XAndY | undefined>(undefined);
  const onDragStart = (initialPosition: XAndY) => {
    setLastPosition(initialPosition);
    props.onDragStart?.(initialPosition);
  };
  const onDrag = (dragged: XAndY) => {
    props.onDrag?.(dragged);
  };
  const onDragEnd = () => {
    setLastPosition(undefined);
    props.onDragEnd?.();
  };
  return <TouchDragHandle
    className={classnames("mui-draggable-component", props.className)}
    onDragStart={onDragStart} onDrag={onDrag}
    lastPosition={lastPosition} onDragEnd={onDragEnd}
  >
    {props.children}
  </TouchDragHandle>;
}

// @todo AppUI deprecation
// eslint-disable-next-line @typescript-eslint/no-deprecated
interface VerticalScrollProps extends CommonProps {
  children?: React.ReactNode;
}

/** A React component that is vertically scrollable. */
export function VerticalScroll(props: VerticalScrollProps) {
  const { children, className, ...otherProps } = props;
  return <div {...otherProps} className={classnames("mui-vertical-scroll", className)}>{children}</div>;
}

// @todo AppUI deprecation
// eslint-disable-next-line @typescript-eslint/no-deprecated
interface TouchCaptorProps extends CommonProps {
  isTouchStarted: boolean;
  onTouchStart?: (e: TouchEvent) => void;
  onTouchMove?: (e: TouchEvent) => void;
  onTouchEnd?: (e: TouchEvent) => void;
  children?: React.ReactNode;
}

// This is a copy of PointerCaptor that has been changed to work with touch events instead.
class TouchCaptor extends React.PureComponent<TouchCaptorProps> {
  public override componentDidMount() {
    document.addEventListener("touchend", this._handleDocumentTouchEnd);
    document.addEventListener("touchmove", this._handleDocumentTouchMove);
  }

  public override componentWillUnmount() {
    document.removeEventListener("touchend", this._handleDocumentTouchEnd);
    document.removeEventListener("touchmove", this._handleDocumentTouchMove);
  }

  public override render() {
    const className = classnames(
      "nz-base-pointerCaptor",
      this.props.isTouchStarted && "nz-captured",
      this.props.className);
    return (
      <div
        className={className}
        onTouchStart={this._handleTouchStart}
        style={this.props.style}
        role="presentation"
      >
        <div className="nz-overlay" />
        {this.props.children}
      </div>
    );
  }

  private _handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    this.props.onTouchStart && this.props.onTouchStart(e.nativeEvent);
  };

  private _handleDocumentTouchEnd = (e: TouchEvent) => {
    if (!this.props.isTouchStarted)
      return;
    this.props.onTouchEnd && this.props.onTouchEnd(e);
  };

  private _handleDocumentTouchMove = (e: TouchEvent) => {
    if (!this.props.isTouchStarted)
      return;
    this.props.onTouchMove && this.props.onTouchMove(e);
  };
}

// @todo Use the functional version of TouchCaptor below after sufficient testing.
// // 2024-06-24: Converted to a function.
// function TouchCaptor(props: TouchCaptorProps) {
//   const { className, children, isTouchStarted, onTouchStart, onTouchMove, onTouchEnd } = props;
//   const handleTouchStart = React.useCallback((e: React.TouchEvent<HTMLDivElement>) => {
//     onTouchStart?.(e.nativeEvent);
//   }, [onTouchStart]);
//   const handleDocumentTouchEnd = React.useCallback((e: TouchEvent) => {
//     if (!isTouchStarted)
//       return;
//     onTouchEnd?.(e);
//   }, [onTouchEnd, isTouchStarted]);
//   const handleDocumentTouchMove = React.useCallback((e: TouchEvent) => {
//     if (!isTouchStarted)
//       return;
//     onTouchMove?.(e);
//   }, [onTouchMove, isTouchStarted]);
//   React.useEffect(() => {
//     document.addEventListener("touchend", handleDocumentTouchEnd);
//     document.addEventListener("touchmove", handleDocumentTouchMove);
//     return () => {
//       document.removeEventListener("touchend", handleDocumentTouchEnd);
//       document.removeEventListener("touchmove", handleDocumentTouchMove);
//     };
//   }, [handleDocumentTouchEnd, handleDocumentTouchMove]);
//   const fullClassName = classnames(
//     "nz-base-pointerCaptor",
//     isTouchStarted && "nz-captured",
//     className);
//   return (
//     <div
//       className={fullClassName}
//       onTouchStart={handleTouchStart}
//       style={props.style}
//       role="presentation"
//     >
//       <div className="nz-overlay" />
//       {children}
//     </div>
//   );
// }

interface TouchDragHandleState {
  isPointerDown: boolean;
}

// @todo AppUI deprecation
// eslint-disable-next-line @typescript-eslint/no-deprecated
interface TouchDragHandleProps extends CommonProps {
  /** Last pointer position of draggable tab. */
  lastPosition?: XAndY;
  /** Function called when component is dragged. */
  onDrag?: (dragged: XAndY) => void;
  /** Function called when component drag is started.
   * @param initialPosition Initial pointer position in window coordinates.
   */
  onDragStart?: (initialPosition: XAndY) => void;
  /** Function called when component drag is finished. */
  onDragEnd?: () => void;
  /** Children to render. */
  children?: React.ReactNode;
}

// A copy of the DragHandle class that uses TouchCaptor instead of PointerCaptor and only allows single touches during drags.
class TouchDragHandle extends React.PureComponent<TouchDragHandleProps, TouchDragHandleState> {
  private _initial: XAndY | undefined = undefined;
  // private _isDragged = false;

  public override readonly state: TouchDragHandleState = {
    isPointerDown: false,
  };

  public override render() {
    const { style, children, className, lastPosition } = this.props;
    return (
      <TouchCaptor
        className={className}
        isTouchStarted={lastPosition === undefined ? this.state.isPointerDown : true}
        // onClick={this._handleClick}
        onTouchStart={this._handlePointerDown}
        onTouchEnd={this._handlePointerUp}
        onTouchMove={this._handlePointerMove}
        style={style}
      >
        {children}
      </TouchCaptor>
    );
  }

  private _handlePointerDown = (e: TouchEvent) => {
    // if (e.target instanceof Element) {
    //   e.target.releasePointerCapture(e.pointerId);
    // }

    if (e.touches.length !== 1)
      return;
    this.setState({ isPointerDown: true });

    e.preventDefault();
    // this._isDragged = false;
    const touch = e.touches[0];

    this._initial = {x: touch.clientX, y: touch.clientY};
  };

  private _handlePointerMove = (e: TouchEvent) => {
    if (e.touches.length !== 1)
      return;
    const touch = e.touches[0];
    const current = new Point2d(touch.clientX, touch.clientY);
    if (this.props.lastPosition) {
      const dragged = current.minus(this.props.lastPosition);
      this.props.onDrag?.(dragged);
      return;
    }

    if (this._initial && current.distance(this._initial) >= 6) {
      // this._isDragged = true;
      this.props.onDragStart?.(this._initial);
    }
  };

  private _handlePointerUp = () => {
    this.setState({ isPointerDown: false });
    this._initial = undefined;
    if (this.props.lastPosition) {
      this.props.onDragEnd?.();
      return;
    }
  };

  // private _handleClick = () => {
  //   if (this._isDragged)
  //     return;
  //   this.props.onClick?.();
  // }
}

// @todo Use the functional version of TouchDragHandle below after sufficient testing.
// NOTE: appui now has usePointerCaptor, which also supports touches. This whole component might
// be redesigned to use that, but I don't understand usePointerCaptor enough to even know if it is
// possible. If usePointerCaptor can be used, then the TouchCaptor class above is not needed.
// // 2024-06-24: Converted to a function.
// function TouchDragHandle(props: TouchDragHandleProps) {
//   const { className, style, lastPosition, onDrag, onDragStart, onDragEnd, children } = props;
//   const [ isPointerDown, setIsPointerDown ] = React.useState(false);
//   const [ initial, setInitial ] = React.useState<XAndY>();
//   const handlePointerDown = React.useCallback((e: TouchEvent) => {
//     if (e.touches.length !== 1)
//       return;
//     setIsPointerDown(true);

//     e.preventDefault();
//     const touch = e.touches[0];

//     setInitial({x: touch.clientX, y: touch.clientY});
//   }, []);
//   const handlePointerMove = React.useCallback((e: TouchEvent) => {
//     if (e.touches.length !== 1)
//       return;
//     const touch = e.touches[0];
//     const current = new Point2d(touch.clientX, touch.clientY);
//     if (lastPosition) {
//       const dragged = current.minus(lastPosition);
//       onDrag?.(dragged);
//       return;
//     }

//     if (initial && current.distance(initial) >= 6) {
//       onDragStart?.(initial);
//     }
//   }, [lastPosition, initial, onDragStart, onDrag]);
//   const handlePointerUp = React.useCallback(() => {
//     setIsPointerDown(false);
//     setInitial(undefined);
//     if (lastPosition) {
//       onDragEnd?.();
//     }
//   }, [lastPosition, onDragEnd]);
//   return (
//     <TouchCaptor
//       className={className}
//       isTouchStarted={lastPosition === undefined ? isPointerDown : true}
//       onTouchStart={handlePointerDown}
//       onTouchEnd={handlePointerUp}
//       onTouchMove={handlePointerMove}
//       style={style}
//     >
//       {children}
//     </TouchCaptor>
//   );
// }
