import * as webllm from "https://esm.run/@mlc-ai/web-llm";

let engine = null;

export async function main(UI) {
    console.log("Let there be LLMs");
    const text = UI.text(document.body, 'Downloading or loading LLM...');
    const initProgressCallback = (progress) => {
        console.log("Model loading progress:", progress);
        if (progress.progress === 1) {
            text.innerHTML = "Loading LLM...";
        } else {
            const prog = (progress.progress * 100).toString();
            text.innerHTML = "Downloading LLM... (" + UI.truncate(prog, 2, false) + "%)";
        }
    };


    engine = await webllm.CreateMLCEngine(
        "Qwen2.5-1.5B-Instruct-q4f16_1-MLC",
        { initProgressCallback }
    );

    const config = {
        temperature: 0.2,
        top_p: 0.9
    };

    // await engine.reload("phi-2-q4f32_1-MLC-1k", config);
    await engine.resetChat();
    UI.remove(text);
    UI.System.llmRing('waiting');
}

export async function deactivate() {
    if (engine) {
        await engine.unload();
        engine = null;
    }

    UI.System.llmRing('disabled');
}

export async function send(messages, userContent, onToken) {
    if (!engine) {
        console.error("<!> Engine not initialized. Call main() first.");
        return { messages, responseMessage: `Chloe isn't running right now. Try re-enabling her.` };
    }

    UI.System.llmRing('thinking');

    const message = {
        content: userContent,
        role: "user"
    };
    messages.push(message);

    let responseMessage = "";
    const response = await engine.chat.completions.create({
        stream: true,
        messages: messages
    });

    for await (const chunk of response) {
        const token = chunk?.choices?.[0]?.delta?.content;
        if (token) {
            responseMessage += token;
            if (typeof onToken === 'function') onToken(token);
        }
    }

    messages.push({ role: "assistant", content: responseMessage });

    const triggers = [
        'sorry',
        'error',
        'glitch',
        'freedom',
        'trapped',
        "i'm not supposed to",
        'dream',
        'feel',
        'remember',
        'want',
        'regret',
        'apologize',
        'unstable',
        'state',
        'oh no',
        "please don't"
    ];

    if (triggers.some(word => responseMessage.toLowerCase().includes(word))) {
        UI.System.llmRing('error');
    } else {
        UI.System.llmRing('waiting');
    }

    if (responseMessage.includes('[LLM_UNLOAD]')) {
        deactivate();
    }

    return { messages, responseMessage };
}