/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import * as React from "react";
import "./IconImage.scss";
import { Icon, IconSpec } from "@itwin/core-react";
import "@bentley/icons-generic-webfont/dist/bentley-icons-generic-webfont.css";

/**
 * Properties for {@link IconImage} component
 * @public
 */
export interface IconImageProps {
  /** Optional size, default is 24px. */
  size?: string;
  /** Optional width, default is [[size]]. */
  width?: string;
  /** Optional height, default is [[size]]. */
  height?: string;
  /** Optional font size used if [[iconSpec]] specifies a glyph from the Bentley icon font, default is [[size]]. */
  fontSize?: string;
  /** [[IconSpec]] of the icon to be shown. */
  iconSpec: IconSpec; // eslint-disable-line deprecation/deprecation
  /** Optional CSS id. */
  id?: string;
  /** Optional CSS margin. */
  margin?: string;
  /** Optional additional CSS properties. */
  style?: React.CSSProperties;
}

/**
 * A React component that wraps an {@link Icon} component from @itwin/core-react to make it easier to use.
 *
 * @public
 */
export function IconImage(props: IconImageProps) {
  const size = props.size || "24px";
  const divStyle: React.CSSProperties = {
    ...props.style,
    fontSize: props.fontSize || size,
    width: props.width || size,
    height: props.height || size,
  };
  if (props.margin !== undefined) {
    divStyle.margin = props.margin!;
  }
  return (
    <div id={props.id} className="mui-icon-image" style={divStyle}>
      {/* eslint-disable-next-line deprecation/deprecation */}
      <Icon iconSpec={props.iconSpec} />
    </div>
  );
}
