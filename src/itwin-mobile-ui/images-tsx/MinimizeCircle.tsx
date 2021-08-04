import * as React from "react";

function SvgMinimizeCircle(props: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="core-icons-svgSprite" {...props}><circle cx={12} cy={12} fill="#fff" r={12} /><path d="m17.929889 8.926578-5.927253 5.939376-5.932525-5.932526" fill="none" stroke="#000" strokeLinecap="round" /></svg>;
}

const MemoSvgMinimizeCircle = React.memo(SvgMinimizeCircle);
export default MemoSvgMinimizeCircle;