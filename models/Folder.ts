import { Image } from "./Image";

export type Folder = {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  images: Image[];
};

export const schema = {
  models: {
    Folder: {
      name: "Folder",
      fields: {
        id: { type: "ID", isRequired: true },
        name: { type: "String", isRequired: true },
        createdAt: { type: "AWSDateTime", isRequired: true },
        updatedAt: { type: "AWSDateTime", isRequired: true },
        images: { type: "relation", isRequired: false, relationName: "FolderImages" },
      },
      syncable: true,
      pluralName: "Folders",
    },
  },
  enums: {},
  nonModels: {},
  version: "1",
};
