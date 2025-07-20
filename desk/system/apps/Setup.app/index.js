export async function launch(UI, fs, Scripts) {
    const setupflexcontainer = UI.create('div', document.body, 'setup-flex-container');
    const setup = UI.create('div', setupflexcontainer, 'setup-window');
    UI.text(setup, "Welcome to WebDesk");
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
                UI.text(setup, "Migration skipped. Click Next to continue.");
            });
            const migrateBtn = UI.button(setup, "Migrate", "ui-main-btn");
            migrateBtn.addEventListener('click', async () => {
                status.innerText = "Getting file paths...";
                const all = await fs2.getall();
                status.innerText = "Converting and rewriting files...";
                all.forEach(async (file) => {
                    console.log(file);
                });
            });
        } else {

        }
    }
}