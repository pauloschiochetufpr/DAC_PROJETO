import React, { useEffect, useState, useRef } from "react";
import {
  buildClientDTO,
  updateClient,
  getPayloadFromToken,
} from "../lib/clientService";
import { MetalSurface } from "../components/MetalSurface";

export default function Perfil() {
  const [isEditing, setIsEditing] = useState(false);
  const [fieldEditing, setFieldEditing] = useState({});

  const [client, setClient] = useState({
    nome: "João Silva",
    cpf: "123.456.789-00",
    salario: 1000,
    saldo: 1000,
    limite: 0,
    email: "joao.silva@email.com",
    telefone: "(11) 99999-9999",
  });

  const [form, setForm] = useState({ ...client });

  function calcularLimiteParaSalario(salario, saldoAtual) {
    const base = salario >= 2000 ? salario / 2 : 0;
    const saldoNegativoAbs = saldoAtual < 0 ? Math.abs(saldoAtual) : 0;
    return base < saldoNegativoAbs ? saldoNegativoAbs : base;
  }

  useEffect(() => {
    setClient((c) => ({
      ...c,
      limite: calcularLimiteParaSalario(c.salario, c.saldo),
    }));
    setForm((f) => ({
      ...f,
      limite: calcularLimiteParaSalario(f.salario, f.saldo),
    }));
  }, []);

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
    setForm({ ...client });
    setIsEditing(true);
  }

  function handleFieldClick(name) {
    if (name === "cpf") return;
    if (!isEditing) return;
    setFieldEditing((s) => ({ ...s, [name]: true }));
  }

  function handleCancel() {
    setForm({ ...client });
    setIsEditing(false);
  }

  function handleSave() {
    const novo = { ...client, ...form };
    novo.limite = calcularLimiteParaSalario(novo.salario, novo.saldo);

    const payload = getPayloadFromToken() || { cpf: novo.cpf };
    const dto = buildClientDTO(payload, novo);

    updateClient(dto)
      .then((updated) => {
        setClient({ ...novo, ...(updated || {}) });
        setIsEditing(false);
        setFieldEditing({});
      })
      .catch(() => {
        setClient(novo);
        setIsEditing(false);
        setFieldEditing({});
      });
  }

  return (
    <div className="mt-56 p-6 max-w-3xl mx-auto relative flex flex-col md:flex-row gap-24">
      <div className="relative order-1 md:order-2 w-[40vw] flex flex-col items-center mx-auto">
        <div className="relative flex flex-col items-center justify-center">
          {/* WRAPPER DA LANTERNA */}
          <div className="flex flex-col items-center md:w-[26vw] w-[74vw]">
            {/* Top cap */}
            <MetalSurface
              variant="top"
              className="absolute md:w-[20vw] w-[60vw] h-10 rounded-t-xl z-[100]"
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
                <div className="relative z-10 p-4 pt-6 flex flex-col">
                  {/* CAMPOS NORMAIS */}
                  {[
                    { key: "nome", label: "Nome" },
                    { key: "cpf", label: "CPF", alwaysDisabled: true },
                    { key: "email", label: "E-mail" },
                    { key: "telefone", label: "Telefone" },
                    { key: "saldo", label: "Saldo Atual (R$)" },
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
                      py-3 px-3
                      flex flex-col md:flex-row md:items-center md:justify-between
                      gap-2 md:gap-6
                      `}
                      >
                        {/* LABEL */}
                        <label className="text-sm font-medium text-secundary text-center md:text-left md:w-1/3">
                          {f.label}
                        </label>

                        {/* INPUT CONTAINER */}
                        <div
                          className={`
                          md:w-2/3 w-full rounded-lg px-3 py-2 transition-all duration-300
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
                                ? (form[f.key] ?? "")
                                : (client[f.key] ?? "")
                            }
                            onChange={handleChange}
                            disabled={!isFieldEditable}
                            readOnly={isReadOnly}
                            className={`
                            w-full bg-transparent outline-none text-sm text-center md:text-left
                            ${isFieldEditable ? "text-zinc-100" : "text-zinc-300"}
                            `}
                          />
                        </div>
                      </div>
                    );
                  })}

                  {/* 💰 SALÁRIO + LIMITE NA MESMA LINHA */}
                  <div className="py-3 px-3 flex flex-col md:flex-row gap-4">
                    {/* SALÁRIO */}
                    <div
                      className="flex-1 group flex flex-col md:flex-row md:items-center gap-2 md:gap-4"
                      onClick={() => handleFieldClick("salario")}
                    >
                      <label className="text-sm text-secundary text-center md:text-left md:w-1/3">
                        Salário (R$)
                      </label>

                      <div
                        className={`
                        md:w-2/3 w-full rounded-lg px-3 py-2 transition-all duration-300
                        ${
                          isEditing
                            ? "bg-white/5 border border-white/10 group-hover:border-orange-300/40 group-hover:shadow-[0_0_10px_rgba(255,120,80,0.25)]"
                            : "bg-transparent border border-transparent"
                        }
                        `}
                      >
                        <input
                          name="salario"
                          type="number"
                          step="0.01"
                          value={
                            isEditing
                              ? (form.salario ?? "")
                              : (client.salario ?? "")
                          }
                          onChange={handleChange}
                          disabled={!isEditing}
                          className="w-full bg-transparent outline-none text-sm text-center md:text-left text-zinc-100"
                        />
                      </div>
                    </div>

                    {/* LIMITE */}
                    <div className="flex-1 flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                      <label className="text-sm text-secundary text-center md:text-left md:w-1/3">
                        Limite (R$)
                      </label>

                      <div className="md:w-2/3 w-full rounded-lg px-3 py-2">
                        <input
                          type="text"
                          value={calcularLimiteParaSalario(
                            isEditing
                              ? (form.salario ?? client.salario)
                              : client.salario,
                            isEditing
                              ? (form.saldo ?? client.saldo)
                              : client.saldo,
                          ).toFixed(2)}
                          readOnly
                          disabled
                          className="w-full bg-transparent outline-none text-sm text-center md:text-left text-zinc-300"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom cap */}
          <MetalSurface
            variant="bottom"
            className="absolute md:w-[20vw] w-[60vw] h-8 rounded-b-xl z-[100]"
          >
            <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,110,70,0.45),transparent_65%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center_top,rgba(255,140,90,0.35),transparent_60%)]" />
          </MetalSurface>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex flex-col items-center z-[10]">
            {/* 🌑 CONTACT SHADOW (entre cap e botão) */}
            <ContactShadow className="relative -bottom-1 md:w-[18vw] w-[54vw] h-4 z-[90]" />
            {/* Edit/Save buttons estilizado como parte da lanterna */}
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 z-[10]">
              <div className="relative w-[48vw] sm:w-40 md:w-48 h-10 rounded-b-2xl overflow-hidden">
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
                        className="flex-1 text-green-400 text-xs md:text-sm hover:bg-white/5 transition"
                      >
                        Salvar
                      </button>

                      <div className="w-[1px] bg-white/10" />

                      <button
                        onClick={handleCancel}
                        className="flex-1 text-brand text-xs md:text-sm hover:bg-white/5 transition"
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
        className="order-2 md:order-1 w-[45rem] h-[35rem] bg-gradient-to-b from-secundaryDark to-secundary
                    shadow-lg shadow-secundaryDark/30 rounded-2xl p-2 flex flex-col z-[100]"
      >
        <div className="bg-brandDark flex-1 rounded-b-xl gap-6 p-6 flex flex-col">
          <h2 className="text-2xl font-semibold mb-4">Informações da Conta</h2>
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
