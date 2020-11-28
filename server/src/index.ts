import "reflect-metadata";
import { COOKIE_NAME, __prod__ } from "./constants";
import express from "express";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import { HelloResolver } from "./resolvers/hello";
import { PostResolver } from "./resolvers/post";
import { UserResolver } from "./resolvers/user";

import Redis from "ioredis";
import session from "express-session";
import connectRedis from "connect-redis";
import { MyContext } from "./types";
import cors from "cors";
import { User } from "./entities/User";
import { createConnection } from "typeorm";
import { Post } from "./entities/Post";
import path from "path";
// rerun
const main = async () => {
  const conn = await createConnection({
    type: "postgres",
    database: "reddit",
    username: "postgres",
    password: "postgres",
    logging: true,
    synchronize: true,
    migrations: [path.join(__dirname, "./migrations/*")],
    entities: [Post, User],
  });

  await conn.runMigrations();

  //await Post.delete({});

  const app = express();
  app.use(cors({ origin: "http://localhost:3000", credentials: true }));

  const RedisStore = connectRedis(session);
  const redis = new Redis();

  app.use(
    session({
      name: COOKIE_NAME,
      store: new RedisStore({
        client: redis,
        disableTouch: true,
      }),
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 365 * 10, //10yrs
        httpOnly: true,
        secure: __prod__,
        sameSite: "lax", //csrf
      },
      saveUninitialized: false,
      secret: "iwantjoebiden",
      resave: false,
    })
  );

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [HelloResolver, PostResolver, UserResolver],
      validate: false,
    }),
    context: ({ req, res }): MyContext => ({ req, res, redis }),
  });

  apolloServer.applyMiddleware({
    app,
    cors: false,
  });

  /* const post = orm.em.create(Post, { title: "my post" });
  await orm.em.persistAndFlush(post);

  const posts = await orm.em.find(Post, {});
  console.log(posts); */

  app.listen(4000, () => console.log("server started on port 4000"));
};

main().catch((err) => {
  console.error(err);
});

console.log("ello world");
