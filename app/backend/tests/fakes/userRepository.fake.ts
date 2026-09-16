import type { User } from '@prisma/client'
import type { CreateUserData, IUserRepository } from '@/interfaces/user.repository.interface'

export type SeedUser = {
  id?: number
  username: string
  email: string
  /** Ya hasheada: el repositorio real solo persiste lo que recibe. */
  password: string
  createdAt?: Date
}

/** Repositorio de usuarios en memoria; los ids arrancan en 1 salvo si el seed los fija. */
export class InMemoryUserRepository implements IUserRepository {
  private readonly rows = new Map<number, User>()
  private nextId = 1

  constructor(seed: SeedUser[] = []) {
    for (const [index, user] of seed.entries()) this.insert(user, index)
  }

  async findById(id: number): Promise<User | null> {
    return this.rows.get(id) ?? null
  }

  async findByEmail(email: string): Promise<User | null> {
    return [...this.rows.values()].find((row) => row.email === email) ?? null
  }

  async findByUsername(username: string): Promise<User | null> {
    return [...this.rows.values()].find((row) => row.username === username) ?? null
  }

  async create(data: CreateUserData): Promise<User> {
    return this.insert(data)
  }

  private insert(data: SeedUser, index = 0): User {
    const id = data.id ?? this.nextId
    this.nextId = Math.max(this.nextId, id) + 1
    const row: User = {
      id,
      username: data.username,
      email: data.email,
      password: data.password,
      createdAt: data.createdAt ?? new Date(`2026-01-01T00:00:${String(index).padStart(2, '0')}Z`),
    }
    this.rows.set(id, row)
    return row
  }
}
