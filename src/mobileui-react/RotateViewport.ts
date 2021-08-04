/*---------------------------------------------------------------------------------------------
* Copyright (c) 2021 Bentley Systems, Incorporated. All rights reserved.
*--------------------------------------------------------------------------------------------*/
import { Angle, AxisIndex, Geometry, Matrix3d, Vector3d } from "@bentley/geometry-core";
import { IModelApp } from "@bentley/imodeljs-frontend";
import { HitBoxX, HitBoxY, HitBoxZ, ViewportComponentEvents } from "@bentley/ui-components";
import { Face } from "@bentley/ui-core";

// NOTE: most of the code in this file was adapted from the following file in the imodeljs repository:
// ui/components/src/ui-components/navigationaids/CubeNavigationAid.tsx

interface CubeNavigationRotationMap {
  up: Face;
  down: Face;
  left: Face;
  right: Face;
}

const cubeNavigationFaceLocs: { [key: string]: Vector3d } = {
  [Face.Left]: Vector3d.create(HitBoxX.Left, HitBoxY.None, HitBoxZ.None),
  [Face.Right]: Vector3d.create(HitBoxX.Right, HitBoxY.None, HitBoxZ.None),
  [Face.Back]: Vector3d.create(HitBoxX.None, HitBoxY.Back, HitBoxZ.None),
  [Face.Front]: Vector3d.create(HitBoxX.None, HitBoxY.Front, HitBoxZ.None),
  [Face.Bottom]: Vector3d.create(HitBoxX.None, HitBoxY.None, HitBoxZ.Bottom),
  [Face.Top]: Vector3d.create(HitBoxX.None, HitBoxY.None, HitBoxZ.Top),
};

// data relating Up/Down/Left/Right directions relative to every surface
const cubeNavigationRoutes: { [key: string]: CubeNavigationRotationMap } = {
  [Face.Front]: { up: Face.Top, down: Face.Bottom, left: Face.Left, right: Face.Right },
  [Face.Back]: { up: Face.Top, down: Face.Bottom, left: Face.Right, right: Face.Left },
  [Face.Top]: { up: Face.Back, down: Face.Front, left: Face.Left, right: Face.Right },
  [Face.Bottom]: { up: Face.Front, down: Face.Back, left: Face.Left, right: Face.Right },
  [Face.Right]: { up: Face.Top, down: Face.Bottom, left: Face.Front, right: Face.Back },
  [Face.Left]: { up: Face.Top, down: Face.Bottom, left: Face.Back, right: Face.Front },
};

function faceCellToPos(face: Face, x: number, y: number) {
  const faceVect = cubeNavigationFaceLocs[face];
  const route = cubeNavigationRoutes[face];

  const faceX = x < 0 ? route.left : x > 0 ? route.right : Face.None;
  const xVect = faceX !== Face.None ? cubeNavigationFaceLocs[faceX] : Vector3d.createZero();

  const faceY = y < 0 ? route.up : y > 0 ? route.down : Face.None;
  const yVect = faceY !== Face.None ? cubeNavigationFaceLocs[faceY] : Vector3d.createZero();

  return faceVect.plus(xVect).plus(yVect);
}

function isMatrixFace(matrix: Matrix3d): boolean {
  let sum = 0;
  for (const coff of matrix.coffs) {
    if (Geometry.isAlmostEqualNumber(Math.abs(coff), 1))
      sum++;
  }
  // Assuming matrix is a proper rotation matrix:
  // if matrix viewing a face, there will be a total of 3 values either almost -1, or almost 1.
  return sum === 3;
}

/**
 * Request that the first open viewport (if there is one) rotate to the specified face, if it is not already facing
 * that way.
 * NOTE: This does not perform the actual rotation, but instead emits
 * [[ViewportComponentEvents.onCubeRotationChangeEvent]]. A handler for that event is expected to perform the actual
 * rotation. This always sets complete to true in the event. It always operates on the first open viewport, so the
 * event handler needs to also only operate on the first open viewport.
 * @param face Which Face to rotate to.
 */
export function rotateFirstViewportToFace(face: Face) {
  const vp = IModelApp.viewManager.getFirstOpenView();
  if (!vp) return;
  const endRotMatrix = vp.rotation.clone();
  const pos = faceCellToPos(face, 0, 0);
  let rotMatrix = Matrix3d.createRigidViewAxesZTowardsEye(pos.x, pos.y, pos.z).inverse();
  if (rotMatrix) {
    // if isMatrixFace and user is clicking on top/bottom, the current matrix face must be top or bottom
    if (!isMatrixFace(endRotMatrix) && (face === Face.Top || face === Face.Bottom)) {
      const angleAxis = endRotMatrix.getAxisAndAngleOfRotation();
      // istanbul ignore else
      if (angleAxis.ok) {
        const xAx = endRotMatrix.columnX();
        const a = Math.atan2(xAx.y, xAx.x);
        const r = Math.round(a * 2 / Math.PI) * Math.PI / 2; // round to quarter turn intervals
        const rot = Matrix3d.createRotationAroundAxisIndex(AxisIndex.Z, Angle.createRadians(r));
        rotMatrix = rot.multiplyMatrixMatrix(rotMatrix);
      }
    }
    if (endRotMatrix.isAlmostEqual(rotMatrix)) return;
    ViewportComponentEvents.onCubeRotationChangeEvent.emit({ rotMatrix, face, complete: true });
    vp.animateFrustumChange();
  }
}
