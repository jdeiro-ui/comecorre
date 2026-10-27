import { NextResponse, type NextRequest } from "next/server";
import { supabaseServidor } from "@/db/supabase";

/** Destino do link mágico: troca o código pela sessão e volta para "Hoje". */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (code) {
    const supabase = await supabaseServidor();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL("/", request.url));
  }
  return NextResponse.redirect(new URL("/entrar", request.url));
}
