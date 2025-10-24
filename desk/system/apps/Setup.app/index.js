export var name = "Setup Assistant";

var UI2;

export async function close() {
    UI.snack(`Setup Assistant can't be closed.`);
}

export async function launch(UI, fs, core) {
    UI2 = UI;
    const blob = await fs.read('/system/lib/wallpaper.jpg');
    if (blob instanceof Blob) {
        const imageUrl = URL.createObjectURL(blob);
        document.body.style.backgroundImage = `url('${imageUrl}')`;
    } else {
        console.log(`<!> /system/lib/wallpaper.jpg is not an image decodable by WebDesk's UI.`);
        UI.System.generateBlobWallpaper();
    }
    const setupflexcontainer = UI.create('div', document.body, 'setup-flex-container');
    const setup = UI.create('div', setupflexcontainer, 'setup-window');
    UI.text(setup, "Welcome to WebDesk!");
    const alrSetup = await set.read('setupdone');
    if (alrSetup === "true") {
        const btn = UI.button(setup, "Exit", "ui-big-btn");
        btn.addEventListener('click', () => {
            UI.remove(setupflexcontainer);
        });
    }

    const btn = UI.button(setup, "Next", "ui-big-btn");
    btn.addEventListener('click', () => {
        migratePane();
    });

    async function migratePane() {
        setup.innerHTML = '';
        UI.text(setup, "Examining WebDesk...");
        const oldfs = document.createElement('script');
        oldfs.src = './migratefs.js';
        document.body.appendChild(oldfs);

        oldfs.onload = async () => {
            setTimeout(async () => {
                const existing = await fs3.read('/user/info/config.json');
                const existing2 = await fs3.read('/system/webdesk');
                setup.innerHTML = '';
                if (existing && existing2) {
                    UI.text(setup, "Welcome back!");
                    const status = UI.text(setup, "Copy data from old WebDesk to new WebDesk? This might take a while, files need to be converted.");
                    const skipBtn = UI.button(setup, "Skip", "ui-big-btn");
                    skipBtn.addEventListener('click', () => {
                        logIn();
                    });
                    const migrateBtn = UI.button(setup, "Migrate", "ui-big-btn");
                    migrateBtn.addEventListener('click', async () => {
                        status.innerText = "Getting file paths...";
                        const all = await fs3.getall();
                        let counter = 0;
                        all.forEach(async (file) => {
                            counter++;
                            status.innerText = counter + "/" + all.length + ": " + file;
                            if (file.startsWith('/system/' || file.startsWith('/apps/') || file === '/user/info/config.json')) {
                                return;
                            } else {
                                console.log(file);
                                const data = await fs3.read(file);
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

                        async function checkIfToken() {
                            const checkForToken = await fs.read('/user/info/token');
                            if (checkForToken) {
                                llmStatus();
                            } else {
                                logIn();
                            }
                        }

                        const whatnow = UI.create('div', setup, 'cm');
                        UI.text(whatnow, "Migration complete!", 'bold');
                        UI.text(whatnow, "Decide what to do with your old data.");
                        UI.text(whatnow, "Delete: Erases old WebDesk and it's data. User files have moved here, so they're safe.");
                        UI.text(whatnow, "Leave alone: Saves old WebDesk so you can boot into it later. Uses more space.");
                        const delBtn = UI.button(whatnow, "Delete", "ui-big-btn");
                        delBtn.addEventListener('click', async () => {
                            await fs3.erase();
                            checkIfToken();
                            UI.snack('Erased old WebDesk.');
                        });

                        const leaveBtn = UI.button(whatnow, "Leave alone", "ui-big-btn");
                        leaveBtn.addEventListener('click', async () => {
                            checkIfToken();
                        });
                    });
                } else {
                    logIn();
                }
            }, 1000);
        };
    }

    async function logIn() {
        setup.innerHTML = '';
        const changeTxt2 = UI.text(setup, "");
        changeTxt2.style.marginBottom = '10px';
        const changeTxt = UI.create('span', changeTxt2);
        changeTxt.innerText = "Create a WebDesk account ";
        const switchBtn = UI.button(changeTxt2, "Login instead", "ui-small-btn");
        const username = UI.input(setup, "Username", "ui-main-input wide", "text");
        const password = UI.input(setup, "Password", "ui-main-input wide", "password");
        const loginBtn = UI.button(setup, "Create account", "ui-big-btn");

        function switchToLogin() {
            changeTxt.innerText = "Sign into your WebDesk account ";
            switchBtn.Filler.innerText = "Create account instead";
            loginBtn.Filler.innerText = "Sign in instead";
            switchBtn.removeEventListener('click', switchToLogin);
            switchBtn.addEventListener('click', switchToCreation);
            loginBtn.removeEventListener('click', createAccount);
            loginBtn.addEventListener('click', loginToAccount);
        }

        function switchToCreation() {
            changeTxt.innerText = "Create a WebDesk account ";
            switchBtn.Filler.innerText = "Login instead";
            loginBtn.Filler.innerText = "Create account";
            switchBtn.removeEventListener('click', switchToCreation);
            switchBtn.addEventListener('click', switchToLogin);
            loginBtn.removeEventListener('click', loginToAccount);
            loginBtn.addEventListener('click', createAccount);
        }

        function loginToAccount() {
            if (username && password) {
                sys.socket.emit("signin", { user: username.value, pass: password.value });
            } else {
                wm.snack("Please enter both username and password.");
            }
        }

        function createAccount() {
            if (username && password) {
                sys.socket.emit("newacc", { user: username.value, pass: password.value });
            } else {
                wm.snack("Enter both username and password.");
            }
        }

        sys.socket.on("logininstead", () => {
            const menu = UI.create('div', setup, 'cm');
            UI.text(menu, "You already have an account! Log in as " + username.value + "?");

            const noBtn = UI.button(menu, "Close", "ui-big-btn");
            noBtn.addEventListener('click', () => {
                UI.remove(menu);
            });

            const yesBtn = UI.button(menu, "Log in", "ui-big-btn");
            yesBtn.addEventListener('click', () => {
                sys.socket.emit("signin", { user: username.value, pass: password.value });
                UI.remove(menu);
            });
        });

        sys.socket.on("token", ({ token }) => {
            fs.write('/user/info/token', token);
            console.log('<i> Token received: ' + UI.truncate(token, 7));
            warnings();
        });

        switchToCreation();
    }

    async function warnings() {
        setup.innerHTML = '';
        UI.text(setup, 'Warnings');

        if (sys.OPFSSupported === false) {
            const compatDiv = UI.create('div', setup, 'message-box-group okay');
            UI.text(compatDiv, `Warning - Filesystem`, 'bold');
            UI.text(compatDiv, `Your browser doesn't support OPFS (Origin Private File System). Some features will be missing, and there might be bugs.`);
        }

        if (!navigator.gpu) {
            const compatDiv = UI.create('div', setup, 'message-box-group okay');
            UI.text(compatDiv, `Warning - AI features`, 'bold');
            UI.text(compatDiv, `Your browser doesn't support WebGPU. AI features can't be used in this browser.`);
        }

        const doneBtn = UI.button(setup, "Okay", "ui-big-btn");
        doneBtn.addEventListener('click', () => {
            llmStatus();
        });
    }

    async function llmStatus() {
        setup.innerHTML = '';
        UI.text(setup, "Assistant");
        UI.text(setup, `WebDesk now includes an assistant called Chloe! It can summarize documents, notifications, write basic essays, etc. It has a status light in the taskbar that you can check:`);

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

        UI.text(setup, `*Ability to use AI features depends on your graphics performance.`, 'smalltxt');

        const doneBtn = UI.button(setup, "Got it", "ui-big-btn");
        const deactivateAIBtn = UI.button(setup, "Deactivate AI features", "ui-big-btn");
        doneBtn.addEventListener('click', () => {
            set.write('setupdone', 'true');
            window.location.reload();
        });

        function deactivateAI() {
            set.write('setupdone', 'true');
            set.write('chloe', 'deactivated');
            UI.snack('AI features deactivated. You can reactivate them in Settings > Manage AI.');
            deactivateAIBtn.Filler.innerText = "Reactivate AI features";
            deactivateAIBtn.removeEventListener('click', deactivateAI);
            deactivateAIBtn.addEventListener('click', reactivateAI);
        }

        function reactivateAI() {
            set.write('setupdone', 'true');
            set.del('chloe');
            UI.snack('AI features reactivated. You can deactivate them in Settings > Manage AI.');
            deactivateAIBtn.Filler.innerText = "Deactivate AI features";
            deactivateAIBtn.removeEventListener('click', reactivateAI);
            deactivateAIBtn.addEventListener('click', deactivateAI);
        }

        deactivateAIBtn.addEventListener('click', deactivateAI);
    }

    migratePane();
}