import Link from "next/link";

// Tela "Hoje" — placeholder do marco 1.
export default function Hoje() {
  return (
    <>
      <h1>Hoje</h1>
      <section>Treino de hoje: —</section>
      <section>Treino de amanhã: —</section>
      <p>
        <Link href="/analisar">Analisar cardápio</Link>
      </p>
      <p>
        <Link href="/onboarding">Configurar perfil</Link>
      </p>
    </>
  );
}
