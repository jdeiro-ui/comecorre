"use client";

import { useActionState } from "react";
import { enviarLink, type EstadoEntrar } from "./actions";

export default function Entrar() {
  const [estado, acao, pendente] = useActionState<EstadoEntrar, FormData>(enviarLink, {});

  if (estado.enviado) {
    return (
      <>
        <h1>Confira seu e-mail</h1>
        <p>Enviamos um link de acesso. Abra-o neste mesmo navegador.</p>
      </>
    );
  }

  return (
    <>
      <h1>Entrar</h1>
      <form action={acao}>
        <label>
          E-mail
          <input name="email" type="email" required autoComplete="email" />
        </label>
        {estado.erro && <p role="alert">{estado.erro}</p>}
        <button disabled={pendente}>Receber link de acesso</button>
      </form>
    </>
  );
}
