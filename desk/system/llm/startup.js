import * as webllm from "https://esm.run/@mlc-ai/web-llm";

let engine = null;

export async function main(UI, ready, modelName) {
    console.log("Let there be LLMs");
    const textContain = UI.create('div', document.body, 'llm-prog');
    const text = UI.text(textContain, 'Downloading or loading LLM...');

    const estimateTotalSizeMB = (fetchedMB, progressFraction) => {
        if (progressFraction <= 0) return null;
        return fetchedMB / progressFraction;
    };

    const initProgressCallback = (progress) => {
        console.log("Model loading progress:", progress);

        if (progress.progress === 0) {
            text.innerHTML = "Loading LLM...";
        } else {
            const prog = (progress.progress * 100).toString();
            const fetchedMatch = progress.text.match(/([\d.]+)MB fetched/);
            let sizeString = "unknown size";

            if (fetchedMatch) {
                const fetchedMB = parseFloat(fetchedMatch[1]);
                const estimatedMB = estimateTotalSizeMB(fetchedMB, progress.progress);
                if (estimatedMB) {
                    const estimatedGB = (estimatedMB / 1024).toFixed(2);
                    sizeString = `${estimatedGB}GB`;
                }
            }

            text.innerHTML = `Downloading LLM... (${UI.truncate(prog, 2, false)}%) (Model is ~${sizeString})`;
        }
    };

    engine = await webllm.CreateMLCEngine(
        modelName,
        {
            initProgressCallback
        }
    );

    const config = {
        temperature: 0.2,
        top_p: 0.9
    };

    await engine.resetChat();
    UI.remove(textContain);
    UI.System.llmRing('waiting');
    if (ready) {
        ready();
    }
}

export function listModels() {
    return webllm.prebuiltAppConfig.model_list.map(m => m.model_id);
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
        return { messages, responseMessage: `Chloe isn't running right now. She might still be starting up, or you disabled her in Settings.` };
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
        'remember',
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