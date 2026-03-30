import React from "react";

export default function Extrato() {
  return (
    <div
      className="bg-white h-full xl:h-[250%] w-full flex flex-col
     items-center justify-center relative"
    >
      <div className="w-[30%] h-full right-0 top-0 absolute bg-gradient-to-r from-transparent to-amber-600/50"></div>
      <div className="w-[30%] h-full left-0 top-0 absolute bg-gradient-to-l from-transparent to-amber-600/50"></div>
      <div className="w-full h-[20%] left-0 top-0 absolute bg-gradient-to-t from-transparent to-amber-600/30"></div>
      <div className="w-full h-[20%] left-0 bottom-0 absolute bg-gradient-to-b from-transparent to-amber-600/30"></div>
      <div
        className=" bg-white h-[10rem] w-[118%] absolute -top-2
                rounded-r-[70px] rounded-l-[70px] overflow-hidden"
      >
        <div className="w-[30%] h-full right-0 top-0 absolute bg-gradient-to-r from-transparent to-amber-600/60"></div>
        <div className="w-[30%] h-full left-0 top-0 absolute bg-gradient-to-l from-transparent to-amber-600/60"></div>
        <div className="w-full h-[40%] left-0 bottom-0 absolute bg-gradient-to-b from-transparent to-amber-700/40"></div>
      </div>
      <div
        className=" bg-white h-[10rem] w-[118%] absolute -bottom-2
                rounded-r-[70px] rounded-l-[70px] overflow-hidden"
      >
        <div className="w-[30%] h-full right-0 top-0 absolute bg-gradient-to-r from-transparent to-amber-600/60"></div>
        <div className="w-[30%] h-full left-0 top-0 absolute bg-gradient-to-l from-transparent to-amber-600/60"></div>
        <div className="w-full h-[40%] left-0 bottom-0 absolute bg-gradient-to-b from-transparent to-amber-700/40"></div>
      </div>
      <div className="h-[70%] w-[90%] overflow-y-scroll"></div>
    </div>
  );
}
