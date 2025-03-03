import axios from 'axios';

export function createAxiosClient({
  options,
  logout
}) {
  const client = axios.create(options);

  client.interceptors.response.use(
    (response) => {
      return response;
    },
    (error) => {
      // If a 401 error is received, logout the user
      if (error.response?.status === 401) {
        logout();
      }
      return Promise.reject(error);
    }
  );

  return client;
}
