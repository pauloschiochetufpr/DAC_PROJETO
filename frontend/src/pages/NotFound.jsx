import { Link } from "react-router-dom";

// SVG's
import SecundaryBorder from "../assets/icons/SecundaryBorder.svg";

export default function NotFound() {
  return (
    <div
      className=" pt-32
    text-center flex flex-col gap-8 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
    items-center justify-center"
    >
      <div className="flex flex-col gap-3">
        <h1 className="text-3xl font-semibold font-orienta">
          Página não encontrada
        </h1>

        <p className="text-lg font-istok-web font-normal text-secundary">
          Desculpe, essa rota não existe
        </p>
      </div>

      <Link
        to="/"
        className="px-12 py-2 relative border-t-4 border-b-4 font-inter font-bold text-lg
         border-secundary rounded w-fit h-[3.5rem] flex items-center justify-center
         bg-secundaryDark/10 shadow-dourado-sutil hover:shadow-secundary/60 hover:shadow-lg
         duration-300 transition-shadow ease-in"
      >
        <img
          src={SecundaryBorder}
          alt="Borda esquerda"
          className="absolute left-0 top-1/2 -translate-x-[45%] -translate-y-1/2 h-[5rem] w-auto object-contain
                          select-none pointer-events-none"
        />
        <img
          src={SecundaryBorder}
          alt="Borda direita"
          className="absolute right-0 top-1/2 translate-x-[45%] -translate-y-1/2 h-[5rem] w-auto object-contain
                          scale-x-[-1] select-none pointer-events-none"
        />
        VOLTAR
      </Link>
    </div>
  );
}
