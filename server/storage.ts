import { type User, type InsertUser } from "@shared/schema";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;

  constructor() {
    this.users = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const { randomUUID } = await import("crypto");
    const id = randomUUID();
    const user = { ...insertUser, id } as unknown as User;
    this.users.set(id, user);
    return user;
  }
}

export const storage = new MemStorage();
