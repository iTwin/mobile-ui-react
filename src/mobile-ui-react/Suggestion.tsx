/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import * as React from "react";
import classnames from "classnames";
import { BeUiEvent } from "@itwin/core-bentley";
import { getCssVariableAsNumber, useOnOutsideClick } from "@itwin/core-react";
import { ToolAssistanceInstructions } from "@itwin/core-frontend";
import { IconImage } from "./IconImage";
import { useBeUiEvent } from "./MobileUi";
import "./Suggestion.scss";

/**
 * Properties for the {@link Suggestion} component.
 * @public
 */
export interface SuggestionProps {
  /** The label text. */
  label: string;
  /** The label text display state. */
  labelIsVisible?: boolean;
  /** Called when the component is clicked. Typically used to change the state to show/hide the label. */
  onClick?: () => void;
  /** Called when the user clicks outside the component. Typically used to hide the label. */
  onOutsideClick?: () => void;
}

/** A React component for containing a [[Suggestion]]. */
export function SuggestionContainer(props: React.HTMLAttributes<HTMLDivElement>) {
  const { className, ...others } = props;
  return <div className={classnames("mui-suggestion-container", className)} {...others} />;
}

/**
 * A React component representing an icon and a collapsible text label.
 * @public
 */
export function Suggestion(props: SuggestionProps) {
  const ref = useOnOutsideClick<HTMLDivElement>(() => props.onOutsideClick?.());
  // To ensure the icon is properly centered when the label not displayed, calculate the icon's margin so that its height and width match the pill height.
  const pillHeight = React.useRef(getCssVariableAsNumber("--mui-pill-height"));
  const iconSize = 12;
  const margin = (pillHeight.current - iconSize) / 2;

  return <div ref={ref} onClick={props.onClick} className={classnames("mui-suggestion", !props.labelIsVisible && "closed")}>
    <IconImage iconSpec="icon-help-hollow" size={`${iconSize}px`} margin={`${margin}px`} />
    {props.labelIsVisible && <div className="mui-suggestion-label">{props.label}</div>}
  </div>;
}

/**
 * Type for arguments sent to {@link ToolAssistanceSuggestion.onSetToolAssistance}.
 * @public
 */
interface OnSetToolAssistanceArgs {
  /** The new {@link ToolAssistanceInstructions}. */
  instructions?: ToolAssistanceInstructions;
}

/**
 * A React component that displays the main tool assistance instruction.
 *
 * __Note__: You must emit {@link ToolAssistanceSuggestion.onSetToolAssistance} when the tool
 * assistance changes using the appriate {@link OnSetToolAssistanceArgs}.
 * @public
 */
export function ToolAssistanceSuggestion() {
  const [mainInstruction, setMainInstruction] = React.useState("");
  const [labelVisible, setLabelVisible] = React.useState(true);

  useBeUiEvent((args: OnSetToolAssistanceArgs) => {
    if (args) {
      if (mainInstruction !== args.instructions?.mainInstruction.text) {
        setMainInstruction(args.instructions?.mainInstruction.text);
        setLabelVisible(true);
      }
    } else {
      setMainInstruction("");
      setLabelVisible(false);
    }
  }, ToolAssistanceSuggestion.onSetToolAssistance);

  if (!mainInstruction)
    return null;

  return <Suggestion
    label={mainInstruction}
    labelIsVisible={labelVisible}
    onClick={() => setLabelVisible(!labelVisible)}
    onOutsideClick={() => setLabelVisible(false)}
  />;
}

/**
 * {@link BeUiEvent} that must be emitted when tool assistance changes.
 * @public
 */
ToolAssistanceSuggestion.onSetToolAssistance = new BeUiEvent<OnSetToolAssistanceArgs>();
