var wd = {
    container: async function () {
        let win = UI.window('Test');
        UI.remove(win.content);

        win.content = UI.create('iframe', win.win, 'window-content');
        win.content.sandbox = "allow-scripts allow-same-origin allow-popups allow-forms";

        const thing = await fs.read('/system/frame.html');

        const blob = new Blob([thing], { type: 'text/html' });
        const url = URL.createObjectURL(blob);

        win.content.src = url;

        win.content.onload = () => {
            win.content.contentWindow.postMessage(
                { type: "ping", value: 42 },
                "*"
            );
        };

        return { container: win.content, window: win.win };
    },
    startLLM: async function () {
        const ai = await fs.read('/system/llm/startup.js');
        core.loadModule(ai).then(async (mod) => {
            UI.System.llmRing('loading');
            sys.LLMLoaded = "loading";
            let readyResolve;
            let ready = new Promise((resolve) => {
                readyResolve = resolve;
            });
            let modelName = await set.read('LLMModel');
            if (!modelName) modelName = "SmolLM2-1.7B-Instruct-q4f32_1-MLC";
            mod.main(UI, readyResolve, modelName);
            ready.then(() => {
                sys.LLMLoaded = true;
            });
            sys.LLM = mod;
            set.del('chloe');
        });
    }
}