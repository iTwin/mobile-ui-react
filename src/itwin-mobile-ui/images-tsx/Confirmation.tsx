import * as React from "react";

function SvgConfirmation(props: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 72 72" xmlns="http://www.w3.org/2000/svg" className="core-icons-svgSprite" {...props}><path d="m4 36 21.8294574 21 42.1705426-42" fill="none" fillRule="evenodd" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" /></svg>;
}

const MemoSvgConfirmation = React.memo(SvgConfirmation);
export default MemoSvgConfirmation;