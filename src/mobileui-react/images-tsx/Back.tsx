import * as React from "react";

function SvgBack(props: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="core-icons-svgSprite" {...props}><path d="m10 0-10 10 10 10" fill="none" fillRule="evenodd" stroke="currentColor" strokeLinecap="round" transform="translate(7 2)" /></svg>;
}

const MemoSvgBack = React.memo(SvgBack);
export default MemoSvgBack;