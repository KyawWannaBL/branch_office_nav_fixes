export async function readApiJson(res: Response) {
  const raw = await res.text();

  let data: any = null;
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    data = null;
  }

  if (!res.ok) {
    throw new Error(
      data?.error ||
      data?.message ||
      raw?.slice(0, 200) ||
      `Request failed with ${res.status}`
    );
  }

  if (data === null) {
    throw new Error(raw?.slice(0, 200) || "Server did not return valid JSON");
  }

  return data;
}