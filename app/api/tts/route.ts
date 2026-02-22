// API Route for OpenAI TTS Proxy

export async function POST(req: Request) {
    try {
        const { text } = await req.json();

        if (!text) {
            return new Response("Text is required", { status: 400 });
        }

        // Call the OpenAI TTS API Route standard fetch directly
        // since ai-sdk's generateSpeech hasn't natively released or isn't standard yet.
        const response = await fetch("https://api.openai.com/v1/audio/speech", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "tts-1",
                input: text,
                voice: "nova", // Nova is a good female voice option
                response_format: "mp3",
            }),
        });

        if (!response.ok) {
            console.error("OpenAI TTS Failed:", await response.text());
            return new Response("Failed to generate speech", { status: 500 });
        }

        // Return the readable stream directly back to the client
        return new Response(response.body, {
            headers: {
                "Content-Type": "audio/mpeg",
            },
        });
    } catch (error) {
        console.error("TTS Error:", error);
        return new Response("Internal Server Error", { status: 500 });
    }
}
