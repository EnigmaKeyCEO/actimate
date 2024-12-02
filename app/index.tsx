import React, { useState } from "react";
import { Button, FlatList, Text, TouchableOpacity, View } from "react-native";
import { useImageContext } from "#/hooks/useImages";
import { useAppContext } from "#/hooks/useAppContext";

const okayButton = (
  <TouchableOpacity>
    <Text>OK</Text>
  </TouchableOpacity>
);

export default function MainPage() {
  const { showModal } = useAppContext();
  const { createImage, images = [] } = useImageContext();
  const [loading, setLoading] = useState(false);

  const handleCreateImage = React.useCallback(async () => {
    try {
      setLoading(true);
      const success = await createImage();
      if (success) {
        await showModal("Image Created", "Image created successfully", [
          okayButton,
        ]);
      } else {
        await showModal("Image Creation Failed", "Image creation failed", [
          okayButton,
        ]);
      }
    } catch (error) {
      console.error(error);
      await showModal("Error", "An error occurred", [okayButton]);
    } finally {
      setLoading(false);
    }
  }, [createImage, showModal]);

  return (
    <View>
      <Button
        title={loading ? "loading..." : "Create Image"}
        onPress={handleCreateImage}
        disabled={loading}
      />
      <FlatList
        data={images}
        renderItem={({ item }) => <Text>{item.name}</Text>}
        keyExtractor={(item) => item.id}
      />
    </View>
  );
}
