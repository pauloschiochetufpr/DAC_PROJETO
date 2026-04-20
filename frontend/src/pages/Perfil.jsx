import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useBanco } from "../hooks/useBanco";
import { MetalSurface } from "../components/MetalSurface";
import WaveSimpleRed from "../components/WaveSimpleRed";
import SecundaryBorder from "../assets/icons/SecundaryBorder.svg";
import { ArrowLeft, ArrowRight } from "lucide-react";

export default function Perfil() {
  const { client, contaInfo, atualizarPerfil, saldo } = useBanco();
  if (!client || !contaInfo) {
    return <div>Carregando...</div>;
  }

  const [isEditing, setIsEditing] = useState(false);
  const [fieldEditing, setFieldEditing] = useState({});
  const [form, setForm] = useState({});
  const [profileSection, setProfileSection] = useState("dados");

  function calcularLimiteParaSalario(salario, saldoAtual) {
    const base = salario >= 2000 ? salario / 2 : 0;
    const saldoNegativoAbs = saldoAtual < 0 ? Math.abs(saldoAtual) : 0;
    return base < saldoNegativoAbs ? saldoNegativoAbs : base;
  }

  // mantém form sincronizado com o provider
  useEffect(() => {
    if (client) {
      setForm(client);
    }
  }, [client]);

  function handleChange(e) {
    const { name, value } = e.target;

    const parsed =
      name === "salario" || name === "saldo" ? parseFloat(value || 0) : value;

    const updated = { ...form, [name]: parsed };

    if (name === "salario") {
      updated.limite = calcularLimiteParaSalario(parsed, updated.saldo);
    }

    if (name === "saldo") {
      updated.limite = calcularLimiteParaSalario(updated.salario, parsed);
    }

    setForm(updated);
  }

  function handleEdit() {
    setForm(client);
    setIsEditing(true);
  }

  function handleFieldClick(name) {
    if (name === "cpf") return;
    if (!isEditing) return;
    setFieldEditing((s) => ({ ...s, [name]: true }));
  }

  function handleCancel() {
    setForm(client);
    setIsEditing(false);
  }

  function handleSave() {
    atualizarPerfil(form).then(() => {
      setIsEditing(false);
      setFieldEditing({});
    });
  }

  return (
    <div className="mt-56 p-6 mx-auto relative flex flex-col justify-center items-center lg:items-end lg:flex-row gap-24">
      <div className="absolute -top-4 left-6 z-[50]">
        <Link to="/">
          <button
            className="
        group flex items-center gap-2
        text-secundary text-3xl md:text-4xl
        transition-all duration-200
        hover:text-orange-300 font-long-cang
      "
          >
            <ArrowLeft
              className="
          w-5 h-5 md:w-6 md:h-6 
          transition-transform duration-200
          group-hover:-translate-x-1
        "
            />
            <span>Voltar</span>
          </button>
        </Link>
      </div>
      <div className="relative order-1 lg:order-2 w-[36vw] flex flex-col items-center mx-auto lg:mx-0">
        <div className="relative flex flex-col items-center justify-center">
          {/* WRAPPER DA LANTERNA */}
          <div className="flex flex-col items-center lg:w-[26vw] w-[74vw]">
            {/* Top cap */}
            <MetalSurface
              variant="top"
              className="absolute lg:w-[20vw] w-[60vw] h-10 rounded-t-xl z-[100]"
            >
              {/* luz */}
              <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(255,110,70,0.45),transparent_65%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center_bottom,rgba(255,140,90,0.35),transparent_60%)]" />
            </MetalSurface>
          </div>

          {/* Lantern body (red) */}
          <div className="relative w-full rounded-3xl overflow-hidden z-[1]">
            {/* 1. BASE */}
            <div className="absolute inset-0 bg-brand" />

            {/* 2. GRADIENTE DE VOLUME (cilindro) */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000040,transparent_25%,transparent_75%,#00000040)]" />

            {/* 3. SUAVIZAÇÃO CENTRAL (papel mais fino no meio) */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08),transparent_70%)]" />

            {/* 4. TEXTURA (ribs da lanterna) */}
            <div className="absolute inset-0 bg-[repeating-linear-gradient(to_bottom,transparent,transparent_16px,rgba(0,0,0,0.08)_17px)]" />

            {/* 5. LEVE VARIAÇÃO VERTICAL (forma orgânica) */}
            <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.2),transparent_30%,transparent_70%,rgba(0,0,0,0.2))]" />
            <div className="bg-brand p-0 flex flex-col">
              <div className="pt-6 p-4 flex-1 flex flex-col">
                {/* SETA DIREITA → ENDEREÇO */}
                {profileSection === "dados" && (
                  <button
                    onClick={() => setProfileSection("endereco")}
                    className="
      absolute right-2 top-1/2 -translate-y-1/2 p-2
      transition-all duration-300 flex flex-row
      hover:scale-110 text-secundary
      z-20
    "
                  >
                    <span className="hidden sm:block md:block lg:hidden xl:block text-sm">
                      Endereço
                    </span>
                    <ArrowRight className="w-5 h-5 md:w-6 md:h-6" />
                  </button>
                )}

                {/* SETA ESQUERDA ← DADOS */}
                {profileSection === "endereco" && (
                  <button
                    onClick={() => setProfileSection("dados")}
                    className="
      absolute left-2 top-1/2 -translate-y-1/2 p-2
      transition-all duration-300 flex flex-row
      hover:scale-110 text-secundary
      z-20
    "
                  >
                    <ArrowLeft className="w-5 h-5 md:w-6 md:h-6" />
                    <span className="hidden sm:block md:block lg:hidden xl:block text-sm">
                      Dados
                    </span>
                  </button>
                )}
                <div className="relative z-10 p-4 pt-6 flex flex-col">
                  {profileSection === "dados" ? (
                    <>
                      {/* CAMPOS NORMAIS */}
                      {[
                        { key: "nome", label: "Nome" },
                        { key: "cpf", label: "CPF", alwaysDisabled: true },
                        { key: "email", label: "E-mail" },
                        { key: "telefone", label: "Telefone" },
                      ].map((f) => {
                        const isReadOnly = !!f.readOnly;
                        const isAlwaysDisabled = !!f.alwaysDisabled;

                        const isFieldEditable =
                          !isReadOnly && !isAlwaysDisabled && isEditing;

                        return (
                          <div
                            key={f.key}
                            onClick={() => {
                              if (!f.alwaysDisabled) handleFieldClick(f.key);
                            }}
                            className={`
                      group
                      lg:py-5 py-3 px-3
                      flex flex-col lg:flex-row lg:items-center lg:justify-between
                      gap-2 lg:gap-0 xl:gap-8
                      `}
                          >
                            {/* LABEL */}
                            <label className="text-sm sm:text-lg lg:text-sm xl:text-lg font-medium text-secundary text-center lg:text-left lg:w-1/3">
                              {f.label}
                            </label>

                            {/* INPUT CONTAINER */}
                            <div
                              className={`
                          lg:w-2/3 w-full rounded-lg px-3 lg:pl-0 py-2 transition-all duration-300
                          ${
                            isFieldEditable
                              ? "bg-white/5 border border-white/10 group-hover:border-orange-300/40 group-hover:shadow-[0_0_10px_rgba(255,120,80,0.25)]"
                              : "bg-transparent border border-transparent"
                          }
                          `}
                            >
                              <input
                                name={f.key}
                                type={f.key === "saldo" ? "number" : "text"}
                                step={f.key === "saldo" ? "0.01" : undefined}
                                value={
                                  isEditing
                                    ? (form?.[f.key] ?? "")
                                    : (client?.[f.key] ?? "")
                                }
                                onChange={handleChange}
                                disabled={!isFieldEditable}
                                readOnly={isReadOnly}
                                className={`
                            w-full bg-transparent outline-none text-sm sm:text-lg lg:text-sm xl:text-lg text-center lg:text-left
                            ${isFieldEditable ? "text-zinc-100" : "text-zinc-300"}
                            `}
                              />
                            </div>
                          </div>
                        );
                      })}

                      {/* 💰 SALÁRIO + LIMITE NA MESMA LINHA */}
                      <div className="py-3 px-3 flex flex-col xl:flex-row gap-4">
                        {/* SALÁRIO */}
                        <div
                          className="flex-1 group flex flex-col lg:flex-row lg:items-center gap-2 lg:gap-4"
                          onClick={() => handleFieldClick("salario")}
                        >
                          <label className="text-sm sm:text-lg lg:text-sm xl:text-lg text-secundary text-center lg:text-left xl:w-2/3">
                            Salário (R$)
                          </label>

                          <div
                            className={`
                        lg:w-2/3 w-full rounded-lg px-3 py-2 transition-all duration-300
                        ${
                          isEditing
                            ? "bg-white/5 border border-white/10 group-hover:border-orange-300/40 group-hover:shadow-[0_0_10px_rgba(255,120,80,0.25)]"
                            : "bg-transparent border border-transparent"
                        }
                        `}
                          >
                            <input
                              name="salario"
                              type="text"
                              inputMode="decimal"
                              value={
                                isEditing
                                  ? (form.salario ?? "").toString()
                                  : Number(client?.salario ?? 0).toFixed(2)
                              }
                              onChange={(e) => {
                                let value = e.target.value;

                                // Permite apenas números e ponto
                                value = value.replace(",", "."); // suporte BR
                                if (!/^\d*\.?\d*$/.test(value)) return;

                                setForm((prev) => ({
                                  ...prev,
                                  salario: value,
                                }));
                              }}
                              onBlur={() => {
                                // Ao sair do campo -> formata para 2 casas
                                setForm((prev) => ({
                                  ...prev,
                                  salario: Number(prev.salario || 0).toFixed(2),
                                }));
                              }}
                              disabled={!isEditing}
                              className="w-full bg-transparent outline-none text-sm sm:text-lg lg:text-sm xl:text-lg text-center lg:text-left text-zinc-100"
                            />
                          </div>
                        </div>

                        {/* LIMITE */}
                        <div className="flex-1 flex flex-col lg:flex-row lg:items-center gap-2 lg:gap-4">
                          <label className="text-sm sm:text-lg lg:text-sm xl:text-lg text-secundary text-center lg:text-left xl:w-1/3">
                            Limite (R$)
                          </label>

                          <div className="lg:w-2/3 w-full rounded-lg px-3 py-2">
                            <input
                              type="text"
                              value={calcularLimiteParaSalario(
                                isEditing
                                  ? (form.salario ?? client?.salario ?? 0)
                                  : (client?.salario ?? 0),
                                isEditing
                                  ? (form.saldo ?? client?.saldo ?? 0)
                                  : (client?.saldo ?? 0),
                              ).toFixed(2)}
                              readOnly
                              disabled
                              className="w-full bg-transparent outline-none text-sm sm:text-lg lg:text-sm xl:text-lg text-center lg:text-left text-zinc-300"
                            />
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* ================= ENDEREÇO ================= */}

                      {[
                        { key: "cep", label: "CEP" },
                        { key: "rua", label: "Rua" },
                        { key: "numero", label: "Número" },
                        { key: "bairro", label: "Bairro" },
                        { key: "cidade", label: "Cidade" },
                        { key: "estado", label: "Estado" },
                      ].map((f) => {
                        const isFieldEditable = isEditing;

                        return (
                          <div
                            key={f.key}
                            onClick={() => handleFieldClick(f.key)}
                            className="
              group
              lg:py-5 py-3 px-8
              flex flex-col lg:flex-row
              lg:items-center lg:justify-between
              gap-2 md:gap-8
            "
                          >
                            <label className="text-sm sm:text-lg lg:text-sm xl:text-lg font-medium text-secundary text-center lg:text-left lg:w-1/3">
                              {f.label}
                            </label>

                            <div
                              className={`
                lg:w-2/3 w-full rounded-lg px-3 py-2
                transition-all duration-300
                ${
                  isFieldEditable
                    ? "bg-white/5 border border-white/10 group-hover:border-orange-300/40"
                    : "bg-transparent border border-transparent"
                }
              `}
                            >
                              <input
                                name={f.key}
                                type="text"
                                value={
                                  isEditing
                                    ? (form?.[f.key] ?? "")
                                    : (client?.[f.key] ?? "")
                                }
                                onChange={handleChange}
                                disabled={!isFieldEditable}
                                className="
                  w-full bg-transparent outline-none
                  text-sm sm:text-lg lg:text-sm xl:text-lg text-center lg:text-left
                  text-zinc-100
                "
                              />
                            </div>
                          </div>
                        );
                      })}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom cap */}
          <MetalSurface
            variant="bottom"
            className="absolute lg:w-[20vw] w-[60vw] h-8 rounded-b-xl z-[100]"
          >
            <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,110,70,0.45),transparent_65%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center_top,rgba(255,140,90,0.35),transparent_60%)]" />
          </MetalSurface>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex flex-col items-center z-[10]">
            {/* 🌑 CONTACT SHADOW (entre cap e botão) */}
            <ContactShadow className="relative -bottom-1 lg:w-[18vw] w-[54vw] h-4 z-[90]" />
            {/* Edit/Save buttons estilizado como parte da lanterna */}
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 z-[10]">
              <div className="relative w-[48vw] sm:w-40 lg:w-48 h-10 rounded-b-2xl overflow-hidden">
                {/* 1. BASE (mais escura que o cap) */}
                <div className="absolute inset-0 bg-secundaryDark" />

                {/* 2. SOMBRA SUPERIOR (oclusão do bottom cap) */}
                <div className="absolute inset-0 bg-[linear-gradient(to_bottom,#00000090,#00000040_40%,transparent_80%)]" />

                {/* 3. VOLUME leve (forma arredondada) */}
                <div className="absolute inset-0 bg-[linear-gradient(to_top,#00000040,transparent_50%,#ffffff05)]" />

                {/* 4. REFLEXO LATERAL (luz indireta ambiente) */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.08),transparent_30%,transparent_70%,rgba(255,255,255,0.08))]" />

                {/* 5. ESCURECIMENTO DAS BORDAS */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.5),transparent_30%,transparent_70%,rgba(0,0,0,0.5))]" />

                {/* CONTEÚDO */}
                <div className="relative z-10 flex h-full">
                  {!isEditing ? (
                    <button
                      onClick={handleEdit}
                      className="flex-1 text-sm text-brand hover:bg-white/5 transition"
                    >
                      Editar
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={handleSave}
                        className="flex-1 text-green-400 text-xs lg:text-sm hover:bg-white/5 transition"
                      >
                        Salvar
                      </button>

                      <div className="w-[1px] bg-white/10" />

                      <button
                        onClick={handleCancel}
                        className="flex-1 text-brand text-xs lg:text-sm hover:bg-white/5 transition"
                      >
                        Cancelar
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div
        className="
    order-2 lg:order-1
    w-full max-w-[42rem]
    h-auto lg:h-[30rem]
    border-[0.3rem] lg:border-[0.4rem]
    border-secundaryDark
    rounded-2xl lg:rounded-[21px]
    flex flex-col z-[100]
    shadow-dourado overflow-hidden
  "
      >
        {/* HEADER */}
        <div className="relative overflow-hidden w-full h-[4rem] sm:h-[5rem] lg:h-[6rem]">
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

          <div className="absolute inset-0 flex items-center justify-center z-[20] px-2">
            <h2 className="text-xl sm:text-xl md:text-3xl lg:text-4xl font-orienta text-secundary text-center">
              Informações da Conta
            </h2>
          </div>
        </div>

        {/* CORPO */}
        <div
          className="
      relative flex-1
      bg-gradient-to-b from-brandDark/70 to-brand/60
      flex flex-col items-center justify-start
      px-4 sm:px-6 lg:px-8
      py-6 sm:py-8 lg:py-10
      gap-6 lg:gap-10
    "
        >
          <div className="absolute inset-0 bg-gradient-to-t from-transparent to-black/25 z-[11]" />
          <div className="absolute inset-0 bg-white/[0.02] z-[12]" />

          <div className="relative z-[20] w-full flex flex-col items-center gap-6 md:gap-10">
            {/* SALDO */}
            <div
              className="
          font-long-cang relative
          w-[90%] sm:w-[80%]
          h-[4rem] sm:h-[5rem]
          flex items-center justify-center
          border-y-[2px] sm:border-y-[3px]
          border-secundary
        "
            >
              <div className="absolute inset-0 bg-white/[0.05]" />
              <div className="absolute inset-0 flex">
                <div className="w-1/2 bg-gradient-to-r from-transparent to-brand/60" />
                <div className="flex-1 bg-gradient-to-l from-transparent to-brand/60" />
              </div>

              {/* bordas decorativas menores no mobile */}
              <img
                src={SecundaryBorder}
                alt=""
                className="
            absolute left-0 top-1/2
            -translate-x-[45%] -translate-y-1/2
            h-[5rem] sm:h-[7rem]
            pointer-events-none select-none
          "
              />

              <img
                src={SecundaryBorder}
                alt=""
                className="
            absolute right-0 top-1/2
            translate-x-[45%] -translate-y-1/2
            h-[5rem] sm:h-[7rem]
            scale-x-[-1]
            pointer-events-none select-none
          "
              />

              <span
                className="
            relative z-[5]
            text-3xl sm:text-5xl md:text-5xl lg:text-6xl
            text-secundary font-semibold
          "
              >
                R$ {Number(saldo ?? 0).toFixed(2)}
              </span>
            </div>

            {/* INFO GRID */}
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-6 text-center">
              {/* CONTA */}
              <div className="flex flex-col gap-1">
                <span className="text-secundary text-xl sm:text-lg md:text-2xl opacity-80">
                  Número da Conta
                </span>
                <span className="text-base sm:text-lg md:text-xl font-medium text-zinc-100 break-all">
                  {contaInfo.conta}
                </span>
              </div>

              {/* GERENTE */}
              <div className="flex flex-col gap-1">
                <span className="text-secundary text-xl sm:text-lg md:text-xl opacity-80">
                  Gerente
                </span>
                <span className="text-base sm:text-lg md:text-xl font-medium text-zinc-100">
                  {contaInfo.gerente}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ContactShadow({ className = "" }) {
  return (
    <div className={`absolute pointer-events-none ${className}`}>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.7),rgba(0,0,0,0.4)_50%,transparent_80%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,#00000080,transparent_70%)]" />
    </div>
  );
}
