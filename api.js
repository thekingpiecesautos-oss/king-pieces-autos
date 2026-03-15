const API_URL = "https://king-pieces-autos-1.onrender.com";

export async function apiFetch(url, options = {}) {
  const response = await fetch(API_URL + url, {
    headers: {
      "Content-Type": "application/json"
    },
    ...options
  });

  if (!response.ok) {
    throw new Error("Erreur API");
  }

  return response.json();
}
