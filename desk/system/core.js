var wd = {
    container: async function () {
        let win = UI.window('Test');
        UI.remove(win.content);
        win.content = UI.create('iframe', win.win, 'window-content');
        win.content.sandbox = "allow-scripts allow-same-origin allow-popups allow-forms";
        const doc = win.content.contentDocument || win.content.contentWindow.document;
        doc.open()
        const contents = await fs.read('/system/frame.html');
        doc.write(contents);
        doc.close();
        win.content.onload = () => {
            win.content.contentWindow.postMessage({ type: "ping", value: 42 }, "*");
        };
        return { container: win.content, window: win.win };
    },
    startLLM: async function () {
        const ai = await fs.read('/system/llm/startup.js');
        Scripts.loadModule(ai).then(async (mod) => {
            UI.System.llmRing('loading');
            sys.LLMLoaded = "loading";
            let readyResolve;
            let ready = new Promise((resolve) => {
                readyResolve = resolve;
            });
            let modelName = await set.read('LLMModel');
            if (!modelName) modelName = "Qwen2.5-3B-Instruct-q4f16_1-MLC";
            mod.main(UI, readyResolve, modelName);
            ready.then(() => {
                sys.LLMLoaded = true;
            });
            sys.LLM = mod;
            set.del('chloe');
        });
    }
}