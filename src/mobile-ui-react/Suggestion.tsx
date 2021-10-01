/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import * as React from "react";
import classnames from "classnames";
import { getCssVariableAsNumber, UiEvent, useOnOutsideClick } from "@bentley/ui-core";
import { ToolAssistanceInstructions } from "@bentley/imodeljs-frontend";
import { IconImage, useUiEvent } from ".";
import "./Suggestion.scss";

/** Properties for the [[Suggestion]] component.
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

/** A React component representing an icon and a collapsible text label.
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

/** Properties for the [[ToolAssistanceSuggestion]] component.
 * @public
 */
export interface ToolAssistanceSuggestionProps {
  /** The event that is emitted when the tool assistance instructions are set. */
  onSetToolAssistance: UiEvent<ToolAssistanceInstructions | undefined>;
}

/** A React component that displays the main tool assistance instruction.
 * @public
 */
export function ToolAssistanceSuggestion(props: ToolAssistanceSuggestionProps) {
  const [mainInstruction, setMainInstruction] = React.useState("");
  const [labelVisible, setLabelVisible] = React.useState(true);

  useUiEvent((instr: ToolAssistanceInstructions | undefined) => {
    if (instr) {
      if (mainInstruction !== instr.mainInstruction.text) {
        setMainInstruction(instr.mainInstruction.text);
        setLabelVisible(true);
      }
    } else {
      setMainInstruction("");
      setLabelVisible(false);
    }
  }, props.onSetToolAssistance);

  if (!mainInstruction)
    return null;

  return <Suggestion
    label={mainInstruction}
    labelIsVisible={labelVisible}
    onClick={() => setLabelVisible(!labelVisible)}
    onOutsideClick={() => setLabelVisible(false)}
  />;
}
