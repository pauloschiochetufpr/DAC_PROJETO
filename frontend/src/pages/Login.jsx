import { useState } from "react";
import FormLogin from "../components/login/FormLogin";
import FormCad from "../components/login/FormCad";
import templeBg from "../assets/temple.jpg";
import WaveSimpleRed from "../components/WaveSimpleRed";

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="w-screen lg:h-[calc(100vh-48px)] min-h-[calc(100vh-48px)] relative overflow-hidden p-12">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${templeBg})` }}
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Content */}
      <div className="relative z-10 flex h-full pt-44">
        {/* Right Side - Form */}
        <div className="flex w-full lg:w-1/2 justify-center items-center px-4">
          <div
            className="w-[90%] max-w-xl border-[0.4rem] border-secundaryDark rounded-[21px] 
            flex flex-col overflow-hidden shadow-dourado"
          >
            {/* Header decorado */}
            <div className="relative overflow-hidden w-full h-[3rem] md:h-[4rem]">
              <div className="absolute inset-0 bg-white/[0.05] z-[14]" />

              <div className="absolute inset-0 flex z-[13]">
                <div className="w-1/2 bg-gradient-to-r from-transparent to-white/[0.14]" />
                <div className="flex-1 bg-gradient-to-l from-transparent to-white/[0.14]" />
              </div>

              <div className="absolute inset-0 flex z-[13]">
                <div className="w-1/2 bg-gradient-to-l from-transparent to-black/[0.32]" />
                <div className="flex-1 bg-gradient-to-r from-transparent to-black/[0.32]" />
              </div>

              <div className="absolute inset-0 bg-gradient-to-t from-transparent to-black/40 z-[12]" />

              <WaveSimpleRed className="z-[10]" />

              <div className="absolute inset-0 flex items-center justify-center z-[20]">
                <h2 className="text-xl md:text-2xl font-orienta text-secundary">
                  {isLogin ? "Login" : "Cadastro"}
                </h2>
              </div>
            </div>

            {/* Corpo */}
            <div className="relative flex-1 bg-gradient-to-b from-brandDark/70 to-brand/60 flex flex-col items-center px-6 py-6">
              {/* overlays */}
              <div className="absolute inset-0 bg-gradient-to-t from-transparent to-black/25 z-[11]" />
              <div className="absolute inset-0 bg-white/[0.02] z-[12]" />

              {/* conteúdo */}
              <div className="relative z-[20] w-full flex flex-col items-center">
                {/* Toggle */}
                <div className="w-full flex mb-6 border-b border-white/10">
                  <button
                    onClick={() => setIsLogin(true)}
                    className={`flex-1 py-2 text-sm transition ${
                      isLogin
                        ? "text-secundary border-b-2 border-secundary"
                        : "text-zinc-300 hover:text-white"
                    }`}
                  >
                    Login
                  </button>

                  <button
                    onClick={() => setIsLogin(false)}
                    className={`flex-1 py-2 text-sm transition ${
                      !isLogin
                        ? "text-secundary border-b-2 border-secundary"
                        : "text-zinc-300 hover:text-white"
                    }`}
                  >
                    Cadastro
                  </button>
                </div>

                {/* Form */}
                <div className="w-full">
                  {isLogin ? <FormLogin /> : <FormCad />}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Left Side - Branding */}
        <div className="hidden lg:flex flex-col justify-center items-start w-1/2 p-16 text-white">
          <div className="bg-black/30 p-6 rounded-3xl">
            <h1 className="text-8xl font-long-cang text-secundary mb-6">
              Bem-vindo
            </h1>
            <p className="text-lg text-zinc-200 max-w-2xl">
              Acesse sua conta ou crie um novo cadastro para começar sua jornada
              junto ao nosso banco. Domine suas finanças com facilidade e
              segurança.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
