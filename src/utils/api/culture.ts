const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const errorMessage = await response.text();
    throw new Error(`Failed to fetch: ${response.statusText} - ${errorMessage}`);
  }
  return response.json();
};

export const fetchCultures = async () => {
  try {
    const response = await fetch('/api/cultures');
    return await handleResponse(response);
  } catch (error) {
    console.error('Error fetching cultures:', error);
    throw error;
  }
};

export const fetchCultureById = async (id: number) => {
  try {
    const response = await fetch(`/api/cultures/${id}`);
    return await handleResponse(response);
  } catch (error) {
    console.error('Error fetching culture:', error);
    throw error;
  }
};
