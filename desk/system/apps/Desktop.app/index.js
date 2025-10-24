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
    const appBTN = UI.button(left, '', 'ui-dock-btn');
    UI.img(appBTN, '/system/lib/img/apps.svg', 'dock-icon');
    const llmBTN = UI.button(left, '', 'ring-btn');
    const contLLM = UI.create('div', llmBTN, 'waiting');
    const ring = UI.create('div', contLLM, 'ring');

    UI.System.SystemMenus.taskbarWindows = UI.create('div', left);
    UI.System.SystemMenus.notifArea = UI.create('div', document.body, 'notif-pane');
    UI.System.SystemMenus.notifArea.style.top = menubar.offsetHeight + 18 + "px";

    const contBTN = UI.button(rightMenuBar, 'Controls', 'menuBar-btn');

    contBTN.addEventListener('mousedown', function () {
        const rect = contBTN.getBoundingClientRect();
        const event = {
            clientX: Math.floor(rect.left),
            clientY: Math.floor(rect.bottom) + 6
        };

        const menu = UI.rightClickMenu(event);
        menu.classList.add('menuBar-Menu');

        menu.style.width = "180px";

        // Uploader code
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
        /* const softBtn = UI.button(menu, 'Reboot without re-initializing', 'ui-med-btn wide');
        softBtn.addEventListener('click', () => {
            document.body.innerHTML = '';
            core.loadJS('/system/init.js');
        }); */


        // Copilot fixed this array's fuckery for me
        const menuBarItems2 = [
            { name: "Reload", action: function () { window.location.reload(); } },
            { name: "Upload File", action: function () { input.click(); } },
            { name: "Fullscreen Toggle", action: function () { UI.System.fullscreenToggle(document); } }
        ];

        menuBarItems2.forEach(function (child) {
            const btn2 = UI.button(menu, child.name, 'ui-menubar-btn wide');
            btn2.addEventListener('click', child.action);
            btn2.addEventListener('mouseup', child.action);
        });

        menu.style.width = "140px";
    });

    if (sys.LLMLoaded === "unsupported") {
        llmBTN.style.display = "none";
    }

    const webdeskButton = UI.create('button', leftMenuBar, 'webdesk-button');

    webdeskButton.addEventListener('mousedown', function () {
        const rect = webdeskButton.getBoundingClientRect();
        const event = {
            clientX: Math.floor(rect.left),
            clientY: Math.floor(rect.bottom) + 6
        };

        const menu = UI.rightClickMenu(event);
        menu.classList.add('menuBar-Menu');

        const menuBarItems2 = [{
            name: "Reload", action: function () {
                window.location.reload();
            }
        }];

        menuBarItems2.forEach(function (child) {
            const btn2 = UI.button(menu, child.name, 'ui-menubar-btn wide');
            btn2.addEventListener('click', child.action);
            btn2.addEventListener('mouseup', child.action);
        });
    });

    UI.System.SystemMenus.MenuBarActions = UI.create('div', leftMenuBar);
    UI.System.SystemMenus.MenuBarActions.innerHTML = `<button class="med menuBar-btn">Desktop</button>`;

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
            return true;
        } else {
            return false;
        }
    }

    async function openAppMenu() {
        closeCurrentMenu();

        const menu = UI.create('div', document.body, 'taskbar-menu');
        menu.style.width = "240px";
        const taskrect = taskbar.getBoundingClientRect();
        // Centering line corrected by AI
        menu.style.left = (taskrect.left + (taskrect.width / 2)) - (menu.offsetWidth / 2) + "px";
        menu.style.bottom = taskrect.height + 8 + "px";
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
        messages.push({
            content: llmGo.replace('${NAME}', UI.LLMName || "Chloe"),
            role: "system"
        });

        let flagCounter = 0;
        async function dontChoke(text) {
            const start = Math.ceil(text.split(/\s+/).length * 1.3);
            let textFinal;
            if (start > 2000) {
                textFinal = UI.truncate(text, 3400);
                flagCounter++;
            } else {
                textFinal = text;
            }
            return textFinal;
        }

        try {
            const cont1 = await dontChoke(`I have a window opened, use it's contents to help me. \n Title: ${UI.focusedWindow.title}\nContent:\n${UI.focusedWindow.content.outerHTML}`);
            messages.push({
                content: cont1,
                role: "user"
            });
        } catch (error) {
            console.log("<i> window read failed");
        }

        try {
            const cont2 = await dontChoke(`I have a second window opened too, use it's contents to help me. \n Title: ${UI.previousFocusedWindow.title}\nContent:\n${UI.previousFocusedWindow.content.outerHTML}`);
            messages.push({
                content: cont2,
                role: "user"
            });
        } catch (error) {
            console.log("<i> second window read failed");
        }

        const menu = UI.create('div', document.body, 'taskbar-menu');
        menu.style.width = "300px";
        const messagebox = UI.create('div', menu);
        messagebox.style.height = "400px";
        messagebox.style.overflow = "auto";
        let generating = false;

        async function searchMode() {
            UI.text(messagebox, "Searching the web...");
            const searchMsg = [{
                content: `You are a research LLM. Your job is to create a summary of the links provided.
                
            Use:
            
            [getWebsiteText](url)
            
            This will retrieve the text contents of the webpage at the given URL.
            
            Once you've gone through each link, summarize the information provided in the user paragraphs.`, role: "system"
            }, { content: `Links: test1, test2` }]
            const response = await UI.sendToLLM(messages, input.value, function (token) {
                messagebox.scrollTop = messagebox.scrollHeight;
                llmResponse += token;
                llmResponseTxt.innerText = `${UI.LLMName}: ` + llmResponse;
            });

            // cant bother connecting it to the internet... YET
        }

        function loadUI() {
            UI.text(messagebox, `${UI.LLMName} may make mistakes. Don't trust it for sensitive topics.`, 'smalltxt');
            if (flagCounter > 0) {
                UI.text(messagebox, `Window contents were too big, and had to be truncated. Context may be missing.`, 'smalltxt');
            }
            const layout = UI.leftRightLayout(menu);
            const input = UI.create('input', layout.left, 'ui-main-input wide');
            input.placeholder = `Ask ${UI.LLMName} anything...`;
            const btn = UI.button(layout.right, 'Send', 'ui-med-btn');

            let firstMsg = true;

            btn.addEventListener('click', async function () {
                if (generating === false) {
                    generating = true;
                    btn.Filler.innerText = "Stop";
                    UI.text(messagebox, 'You: ' + input.value);
                    input.value = "";
                    let llmResponseTxt = UI.text(messagebox, `${UI.LLMName}: `);
                    let llmResponse = "";
                    if (firstMsg === true) {
                        llmResponseTxt.innerText = `The first message may take longer to generate. Please wait...`;
                        firstMsg = false;
                    }

                    let timeSinceLastToken = Date.now();
                    let tripCounter = 0;
                    let alreadyNotified = false;

                    const response = await UI.sendToLLM(messages, input.value, function (token) {
                        const now = Date.now();
                        if ((now - timeSinceLastToken) > 10000) {
                            tripCounter++;
                        } else {
                            tripCounter = 0;
                        }
                        timeSinceLastToken = now;

                        if (tripCounter > 3 || tripCounter === 3 && alreadyNotified === false) {
                            alreadyNotified = true;
                            UI.text(menu, `This model isn't performing well. Consider using a smaller one in Settings.`);
                        }
                        messagebox.scrollTop = messagebox.scrollHeight;
                        llmResponse += token;
                        llmResponseTxt.innerText = `${UI.LLMName}: ` + llmResponse;
                    });

                    llmResponseTxt.innerText = `${UI.LLMName}: ` + response;
                    generating = false;
                    btn.Filler.innerText = "Send";
                } else {
                    UI.stopLLMGeneration();
                    generating = false;
                    btn.Filler.innerText = "Send";
                }
            });
        }

        if (sys.LLMLoaded === true) {
            loadUI();
        } else if (sys.LLMLoaded === "loading") {
            const txt = UI.text(menu, `AI features are loading...`);
            const check = setInterval(function () {
                if (sys.LLMLoaded === true) {
                    clearInterval(check);
                    txt.remove();
                    loadUI();
                }
            }, 200);
        } else {
            UI.text(menu, `AI features are disabled.`);
            UI.text(menu, `You can re-enable them in Settings.`);
        }

        const taskrect = taskbar.getBoundingClientRect();
        menu.style.left = (taskrect.left + (taskrect.width / 2)) - (menu.offsetWidth / 2) + "px";
        menu.style.bottom = taskrect.height + 8 + "px";

        currentMenu.element = menu;
        currentMenu.type = "llm";
        document.addEventListener('mousedown', function (event) {
            const closed = handleOutsideClick(event);
            if (closed === true && generating === true) {
                UI.stopLLMGeneration();
                generating = false;
                btn.Filler.innerText = "Send";
            }
        });
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