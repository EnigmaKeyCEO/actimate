import { ImagePickerAsset } from "expo-image-picker";
import React from "react";

export type AppContextType = {
  takePhoto: () => void;
  pickImage: () => Promise<ImagePickerAsset | null>;
  image: ImagePickerAsset | null;
  error: Error | null;
  showModal: (
    title: string,
    content: React.ReactNode,
    actions: React.ReactNode[]
  ) => Promise<boolean>;
  hideModal: () => void;
};

export const INITIAL_STATE: AppContextType = {
  takePhoto: () => {},
  pickImage: () => Promise.resolve(null),
  image: null,
  error: null,
  showModal: () => Promise.resolve(false),
  hideModal: () => {},
};

export const AppContext = React.createContext(INITIAL_STATE);
