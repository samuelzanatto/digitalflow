import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Buscar páginas do usuário atual + páginas publicadas de outros usuários
    const pages = await prisma.salesPage.findMany({
      where: {
        OR: [
          { userId: user.id }, // Todas as páginas do usuário
          { published: true }, // Páginas publicadas de qualquer usuário
        ],
      },
      select: {
        id: true,
        title: true,
        slug: true,
        published: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ pages })
  } catch (error) {
    console.error('Erro ao buscar páginas:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar páginas' },
      { status: 500 }
    )
  }
}
