import { v } from "convex/values";
/**
 * Handler for the remove mutation that deletes a board.
 *
 * Checks for user authorization and deletes the board with the given ID.
 *
 * Throws an error if the user is unauthorized.
 */

import { mutation, query } from "./_generated/server";

const images = [
  "/placeholders/1.svg",
  "/placeholders/2.svg",
  "/placeholders/3.svg",
  "/placeholders/4.svg",
  "/placeholders/5.svg",
  "/placeholders/6.svg",
  "/placeholders/7.svg",
  "/placeholders/8.svg",
  "/placeholders/9.svg",
  "/placeholders/10.svg",
];
/**
 * Deletes the user's favorite for the board being deleted if one exists.
 */
/**
 * Mutations for creating, removing, and updating boards.
 *
 * create: Creates a new board. Checks for user authorization and generates a random image.
 *
 * remove: Deletes a board. Checks for authorization, deletes any user favorite for the board, and deletes the board.
 *
 * update: Updates a board's title. Checks for authorization and validates the title.
 */

export const create = mutation({
  args: {
    orgId: v.string(),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Unauthorized");
    }

    const randomImage = images[Math.floor(Math.random() * images.length)];

    console.log(randomImage, "TEST");

    const board = await ctx.db.insert("boards", {
      title: args.title,
      orgId: args.orgId,
      authorId: identity.subject,
      authorName: identity.name!,
      imageUrl: randomImage,
    });

    return board;
  },
});

export const remove = mutation({
  args: { id: v.id("boards") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Unauthorized");
    }

    const userId = identity.subject;

    const existingFavorite = await ctx.db
      .query("userFavorites")
      .withIndex("by_user_board", (q) =>
        q.eq("userId", userId).eq("boardId", args.id)
      )
      .unique();

    if (existingFavorite) {
      await ctx.db.delete(existingFavorite._id);
    }

    await ctx.db.delete(args.id);
  },
});

export const update = mutation({
  args: { id: v.id("boards"), title: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Unauthorized");
    }

    const title = args.title.trim();

    if (!title) {
      throw new Error("Title is required");
    }

    if (title.length > 60) {
      throw new Error("Title cannot be longer than 60 characters");
    }

    const board = await ctx.db.patch(args.id, {
      title: args.title,
    });

    return board;
  },
});

export const favorite = mutation({
  args: { id: v.id("boards"), orgId: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Unauthorized");
    }

    const board = await ctx.db.get(args.id);

    if (!board) {
      throw new Error("Board not found");
    }

    const userId = identity.subject;

    const existingFavorite = await ctx.db
      .query("userFavorites")
      .withIndex("by_user_board", (q) => 
        q
          .eq("userId", userId)
          .eq("boardId", board._id)
      )
      .unique();

    if (existingFavorite) {
      throw new Error("Board already favorited");
    }

    await ctx.db.insert("userFavorites", {
      userId,
      boardId: board._id,
      orgId: args.orgId,
    });

    return board;
  },
});


export const unfavorite = mutation({
  args: { id: v.id("boards") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Unauthorized");
    }

    const board = await ctx.db.get(args.id);

    if (!board) {
      throw new Error("Board not found");
    }

    const userId = identity.subject;

    const existingFavorite = await ctx.db
      .query("userFavorites")
      .withIndex("by_user_board", (q) => 
        q
          .eq("userId", userId)
          .eq("boardId", board._id)
      )
      .unique();

    if (!existingFavorite) {
      throw new Error("Favorited board not found");
    }

    await ctx.db.delete(existingFavorite._id);

    return board;
  },
});

export const get = query({
  args: { id: v.id("boards") },
  handler: async (ctx, args) => {
    const board = ctx.db.get(args.id);

    return board;
  },
});

/**
 * The create mutation takes in an orgId and title as inputs. It first checks if the user is authenticated. Then it generates a random image url from a list of placeholders. It inserts a new board record into the database with the given title, orgId, and random imageUrl, along with the authorId and name from the authenticated user. The new board object is returned.

The remove mutation takes a board id as input. It checks user authentication, then deletes any favorite record for that board by the user. Finally it deletes the board record from the database.

The update mutation takes a board id and new title as inputs. It checks authentication, trims the title, validates it is not empty and under 60 chars. It then updates the board record with the new title and returns the updated board object.

The favorite mutation takes a board id and orgId as inputs. It checks authentication, validates the board exists, and checks if the user already favorited it. If not, it inserts a new userFavorite record with the userId, boardId, and orgId. It returns the favorited board object.

The unfavorite mutation takes a board id as input. It checks authentication, validates the board exists, and deletes any existing favorite record for the user and board.

In summary, these mutations allow authenticated users to perform CRUD operations on boards - creating, reading, updating, deleting, favoriting and unfavoriting. The mutations contain authorization checks and data validation. They interact with the database to insert, update, delete, and query records.
 */