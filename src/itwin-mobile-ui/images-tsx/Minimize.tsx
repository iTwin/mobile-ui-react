import * as React from "react";

function SvgMinimize(props: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="core-icons-svgSprite" {...props}><path d="m2 7 10 10 10-10" fill="none" fillRule="evenodd" stroke="currentColor" strokeLinecap="round" /></svg>;
}

const MemoSvgMinimize = React.memo(SvgMinimize);
export default MemoSvgMinimize;