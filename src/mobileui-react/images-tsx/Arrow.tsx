import * as React from "react";

function SvgArrow(props: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="core-icons-svgSprite" {...props}><g fill="none" fillRule="evenodd" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" transform="translate(2 4)"><path d="m0 8h20" /><path d="m13 1 7 7" /><path d="m13 8 7 7" transform="matrix(1 0 0 -1 0 23)" /></g></svg>;
}

const MemoSvgArrow = React.memo(SvgArrow);
export default MemoSvgArrow;