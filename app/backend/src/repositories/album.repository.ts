import { prisma } from '@/config/prisma'
import type {
  CreateAlbumData,
  IAlbumRepository,
  UpdateAlbumData,
} from '@/interfaces/album.repository.interface'

export class PrismaAlbumRepository implements IAlbumRepository {
  findAll() {
    return prisma.album.findMany({ orderBy: { createdAt: 'desc' } })
  }

  findById(id: number) {
    return prisma.album.findUnique({
      where: { id },
      include: { stickers: { orderBy: { number: 'asc' } } },
    })
  }

  findOwnership(id: number) {
    return prisma.album.findUnique({ where: { id }, select: { userId: true } })
  }

  create(data: CreateAlbumData) {
    return prisma.album.create({ data })
  }

  update(id: number, data: UpdateAlbumData) {
    return prisma.album.update({ where: { id }, data })
  }

  delete(id: number) {
    return prisma.album.delete({ where: { id } })
  }
}
