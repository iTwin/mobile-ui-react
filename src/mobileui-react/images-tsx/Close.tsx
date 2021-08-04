import * as React from "react";

function SvgClose(props: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="core-icons-svgSprite" {...props}><g fill="none" fillRule="evenodd" stroke="currentColor" strokeLinecap="round" transform="matrix(.70710678 .70710678 -.70710678 .70710678 12 .686292)"><path d="m-2 8h20" /><path d="m8-2v20" /></g></svg>;
}

const MemoSvgClose = React.memo(SvgClose);
export default MemoSvgClose;