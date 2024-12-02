import React from "react";
import { Modal, Platform, Text, TouchableOpacity, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { AppContext, AppContextType } from "#/contexts/AppContext";

export default function AppProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [image, setImage] = React.useState<ImagePicker.ImagePickerAsset | null>(
    null
  );
  const [error, setError] = React.useState<Error | null>(null);

  const [modalVisible, setModalVisible] = React.useState(false);
  const [modalContent, setModalContent] =
    React.useState<React.ReactNode | null>(null);
  const [modalTitle, setModalTitle] = React.useState<string | null>(null);
  const [modalActions, setModalActions] = React.useState<Array<
    React.ReactElement<typeof TouchableOpacity>
  > | null>(null);
  const modalOnClose = React.useRef<(() => void) | null>(null);
  const modalPromiseRef = React.useRef<Promise<boolean> | null>(null);

  const [cameraPermissionStatus, requestCameraPermissions] =
    ImagePicker.useCameraPermissions();
  const [mediaLibraryPermissionStatus, requestMediaLibraryPermissions] =
    ImagePicker.useMediaLibraryPermissions();

  const permissions = React.useRef<{
    camera: boolean;
    mediaLibrary: boolean;
  }>({
    camera: cameraPermissionStatus?.status === "granted",
    mediaLibrary: mediaLibraryPermissionStatus?.status === "granted",
  });

  React.useEffect(() => {
    (async () => {
      if (Platform.OS === "ios") {
        // only iOS requires camera permission
        if (!permissions.current.camera) {
          permissions.current.camera =
            cameraPermissionStatus?.status === "granted";
        }
        if (!permissions.current.camera) {
          const permissionPromise = await requestCameraPermissions();
          permissions.current.camera = permissionPromise.status === "granted";
        }
      }
      // all implemented platforms require mediaLibrary permission
      if (!permissions.current.mediaLibrary) {
        permissions.current.mediaLibrary =
          mediaLibraryPermissionStatus?.status === "granted";
      }
      if (!permissions.current.mediaLibrary) {
        const permissionPromise = await requestMediaLibraryPermissions();
        permissions.current.mediaLibrary =
          permissionPromise.status === "granted";
      }
      if (
        (Platform.OS === "ios" && !permissions.current.camera) ||
        !permissions.current.mediaLibrary
      ) {
        setError(
          new Error("Sorry, we need these permissions to make this work!")
        );
      }
    })();
  }, [
    cameraPermissionStatus,
    mediaLibraryPermissionStatus,
    requestCameraPermissions,
    requestMediaLibraryPermissions,
  ]);

  const handleImagePicked = React.useCallback(
    async (pickerResult: ImagePicker.ImagePickerResult) => {
      try {
        if (pickerResult.canceled) {
          setError(new Error("User cancelled image selection"));
          return;
        } else {
          console.log("image picked", pickerResult.assets[0]);
          setImage(pickerResult.assets[0]);
          return pickerResult.assets[0];
        }
      } catch (e) {
        console.error(e);
        setError(e as Error);
      }
    },
    [setImage, setError]
  );

  const takePhoto = React.useCallback(async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      aspect: [4, 3],
    });

    return await handleImagePicked(result);
  }, [handleImagePicked]);

  const pickImage = React.useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      aspect: [4, 3],
      quality: 1,
    });
    return await handleImagePicked(result);
  }, [handleImagePicked]);

  const hideModal = React.useCallback(() => {
    setModalVisible(false);
    modalOnClose.current?.();
  }, []);

  const showModal = React.useCallback(
    async (
      title: string,
      content: React.ReactNode,
      actions: Array<React.ReactElement<typeof TouchableOpacity>>
    ) => {
      modalPromiseRef.current = new Promise((resolve) => {
        modalOnClose.current = () => resolve(true);
      });
      if (title !== "") {
        setModalTitle(title);
      }
      if (content !== null) {
        setModalContent(content);
      }
      if (actions !== null) {
        const _actions = React.Children.map(
          actions,
          (action: React.ReactElement) => {
            return (
              action && (
                <TouchableOpacity
                  onPress={() => {
                    action.props.onPress?.();
                    hideModal();
                  }}
                >
                  {action.props.children}
                </TouchableOpacity>
              )
            );
          }
        );
        setModalActions(_actions);
      }
      setModalVisible(true);
      return await modalPromiseRef.current;
    },
    [hideModal]
  );

  const value = {
    takePhoto,
    pickImage,
    image,
    error,
    showModal,
    hideModal,
  } as AppContextType;

  return (
    <AppContext.Provider value={value}>
      <>
        <Modal
          visible={modalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={hideModal}
        >
          <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }} />
          <View style={{ flex: 1, backgroundColor: "white" }}>
            {modalTitle && <Text>{modalTitle}</Text>}
            {typeof modalContent === "string" ? (
              <Text>{modalContent}</Text>
            ) : (
              modalContent
            )}
            {modalActions && (
              <View style={{ flexDirection: "row", gap: 10 }}>
                {modalActions}
              </View>
            )}
          </View>
        </Modal>
        {children}
      </>
    </AppContext.Provider>
  );
}
