/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import * as React from "react";
import { BackendError, Localization } from "@itwin/core-common";
import { getCssVariable, getCssVariableAsNumber } from "@itwin/core-react";
import { UiEvent, UiSyncEventArgs } from "@itwin/appui-abstract";
import { ColorTheme, SessionStateActionId, SyncUiEventDispatcher, SyncUiEventId, SYSTEM_PREFERRED_COLOR_THEME, UiFramework } from "@itwin/appui-react";
import { EmphasizeElements, IModelApp, IModelConnection, ScreenViewport, SelectionSet, Tool, Viewport } from "@itwin/core-frontend";
import { AuthStatus, BeEvent, BentleyError, BeUiEvent, BriefcaseStatus, Id64Set, Listener } from "@itwin/core-bentley";
import { getAllViewports, getEmphasizeElements, Messenger, MobileCore, UIError } from "@itwin/mobile-sdk-core";

import "./MobileUi.scss";

/** Type used for MobileUi.onClose BeEvent. */
export declare type CloseListener = () => void;

/** Type used for MobileUi.onColorSchemeChanged BeEvent. */
export declare type ColorSchemeChangedListener = (isDark: boolean) => void;

/** The user's preferred color scheme.
 *
 * When set to Automatic, it uses the prefers-color-scheme media value from the web view.
 */
export enum PreferredColorScheme {
  Automatic = 0,
  Light = 1,
  Dark = 2,
}

/** Class for top-level MobileUi functionality. */
export class MobileUi {
  private static _localization: Localization;
  private static _preferredColorScheme: PreferredColorScheme = JSON.parse(localStorage.getItem("ITM_PreferredColorScheme") ?? "0") as PreferredColorScheme;

  /** BeEvent raised when [[MobileUi.close]] is called. */
  public static onClose: BeEvent<CloseListener> = new BeEvent<CloseListener>();
  /** BeEvent raised when the web view's color scheme changes. */
  public static onColorSchemeChanged: BeEvent<ColorSchemeChangedListener> = new BeEvent<ColorSchemeChangedListener>();

  /** Translate a string from the MobileUi i18n namespace.
   * @param key - The key for the string to translate. For example, "general.cancel".
   * @param options - Optional options to pass into the i18next system.key
   * @returns The translated string, or key if it is not found.
   */
  public static translate(key: string, options?: any) {
    return this._localization.getLocalizedStringWithNamespace("iTwinMobileUI", key, options);
  }

  public static set preferredColorScheme(value: PreferredColorScheme) {
    MobileUi._preferredColorScheme = value;
    localStorage.setItem("ITM_PreferredColorScheme", JSON.stringify(value));
    MobileUi.colorSchemeChanged(MobileUi.activeColorSchemeIsDark);
    MobileUi.reflectColorScheme();
  }

  /** The user's preferred color scheme.
   *
   * This should be set after UiFramework is initialized if the app uses UiFramework.
   *
   * __Note__: This setting is stored in localStorage, so it is remembered from one run to the next.
   */
  public static get preferredColorScheme() {
    return MobileUi._preferredColorScheme;
  }

  /** Indicates if the active color scheme is dark.
   * @returns Whether or not the active color scheme is dark.
   */
  public static get activeColorSchemeIsDark() {
    if (MobileUi._preferredColorScheme === PreferredColorScheme.Automatic) {
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    } else {
      return MobileUi._preferredColorScheme === PreferredColorScheme.Dark;
    }
  }

  private static reflectColorScheme() {
    const isDark = MobileUi.activeColorSchemeIsDark;
    if (UiFramework.initialized) {
      UiFramework.setColorTheme(isDark ? ColorTheme.Dark : ColorTheme.Light);
      // The imodeljs UI framework relies on the "data-theme" attribute. Since the only two ColorTheme
      // values are Light and Dark, the below handles those and Automatic.
      let dataTheme: string;
      switch (MobileUi._preferredColorScheme) {
        case PreferredColorScheme.Automatic:
          dataTheme = SYSTEM_PREFERRED_COLOR_THEME;
          break;
        case PreferredColorScheme.Dark:
          dataTheme = ColorTheme.Dark;
          break;
        default:
          dataTheme = ColorTheme.Light;
          break;
      }
      document.documentElement.setAttribute("data-theme", dataTheme);
    }
    Messenger.sendMessage("Bentley_ITM_updatePreferredColorScheme", { preferredColorScheme: MobileUi._preferredColorScheme });
  }

  private static colorSchemeChanged(isDark: boolean) {
    document.documentElement.setAttribute("preferred-color-scheme", isDark ? "dark" : "light");
    MobileUi.onColorSchemeChanged.raiseEvent(isDark);
    MobileUi.reflectColorScheme();
  }

  private static _colorSchemeListener = (ev: MediaQueryListEvent) => {
    if (MobileUi._preferredColorScheme !== PreferredColorScheme.Automatic) return;
    MobileUi.colorSchemeChanged(ev.matches);
  };

  /** Initializes the MobileUi module.
   *
   * This should be done after UiFramework is initialized if the app uses UiFramework. Alternatively,
   * set preferredColorScheme after UiFramework is initialized (even if setting to the default value
   * of Automatic).
   * @param localization - The [[Localization]] object (from iModelJs).
   */
  public static async initialize(localization: Localization): Promise<void> {
    await MobileCore.initialize(localization);
    this._localization = localization;
    await localization.registerNamespace("iTwinMobileUI");
    this.setupUIError();
    try {
      window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", MobileUi._colorSchemeListener);
    } catch (e) {
      // Safari didn't support the above BASIC functionality until version 14.
      // eslint-disable-next-line deprecation/deprecation
      window.matchMedia("(prefers-color-scheme: dark)").addListener(MobileUi._colorSchemeListener);
    }
    const isDark = MobileUi.activeColorSchemeIsDark;
    document.documentElement.setAttribute("preferred-color-scheme", isDark ? "dark" : "light");
    MobileUi.reflectColorScheme();
  }

  private static setupUIError() {
    UIError.create = (error) => {
      let uiError = UIError.defaultCreate(error);
      if (!MobileCore.isInternetReachable) {
        if (error instanceof BentleyError && error.errorNumber === AuthStatus.Error) {
          uiError = new UIError();
          uiError.Message = UIError.i18n("internet-unreachable");
        }
      }
      if (error instanceof BackendError && error.errorNumber === BriefcaseStatus.DownloadCancelled) {
        uiError.WasCanceled = true;
      }
      return uiError;
    };
  }

  /** Close down the MobileUi module. Call before closing down so that cleanup can be done. */
  public static close() {
    try {
      window.matchMedia("(prefers-color-scheme: dark)").removeEventListener("change", MobileUi._colorSchemeListener);
    } catch (e) {
      // Safari didn't support the above BASIC functionality until version 14.
      // eslint-disable-next-line deprecation/deprecation
      window.matchMedia("(prefers-color-scheme: dark)").removeListener(MobileUi._colorSchemeListener);
    }
    this.onClose.raiseEvent();
  }
}

/** Custom react hook that returns the value of the specified CSS variable, and updates when the value is changed
 * using [[MobileCore.setCssVariable]] or [[MobileCore.setCssVariables]].
 * @param name - The name of the CSS variable to read.
 * @param htmlElement - The optional HTMLElement that contains the variable, defaults to document.documentElement.
 * @returns The current value of the specified variable.
 */
export function useCssVariable(name: string, htmlElement?: HTMLElement) {
  const [value, setValue] = React.useState(getCssVariable(name, htmlElement));
  useBeUiEvent((args) => {
    if (args.names.has(name) && args.htmlElement === htmlElement) {
      setValue(getCssVariable(name, htmlElement));
    }
  }, MobileCore.onCssVariableDidChange);
  return value;
}

/** Custom react hook that returns the value of the specified CSS variable as a number, and updates when the value is
 * changed using [[MobileCore.setCssVariable]] or [[MobileCore.setCssVariables]].
 * @param name - The name of the CSS variable to read.
 * @param htmlElement - The optional HTMLElement that contains the variable, defaults to document.documentElement.
 * @returns The current value of the specified variable as a number.
 */
export function useCssVariableAsNumber(name: string, htmlElement?: HTMLElement) {
  const [value, setValue] = React.useState(getCssVariableAsNumber(name, htmlElement));
  useBeUiEvent((args) => {
    if (args.names.has(name) && args.htmlElement === htmlElement) {
      setValue(getCssVariableAsNumber(name, htmlElement));
    }
  }, MobileCore.onCssVariableDidChange);
  return value;
}

/** Custom React hook that wraps React.useCallback with an empty dependencies list.
 * @param callback - The callback to pass into React.useCallback.
 * @returns The wrapped callback.
 */
export function useNoDepsCallback<T extends (...args: any[]) => any>(callback: T): T {
  return React.useCallback(callback, []); // eslint-disable-line react-hooks/exhaustive-deps
}

/** Custom React hook for calling a callback on the specified window event.
 * @param event - The event name.
 * @param callback - The function to call when the event occurs.
 */
export const useWindowEvent = (event: string, callback: EventListenerOrEventListenerObject) => {
  React.useEffect(() => {
    window.addEventListener(event, callback);
    return () => window.removeEventListener(event, callback);
  }, [event, callback]);
};

/** Custom react hook that returns a ref that indicates if the React function component is still mounted.
 * Use when a function component uses a promise or a delayed callback to verify that the component is still
 * mounted before continuing processing.
 * @returns A boolean React ref object whose current value indicates whether or not the component is still mounted.
 */
export const useIsMountedRef = () => {
  const isMountedRef = React.useRef(false);
  React.useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  return isMountedRef;
};

/**
 * Custom React hook for tracking the value of a media query.
 * @param query A media query for use with window.matchMedia().
 *   Example: (min-width: 400px)
 * @returns true if query matches; false otherwise
 */
export const useMediaQuery = (query: string) => {
  // Adapted to TypeScript from here:
  // https://medium.com/@ttennant/react-inline-styles-and-media-queries-using-a-custom-react-hook-e76fa9ec89f6
  const mediaMatch = window.matchMedia(query);
  const [matches, setMatches] = React.useState(mediaMatch.matches);

  React.useEffect(() => {
    const listener = (e: MediaQueryListEvent) => setMatches(e.matches);
    try {
      mediaMatch.addEventListener("change", listener);
      return () => mediaMatch.removeEventListener("change", listener);
    } catch (e) {
      // Safari didn't support the above BASIC functionality until version 14.
      mediaMatch.addListener(listener); // eslint-disable-line deprecation/deprecation
      return () => mediaMatch.removeListener(listener); // eslint-disable-line deprecation/deprecation
    }
  });
  return matches;
};

/**
 * Custom React hook for tracking when the specified HTMLElement scrolls.
 * @param scrollable The scrollable HTMLElement to track scrolls on; if null or undefined, callback isn't called.
 * @param callback The callback to call when scrollable scrolls.
 */
export function useScroll(scrollable: HTMLElement | undefined | null, callback: (element: HTMLElement) => void) {
  React.useLayoutEffect(() => {
    if (!scrollable) return;
    const onScroll = () => callback(scrollable);
    scrollable?.addEventListener("scroll", onScroll);
    return () => scrollable.removeEventListener("scroll", onScroll);
  }, [scrollable, callback]);
}

/**
 * Custom React hook for tracking when the specified HTMLElement is scrolling.
 * @param scrollable The scrollable HTMLElement to track scrolling on; if null or undefined, result is false.
 * @returns true while scrollable is scrolling; false otherwise
 */
export const useScrolling = (scrollable: HTMLElement | undefined | null) => {
  const [scrolling, setScrolling] = React.useState(false);

  React.useEffect(() => {
    let touching = false;
    let timer: NodeJS.Timeout | undefined;

    const scrollHandler = () => {
      if (timer) {
        clearTimeout(timer);
      }
      setScrolling(true);
      if (!touching) {
        // If not touching, the user initiated scrolling using an attached pointing device (mouse or trackpad).
        timer = setTimeout(() => setScrolling(false), 250);
      }
    };

    const touchStartHandler = () => {
      touching = true;
    };

    const touchEndHandler = (ev: TouchEvent) => {
      touching = ev.touches.length !== 0;
      if (!touching) {
        setScrolling(false);
      }
    };

    if (scrollable) {
      scrollable.addEventListener("scroll", scrollHandler);
      // these events are intentionally only for touch as drag scrolling isn't done with the mouse or trackpad
      scrollable.addEventListener("touchstart", touchStartHandler);
      scrollable.addEventListener("touchend", touchEndHandler);
    }

    return () => {
      if (scrollable) {
        scrollable.removeEventListener("scroll", scrollHandler);
        scrollable.removeEventListener("touchstart", touchStartHandler);
        scrollable.removeEventListener("touchend", touchEndHandler);
      }
    };
  }, [scrollable]);
  return scrolling;
};

function stringSetHas(set: Set<string>, values: ReadonlyArray<string>) {
  for (const value of values) {
    if (set.has(value)) {
      return true;
    }
  }
  return false;
}

/** A custom React hook function for UiSyncEvents.
 * @param handler - The callback function.
 * @param eventIds - The optional event ids to handle.
 */
export function useSyncUiEvent(handler: (args: UiSyncEventArgs) => void, ...eventIds: ReadonlyArray<string>) {
  React.useEffect(() => {
    const handleSyncUiEvent = (args: UiSyncEventArgs) => {
      if (eventIds.length === 0 || stringSetHas(args.eventIds, eventIds)) {
        handler(args);
      }
    };
    SyncUiEventDispatcher.onSyncUiEvent.addListener(handleSyncUiEvent);
    return () => {
      SyncUiEventDispatcher.onSyncUiEvent.removeListener(handleSyncUiEvent);
    };
  }, [eventIds, handler]);
}

/** A custom React hook function for BeEvents.
 * @param handler - The callback function.
 * @param event - The BeEvent to handle.
 */
export function useBeEvent<T extends Listener>(handler: T, event: BeEvent<T>) {
  React.useEffect(() => {
    event.addListener(handler);
    return () => {
      event.removeListener(handler);
    };
  }, [event, handler]);
}

/** A custom React hook function for BeUiEvents.
 * @param handler - The callback function.
 * @param event - The BeUiEvent to handle.
 */
export function useBeUiEvent<T>(handler: (args: T) => void, event: BeUiEvent<T>) {
  useBeEvent(handler, event);
}

/** A custom React hook function for UiEvents.
 * Note: UiEvent should generally be avoided, since it adds nothing to BeUiEvent.
 * @param handler - The callback function.
 * @param event - The BeUiEvent to handle.
 */
export function useUiEvent<T>(handler: (args: T) => void, event: UiEvent<T>) {
  useBeUiEvent(handler, event);
}

/** A custom React hook function for using the active tool id.
 * @param ignoreEmptyToolIds - When true, ignore tools that have an empty tool id (i.e. the idle tool). Default: true.
 */
export function useActiveToolId(ignoreEmptyToolIds: boolean = true) {
  const [activeToolId, setActiveTool] = React.useState(IModelApp.toolAdmin.activeTool?.toolId);
  useBeEvent((tool: Tool) => {
    if (!ignoreEmptyToolIds || tool.toolId)
      setActiveTool(tool.toolId);
  }, IModelApp.toolAdmin.activeToolChanged);
  return activeToolId;
}

/** A custom React hook function for handling selection set changes.
 * @param handler - The callback function.
 */
export function useSelectionSetChanged(handler: (selectionSet?: SelectionSet) => void) {
  useSyncUiEvent(() => {
    const view = IModelApp.viewManager.getFirstOpenView();
    if (view)
      handler(view.iModel.selectionSet);
    else
      handler(undefined);
  }, SyncUiEventId.SelectionSetChanged);
}

/** A custom React hook function for handling selection set count changes.
 * @param handler - The callback function.
 */
export function useSelectionSetCount(handler: (count: number) => void) {
  useSelectionSetChanged((selSet?: SelectionSet) => {
    handler(selSet?.size ?? 0);
  });
}

/** A React hook function for getting the previous value of a state or prop.
 * @param value - the current state value.
 */
export function usePrevious<T>(value: T) {
  const ref = React.useRef<T>();
  React.useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref.current;
}

/** A custom React hook function for getting the first viewport that reacts to open view changes.
 * @returns The first open viewport, or undefined when there is no viewport open.
 */
export function useFirstViewport(): ScreenViewport | undefined {
  const [firstOpenViewport, setFirstOpenViewport] = React.useState(IModelApp.viewManager.getFirstOpenView());

  React.useEffect(() => {
    const onViewOpen = (vp: ScreenViewport) => {
      if (vp === IModelApp.viewManager.getFirstOpenView()) {
        setFirstOpenViewport(vp);
      }
    };

    IModelApp.viewManager.onViewOpen.addListener(onViewOpen);
    return () => {
      IModelApp.viewManager.onViewOpen.removeListener(onViewOpen);
    };
  }, []);

  React.useEffect(() => {
    const onViewClose = (vp: ScreenViewport) => {
      if (vp === firstOpenViewport) {
        setFirstOpenViewport(undefined);
      }
    };

    IModelApp.viewManager.onViewClose.addListener(onViewClose);
    return () => {
      IModelApp.viewManager.onViewClose.removeListener(onViewClose);
    };
  }, [firstOpenViewport]);

  return firstOpenViewport;
}

/** A custom React hook function for tracking viewports.
 * @param handler - The callback function. Any time a viewport opens or closes, this is called with the new list of all
 * open viewports.
 */
export function useViewports(handler: (viewports: ScreenViewport[]) => void): ScreenViewport[] {
  React.useEffect(() => {
    const onViewOpen = () => {
      handler(getAllViewports());
    };
    const onViewClose = () => {
      handler(getAllViewports());
    };
    IModelApp.viewManager.onViewOpen.addListener(onViewOpen);
    IModelApp.viewManager.onViewClose.addListener(onViewClose);
    return () => {
      IModelApp.viewManager.onViewOpen.removeListener(onViewOpen);
      IModelApp.viewManager.onViewClose.removeListener(onViewClose);
    };
  }, [handler]);
  return getAllViewports();
}

/** A custom React hook function for handling viewport "feature overrides" changes.
 * @param handler - The callback function.
 */
export function useFeatureOverrides(handler: (alwaysDrawn: Id64Set | undefined) => void) {
  const vp = useFirstViewport();

  const featureOverridesListener = React.useCallback((listenerVp: Viewport) => {
    handler(listenerVp.alwaysDrawn);
  }, [handler]);

  React.useEffect(() => {
    vp?.onFeatureOverridesChanged.addListener(featureOverridesListener);
    return () => {
      vp?.onFeatureOverridesChanged.removeListener(featureOverridesListener);
    };
  }, [vp, featureOverridesListener]);
}

function getEmphasisCount(getElements: (vp: ScreenViewport, ee: EmphasizeElements) => Id64Set | undefined): number {
  const [vp, ee] = getEmphasizeElements();
  if (!vp || !ee) return 0;
  return getElements(vp, ee)?.size ?? 0;
}

function useEmphasisCount(getElements: (vp: ScreenViewport, ee: EmphasizeElements) => Id64Set | undefined): number {
  const [emphasisCount, setEmphasisCount] = React.useState(getEmphasisCount(getElements));

  useFeatureOverrides(React.useCallback(() => {
    setEmphasisCount(getEmphasisCount(getElements));
  }, [getElements]));

  return emphasisCount;
}

/** A custom React hook function for tracking the emphasized elements count. */
export function useEmphasizedCount(): number {
  return useEmphasisCount(React.useCallback((vp: ScreenViewport, ee: EmphasizeElements) => {
    return ee.getEmphasizedElements(vp);
  }, []));
}

/** A custom React hook function for tracking the hidden elements count. */
export function useHiddenCount(): number {
  return useEmphasisCount(React.useCallback((vp: ScreenViewport, ee: EmphasizeElements) => {
    return ee.getHiddenElements(vp);
  }, []));
}

/** A custom React hook function for tracking the isolated elements count. */
export function useIsolatedCount(): number {
  return useEmphasisCount(React.useCallback((vp: ScreenViewport, ee: EmphasizeElements) => {
    return ee.getIsolatedElements(vp);
  }, []));
}

/** A custom React hook function for tracking the UiFramework's current iModel.
 * @param handler - The callback function.
 */
export function useIModel(handler: (iModel: IModelConnection | undefined) => void) {
  useSyncUiEvent(() => {
    handler(UiFramework.getIModelConnection());
  }, SessionStateActionId.SetIModelConnection);
}

/** A custom React hook function for using an interval timer.
 * @param callback - The callback function.
 * @param delay - How often (in msec) to call the callback function, or null to stop calling it.
 */
export function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = React.useRef<() => void | null>();
  // Remember the latest callback.
  React.useEffect(() => {
    savedCallback.current = callback;
  });
  // Set up the interval.
  React.useEffect(() => {
    function tick() {
      if (typeof savedCallback?.current !== "undefined") {
        savedCallback?.current();
      }
    }
    if (delay !== null) {
      const id = setInterval(tick, delay);
      return () => clearInterval(id);
    }
    return () => { };
  }, [delay]);
}

/** Scrolls the input div horizontally to ensure the input child is visible.
 * @param scrollableDiv - div to scroll horizontally.
 * @param childIndex - Index of child to make visible.
 */
export function horizontallyScrollChildVisible(scrollableDiv: HTMLDivElement, childIndex: number) {
  if (childIndex >= 0 && childIndex < scrollableDiv.childElementCount) {
    const child = scrollableDiv.children[childIndex];
    const childRect = child.getBoundingClientRect();
    const clientWidth = scrollableDiv.clientWidth;

    if (childRect.left < 0 || childRect.right > clientWidth) {
      const tabCenter = scrollableDiv.scrollLeft + childRect.left + (childRect.width / 2);
      scrollableDiv.scrollLeft = tabCenter - (clientWidth / 2);
    }
  }
}

/** A custom React hook that ensures the child in the horizontally scrollable div is visible after window resize events.
 * @param scrollableDiv - div to scroll horizontally.
 * @param childIndex - Index of child to keep visible.
 */
export function useHorizontalScrollChildVisibleOnResize(scrollableDiv: HTMLDivElement | null | undefined, childIndex: number | undefined) {
  const handler = React.useCallback(() => {
    if (scrollableDiv && childIndex !== undefined)
      horizontallyScrollChildVisible(scrollableDiv, childIndex);
  }, [scrollableDiv, childIndex]);
  useWindowEvent("resize", handler);
}

/** A convenience type to make using React.forwardRef easier to use. */
export type MutableRefOrFunction<T> = ((instance: T | null) => void) | React.MutableRefObject<T | null> | null;

/** A convenience type to make using React.forwardRef easier to use. */
export type MutableHtmlDivRefOrFunction = MutableRefOrFunction<HTMLDivElement>;

/** A convenience type for the array returned from React.useState. */
export type ReactUseState<S> = [S, React.Dispatch<React.SetStateAction<S>>];

/** Sets the ref to the input instance based on whether the ref is a function or a mutable reference.
 * @param ref - The ref to set.
 * @param instance - The input instance.
 */
export function assignRef<T>(ref: MutableRefOrFunction<T>, instance: T | null) {
  if (ref) {
    if (typeof (ref) === "function")
      ref(instance);
    else
      ref.current = instance;
  }
}

/** Returns a function that can be used as a ref property of a React component. This is particularly useful when you need
 * to forward a ref as well as have one locally.
 * @param ref - The ref to set.
 * @param mutableRef - Optional mutable ref that is also set if provided.
 */
export function makeRefHandler<T>(ref: MutableRefOrFunction<T>, mutableRef?: React.MutableRefObject<T | null>) {
  return (instance: T | null) => {
    if (mutableRef)
      mutableRef.current = instance;
    assignRef(ref, instance);
  };
}

/** Returns a function that when called forces an update of the calling functional React component.
 * @returns - A function that when called forces an update of the calling functional React component.
 */
export function useForceUpdate() {
  const [_value, setValue] = React.useState(0); // integer state
  return () => setValue((valueParam) => valueParam + 1); // update the state to force render
}

/**
 * React hook indicating if the active color scheme is dark.
 * @returns true if the active color scheme is dark, fals otherwise.
 */
export function useActiveColorSchemeIsDark() {
  const [isDark, setIsDark] = React.useState(MobileUi.activeColorSchemeIsDark);

  useBeEvent((newIsDark) => {
    setIsDark(newIsDark);
  }, MobileUi.onColorSchemeChanged);
  return isDark;
}
