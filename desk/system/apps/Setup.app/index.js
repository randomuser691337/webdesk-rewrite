export async function launch(UI, fs, Scripts) {
    const setupflexcontainer = UI.create('div', document.body, 'setup-flex-container');
    const setup = UI.create('div', setupflexcontainer, 'setup-window');
    UI.text(setup, "Welcome to WebDesk!");
    const alrSetup = await set.read('setupdone');
    if (alrSetup === "true") {
        const btn = UI.button(setup, "Exit", "ui-main-btn");
        btn.addEventListener('click', () => {
            UI.remove(setupflexcontainer);
        });
    }

    const btn = UI.button(setup, "Next", "ui-main-btn");
    btn.addEventListener('click', () => {
        migratePane();
    });

    async function migratePane() {
        setup.innerHTML = '';
        UI.text(setup, "Migration Assistant");
        const existing = await fs.read('/user/info/config.json');
        if (existing) {
            const status = UI.text(setup, "Copy data from old WebDesk to new WebDesk? This might take a while, files need to be converted.");
            const skipBtn = UI.button(setup, "Skip", "ui-main-btn");
            skipBtn.addEventListener('click', () => {
                aiSetupPane();
            });
            const migrateBtn = UI.button(setup, "Migrate", "ui-main-btn");
            migrateBtn.addEventListener('click', async () => {
                const oldfs = document.createElement('script');
                oldfs.src = './oldfs.js';
                document.body.appendChild(oldfs);
                oldfs.onload = async () => {
                    setTimeout(async () => {
                        status.innerText = "Getting file paths...";
                        const all = await fs2.getall();
                        let counter = 0;
                        all.forEach(async (file) => {
                            counter++;
                            status.innerText = counter + "/" + all.length + ": " + file;
                            if (file.startsWith('/system/' || data.path.startsWith('/apps/'))) {
                                return;
                            } else {
                                const data = await fs2.read(file);
                                if (data.startsWith('data:')) {
                                    const base64Data = data.split(',')[1];
                                    const byteCharacters = atob(base64Data);
                                    const byteNumbers = new Array(byteCharacters.length);
                                    for (let i = 0; i < byteCharacters.length; i++) {
                                        byteNumbers[i] = byteCharacters.charCodeAt(i);
                                    }
                                    const byteArray = new Uint8Array(byteNumbers);
                                    const blob = new Blob([byteArray], { type: 'image/png' });
                                    await fs.write(file, blob, 'blob');
                                } else {
                                    await fs.write(file, data, 'text');
                                }
                            }
                        });
                    }, 1000); // not fighting with old webdesk
                }
            });
        } else {

        }
    }

    async function llmStatus() {
        setup.innerHTML = '';
        UI.text(setup, "Chloe");
        UI.text(setup, `WebDesk now includes an assistant called Chloe! She can summarize documents, notifications, write basic essays, etc. She has a status light in the taskbar that you can decipher:`);

        const setupR = UI.create('div', setup, 'box-group')

        const normalOpBar = UI.leftRightLayout(setupR);
        const normalOpRing = UI.create('div', normalOpBar.left, 'ring');
        normalOpRing.style.setProperty('--color-start', '#08f');
        normalOpRing.style.setProperty('--color-end', '#00f');
        normalOpRing.style.setProperty('--speed', '4s');
        normalOpBar.right.innerText = "Waiting for commands";

        UI.line(setupR);

        const workingOpBar = UI.leftRightLayout(setupR);
        const workingOpRing = UI.create('div', workingOpBar.left, 'ring');
        workingOpRing.style.setProperty('--color-start', '#fe0');
        workingOpRing.style.setProperty('--color-end', '#fb0');
        workingOpRing.style.setProperty('--speed', '2.5s');
        workingOpBar.right.innerText = "Thinking/Generating";

        UI.line(setupR);

        const startBar = UI.leftRightLayout(setupR);
        const startRing = UI.create('div', startBar.left, 'ring');
        startRing.style.setProperty('--color-start', '#c9f');
        startRing.style.setProperty('--color-end', '#88f');
        startRing.style.setProperty('--speed', '1s');
        startBar.right.innerText = "Starting up/Loading";

        UI.line(setupR);

        const disabledBar = UI.leftRightLayout(setupR);
        const disabledRing = UI.create('div', disabledBar.left, 'ring');
        disabledRing.style.setProperty('--color-start', '#999');
        disabledRing.style.setProperty('--color-end', '#999');
        disabledRing.style.setProperty('--speed', '2.5s');
        disabledBar.right.innerText = "Deactivated/Off";

        UI.line(setupR);

        const errorBar = UI.leftRightLayout(setupR);
        const errorRing = UI.create('div', errorBar.left, 'ring');
        errorRing.style.setProperty('--color-start', '#f00');
        errorRing.style.setProperty('--color-end', '#f00');
        setInterval(() => {
            errorRing.style.setProperty('--color-start', '#f00');
            errorRing.style.setProperty('--color-end', '#f00');

            setTimeout(() => {
                errorRing.style.setProperty('--color-start', 'rgba(0, 0, 0, 0)');
                errorRing.style.setProperty('--color-end', 'rgba(0, 0, 0, 0)');
            }, 300);
        }, 600);
        errorBar.right.innerText = "Error/Problem";
    }

    llmStatus();
}