import React from "react";
import {
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { AppContext, AppContextType } from "#/contexts/AppContext";

const MODAL_TYPES = {
  default: "default",
  info: "info",
  warning: "warning",
  error: "error",
} as const;

type ModalType = (typeof MODAL_TYPES)[keyof typeof MODAL_TYPES];

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
  const modalTypeRef = React.useRef<ModalType>("default");

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

  const styles = useStyles(modalTypeRef.current);

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
    modalTypeRef.current = "default";
    modalOnClose.current?.();
  }, []);

  const showModal = React.useCallback(
    async (
      title: string,
      content: React.ReactNode,
      actions: Array<React.ReactElement<typeof TouchableOpacity>>,
      type: ModalType = "default"
    ) => {
      modalPromiseRef.current = new Promise((resolve) => {
        modalOnClose.current = () => resolve(true);
      });
      modalTypeRef.current = type;
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
                  style={styles.modalAction}
                  onPress={() => {
                    action.props.onPress?.();
                    hideModal();
                  }}
                >
                  {typeof action.props.children === "string" ? (
                    <Text style={styles.modalActionText}>
                      {action.props.children}
                    </Text>
                  ) : (
                    action.props.children
                  )}
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
    [hideModal, styles]
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
          onDismiss={hideModal}
          style={styles.modalBackground}
          presentationStyle="overFullScreen"
        >
          <View style={styles.modalBackground} />
          <View style={styles.modalContent}>
            {modalTitle && <Text style={styles.modalTitle}>{modalTitle}</Text>}
            {typeof modalContent === "string" ? (
              <Text style={styles.modalContentText}>{modalContent}</Text>
            ) : (
              modalContent
            )}
            {modalActions && (
              <View style={styles.modalActions}>{modalActions}</View>
            )}
          </View>
        </Modal>
        {children}
      </>
    </AppContext.Provider>
  );
}

const modalColors: Record<ModalType, string> = {
  default: "#FFFFFFFF",
  info: "#0000FF22",
  warning: "#FFFF0022",
  error: "#FF000022",
};

const useStyles = (modalType: ModalType) => {
  const backgroundColor = modalColors[modalType];
  return StyleSheet.create({
    modalBackground: {
      flex: 1,
      backgroundColor,
      justifyContent: "flex-end",
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: "600",
      textAlign: "center",
      marginBottom: 16,
      color: Platform.select({ ios: "#000", android: "#212121" }),
    },
    modalContent: {
      backgroundColor: Platform.select({ ios: "#F3F3F3", android: "white" }),
      borderTopLeftRadius: 12,
      borderTopRightRadius: 12,
      padding: 16,
      maxHeight: "80%",
      paddingBottom: 32,
    },
    modalContentText: {
      fontSize: 16,
      textAlign: "center",
      marginBottom: 24,
      color: Platform.select({ ios: "#666666", android: "#757575" }),
    },
    modalActions: {
      flexDirection: "column",
      marginHorizontal: -16,
      marginBottom: -16,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: "#CCCCCC",
    },
    modalAction: {
      paddingVertical: 16,
      alignItems: "center",
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: "#CCCCCC",
      backgroundColor: "transparent",
    },
    modalActionText: {
      color: Platform.select({ ios: "#007AFF", android: "#2196F3" }),
      fontSize: 18,
      fontWeight: "500",
    },
  });
};
