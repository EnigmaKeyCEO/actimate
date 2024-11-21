import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import {
  View,
  StyleSheet,
  Animated,
  useWindowDimensions,
  ActivityIndicator,
} from "react-native";
import { useNavigate, useParams } from "react-router-native";
import { useTheme } from "native-base";
import { FolderActions } from "#/components/actions/FolderActions";
import { useFolders } from "#/hooks/useFolders";
import { useFiles } from "#/hooks/useFiles";
import { Folder, SortOptions } from "#/types";
import { useModal } from "#/components/Modal";
import { FolderList } from "#/components/folders/FolderList";
import { FilesList } from "#/components/files/FilesList";
import { SortHeader } from "#/components/headers/SortHeader";
import { SectionHeader } from "#/components/headers/SectionHeader";
import { LoadingIndicator } from "#/components/common/LoadingIndicator";
import { FolderModal } from "#/components/modals/FolderModal";
import * as IP from "expo-image-picker";
import { debounce } from "lodash";
import { Breadcrumb } from "#/components/Breadcrumb";

export function FolderScreen(passedProps: { folderId?: string }) {
  const { folderId = passedProps.folderId || "root" } = useParams<{
    folderId?: string;
  }>();
  const navigate = useNavigate();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const { showModal } = useModal();

  const [showFolderModal, setShowFolderModal] = useState(false);

  // Define sortOptions state
  const [sortOptions, setSortOptions] = useState<SortOptions>({
    field: "name",
    direction: "asc",
  });

  const {
    folders,
    loading: foldersLoading,
    error: foldersError,
    createFolder,
    deleteFolder,
    loadMoreFolders: doLoadMoreFolders,
    refreshFolders,
    hasMoreFolders,
    fetchSingleFolder,
  } = useFolders(folderId);

  const {
    files,
    loading: filesLoading,
    error: filesError,
    loadMoreFiles: doLoadMoreFiles,
    uploadNewFile,
    removeFile,
    sortFiles,
    hasMore: hasMoreFiles,
  } = useFiles(folderId);

  const handleFolderPress = useCallback(
    (folder: Folder) => {
      navigate(`/folder/${folder.id}`);
    },
    [navigate]
  );

  const handleCreateFolder = useCallback(
    async (folderName: Folder["name"]) => {
      try {
        await createFolder({
          name: folderName,
          parentId: folderId || "root",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        setShowFolderModal(false);
      } catch (error: any) {
        showModal(error.message, "error");
      }
    },
    [createFolder, folderId, showModal]
  );

  const handleDeleteFolder = useCallback(
    async (folderId: string) => {
      try {
        await deleteFolder(folderId);
      } catch (error: any) {
        showModal(error.message, "error");
      }
    },
    [deleteFolder, showModal]
  );

  const handleUploadFile = useCallback(async () => {
    // Implement your file upload logic here
    // Example: Launch image picker and upload selected file
    const result = await IP.launchImageLibraryAsync({
      mediaTypes: IP.MediaTypeOptions.Images,
      allowsEditing: true,
      base64: true,
    });

    if (
      !result.canceled &&
      result.assets &&
      result.assets.length > 0 &&
      result.assets[0].base64
    ) {
      const formData = new FormData();
      formData.append("file", result.assets[0].base64);
      try {
        await uploadNewFile(formData);
      } catch (error: any) {
        showModal(error.message, "error");
      }
    }
  }, [uploadNewFile, showModal]);

  // Debounced handlers to prevent rapid calls
  const handleLoadMoreFolders = useCallback(
    debounce(() => {
      if (hasMoreFolders && !foldersLoading && !foldersError) {
        doLoadMoreFolders();
      }
    }, 300),
    [hasMoreFolders, foldersLoading, foldersError, doLoadMoreFolders]
  );

  const handleLoadMoreFiles = useCallback(
    debounce(() => {
      if (hasMoreFiles && !filesLoading && !filesError) {
        doLoadMoreFiles();
      }
    }, 300),
    [hasMoreFiles, filesLoading, filesError, doLoadMoreFiles]
  );

  // Handle errors for both folders and files
  useEffect(() => {
    if (foldersError) {
      showModal(foldersError.message, "error");
    } else if (filesError) {
      showModal(filesError.message, "error");
    }
  }, [foldersError, filesError, showModal]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  useEffect(() => {
    sortFiles(sortOptions);
  }, [sortOptions, sortFiles]);

  // Fetch the breadcrumb path
  const [breadcrumbPath, setBreadcrumbPath] = useState<Folder[]>([]);

  const fetchBreadcrumb = useCallback(async () => {
    const path: Folder[] = [];
    let currentFolderId: string | undefined = folderId;

    while (currentFolderId && currentFolderId !== "root") {
      const folder = await fetchSingleFolder(currentFolderId);
      if (folder) {
        path.unshift(folder); // Add to the beginning to maintain order from root to current
        currentFolderId = folder.parentId;
      } else {
        break; // If folder not found, stop the loop
      }
    }

    // Optionally, add the root folder to the breadcrumb
    if (folderId !== "root") {
      const rootFolder: Folder = {
        id: "root",
        name: "Root",
        parentId: "",
        createdAt: "",
        updatedAt: "",
        // Add other necessary fields if required
      };
      path.unshift(rootFolder);
    }

    setBreadcrumbPath(path);
  }, [folderId, fetchSingleFolder]);

  useEffect(() => {
    fetchBreadcrumb();
  }, [fetchBreadcrumb]);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* Breadcrumb Navigation */}
      {breadcrumbPath.length > 0 && (
        <Breadcrumb
          path={breadcrumbPath}
          onNavigate={(folderId) => navigate(`/folder/${folderId}`)}
        />
      )}

      {/* Sort Header */}
      <SortHeader
        sortOptions={sortOptions}
        onSortChange={(field) => {
          setSortOptions((prev) => ({
            field,
            direction: prev.direction === "asc" ? "desc" : "asc",
          }));
        }}
      />

      {/* Section List for Folders */}
      <View style={styles.section}>
        <SectionHeader title="Folders" />
        {foldersLoading && folderId === "root" ? (
          <ActivityIndicator size="large" color="#0000ff" />
        ) : (
          <FolderList folders={folders} />
        )}
      </View>

      {/* Section List for Files */}
      <View style={styles.section}>
        <SectionHeader title="Files" />
        {filesLoading && folderId === "root" ? (
          <ActivityIndicator size="large" color="#0000ff" />
        ) : (
          <FilesList
            files={files}
            loading={filesLoading}
            error={filesError?.message}
            loadMoreFiles={handleLoadMoreFiles}
            removeFile={removeFile}
          />
        )}
      </View>

      {/* FolderActions Fixed at Bottom */}
      <View style={styles.folderActionsContainer}>
        <FolderActions
          onAddFolder={() => setShowFolderModal(true)}
          onUploadFile={handleUploadFile}
        />
      </View>

      {/* Add Folder Modal */}
      <FolderModal
        isOpen={showFolderModal}
        onClose={() => setShowFolderModal(false)}
        onCreate={handleCreateFolder}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    flex: 1,
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  folderActionsContainer: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    padding: 10,
    borderTopWidth: 1,
    borderColor: "#ccc",
    backgroundColor: "#fff",
  },
});