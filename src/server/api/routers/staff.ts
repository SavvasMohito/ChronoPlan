import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { staff } from "@/server/db/schema";

export const staffRouter = createTRPCRouter({
  hello: publicProcedure
    .input(z.object({ text: z.string() }))
    .query(({ input }) => {
      return {
        greeting: `Hello ${input.text}`,
      };
    }),

  create: publicProcedure
    .input(
      z.object({
        name: z.string().min(1),
        services: z.array(z.string()).min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.insert(staff).values({
        name: input.name,
        services: input.services,
      });
    }),

  // getLatest: publicProcedure.query(async ({ ctx }) => {
  //   const post = await ctx.db.query.posts.findFirst({
  //     orderBy: (posts, { desc }) => [desc(posts.createdAt)],
  //   });

  //   return post ?? null;
  // }),
});
