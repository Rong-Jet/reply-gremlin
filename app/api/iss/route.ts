// Fetch the ISS position
export async function GET() {
  try {
    const response = await fetch("http://api.open-notify.org/iss-now.json");
    if (!response.ok) {
      console.error("Failed to fetch ISS position", response);
      return new Response(
        JSON.stringify({ error: "Failed to fetch ISS position" }),
        {
          status: response.status,
        }
      );
    }
    const data = await response.json();
    console.log("ISS position:", data.iss_position);
    return new Response(JSON.stringify(data.iss_position), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error: any) {
    console.error("Failed to fetch ISS location:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
}
