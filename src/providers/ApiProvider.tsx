import React from "react";
import API from "@aws-amplify/api";
import { DocumentType } from "@aws-amplify/core/internals/utils";

type ApiContextType = {
  getSignedUrl: (input: { path: string; expires: number }) => Promise<DocumentType>;
};

const APIName = "amplify-expoexampleamplify-dev-28768";

const APIContext = React.createContext<ApiContextType>({
  getSignedUrl: async () => "",
});

const ApiProvider = ({ children }: { children: React.ReactNode }) => {
  const { get } = API;
  const getSignedUrl = async (input: { path: string; expires: number }) => {
    const { response: body } = await get({
      apiName: APIName,
      path: input.path,
    });
    // this looks weird, but it's the only way to get the signed url from the response
    if (!body) {
      throw new Error("No response body");
    }
    const innerBody = (await body).body;
    if (!innerBody) {
      throw new Error("No inner body");
    }
    const signedUrl: DocumentType = await innerBody.json();
    if (!signedUrl) {
      throw new Error("No signed url");
    }
    return signedUrl;
  };
  const value = {
    getSignedUrl,
  };
  return <APIContext.Provider value={value}>{children}</APIContext.Provider>;
};

export default ApiProvider;
