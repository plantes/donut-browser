export async function testSyncConnection(
  serverUrl: string,
  token: string,
): Promise<boolean> {
  if (!serverUrl || !token) return false;
  const response = await fetch(
    `${serverUrl.replace(/\/$/, "")}/v1/objects/stat`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ key: ".donut-connection-test" }),
    },
  );
  return response.ok;
}
