import * as webllm from "https://esm.run/@mlc-ai/web-llm";

let engine = null;

export var name = "LLM engine"

export async function main(UI, ready, modelName) {
    console.log("Let there be LLMs");
    const textContain = await UI.notif('AI features', 'Loading LLM...');
    const text = textContain.mainDiv;

    try {
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

                text.innerHTML = `Downloading LLM... (${UI.truncate(prog, 2, false).replace('.', '')}%) (Model is ~${sizeString})`;
            }
        };

        const config = {
            temperature: 0.3,
            top_p: 0.9
        };

        engine = await webllm.CreateMLCEngine(
            modelName,
            {
                initProgressCallback
            }
        );

        await engine.resetChat();
        UI.System.llmRing('waiting');
        await UI.changeimg(textContain.iconImg, '/system/lib/img/check.svg');
        text.innerHTML = `AI features loaded!`;
        setTimeout(function () {
            textContain.removeNotif();
        }, 4000);
        if (ready) {
            ready();
        }
    } catch (error) {
        console.log(`<!> Failed to load LLM: ` + error);
        await UI.changeimg(textContain.iconImg, '/system/lib/img/warn.svg');
        text.innerHTML = "Failed to load LLM.";
        setTimeout(function () {
            textContain.removeNotif();
        }, 4000);
    }
}

export function listModels() {
    return webllm.prebuiltAppConfig.model_list.map(m => m.model_id);
}

export function stopGenerating() {
    console.log(engine);
    if (engine) {
        engine.interruptSignal = true;
        UI.System.llmRing('waiting');
    }
}

export async function deactivate() {
    if (engine) {
        await engine.unload();
        engine = null;
    }

    UI.System.llmRing('disabled');
}

export async function send(messages, userContent, onToken, temp, top_p) {
    try {
        if (!engine) {
            console.error("<!> Engine not initialized. Call main() first.");
            return { messages, responseMessage: `AI features aren't running. Enable them in Settings -> Manage AI.` };
        }

        UI.System.llmRing('thinking');

        const message = {
            content: userContent,
            role: "user"
        };
        messages.push(message);

        let responseMessage = "";

        if (!temp) temp = 0.5;
        if (!top_p) top_p = 0.9;


        const response = await engine.chat.completions.create({
            stream: true,
            messages: messages,
            temperature: temp,
            top_p: top_p
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
    } catch (error) {
        UI.System.llmRing('error');
        console.error("<!> LLM send error: " + error);
        return { messages, responseMessage: `Error during LLM processing: ${error}` };
    }
}