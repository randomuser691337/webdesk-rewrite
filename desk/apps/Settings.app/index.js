export async function launch(UI, fs, Scripts) {
    const win = UI.window('Settings');
    win.win.style.width = "500px";
    win.win.style.height = "500px";
    win.headertxt.innerHTML = "";
    win.content.style.padding = "0px";
    win.content.style.display = "flex";
    const sidebar = UI.create('div', win.content, 'window-split-sidebar');
    sidebar.appendChild(win.header);
    win.header.classList.add('window-header-clear');
    win.header.style.padding = "14px";
    win.header.style.paddingBottom = "4px";
    const sidebarcontent = UI.create('div', sidebar, 'content');
    sidebarcontent.style.paddingTop = "0px";
    UI.create('span', sidebarcontent, 'smalltxt').textContent = "Settings";

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
    const title = UI.create('div', container, 'window-draggable');
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

    function General() {
        content.innerHTML = '';
        title.innerText = "General";
        const group1 = UI.create('div', content, 'box-group');
        const eraseBtn = UI.button(group1, 'Erase WebDesk', 'ui-main-btn wide');
        const appearbar = UI.leftRightLayout(group1);
        appearbar.left.innerHTML = '<span class="smalltxt">Low-end device mode</span>';
        const enableBtn = UI.button(appearbar.right, 'Enable', 'ui-main-btn wide');
        enableBtn.addEventListener('click', () => {
            UI.System.lowgfxMode(true);
            set.write('lowend', 'true');
        });
        const disableBtn = UI.button(appearbar.right, 'Disable', 'ui-main-btn wide');
        disableBtn.addEventListener('click', () => {
            UI.System.lowgfxMode(false);
            set.write('lowend');
        });
    }

    async function Assistant() {
        content.innerHTML = '';
        title.innerText = "Manage AI";
        if (('gpu' in navigator)) {
            const group1 = UI.create('div', content, 'box-group');
            const appearbar = UI.leftRightLayout(group1);
            appearbar.left.innerHTML = '<span class="smalltxt">AI features</span>';
            const enableBtn = UI.button(appearbar.right, 'Enable', 'ui-main-btn wide');
            const disableBtn = UI.button(appearbar.right, 'Disable', 'ui-main-btn wide');
            disableBtn.addEventListener('click', async function () {
                if (sys.LLMLoaded !== false) {
                    const areyousure = UI.create('div', document.body, 'cm');
                    UI.text(areyousure, 'Are you sure?', 'bold');
                    UI.text(areyousure, 'WebDesk will reboot if you disable AI features.');
                    const yes = UI.button(areyousure, 'Disable', 'ui-main-btn');
                    yes.addEventListener('click', async function () {
                        set.write('chloe', 'deactivated');
                        window.location.reload();
                    });

                    const no = UI.button(areyousure, 'Cancel', 'ui-main-btn');
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

            const DELETEBTN = UI.button(appearbar3.right, 'Delete LLMs', 'ui-main-btn');
            DELETEBTN.addEventListener('click', async function () {
                const areyousure = UI.create('div', document.body, 'cm');
                UI.text(areyousure, 'Are you sure?', 'bold');
                UI.text(areyousure, 'WebDesk will reboot once LLMs are deleted. If AI features are on, the default LLM will redownload.');
                const yes = UI.button(areyousure, 'Delete cache', 'ui-main-btn');
                yes.addEventListener('click', async function () {
                    for (const cacheName of cacheArrays) {
                        const deleted = await caches.delete(cacheName);
                        console.log(`Cache "${cacheName}" deleted:`, deleted);
                    }

                    set.del('LLMModel');
                    window.location.reload();
                });

                const no = UI.button(areyousure, 'Cancel', 'ui-main-btn');
                no.addEventListener('click', async function () {
                    UI.remove(areyousure);
                });
            });

            const group2 = UI.create('div', content, 'box-group');
            const appearbar2 = UI.leftRightLayout(group2);
            appearbar2.left.innerHTML = '<span class="smalltxt">LLM to use</span>';
            let modeln = await set.read('LLMModel');
            if (modeln === undefined) modeln = "SmolLM2-1.7B-Instruct-q4f32_1-MLC";
            const dropBtn = UI.button(appearbar2.right, UI.truncate(modeln, 25), 'ui-main-btn wide');
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
                        dropBtn.Filler.innerText = UI.truncate('SmolLM2-1.7B-Instruct-q4f32_1-MLC', 25);
                        await wd.startLLM();
                    });
                    models.forEach(function (model) {
                        if (model.toLowerCase().includes("chat") || model.toLowerCase().includes("instruct")) {
                            const btn = UI.button(menu, model, 'ui-small-btn wide');
                            btn.addEventListener('click', function () {
                                const rebootmsg = UI.create('div', document.body, 'cm');
                                UI.text(rebootmsg, 'Use this model?', 'bold');
                                const match = model.match(/(\d+(?:\.\d+)?)B/i);
                                const size = match ? parseFloat(match[1]) : 0;

                                if (size < 1.1) {
                                    UI.text(rebootmsg, `This model has limited knowledge and might struggle with complex tasks. It runs well on most modern devices.`);
                                } else if (size > 5.1) {
                                    UI.text(rebootmsg, `THIS MODEL IS HUGE. It'll excel at nearly everything but requires high-end hardware to run smoothly.`);
                                } else {
                                    UI.text(rebootmsg, `This is a mid-sized model. It can handle most tasks with careful prompting, but low-end hardware may struggle.`);
                                }
                                UI.text(rebootmsg, `Each model acts differently.`);

                                UI.text(rebootmsg, 'Chloe will restart and use the new model from now on.');
                                const reboot = UI.button(rebootmsg, 'Use model', 'ui-med-btn');
                                reboot.addEventListener('click', async function () {
                                    set.write('LLMModel', model);
                                    await sys.LLM.deactivate();
                                    dropBtn.Filler.innerText = UI.truncate(model, 25);
                                    await wd.startLLM();
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

            const changePrompt = UI.button(appearbar4.right, 'Change Prompt', 'ui-main-btn');
            changePrompt.addEventListener('click', async function () {
                const code = await fs.read('/apps/TextEdit.app/index.js');
                const mod = await Scripts.loadModule(code);
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
        const lightBtn = UI.button(appearbar.right, 'Light', 'ui-main-btn wide');
        lightBtn.style.margin = "0px 0px 0px 4px";
        lightBtn.addEventListener('click', () => {
            UI.System.lightMode();
            set.write('appearance', 'light');
        });
        const darkBtn = UI.button(appearbar.right, 'Dark', 'ui-main-btn wide');
        darkBtn.style.margin = "0px 0px 0px 4px";
        darkBtn.addEventListener('click', () => {
            UI.System.darkMode();
            set.write('appearance', 'dark');
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
    }

    win.updateWindow();
    return {
        General: General(),
        Assistant: Assistant(),
        Personalize: Personalize()
    };
}