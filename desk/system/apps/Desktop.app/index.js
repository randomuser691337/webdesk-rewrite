export var name = "Desktop"
var taskbar;
var menubar;
var imageUrl;
var core2;
export async function launch(UI, fs, core) {
    core2 = core;
    UI.System.SystemMenus.menubar = UI.create('div', document.body, 'menuBar');
    UI.System.SystemMenus.taskbarContainer = UI.create('div', document.body, 'taskbar-container');
    UI.System.SystemMenus.taskbar = UI.create('div', UI.System.SystemMenus.taskbarContainer, 'taskbar');
    menubar = UI.System.SystemMenus.menubar;
    taskbar = UI.System.SystemMenus.taskbar;
    const leftMenuBar = UI.create('div', menubar, 'window-header-nav');
    const rightMenuBar = UI.create('div', menubar, 'window-header-text');
    const left = UI.create('div', taskbar, 'window-header-nav');
    const appBTN = UI.button(left, 'Apps', 'ui-big-btn');
    const llmBTN = UI.button(left, '', 'ring-btn');
    const contLLM = UI.create('div', llmBTN, 'waiting');
    const ring = UI.create('div', contLLM, 'ring');
    const contBTN = UI.button(rightMenuBar, 'Controls', 'ui-menubar-btn');
    if (sys.LLMLoaded === "unsupported") {
        llmBTN.style.display = "none";
    }

    leftMenuBar.style.height = "16px";
    rightMenuBar.style.height = "16px";
    const webdeskButton = UI.create('button', leftMenuBar, 'webdesk-button');
    UI.System.SystemMenus.MenuBarActions = UI.create('div', leftMenuBar);

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
        menu.style.width = "240px";
        const taskrect = taskbar.getBoundingClientRect();
        // Centering line corrected by AI
        menu.style.left = (taskrect.left + (taskrect.width / 2)) - (menu.offsetWidth / 2) + "px";
        menu.style.bottom = taskrect.height + 4 + "px";
        const name = await set.read('name');
        if (name !== null) {
            UI.text(menu, name);
        }
        const items = await fs.ls('/system/apps/Desktop.app/Items');
        for (const file of items) {
            const btn = UI.button(menu, file.name, 'ui-med-btn wide');
            btn.addEventListener('click', async () => {
                const path = await fs.read(file.path);
                const code = await fs.read(path);
                if (code === null) {
                    const menu = UI.create('div', document.body, 'cm');
                    UI.text(menu, `Couldn't open ${file.name}`, 'bold');
                    UI.text(menu, `${file.name} is corrupted or deleted.`);
                    const rm = UI.button(menu, 'Remove app', 'ui-med-btn');
                    rm.addEventListener('click', function () {
                        fs.del(file.path);
                        fs.del(path.substring(0, path.lastIndexOf('/')), true);
                        UI.remove(menu);
                    });
                    const close = UI.button(menu, 'Close', 'ui-med-btn');
                    close.addEventListener('click', function () {
                        UI.remove(menu);
                    });
                    closeCurrentMenu();
                    return;
                }
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

        try {
            messages.push({
                content: `Your name is ${UI.LLMName}` + llmGo,
                role: "system"
            });

            messages.push({
                role: "system",
                content: `Focused window info:\nTitle: ${UI.focusedWindow.title}\nContent:\n${UI.focusedWindow.content.outerHTML}`
            });
        } catch (error) {
            console.log(error);
            messages.push({
                content: `Your name is ${UI.LLMName}` + llmGo,
                role: "system"
            });

            messages.push({
                content: `No windows accessible.`,
                role: "system"
            });
        }

        const menu = UI.create('div', document.body, 'taskbar-menu');
        menu.style.width = "300px";
        const messagebox = UI.create('div', menu);
        const warn = UI.text(messagebox, UI.LLMName + " may make mistakes. Don't trust it for sensitive topics.", 'smalltxt bold');
        messagebox.style.height = "400px";
        messagebox.style.overflow = "auto";

        const taskrect = taskbar.getBoundingClientRect();
        menu.style.left = (taskrect.left + (taskrect.width / 2)) - (menu.offsetWidth / 2) + "px";
        menu.style.bottom = taskrect.height + 4 + "px";

        currentMenu.element = menu;
        currentMenu.type = "llm";
        document.addEventListener('mousedown', handleOutsideClick);

        if (sys.LLMLoaded !== true) {
            if (sys.LLMLoaded === false) {
                UI.text(messagebox, UI.LLMName + "'s deactivated.");
                UI.text(messagebox, "Would you like to reactivate it? WebDesk will restart.");
                const button = UI.button(messagebox, 'Reactivate', 'ui-big-btn');
                button.addEventListener('click', async function () {
                    messagebox.innerHTML = `<p>You reactivated ${UI.LLMName}.</p><p>Loading...</p>`;
                    set.del('chloe');
                    window.location.reload();
                });
            } else {
                UI.text(messagebox, UI.LLMName + "'s loading...");
                UI.text(messagebox, "It'll be with you in a second.");
            }

            const closeBtn = UI.button(messagebox, 'Close', 'ui-big-btn');
            closeBtn.addEventListener('click', async function () {
                closeCurrentMenu();
            });
        } else {
            const layout = UI.leftRightLayout(menu);
            const input = UI.create('input', layout.left, 'ui-main-input wide');
            input.placeholder = "Message";
            const btn = UI.button(layout.right, 'Send', 'ui-med-btn');

            btn.addEventListener('click', async function () {
                UI.text(messagebox, 'You: ' + input.value);
                input.value = "";
                let llmResponseTxt = UI.text(messagebox, `${UI.LLMName}: `);
                let llmResponse = "";
                const response = await UI.sendToLLM(messages, input.value, function (token) {
                    llmResponse += token;
                    llmResponseTxt.innerText = `${UI.LLMName}: ` + llmResponse;
                });

                llmResponseTxt.innerText = `${UI.LLMName}: ` + response;
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

        const uploadBtn = UI.button(menu, 'Upload File', 'ui-big-btn wide');
        uploadBtn.addEventListener('click', () => {
            input.click();
        });

        const softBtn = UI.button(menu, 'Reboot without re-initializing', 'ui-big-btn wide');
        softBtn.addEventListener('click', () => {
            document.body.innerHTML = '';
            core.loadJS('/system/init.js');
        });

        const taskrect = menubar.getBoundingClientRect();
        menu.style.right = "4px";
        menu.style.top = taskrect.height + "px";

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

    const blob = await fs.read('/system/lib/wallpaper.jpg');
    if (blob instanceof Blob) {
        imageUrl = URL.createObjectURL(blob);
        document.body.style.backgroundImage = `url('${imageUrl}')`;
    } else {
        console.log(`<!> /system/lib/wallpaper.jpg is not an image decodable by WebDesk's UI.`);
        UI.System.generateBlobWallpaper();
    }

    return ring;
}

export async function close() {
    if (taskbar) {
        core2.removeModule(id);
        UI.remove(UI.System.SystemMenus.menubar);
        UI.remove(UI.System.SystemMenus.taskbarContainer);
        taskbar = undefined;
        menubar = undefined;
        document.body.style.backgroundImage = "unset";
        if (imageUrl) {
            URL.revokeObjectURL(imageUrl);
        }
    }
}