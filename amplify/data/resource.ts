import { type ClientSchema, a, defineData } from "@aws-amplify/backend";

const schema = a.schema({
  Folder: a
    .model({
      id: a.id(),
      parentFolderId: a.id(),
      parentFolder: a.belongsTo("Folder", "parentFolderId"),
      name: a.string().required(),
      createdAt: a.timestamp().default(() => Date.now()),
      updatedAt: a.timestamp().default(() => Date.now()),
      subfolders: a.hasMany("Folder", "parentFolderId"),
      images: a.hasMany("Image", "folderId"),
    })
    .authorization((allow) => [
      allow
        .guest()
        .to([
          "list",
          "get",
          "create",
          "update",
          "delete",
          "sync",
          "listen",
          "search",
        ]),
      allow
        .publicApiKey()
        .to([
          "list",
          "get",
          "create",
          "update",
          "delete",
          "sync",
          "listen",
          "search",
        ]),
    ]),

  Image: a
    .model({
      id: a.id(),
      name: a.string().required(),
      folderId: a.id().required(),
      folder: a.belongsTo("Folder", "folderId"),
      createdAt: a.timestamp().default(() => Date.now()),
      updatedAt: a.timestamp().default(() => Date.now()),
      url: a.string().required(),
      file: a.customType({
        bucket: a.string(),
        key: a.string().required(),
        region: a.string(),
      }),
    })
    .authorization((allow) => [
      allow
        .guest()
        .to([
          "list",
          "get",
          "create",
          "update",
          "delete",
          "sync",
          "listen",
          "search",
        ]),
      allow
        .publicApiKey()
        .to([
          "list",
          "get",
          "create",
          "update",
          "delete",
          "sync",
          "listen",
          "search",
        ]),
    ]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "apiKey",
    // API Key is used for a.allow.public() rules
    apiKeyAuthorizationMode: {
      expiresInDays: 30, // API key expiration in days
    },
  },
});
