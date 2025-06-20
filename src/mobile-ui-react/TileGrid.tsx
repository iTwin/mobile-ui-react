/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import * as React from "react";
import classnames from "classnames";
import { CommonProps } from "@itwin/core-react";
import { useMediaQuery, useScrolling } from "./MobileUi";
import "./TileGrid.scss";

/**
 * Specifies the size of a {@link GridTile}.
 * @public
 */
export interface GridTileSize {
  /** The minimum size (in pixels) of the tile, if the tile is square */
  size?: number;
  /** The minimum width (in pixels) of the tile. Overrides size. */
  width?: number;
  /** The minimum height (in pixels) of the tile. Overrides size. */
  height?: number;
}

/**
 * Properties for {@link TileGrid} component.
 * @public
 */
// @todo AppUI deprecation
// eslint-disable-next-line @typescript-eslint/no-deprecated
export interface TileGridProps extends CommonProps {
  /** [[GridTile]] children of this node */
  children?: Array<React.ReactElement<GridTileProps>>;
  /** Content to display when children is empty */
  noChildrenContent?: React.ReactNode;
  /** The size used for each [[GridTile]] in this [[TileGrid]] on a normal sized screen. Default size is 160. */
  normalTileSize?: GridTileSize;
  /** The size used for each [[GridTile]] in this [[TileGrid]] on a small sized screen (width or height < 400). Default size is 140. */
  smallTileSize?: GridTileSize;
}

/**
 * Properties injected into a {@link GridTile} component by its parent {@link TileGrid} component.
 * Do not directly use this interface. Note: all of these properties have to be optional in order for things to work
 * right. {@link TileGrid} will always set these properties, and {@link GridTile} expects them to be set.
 * @internal
 */
export interface GridTileInjectedProps {
  /** The minimum width (in pixels) used for the [[GridTile]]. */
  width?: number;
  /** The minimum height (in pixels) used for the [[GridTile]]. */
  height?: number;
}

/**
 * Properties for {@link GridTile} component.
 * @public
 */
// @todo AppUI deprecation
// eslint-disable-next-line @typescript-eslint/no-deprecated
export interface GridTileProps extends CommonProps {
  /** onClick handler for this GridTile. */
  onClick?: (e: React.MouseEvent) => void;
  /** Children of this node */
  children?: React.ReactNode;
}

/**
 * Takes a {@link GridTileSize} with optional values and returns a new one with all values populated.
 * @param tileSize Input {@link GridTileSize} with optional values.
 * @param defaultSize Default value to use for all undefined properties.
 * @returns A {@link GridTileSize} object with all values set based on the input and defaultSize.
 * @internal
 */
function fillTileSize(tileSize: GridTileSize | undefined, defaultSize: number) {
  const actualDefaultSize = tileSize?.size ?? defaultSize;
  const { size = defaultSize, width = actualDefaultSize, height = actualDefaultSize } = tileSize ?? {};
  return { size, width, height };
}

/**
 * A React component that displays a grid of tiles, where all tiles are the same size, and have a fixed aspect ratio.
 * @public
 */
export function TileGrid(props: TileGridProps) {
  const divRef = React.useRef<HTMLDivElement>(null);
  const scrolling = useScrolling(divRef.current);
  const normalScreen = useMediaQuery("(min-width: 400px) and (min-height: 400px)");
  const defaultSize = normalScreen ? 160 : 140;
  const tileSize = fillTileSize(normalScreen ? props.normalTileSize : props.smallTileSize, defaultSize);
  const children = props.children && React.Children.map(props.children, (child: React.ReactElement<GridTileProps>) => {
    return React.cloneElement<GridTileProps & GridTileInjectedProps>(child, {
      width: tileSize.width,
      height: tileSize.height,
    });
  });
  const gridTemplateColumns = `repeat(auto-fill, minmax(${tileSize.width}px, 1fr))`;
  return (
    <>
      <div className="mui-panel-gradient" />
      <div ref={divRef} className="mui-tile-grid-scroll-container">
        {children && children.length ?
          <div
            className={classnames("mui-tile-grid", scrolling && "scrolling", props.className)}
            style={{
              display: "grid",
              gridTemplateColumns,
              ...props.style,
            }}
          >{children}</div> : props.noChildrenContent}
      </div>
    </>
  );
}

/**
 * A React component that is an individual tile in a {@link TileGrid}.
 * @public
 */
export function GridTile(props: GridTileProps & GridTileInjectedProps) {
  const { width, height } = props;
  const aspect = `${(height / width * 100).toString()  }%`;
  return (
    <div className="mui-grid-tile-container" style={{ paddingTop: aspect, ...props.style }}>
      <div
        className={classnames("mui-grid-tile", props.className)}
        style={{ minWidth: width, minHeight: height }}
        onClick={(e: React.MouseEvent) => {
          e.stopPropagation();
          props.onClick && props.onClick(e);
        }}
      >
        {props.children}
      </div>
      <div className="mui-grid-tile-border" onClick={props.onClick} />
    </div>
  );
}
