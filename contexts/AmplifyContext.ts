import React from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../amplify/data/resource";
import {
  CreateFolderInput,
  CreateImageInput,
  Folder,
  Image,
  ModelImageConnection,
  ModelFolderConnection,
} from "#/types";

export type AmplifyContextType = {
  // TODO: remove this once the methods are implemented, probably.
  client?: ReturnType<typeof generateClient<Schema>>;
  ready: boolean;
  error: Error | null;
  create: <T extends CreateImageInput | CreateFolderInput>(
    input: T
  ) => Promise<boolean>;
  read: <T extends Image | Folder>(id: string) => Promise<T | null>;
  update: <T extends Image | Folder>(arg0: T) => Promise<boolean>;
  delete: <T extends Image | Folder>(arg0: T) => Promise<boolean>;
  list: <T extends Image | Folder>(folderId?: string) => Promise<T extends Image ? ModelImageConnection : ModelFolderConnection>;
};

export const AmplifyContext = React.createContext<AmplifyContextType>({
  ready: false,
  client: undefined,
  error: null,
  create: async () => Promise.resolve(false),
  read: async () => Promise.resolve(null),
  update: async () => Promise.resolve(false),
  delete: async () => Promise.resolve(false),
  list: async <T>() => Promise.resolve({ list: [], nextToken: null } as T),
});

export default AmplifyContext;
