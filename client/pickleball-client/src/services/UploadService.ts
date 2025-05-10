import axios from 'axios';
import { useApi } from '../composables/useApi';

export function useUploadService() {
  const { api } = useApi();

  /**
   * Upload a file to the server
   * @param file The file to upload
   * @param type The type of file (e.g., 'court', 'profile')
   * @returns Promise with the uploaded file URL
   */
  const uploadFile = async (file: File, type: string = 'court'): Promise<string> => {
    // Create form data
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    try {
      console.log('Uploading file:', file.name, file.type, file.size);
      console.log('FormData:', formData);

      // Get token from localStorage
      const token = localStorage.getItem('token');

      // Use axios directly for file upload with multipart/form-data
      const response = await axios.post(
        'http://localhost:5000/api/upload',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': token ? `Bearer ${token}` : ''
          }
        }
      );

      console.log('Upload response:', response.data);

      if (response.data && response.data.url) {
        return response.data.url;
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  };

  return {
    uploadFile
  };
}
