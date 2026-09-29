'use server';

// Categorias de la Guia del Paciente creadas por el medico.
//
// Son GLOBALES: una vez creada, la categoria aparece en la Guia de todos los
// pacientes. Es lo que el medico espera al "crear una categoria"; tener que
// recrearla paciente a paciente no tendria sentido.
//
// Los ITEMS dentro de ellas siguen siendo por guia, con el mecanismo de
// "Anadir nuevo producto" que ya persiste su nombre. Una categoria global con
// productos distintos por paciente es justo el caso de uso.

import { prisma } from '@/lib/db';
import { requireSession } from '@/lib/auth-guards';
import { revalidatePath } from 'next/cache';
import { normalizarTituloCategoria, validarTituloCategoria } from '@/lib/guide/category-rules';

export interface CategoriaPersonalizada {
  id: string;
  title: string;
  orden: number;
}

export interface RespuestaCategoria {
  success: boolean;
  error?: string;
  categoria?: CategoriaPersonalizada;
}

/**
 * Categorias vigentes, en el orden en que deben aparecer.
 *
 * Las archivadas se excluyen: dejan de ofrecerse para guias nuevas, pero sus
 * items siguen pudiendose pintar en las guias que ya los tenian.
 */
export async function listarCategoriasPersonalizadas(): Promise<CategoriaPersonalizada[]> {
  try {
    await requireSession();
  } catch {
    // Sin sesion no se filtra el catalogo del consultorio.
    return [];
  }

  const filas = await prisma.guideCustomCategory.findMany({
    where: { archivada: false },
    orderBy: [{ orden: 'asc' }, { createdAt: 'asc' }],
    select: { id: true, title: true, orden: true },
  });
  return filas;
}

/** Crea una categoria. El titulo es unico: dos iguales serian indistinguibles en pantalla. */
export async function crearCategoriaPersonalizada(
  tituloCrudo: string
): Promise<RespuestaCategoria> {
  let userId: string;
  try {
    const { session } = await requireSession();
    userId = session.user.id;
  } catch {
    return { success: false, error: 'No autorizado.' };
  }

  const titulo = normalizarTituloCategoria(tituloCrudo);
  const problema = validarTituloCategoria(titulo);
  if (problema) return { success: false, error: problema };

  try {
    const creada = await prisma.guideCustomCategory.create({
      data: { title: titulo, createdById: userId },
      select: { id: true, title: true, orden: true },
    });
    revalidatePath('/historias');
    return { success: true, categoria: creada };
  } catch (error) {
    // El unico indice unico de la tabla es el titulo, asi que una colision solo
    // puede venir de ahi. Se traduce a un mensaje que el medico entienda.
    if ((error as { code?: string }).code === 'P2002') {
      return { success: false, error: 'Ya existe una categoría con ese nombre.' };
    }
    console.error('[guia] fallo creando categoria:', (error as Error).message);
    return { success: false, error: 'No se pudo crear la categoría.' };
  }
}

/**
 * Archiva una categoria. NO la borra.
 *
 * Borrarla dejaria sin sitio a los items de guias ya emitidas que apuntan a
 * ella, que es exactamente el problema que hubo con Terapia BioNeural.
 */
export async function archivarCategoriaPersonalizada(
  categoriaId: string
): Promise<RespuestaCategoria> {
  try {
    await requireSession();
  } catch {
    return { success: false, error: 'No autorizado.' };
  }

  if (!categoriaId?.trim()) return { success: false, error: 'Categoría no válida.' };

  try {
    await prisma.guideCustomCategory.update({
      where: { id: categoriaId },
      data: { archivada: true },
    });
    revalidatePath('/historias');
    return { success: true };
  } catch (error) {
    console.error('[guia] fallo archivando categoria:', (error as Error).message);
    return { success: false, error: 'No se pudo archivar la categoría.' };
  }
}
