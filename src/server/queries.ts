import "server-only";

import { db } from "./db";
import { clients, staff } from "./db/schema";

export async function createClient(name: string, services: string[]) {
  await db.insert(clients).values({
    name: name,
    services: services,
  });
}

export async function createStaff(name: string, services: string[]) {
  await db.insert(staff).values({
    name: name,
    services: services,
  });
}
