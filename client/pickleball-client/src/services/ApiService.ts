import { useApi } from '../composables/useApi';

export function useApiService() {
  const { loading, error, get, post, put, delete: remove } = useApi();

  return {
    loading,
    error,
    get,
    post,
    put,
    remove
  };
}
