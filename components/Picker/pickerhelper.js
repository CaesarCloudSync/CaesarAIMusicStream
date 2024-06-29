import DocumentPicker, { types } from 'react-native-document-picker';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import ImageCropPicker from 'react-native-image-crop-picker';
import RNFS from 'react-native-fs';
import { getSystemVersion } from 'react-native-device-info';
import { Image } from 'react-native-compressor';
import { PermissionsAndroid } from 'react-native';
import { Alert } from 'react-native';
const FILE_MAX_SIZE = 300_000
const requestDocumentWithPermission = async () => {
  try {
    if (Platform.OS === 'android') {
      // In android 13 no permission is needed

      const deviceVersion = getSystemVersion();
      let granted = PermissionsAndroid.RESULTS.DENIED;
      if (deviceVersion >= 13) {
        granted = PermissionsAndroid.RESULTS.GRANTED;
      } else {
        granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE
        );
      }
      if (granted) {
        return pickDocument();
      }
    } else {
      // Handle iOS permissions if needed
      return pickDocument();
    }
  } catch (error) {
    console.log('Error checking/requesting permissions:', error);
    return null;
  }
};

const pickDocument = async () => {
  
  try {
    const result = await DocumentPicker.pick({
      // allowMultiSelection: false,
      type: [DocumentPicker.types.pdf],
    });
    if (result) {
      console.log('Picked document:0', result);

      const { name, size, type, uri } = result[0];
      console.log(size)

      if (size > FILE_MAX_SIZE) {
        Alert.alert('File Size Limit Exceeded', 'Please select a file up to 2 MB.');
      } else {
        return {
          name,
          type,
          uri,
          size,
        };
      }
    }
  } catch (err) {
    if (DocumentPicker.isCancel(err)) {
      // User cancelled the document picker
      console.log('Document picker cancelled by user');
    } else {
      // Handle other errors
      console.log('Error picking document:', err);
    }
    return null;
  }
};

const requestCameraWithPermission = async () => {
  try {
    const cameraPermission = await check(PERMISSIONS.ANDROID.CAMERA);

    if (cameraPermission === RESULTS.GRANTED) {
      console.log('Camera permission already granted');
      return pickImageFromCamera();
    }
    const cameraPermissionResult = await request(PERMISSIONS.ANDROID.CAMERA);

    if (cameraPermissionResult === RESULTS.GRANTED) {
      console.log('Camera permission granted');
      return pickImageFromCamera();
    }
    console.log('Camera permission denied');
  } catch (error) {
    console.log('Error checking/requesting camera permission:', error);
    return null;
  }
};

const requestGalleryWithPermission = async () => {
  try {
    if (Platform.OS === 'android') {
      const deviceVersion = getSystemVersion();
      let granted = PermissionsAndroid.RESULTS.DENIED;
      if (deviceVersion >= 13) {
        granted = PermissionsAndroid.RESULTS.GRANTED;
      } else {
        granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE
        );
      }
      if (granted) {
        return pickImageFromGallery();
      }
    } else {
      // On iOS, permissions are typically not required for accessing the photo library
      console.log('iOS platform: No specific permissions required for media library');
      return pickImageFromGallery();
    }
  } catch (error) {
    console.log('Error checking/requesting storage permission:', error);
    return null;
  }
};

function getFileExtension(uri) {
  const lastDotIndex = uri.lastIndexOf('.');
  if (lastDotIndex !== -1) {
    return uri.slice(lastDotIndex + 1);
  }
  return null; // or an appropriate default value
}

const pickImageFromCamera = async () => {
  try {
    const image = await ImageCropPicker.openCamera({
      // width: 300,
      // height: 400,
      cropping: true,
      multiple: false,
      mediaType: 'photo',
    });

    if (image) {
      const pathCompressed = await Image.compress(image?.path, {
        // compress image below 2mb
        maxWidth: 1500,
        maxHeight: 1000,
      });
      const imageCompressed = await RNFS.stat(pathCompressed);

      console.log('Picked image from gallery:0', image);
      if (imageCompressed.size > FILE_MAX_SIZE) {
        Alert.alert('File Size Limit Exceeded', 'Please select a file up to 2 MB.');
      } else {
        // The picked document is available in the 'result' object

        return {
          name: image?.filename || `image_${Date.now()}.${getFileExtension(imageCompressed?.path)}`,
          type: image?.mime,
          uri: imageCompressed?.path,
          size: imageCompressed?.size,
        };
      }
    }
  } catch (error) {
    console.log('Error picking image from camera:', error);
    return null;
  }
};

const pickImageFromGallery = async () => {
  try {
    const image = await ImageCropPicker.openPicker({
      // width: 300,
      // height: 400,
      // cropping: true,
      multiple: false,
      mediaType: 'photo',
    });

    if (image) {
      const pathCompressed = await Image.compress(image?.path, {
        maxWidth: 1500,
        maxHeight: 1000,
      });
      const imageCompressed = await RNFS.stat(pathCompressed);

      console.log('Picked image from gallery:0', image, imageCompressed);
      if (imageCompressed.size > FILE_MAX_SIZE) {
        Alert.alert('File Size Limit Exceeded', 'Please select a file up to 2 MB.');
      } else {
        // The picked document is available in the 'result' object
        let filename = image?.filename || `image_${Date.now()}.${getFileExtension(imageCompressed?.path)}`
        let file_path = "file://" + RNFS.DocumentDirectoryPath + "/" + filename
        await RNFS.copyFile(imageCompressed?.path,file_path)
      
        //console.log("internal",file_path)
        return {
          name: filename,
          type: image?.mime,
          uri: file_path,
          size: imageCompressed?.size,
        };
      }
    }
  } catch (error) {
    console.log('Error picking image from gallery:', error);
    return null;
  }
};

const uploadFileImageOrPdf = async (fileBlob, isFromImagePicker = true) => {
  try {
    const formData = new FormData();
    if (isFromImagePicker) {
      formData.append('file', {
        uri: fileBlob?.path,
        type: fileBlob?.mime,
        name: fileBlob?.filename, // Adjust the filename as needed
      });
    } else {
      formData.append('file', {
        uri: fileBlob[0]?.uri,
        type: fileBlob[0]?.type,
        name: fileBlob[0]?.name, // Adjust the filename as needed
      });
    }

    const response = await fetch('YOUR_API_ENDPOINT', {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
        // You may need to include additional headers depending on your API requirements
      },
    });

    const responseData = await response.json();
    console.log('File upload response:', responseData);
  } catch (error) {
    console.log('File upload error:', error);
  }
};

export {
  requestDocumentWithPermission,
  requestCameraWithPermission,
  requestGalleryWithPermission,
};