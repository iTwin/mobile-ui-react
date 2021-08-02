import * as React from "react";

function SvgCloseCircle(props: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}><g strokeLinecap="round"><circle cx={12} cy={12} fill="#fff" r={12} /><g fill="none" stroke="#000"><path d="m6.9833681 6.9833683 10.0332619 10.0332617" /><path d="m6.9833681 17.01663 10.0332619-10.0332617" /></g></g></svg>;
}

export default SvgCloseCircle;