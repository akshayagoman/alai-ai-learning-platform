import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const stateId = searchParams.get("state_id")

    if (!stateId) {
      return NextResponse.json({ error: "State ID is required" }, { status: 400 })
    }

    const { data, error } = await supabase.from("cities").select("*").eq("state_id", stateId)

    if (error) {
      console.error("Error fetching cities:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

