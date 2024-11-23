export type Folder = {
  id: string;
  name: string;
};

export const schema = {
  models: {
    Folder: {
      name: "Folder",
      fields: {
        id: { type: "ID", isRequired: true },
        name: { type: "String", isRequired: true },
      },
    },
  },
};