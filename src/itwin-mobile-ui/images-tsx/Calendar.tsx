import * as React from "react";

function SvgCalendar(props: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" {...props}><defs><clipPath id="a" clipPathUnits="userSpaceOnUse"><path d="M-924-113H100v768H-924z" /></clipPath><clipPath id="b" clipPathUnits="userSpaceOnUse"><path d="M0 0h11v12H0z" /></clipPath><clipPath id="c" clipPathUnits="userSpaceOnUse"><path d="M8 11.5a.5.5 0 00.5-.5v-.5h1A1.5 1.5 0 0011 9V2A1.5 1.5 0 009.5.5h-7A1.5 1.5 0 001 2v7a1.5 1.5 0 001.5 1.5h1v.5a.5.5 0 00.41.492L4 11.5a.5.5 0 00.5-.5v-.5h3v.5a.5.5 0 00.41.492zm2-5H2V2a.5.5 0 01.5-.5h7a.5.5 0 01.5.5zm-6.5 3h-1A.5.5 0 012 9V7.5h8V9a.5.5 0 01-.5.5h-1V9a.5.5 0 00-.41-.492L8 8.5a.5.5 0 00-.5.5v.5h-3V9a.5.5 0 00-.41-.492L4 8.5a.5.5 0 00-.5.5z" /></clipPath><clipPath id="d" clipPathUnits="userSpaceOnUse"><path d="M0 0h12v12H0z" /></clipPath><clipPath id="e" clipPathUnits="userSpaceOnUse"><path d="M-5-5h21v22H-5z" /></clipPath><clipPath id="f" clipPathUnits="userSpaceOnUse"><path d="M0 0h11v12H0z" /></clipPath></defs><g clipPath="url(#a)" transform="matrix(1.33333 0 0 -1.33333 0 16)"><g clipPath="url(#b)"><g clipPath="url(#c)"><g clipPath="url(#d)"><g clipPath="url(#e)"><g clipPath="url(#f)"><path d="M-4 16.5h20v-21H-4z" /><path d="M-5 17h22V-5H-5z" /></g></g></g></g></g></g></svg>;
}

export default SvgCalendar;