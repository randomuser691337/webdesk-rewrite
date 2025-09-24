export var name = "Settings";
var win;
var core2;
var resizeObserver;
export async function launch(UI, fs, core, unused, module) {
    core2 = core;
    const check = await fs.read('/tmp/settings-open');
    if (check) {
        win = check;
        win.win.click();
        core2.removeModule(id);
        return;
    }
    win = UI.window(name, module);
    fs.write('/tmp/settings-open', win);
    console.log(window.outerWidth);
    if (window.outerWidth < 470) {
        win.win.style.width = window.outerWidth / 1.08 + "px";
    } else {
        win.win.style.width = "540px";
    }

    win.win.style.height = "540px";
    win.headertxt.innerHTML = "";
    win.content.style.padding = "0px";
    win.content.style.display = "flex";
    let showSideBar;
    const sidebar = UI.create('div', win.content, 'window-split-sidebar');
    sidebar.style.width = "175px";
    const sidebarWinBtnDiv = UI.create('div', sidebar);
    sidebar.appendChild(win.header);
    win.header.classList.add('window-header-clear');
    win.header.style.padding = "14px";
    win.header.style.paddingBottom = "4px";
    const sidebarcontent = UI.create('div', sidebar, 'content');
    sidebarcontent.style.paddingTop = "0px";

    const accountDiv = UI.create('div', sidebarcontent, 'box-group');
    accountDiv.style.marginTop = "6px";
    const userBar = UI.leftRightLayout(accountDiv);
    userBar.left.innerHTML = `<span class="bold">${UI.userName}</span>`;
    const manageBtn = UI.button(userBar.right, '⚙️', 'ui-small-btn');
    manageBtn.addEventListener('click', () => {
        userAcc();
    });

    const generalButton = UI.button(sidebarcontent, 'General', 'ui-med-btn wide');
    generalButton.addEventListener('click', () => {
        General();
    });

    const personalizeButton = UI.button(sidebarcontent, 'Personalize', 'ui-med-btn wide');
    personalizeButton.addEventListener('click', () => {
        Personalize();
    });

    const llmButton = UI.button(sidebarcontent, 'Manage AI', 'ui-med-btn wide');
    llmButton.addEventListener('click', () => {
        Assistant();
    });

    const container = UI.create('div', win.content, 'window-split-content');
    const titleCont = UI.create('div', container, 'window-draggable');
    const title = UI.create('span', titleCont);
    const content = UI.create('div', container);
    content.style.paddingTop = "4px";
    title.classList.add('bold');

    async function getTotalCacheSize(cacheNames) {
        let totalSize = 0;

        for (const name of cacheNames) {
            const cache = await caches.open(name);
            const requests = await cache.keys();

            for (const request of requests) {
                const response = await cache.match(request);
                if (response) {
                    const cloned = response.clone();
                    const buffer = await cloned.arrayBuffer();
                    totalSize += buffer.byteLength;
                }
            }
        }

        return totalSize;
    }

    function userAcc() {
        content.innerHTML = '';
        title.innerText = "WebDesk Account - " + UI.userName;
        const group1 = UI.create('div', content, 'box-group');
        UI.text(group1, "Profile");
        const changeUsername = UI.button(group1, 'Change Username', 'ui-med-btn');

        const group2 = UI.create('div', content, 'box-group');
        UI.text(group2, "Personal");
        const changePw = UI.button(group2, 'Change Password', 'ui-med-btn');
    }

    function General() {
        content.innerHTML = '';
        title.innerText = "General";
        const group1 = UI.create('div', content, 'box-group');
        const eraseBtn = UI.button(group1, 'Erase WebDesk', 'ui-med-btn wide');
        const appearbar = UI.leftRightLayout(group1);
        appearbar.left.innerHTML = '<span class="smalltxt">Low-end device mode</span>';
        const enableBtn = UI.button(appearbar.right, 'Enable', 'ui-med-btn wide');
        enableBtn.addEventListener('click', () => {
            set.write('lowend', 'true');
            const menu = UI.create('div', document.body, 'cm');
            UI.text(menu, 'Restart WebDesk to enable low-end device mode');
            const btn = UI.button(menu, 'Restart', 'ui-med-btn');
            btn.addEventListener('click', function () { window.location.reload(); });
            const btn2 = UI.button(menu, `I'll do it later`, 'ui-med-btn');
            btn2.addEventListener('click', function () { UI.remove(menu); });
        });
        const disableBtn = UI.button(appearbar.right, 'Disable', 'ui-med-btn wide');
        disableBtn.addEventListener('click', () => {
            set.del('lowend');
            const menu = UI.create('div', document.body, 'cm');
            UI.text(menu, 'Restart WebDesk to disable low-end device mode');
            const btn = UI.button(menu, 'Restart', 'ui-med-btn');
            btn.addEventListener('click', function () { window.location.reload(); });
            const btn2 = UI.button(menu, `I'll do it later`, 'ui-med-btn');
            btn2.addEventListener('click', function () { UI.remove(menu); });
        });
    }

    async function Assistant() {
        content.innerHTML = '';
        title.innerText = "Manage AI";
        if (('gpu' in navigator)) {
            const group1 = UI.create('div', content, 'box-group');
            const appearbar = UI.leftRightLayout(group1);
            appearbar.left.innerHTML = '<span class="smalltxt">AI features</span>';
            const enableBtn = UI.button(appearbar.right, 'Enable', 'ui-med-btn wide');
            const disableBtn = UI.button(appearbar.right, 'Disable', 'ui-med-btn wide');
            disableBtn.addEventListener('click', async function () {
                if (sys.LLMLoaded !== false) {
                    const areyousure = UI.create('div', document.body, 'cm');
                    UI.text(areyousure, 'Are you sure?', 'bold');
                    UI.text(areyousure, 'WebDesk will reboot if you disable AI features.');
                    const yes = UI.button(areyousure, 'Disable', 'ui-med-btn');
                    yes.addEventListener('click', async function () {
                        set.write('chloe', 'deactivated');
                        window.location.reload();
                    });

                    const no = UI.button(areyousure, 'Cancel', 'ui-med-btn');
                    no.addEventListener('click', async function () {
                        UI.remove(areyousure);
                    });
                } else {
                    UI.text(areyousure, 'AI features are already turned off.');
                }
            });

            enableBtn.addEventListener('click', async function () {
                if (sys.LLMLoaded === false) {
                    wd.startLLM();
                }
            });

            UI.line(group1);

            const appearbar3 = UI.leftRightLayout(group1);
            let cacheArrays = ['webllm/config', 'webllm/wasm', 'webllm/model'];
            appearbar3.left.innerHTML = `<span class="smalltxt">Calculating size, please wait...</span>`;

            const DELETEBTN = UI.button(appearbar3.right, 'Delete LLMs', 'ui-med-btn');
            DELETEBTN.addEventListener('click', async function () {
                const areyousure = UI.create('div', document.body, 'cm');
                UI.text(areyousure, 'Are you sure?', 'bold');
                UI.text(areyousure, 'WebDesk will reboot once LLMs are deleted. If AI features are on, the default LLM will redownload.');
                const yes = UI.button(areyousure, 'Delete cache', 'ui-med-btn');
                yes.addEventListener('click', async function () {
                    for (const cacheName of cacheArrays) {
                        const deleted = await caches.delete(cacheName);
                        console.log(`Cache "${cacheName}" deleted:`, deleted);
                    }

                    set.del('LLMModel');
                    window.location.reload();
                });

                const no = UI.button(areyousure, 'Cancel', 'ui-med-btn');
                no.addEventListener('click', async function () {
                    UI.remove(areyousure);
                });
            });

            const group2 = UI.create('div', content, 'box-group');
            const appearbar2 = UI.leftRightLayout(group2);
            appearbar2.left.innerHTML = '<span class="smalltxt">LLM to use</span>';
            let modeln = await set.read('LLMModel');
            if (modeln === undefined) modeln = "Qwen2.5-1.5B-Instruct-q4f32_1-MLC";
            const dropBtn = UI.button(appearbar2.right, UI.truncate(modeln, 25), 'ui-med-btn wide');
            dropBtn.dropBtnDecor();

            dropBtn.addEventListener('click', async function () {
                const rect = dropBtn.getBoundingClientRect();
                const event = {
                    clientX: Math.floor(rect.left),
                    clientY: Math.floor(rect.bottom)
                };

                const menu = UI.rightClickMenu(event);
                menu.style.width = `${Math.floor(rect.width) - 10}px`;
                if (sys.LLMLoaded === false) {
                    UI.text(menu, 'Enable AI features to choose LLMs.', 'smalltxt');
                } else {
                    menu.style.height = "350px";
                    const models = sys.LLM.listModels();
                    const btn2 = UI.button(menu, 'Default', 'ui-small-btn wide');
                    btn2.addEventListener('click', async function () {
                        set.del('LLMModel');
                        await sys.LLM.deactivate();
                        dropBtn.Filler.innerText = UI.truncate('Qwen2.5-1.5B-Instruct-q4f32_1-MLC', 25);
                        await wd.startLLM();
                    });
                    models.forEach(function (model) {
                        if (model.toLowerCase().includes("chat") || model.toLowerCase().includes("instruct")) {
                            const btn = UI.button(menu, model, 'ui-small-btn wide');
                            btn.addEventListener('click', function () {
                                const rebootmsg = UI.create('div', document.body, 'cm');
                                UI.text(rebootmsg, 'Use this model? WebDesk will restart.', 'bold');
                                const match = model.match(/(\d+(?:\.\d+)?)B/i);
                                const size = match ? parseFloat(match[1]) : 0;

                                if (size < 1.1) {
                                    UI.text(rebootmsg, `This model has limited knowledge and might struggle with complex tasks. It runs well on most modern devices.`);
                                } else if (size > 5.1) {
                                    UI.text(rebootmsg, `THIS MODEL IS HUGE. It'll do nearly everything but requires high-end hardware to run smoothly.`);
                                } else {
                                    UI.text(rebootmsg, `This is a mid-sized model. It can handle most tasks with careful prompting, but low-end hardware may struggle.`);
                                }
                                UI.text(rebootmsg, `Each model acts differently.`);

                                UI.text(rebootmsg, UI.LLMName + ' will restart and use the new model from now on.');

                                const reboot = UI.button(rebootmsg, 'Restart and use model', 'ui-med-btn');
                                reboot.addEventListener('click', async function () {
                                    set.write('LLMModel', model);
                                    window.location.reload();
                                });

                                const close = UI.button(rebootmsg, `Cancel`, 'ui-med-btn');
                                close.addEventListener('click', function () {
                                    UI.remove(rebootmsg);
                                });
                            });
                        }
                    });
                }
            });

            UI.line(group2);

            const appearbar4 = UI.leftRightLayout(group2);
            appearbar4.left.innerHTML = `<span class="smalltxt">BE CAREFUL</span>`;

            const changePrompt = UI.button(appearbar4.right, 'Change Prompt', 'ui-med-btn');
            changePrompt.addEventListener('click', async function () {
                const code = await fs.read('/apps/TextEdit.app/index.js');
                const mod = await core.loadModule(code);
                const textedit = await mod.launch(UI, fs);
                textedit.open('/system/llm/prompt.txt');
            });

            await getTotalCacheSize(cacheArrays)
                .then(sizeBytes => {
                    const cacheSizeGB = (sizeBytes / (1024 ** 3)).toFixed(2);
                    appearbar3.left.innerHTML = `<span class="smalltxt">Installed LLMs: ${cacheSizeGB} GB</span>`;
                });
        } else {
            UI.text(content, `Your browser doesn't support WebGPU, so no AI features can be used.`);
            UI.text(content, `Use Chrome/a Chrome-based browser to enable AI features.`);
        }
    }

    function Personalize() {
        content.innerHTML = '';
        title.innerText = "Personalization";
        const group1 = UI.create('div', content, 'box-group');
        const appearbar = UI.leftRightLayout(group1);
        appearbar.left.innerHTML = '<span class="smalltxt">Appearance</span>';

        const lightBtn = UI.button(appearbar.right, 'Light', 'ui-med-btn wide');
        lightBtn.addEventListener('click', () => {
            UI.System.lightMode();
            set.write('appearance', 'light');
        });
        const darkBtn = UI.button(appearbar.right, 'Dark', 'ui-med-btn wide');
        darkBtn.addEventListener('click', () => {
            UI.System.darkMode();
            set.write('appearance', 'dark');
        });

        const autoBtn = UI.button(appearbar.right, 'Auto', 'ui-med-btn wide');
        autoBtn.addEventListener('click', () => {
            const prefersDarkScheme = window.matchMedia("(prefers-color-scheme: dark)");
            if (prefersDarkScheme.matches) {
                UI.System.darkMode();
            } else {
                UI.System.lightMode();
            }
            set.write('appearance', 'auto');
        });

        UI.line(group1);

        const accentbar = UI.leftRightLayout(group1);
        accentbar.left.innerHTML = '<span class="smalltxt">Accent color</span>';
        // Accent color buttons based off https://developer.apple.com/design/human-interface-guidelines/color
        const colors = [
            '175,82,222',   // Purple
            '0,122,255',   // Blue
            '90,200,250',  // Light Blue
            '52,199,89',   // Green
            '255,204,0',   // Yellow
            '255,149,0',   // Orange
            '255,45,85',   // Red
        ];

        colors.forEach(color => {
            const colorButton = UI.button(accentbar.right, '', 'accent-button');
            colorButton.style.backgroundColor = "rgb(" + color + ")";
            colorButton.addEventListener('click', () => {
                UI.changevar('ui-accent', color);
                set.write('accent', color);
            });
        });

        const group2 = UI.create('div', content, 'box-group');
        const group2bar = UI.leftRightLayout(group2);
        group2bar.left.innerHTML = '<span class="smalltxt">Wallpaper</span>';

        const randomBlobWall = UI.button(group2bar.right, 'Use dynamic', 'ui-med-btn');
        randomBlobWall.addEventListener('click', function () {
            UI.System.generateBlobWallpaper();
        });

        const uploadWall = UI.button(group2bar.right, 'Upload', 'ui-med-btn');
        uploadWall.addEventListener('click', function () {
            UI.System.generateBlobWallpaper();
        });
    }

    let claustrophobic = false;

    function DynamicResize() {
        if (win.win.style.width < "450px") {
            if (claustrophobic === false) {
                claustrophobic = true;
                UI.menuSlide(sidebar, "setup");
                UI.menuSlide(sidebar, false);
                container.style.transition = "background 0.25s ease-in-out";
                container.style.backgroundColor = "rgba(0, 0, 0, 0)";
                setTimeout(function () {
                    win.win.appendChild(win.header);
                    win.win.appendChild(win.content);
                    win.header.classList.remove('window-header-clear');
                    win.header.style.padding = "10px";
                    win.headertxt.appendChild(title);
                    showSideBar = UI.button(win.headertxt, '☰', 'ui-med-btn');
                    showSideBar.style.marginLeft = "5px";
                    sidebar.classList.add('sidebar-compacted');
                    showSideBar.addEventListener('click', () => {
                        UI.menuSlide(sidebar);
                    });
                }, 250);
            }
        } else {
            if (claustrophobic === true) {
                claustrophobic = false;
                sidebar.classList.remove('sidebar-compacted');
                win.header.classList.add('window-header-clear');
                win.header.style.padding = "14px";
                win.header.style.paddingBottom = "4px";
                sidebar.style.display = "inline-block";
                UI.remove(showSideBar);
                titleCont.appendChild(title);
                sidebarWinBtnDiv.appendChild(win.header);
                container.style.backgroundColor = "rgba(var(--ui-primary), 1.0)";
                UI.menuSlide(sidebar, true);
                setTimeout(function () {
                    UI.menuSlide(sidebar, "stop");
                }, 250);
            }
        }
    }

    resizeObserver = new ResizeObserver(() => {
        DynamicResize();
    });

    resizeObserver.observe(win.win);

    win.updateWindow();
    DynamicResize();

    return {
        General: General(),
        Assistant: Assistant(),
        Personalize: Personalize(),
        DynamicResize: DynamicResize(),
    };
}

export async function close() {
    fs.rm('/tmp/settings-open');
    core2.removeModule(id);
    resizeObserver.unobserve(win.win);
    UI.remove(win.win);
    win = undefined;
}