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
}