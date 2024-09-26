import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { staff } from "@/server/db/schema";

export const staffRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    const staff = await ctx.db.query.staff.findMany();
    return staff;
  }),

  create: publicProcedure
    .input(
      z.object({
        name: z.string().min(1),
        services: z.array(z.string()).min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .insert(staff)
        .values({
          name: input.name,
          services: input.services,
        })
        .onConflictDoUpdate({
          target: staff.id,
          set: { name: input.name, services: input.services },
        });
    }),

  // getLatest: publicProcedure.query(async ({ ctx }) => {
  //   const post = await ctx.db.query.posts.findFirst({
  //     orderBy: (posts, { desc }) => [desc(posts.createdAt)],
  //   });

  //   return post ?? null;
  // }),
});
