export var name = "Desktop"
var taskbar;
var imageUrl;
export async function launch(UI, fs, core) {
    taskbar = UI.create('div', document.body, 'taskbar');
    const left = UI.create('div', taskbar, 'window-header-nav');
    const right = UI.create('div', taskbar, 'window-header-text');
    const appBTN = UI.button(left, 'Apps', 'ui-main-btn');
    const llmBTN = UI.button(left, '', 'ring-btn');
    const contLLM = UI.create('div', llmBTN, 'waiting');
    const ring = UI.create('div', contLLM, 'ring');
    const contBTN = UI.button(right, 'Controls', 'ui-main-btn');
    if (sys.LLMLoaded === "unsupported") {
        llmBTN.style.display = "none";
    }

    let currentMenu = {
        element: null,
        type: null
    };

    function closeCurrentMenu() {
        if (currentMenu.element) {
            UI.remove(currentMenu.element);
            document.removeEventListener('mousedown', handleOutsideClick);
            currentMenu.element = null;
            currentMenu.type = null;
        }
    }

    function handleOutsideClick(e) {
        if (
            currentMenu.element &&
            !currentMenu.element.contains(e.target) &&
            !appBTN.contains(e.target) &&
            !contBTN.contains(e.target)
        ) {
            closeCurrentMenu();
        }
    }

    async function openAppMenu() {
        closeCurrentMenu();

        const menu = UI.create('div', document.body, 'taskbar-menu');
        const taskrect = taskbar.getBoundingClientRect();
        menu.style.left = taskrect.left + "px";
        menu.style.bottom = taskrect.height + taskrect.left + taskrect.left + "px";
        const name = await set.read('name');
        if (name !== null) {
            UI.text(menu, name);
        }
        const items = await fs.ls('/system/apps/Desktop.app/Items');
        for (const file of items) {
            const btn = UI.button(menu, file.name, 'ui-main-btn wide');
            btn.addEventListener('click', async () => {
                const path = await fs.read(file.path);
                const code = await fs.read(path);
                const mod = await core.loadModule(code);

                if (typeof mod.launch === 'function') {
                    if (mod.close && typeof mod.close === 'function') {
                        const appInstance = await mod.launch(UI, fs, core, true, mod);
                    } else {
                        const div = UI.create('div', document.body, 'cm');
                        UI.text(div, "This app is missing the close() function or it wasn't exported.");
                        UI.text(div, `If you launch it anyways, it might leave things behind in memory on close.`);
                        UI.text(div, "If you're the developer, implement the close() function.");
                        const launch = UI.button(div, 'Launch anyways', 'ui-med-btn');
                        launch.addEventListener('click', function () {
                            mod.launch(UI, fs, core, true, mod);
                            UI.remove(div);
                        });
                        const close = UI.button(div, 'Close', 'ui-med-btn');
                        close.addEventListener('click', function () {
                            UI.remove(div);
                        });
                    }
                } else {
                    console.warn(`${file.name} has no launch() export`);
                }

                closeCurrentMenu();
            });
        }

        currentMenu.element = menu;
        currentMenu.type = "apps";
        document.addEventListener('mousedown', handleOutsideClick);
    }

    async function openLLMMenu() {
        closeCurrentMenu();
        let messages = []

        const llmGo = await fs.read('/system/llm/prompt.txt');
        messages.push({
            content: llmGo + ` Focused window: TextEdit. You DO NOT have permission to read this window's contents.
To replace text: TextEdit: replace: text, newText
To create a blank document: TextEdit: new: text`,
            role: "system"
        });

        messages.push({
            content: `I'm Chloe. My capabilities are limited, but I'll try my best!`,
            role: "assistant"
        });

        const menu = UI.create('div', document.body, 'taskbar-menu');
        menu.style.width = "300px";
        const messagebox = UI.create('div', menu);
        const warn = UI.text(messagebox, "Chloe may make mistakes. Don't trust it for sensitive topics.");
        warn.style.color = "#999";
        warn.style.fontSize = "var(--font-size-ui)";
        messagebox.style.height = "400px";
        messagebox.style.overflow = "auto";

        const taskrect = taskbar.getBoundingClientRect();
        menu.style.left = taskrect.left + "px";
        menu.style.bottom = taskrect.height + taskrect.left + taskrect.left + "px";

        currentMenu.element = menu;
        currentMenu.type = "llm";
        document.addEventListener('mousedown', handleOutsideClick);

        if (sys.LLMLoaded !== true) {
            if (sys.LLMLoaded === false) {
                UI.text(messagebox, "Chloe's deactivated.");
                UI.text(messagebox, "Would you like to reactivate her?");
                const button = UI.button(messagebox, 'Reactivate', 'ui-main-btn');
                button.addEventListener('click', async function () {
                    messagebox.innerHTML = "<p>You reactivated Chloe.</p><p>Loading...</p>";
                    set.del('chloe');
                    const ai = await fs.read('/system/llm/startup.js');
                    let model = set.read('LLMModel');
                    if (!model) model = "QSmolLM2-1.7B-Instruct-q4f32_1-MLC"
                    core.loadModule(ai).then(async (mod) => {
                        let readyResolve;
                        let ready = new Promise((resolve) => {
                            readyResolve = resolve;
                        });
                        mod.main(UI, readyResolve, model);
                        ready.then(() => {
                            closeCurrentMenu();
                            llmBTN.click();
                            sys.LLMLoaded = true;
                        });
                        sys.LLM = mod;
                    });
                });
            } else {
                UI.text(messagebox, "Chloe's loading...");
                UI.text(messagebox, "She'll be with you in a second.");
            }

            const closeBtn = UI.button(messagebox, 'Close', 'ui-main-btn');
            closeBtn.addEventListener('click', async function () {
                closeCurrentMenu();
            });
        } else {
            const layout = UI.leftRightLayout(menu);
            const input = UI.create('input', layout.left, 'ui-main-input wide');
            input.placeholder = "Ask Chloe anything...";
            const btn = UI.button(layout.right, 'Send', 'ui-med-btn');

            btn.addEventListener('click', async function () {
                UI.text(messagebox, 'You: ' + input.value);
                let llmResponseTxt = UI.text(messagebox, 'Chloe: ');
                let llmResponse = "";
                const response = await UI.sendToLLM(messages, input.value, function (token) {
                    llmResponse += token;
                    llmResponseTxt.innerText = "Chloe: " + llmResponse;
                });

                llmResponseTxt.innerText = "Chloe: " + response;
            });
        }
    }

    async function openControlsMenu() {
        closeCurrentMenu();

        const menu = UI.create('div', document.body, 'taskbar-menu');
        const input = UI.create('input', menu, 'hide');
        input.type = "file";
        input.addEventListener("change", async function () {
            for (const file of this.files) {
                const path = `/uploads/${file.name}`;
                const isImage = file.type.startsWith("image");
                const content = isImage ? file : await file.text();

                try {
                    await fs.write(path, content, isImage ? "blob" : "text");
                    const blob = await fs.read(path);
                    if (isImage && blob instanceof Blob) {
                        const img = document.createElement("img");
                        img.src = URL.createObjectURL(blob);
                        img.style.maxWidth = "200px";
                        document.body.appendChild(img);
                    } else {
                        console.log(`Text file contents of ${file.name}:`, blob);
                    }
                } catch (err) {
                    console.error(`Failed to process ${file.name}:`, err);
                }
            }
        });

        const uploadBtn = UI.button(menu, 'Upload File', 'ui-main-btn wide');
        uploadBtn.addEventListener('click', () => {
            input.click();
        });

        const softBtn = UI.button(menu, 'Reboot without re-initializing', 'ui-main-btn wide');
        softBtn.addEventListener('click', () => {
            document.body.innerHTML = '';
            core.loadJS('/system/init.js');
        });

        const taskrect = taskbar.getBoundingClientRect();
        menu.style.right = taskrect.left + "px";
        menu.style.bottom = taskrect.height + taskrect.left + taskrect.left + "px";

        currentMenu.element = menu;
        currentMenu.type = "controls";
        document.addEventListener('mousedown', handleOutsideClick);
    }

    appBTN.addEventListener('click', async () => {
        if (currentMenu.type === "apps") {
            closeCurrentMenu();
        } else {
            await openAppMenu();
        }
    });

    llmBTN.addEventListener('click', async () => {
        if (currentMenu.type === "llm") {
            closeCurrentMenu();
        } else {
            await openLLMMenu();
        }
    });

    contBTN.addEventListener('click', async () => {
        if (currentMenu.type === "controls") {
            closeCurrentMenu();
        } else {
            await openControlsMenu();
        }
    });

    if (await set.read('lowend') !== "true") {
        const blob = await fs.read('/system/lib/wallpaper.jpg');
        if (blob instanceof Blob) {
            imageUrl = URL.createObjectURL(blob);
            document.body.style.backgroundImage = `url('${imageUrl}')`;
        } else {
            console.log(`<!> /system/lib/wallpaper.jpg is not an image decodable by WebDesk's UI.`);
        }
    }

    return ring;
}

export async function close() {
    if (taskbar) {
        UI.remove(taskbar);
        document.body.style.backgroundImage = "unset";
        if (imageUrl) {
            URL.revokeObjectURL(imageUrl);
        }
    }
}