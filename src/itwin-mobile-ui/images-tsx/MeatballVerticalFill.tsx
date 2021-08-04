import * as React from "react";

function SvgMeatballVerticalFill(props: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="core-icons-svgSprite" {...props}><path d="m2 14c1.1045695 0 2 .8954305 2 2s-.8954305 2-2 2-2-.8954305-2-2 .8954305-2 2-2zm0-7c1.1045695 0 2 .8954305 2 2s-.8954305 2-2 2-2-.8954305-2-2 .8954305-2 2-2zm0-7c1.1045695 0 2 .8954305 2 2s-.8954305 2-2 2-2-.8954305-2-2 .8954305-2 2-2z" fillRule="evenodd" stroke="currentColor" transform="translate(10 3)" /></svg>;
}

const MemoSvgMeatballVerticalFill = React.memo(SvgMeatballVerticalFill);
export default MemoSvgMeatballVerticalFill;