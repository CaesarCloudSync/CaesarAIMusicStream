// Modal.js

import React from "react";
import { View,Text } from "react-native";
const modalStyles = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100vw",
  height: "100vh",
  background: "blue"
};

export const NormModal = ({ canShow, updateModalState }) => {
  if (canShow) {
    return (
      <View style={modalStyles}>
        <Text>I'm a Modal!</Text>
        <Text onClick={updateModalState}>X</Text>
      </View>
    );
  }

  return null;
};

