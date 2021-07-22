/*---------------------------------------------------------------------------------------------
* Copyright (c) 2020 Bentley Systems, Incorporated. All rights reserved.
*--------------------------------------------------------------------------------------------*/
import * as React from "react";
import { CommonProps, IconSpec } from "@bentley/ui-core";
import { IconSpecUtilities } from "@bentley/ui-abstract";
import { Messenger, MobileUi, NavigationButton } from ".";
import moreSvg from "./images/meatball_vertical_fill.svg?sprite";

/**
 * Style used by [[ActionSheetAction]] and [[AlertAction]].
 * @public
 */
export enum ActionStyle {
  Default = "default",
  Cancel = "cancel",
  Destructive = "destructive",
}

/**
 * Actions to take in the [[ActionSheetButton]]. Note that the callback-based version allows for the definition of the
 * actions to be delayed until the point that the [[ActionSheetButton]] is pressed, so that if the list of actions
 * changes based on other user activities, they will always be correct when the user presses the button.
 */
export type ActionSheetActions = ActionSheetAction[] | (() => ActionSheetAction[]);

/**
 * Action to take in the [[presentAlert]] function or [[ActionSheetButton]] component.
 * @public
 */
export interface AlertAction {
  /** The key for this action, which is then returned by presentAlert if this action is selected: must be unique. */
  name: string;
  /** The text to present to the user for this action. */
  title: string;
  /** The style for this action. Default is [[ActionStyle.Default]]. */
  style?: ActionStyle;
}

/**
 * Action to take in the [[ActionSheetButton]] component.
 * @public
 */
export interface ActionSheetAction extends AlertAction {
  /** Callback called when this action is selected by the user. */
  onSelected: (action: ActionSheetAction) => void;
}

/** Properties for [[ActionSheeButton]]
 * @public
 */
export interface ActionSheetButtonProps extends CommonProps {
  /** Optional title to show on the action sheet. */
  title?: string;
  /** Optional message to show on the action sheet. */
  message?: string;
  /** Actions to perform by the action sheet.
   * Note: If no action with an ActionStyle of Cancel is present, a default cancel action will be automatically
   * provided unless skipCancel is set to true. Note that iPads allow cancelation even if there is no cancel action,
   * but phones don't. Consequently, not allowing cancel on phones should be extremely rare.
   */
  actions: ActionSheetActions;
  /** If set to true, prevents the default Cancel action from being added, default is false. */
  skipCancel?: boolean;
  /** The icon to show on the [[ActionSheetButton]], default is three vertical dots. */
  iconSpec?: IconSpec;
  /** The size of the [[ActionSheetButton]], default is "42px". */
  size?: string;
  /** The width of the [[ActionSheetButton]], default is size if specified, "42px" otherwise. */
  width?: string;
  /** The height of the [[ActionSheetButton]], default is size if specified, "42px" otherwise. */
  height?: string;
  /** The icon size of the [[ActionSheetButton]] icon, default is "24px". */
  iconSize?: string;
}

/**
 * @internal
 */
interface AlertControllerActions {
  [name: string]: ActionSheetAction;
}

/**
 * Navigation button that shows an Action Sheet when pressed.
 * Note: The action sheet functionality can be used from a different React component by utilizing the public static
 * registerActions, unregisterActions, and nextSenderId functions.
 * @public
 */
export class ActionSheetButton extends React.Component<ActionSheetButtonProps> {
  private static _nextSenderId = 0;
  private static _haveListener = false;
  private static _actions: { [key: number]: any } = {};
  private static _waiting: { [key: number]: boolean } = {};
  private _senderId: number;
  constructor(props: ActionSheetButtonProps) {
    super(props);
    this._senderId = ActionSheetButton.nextSenderId;
  }

  /**
   * Registers the specified actions with the Messenger system so that when they are triggered, they
   * will be sent to the proper receiver.
   * @param senderId The senderId for the component registering actions.
   * @param actions Actions to register.
   */
  public static registerActions(senderId: number, actions: ActionSheetAction[]) {
    const controllerActions: AlertControllerActions = {};
    for (const action of actions) {
      controllerActions[action.name] = action;
    }
    ActionSheetButton._actions[senderId] = controllerActions;
  }

  /**
   * Unregisters all actions for the specified sender.
   * @param senderId The senderId for the component unregistering actions.
   */
  public static unregisterActions(senderId: number) {
    delete this._actions[senderId];
  }

  /**
   * The next available senderId for sending actions. Call this once for each instance of a component, and then
   * use the value.
   */
  public static get nextSenderId() {
    this.initListener();
    return ++this._nextSenderId;
  }

  private static initListener() {
    if (this._haveListener) return;
    // Note: one global (static member variable) handler for actionSheetAction.
    Messenger.onQuery("Bentley_WMU_actionSheetAction").setHandler(this._onActionSheetAction);
    this._haveListener = true;
  }

  private static _onActionSheetAction = async (args: { senderId: number, name: number }) => {
    const { senderId, name } = args;
    const actions = ActionSheetButton._actions[senderId];
    if (!actions) return;
    const action = actions[name];
    if (!action) return;
    action.onSelected(action);
  }

  public override componentWillUnmount() {
    ActionSheetButton.unregisterActions(this._senderId);
  }

  public static onClick = async (senderId: number, props: ActionSheetButtonProps, source: React.MouseEvent | DOMRect) => {
    const waiting = ActionSheetButton._waiting[senderId] ?? false;
    // Ignore clicks while we are waiting for a previous one to be processed.
    if (waiting) {
      return;
    }
    ActionSheetButton._waiting[senderId] = true;
    const { message, title, actions: propsActions, skipCancel = false } = props;
    const actions = typeof propsActions === "function" ? propsActions() : propsActions;
    ActionSheetButton.registerActions(senderId, actions);
    const messageData = {
      senderId,
      title,
      message,
      style: "actionSheet",
      sourceRect: "currentTarget" in source ? source.currentTarget.getBoundingClientRect() : source,
      actions: [...actions],
    };
    let needCancel = !skipCancel;
    for (const action of messageData.actions) {
      if (!action.style) {
        action.style = ActionStyle.Default;
      } else if (action.style === ActionStyle.Cancel) {
        needCancel = false;
      }
    }
    if (needCancel) {
      messageData.actions.push({
        name: "mui_cancel",
        title: MobileUi.translate("general.cancel"),
        style: ActionStyle.Cancel,
        onSelected: () => { },
      });
    }
    await Messenger.query("Bentley_WMU_presentActionSheet", messageData);
    ActionSheetButton._waiting[senderId] = false;
  }

  public override render() {
    const { iconSpec, size, width, height, iconSize } = this.props;
    const onClick = async (e: React.MouseEvent) => {
      return ActionSheetButton.onClick(this._senderId, this.props, e);
    };
    return (
      <NavigationButton
        className={this.props.className}
        style={this.props.style}
        onClick={onClick}
        strokeWidth="1px"
        size={size}
        width={width}
        height={height}
        iconSpec={iconSpec || IconSpecUtilities.createSvgIconSpec(moreSvg)}
        iconSize={iconSize}
      />
    );
  }
}
