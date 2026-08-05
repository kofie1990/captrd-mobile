import * as FileSystem from 'expo-file-system/legacy';

export interface FailedUpload {
  id: string; // The generated fileName
  uri: string; // Path in documentDirectory
  fileName: string;
  eventId: string;
  guestName: string;
  isVideo: boolean;
  timestamp: number;
}

const FILE_PATH = `${FileSystem.documentDirectory}failedUploads.json`;

export const getFailedUploads = async (): Promise<FailedUpload[]> => {
  try {
    const info = await FileSystem.getInfoAsync(FILE_PATH);
    if (!info.exists) return [];
    
    const content = await FileSystem.readAsStringAsync(FILE_PATH);
    return JSON.parse(content) as FailedUpload[];
  } catch (error) {
    console.error('Failed to get uploads', error);
    return [];
  }
};

export const saveFailedUpload = async (upload: FailedUpload, tempUri: string): Promise<void> => {
  try {
    // Copy the file from temp cache to document directory so it isn't cleared
    const safeName = upload.fileName.replace(/\//g, '_');
    const persistentUri = `${FileSystem.documentDirectory}${safeName}`;
    
    await FileSystem.copyAsync({ from: tempUri, to: persistentUri });
    upload.uri = persistentUri;

    const uploads = await getFailedUploads();
    uploads.push(upload);
    await FileSystem.writeAsStringAsync(FILE_PATH, JSON.stringify(uploads));
  } catch (error) {
    console.error('Failed to save upload', error);
  }
};

export const deleteFailedUpload = async (id: string): Promise<void> => {
  try {
    let uploads = await getFailedUploads();
    const target = uploads.find((u) => u.id === id);
    if (target && target.uri) {
      const info = await FileSystem.getInfoAsync(target.uri);
      if (info.exists) {
        await FileSystem.deleteAsync(target.uri);
      }
    }
    
    uploads = uploads.filter((u) => u.id !== id);
    await FileSystem.writeAsStringAsync(FILE_PATH, JSON.stringify(uploads));
  } catch (error) {
    console.error('Failed to delete upload', error);
  }
};
