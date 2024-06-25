/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { Point3d, SmoothTransformBetweenFrusta, Transform } from "@itwin/core-geometry";
import { Easing, Frustum, Tweens } from "@itwin/core-common";
import { SessionStateActionId, SyncUiEventDispatcher, UiFramework, UiSyncEventArgs } from "@itwin/appui-react";
import { Animator, IModelApp, ScreenViewport, ViewAnimationOptions } from "@itwin/core-frontend";

/**
 * Custom animator to animate the 8 corners of a view frustum change.
 * This class came from Keith Bentley, who dug it out of old iModelJS code.
 * @internal
 */
class InterpolateFrustumAnimator implements Animator {
  private readonly _currFrustum = new Frustum();
  private _interpolator?: SmoothTransformBetweenFrusta;
  private _tweens = new Tweens();

  private moveToFraction(fraction: number): boolean {
    const vp = this.viewport;

    // if we're done, set the final state directly
    if (fraction >= 1.0 || undefined === this._interpolator) {
      vp.setupViewFromFrustum(this.endFrustum);
      return true;
    }
    this._interpolator.fractionToWorldCorners(Math.max(fraction, 0), this._currFrustum.points);
    vp.setupViewFromFrustum(this._currFrustum);
    return false;
  }

  public constructor(public options: ViewAnimationOptions, public viewport: ScreenViewport, public startFrustum: Frustum, public endFrustum: Frustum) {
    // const duration = ScreenViewport.animation.time.normal.milliseconds;
    const duration = options.animationTime ?? ScreenViewport.animation.time.normal.milliseconds;
    this._interpolator = SmoothTransformBetweenFrusta.create(startFrustum.points, endFrustum.points);

    this._tweens.create({ fraction: 0.0 }, {
      to: { fraction: 1.0 },
      duration,
      easing: options.easingFunction ? options.easingFunction : Easing.Cubic.Out,
      start: true,
      onUpdate: (obj: any) => this.moveToFraction(obj.fraction),
    });
  }

  public animate() { return !this._tweens.update(); }
  public interrupt() { this.moveToFraction(1.0); }
}

/**
 * Class to track the current pan offset at any given time.
 */
export class PanTracker {
  private static _panTrackers: { [key: string]: PanTracker } = {};
  private _vpParentDivId: string;
  public x = 0;
  public y = 0;
  public nextX = 0;
  public nextY = 0;

  private constructor(vpParentDivId: string) {
    this._vpParentDivId = vpParentDivId;
    IModelApp.viewManager.onViewOpen.addListener(this._onViewOpen);
    IModelApp.viewManager.onViewClose.addListener(this._onViewClose);
    SyncUiEventDispatcher.onSyncUiEvent.addListener(this._onSyncUi);
  }

  public get vpParentDivId() {
    return this._vpParentDivId;
  }

  // @todo FIX Remove deprecated usage once appui-react provides a reasonable solution.
  // eslint-disable-next-line deprecation/deprecation
  private _onSyncUi = (args: UiSyncEventArgs) => {
    if (args.eventIds.has(SessionStateActionId.SetIModelConnection) && this._vpParentDivId) {
      let panTracker = PanTracker.getWithKey(this._vpParentDivId);
      const nextX = panTracker.nextX;
      const nextY = panTracker.nextY;
      panTracker.detach();
      if (UiFramework.getIModelConnection() && (nextX !== 0 || nextY !== 0)) {
        let vpFound = false;
        if (IModelApp.viewManager.getFirstOpenView()) {
          // I don't think it's possible to get here, but just in case, do the right thing.
          for (const vp of IModelApp.viewManager) {
            if (vp.parentDiv?.id === this._vpParentDivId) {
              panViewportTo(vp, nextX, nextY);
              vpFound = true;
            }
          }
        }
        if (!vpFound) {
          // It's expected that when an iModel is opened, there isn't yet a viewport for it to display into. So store
          // the nextX and nextY values in a new singleton PanTracker so that they will be applied when the viewport
          // does get opened.
          panTracker = PanTracker.getWithKey(this._vpParentDivId);
          panTracker.nextX = nextX;
          panTracker.nextY = nextY;
        }
      }
    }
  };

  private static getDivId(vpParentDiv?: HTMLDivElement) {
    return vpParentDiv ? vpParentDiv.id : "imodel-viewport";
  }

  private static getWithKey(key: string) {
    if (!this._panTrackers[key]) {
      this._panTrackers[key] = new PanTracker(key);
    }
    return this._panTrackers[key];
  }

  public static get(vp?: ScreenViewport): PanTracker {
    return this.getWithKey(this.getDivId(vp?.parentDiv));
  }

  private detach() {
    IModelApp.viewManager.onViewOpen.removeListener(this._onViewOpen);
    IModelApp.viewManager.onViewClose.removeListener(this._onViewClose);
    SyncUiEventDispatcher.onSyncUiEvent.removeListener(this._onSyncUi);
    delete PanTracker._panTrackers[this._vpParentDivId];
  }

  private _onViewOpen = (vp: ScreenViewport) => {
    if (vp.parentDiv?.id === this._vpParentDivId) {
      PanTracker.get(vp).detach();
      if (this.nextX !== 0 || this.nextY !== 0) {
        panViewportTo(vp, this.nextX, this.nextY);
      }
    }
  };

  private _onViewClose = (vp: ScreenViewport) => {
    if (vp.parentDiv?.id === this._vpParentDivId) {
      PanTracker.get(vp).detach();
    }
  };
}

/**
 * Pan the given viewport the given amount in X and Y.
 * @param vp - The {@link ScreenViewport} to pan. If undefined, the pan request will be recorded for when it eventually becomes defined.
 * @param newX - The new amount to pan in X.
 * @param newY - The new amount to pan in Y.
 * @param animationTime - The animation time in ms, default 500.
 */
export function panViewportTo(vp: ScreenViewport | undefined, newX: number, newY: number, animationTime: number = 500) {
  const panTracker = PanTracker.get(vp);
  if (!vp) {
    // Record the pan request so that once a viewport does get opened, it will be panned to the right place.
    PanTracker.get();
    panTracker.nextX = newX;
    panTracker.nextY = newY;
    return;
  }
  const x = newX - panTracker.x;
  const y = newY - panTracker.y;
  panTracker.x = newX;
  panTracker.y = newY;
  // Abort any ongoing animations before doing anything else. Otherwise, the positions we read for the "old" locations
  // can be mid-stream in an animation, and that will produce incorrect results.
  vp.setAnimator(undefined);
  if (vp.isCameraOn) {
    // Create a skewed frustum to allow a perspective view to effectively pan withouth changing the eye point.
    const frustum = vp.getFrustum().clone();
    const viewPoints = new Array<Point3d>(8);
    for (let i = 0; i < 8; ++i) {
      viewPoints[i] = vp.worldToView(frustum.points[i]);
      viewPoints[i].x += x;
      viewPoints[i].y += y;
    }
    for (let i = 0; i < 8; ++i) {
      frustum.points[i] = vp.viewToWorld(viewPoints[i]);
    }
    // The default frustum animator doesn't work for our frustum skew. The custom one below (copied from old iModelJS
    // code) works great, though.
    const lastFrustum = vp.getFrustum().clone();
    vp.setupViewFromFrustum(frustum);
    vp.setAnimator(new InterpolateFrustumAnimator({ animationTime, easingFunction: Easing.Cubic.InOut }, vp, lastFrustum, vp.getFrustum()));
  } else {
    // Since there is no perspective in orthographic mode, we just want to offset the camera by the given amount
    // (in view cooridnates).
    const oldLookAtView = vp.npcToView(new Point3d(0.5, 0.5, 0.5));
    const newLookAtView = new Point3d(oldLookAtView.x + x, oldLookAtView.y + y, oldLookAtView.z);
    const oldLookAt = vp.viewToWorld(oldLookAtView);
    const newLookAt = vp.viewToWorld(newLookAtView);
    const cameraOffset = newLookAt.minus(oldLookAt);
    const cameraOffsetTransform = Transform.createTranslation(cameraOffset);
    const frustum = vp.getFrustum().transformBy(cameraOffsetTransform);
    vp.view.setupFromFrustum(frustum);
    vp.animateFrustumChange({ animationTime, easingFunction: Easing.Cubic.InOut });
    vp.setupFromView();
  }
}
