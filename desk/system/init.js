Scripts.loadCSS('/system/style.css');
Scripts.loadJS('/system/core.js');
Scripts.loadJS('/system/lib/socket.io.js');
(async function () {
    const checkSockets = await startsockets();
    if (await set.read('setupdone') !== "true") {
        if (checkSockets === true) {
            const setup = await Scripts.loadModule(await fs.read('/system/apps/Setup.app/index.js'));
            await setup.launch(UI, fs, Scripts);
        } else {
            const setupflexcontainer = UI.create('div', document.body, 'setup-flex-container');
            const setup = UI.create('div', setupflexcontainer, 'setup-window');
            UI.text(setup, "Welcome to WebDesk!");
            UI.text(setup, "WebDesk's server is down, so setup can't continue. Continue as guest?");
            const btn = UI.button(setup, "Reboot", "ui-main-btn");
            btn.addEventListener('click', () => {
                window.location.reload();
            });

            const guestBtn = UI.button(setup, "Guest", "ui-main-btn");
            guestBtn.addEventListener('click', async () => {
                await set.write('setupdone', 'true');
                await set.write('guest', 'true');
                UI.remove(setupflexcontainer);
                const desktop = await fs.read('/system/apps/Desktop.app/index.js');
                Scripts.loadModule(desktop).then(async (mod) => {
                    if (('gpu' in navigator)) {
                        if (await set.read('chloe') !== "deactivated") {
                            wd.startLLM();
                        }
                    } else {
                        sys.LLMLoaded = "unsupported";
                    }
                    mod.launch(UI, fs, Scripts);
                });
            });
        }
    } else {
        const desktop = await fs.read('/system/apps/Desktop.app/index.js');
        Scripts.loadModule(desktop).then(async (mod) => {
            if (('gpu' in navigator)) {
                if (await set.read('chloe') !== "deactivated") {
                    wd.startLLM();
                }
            } else {
                sys.LLMLoaded = "unsupported";
            }
            mod.launch(UI, fs, Scripts);
        });
        const acc = await set.read('accent');
        if (acc) UI.changevar('ui-accent', acc);
        const appear = await set.read('appearance');
        if (appear === "dark") UI.System.darkMode();
        const lowdevice = await set.read('lowend');
        if (lowdevice === "true") UI.System.lowgfxMode(true);
    }
})();

async function startsockets() {
    const devsocket = await set.read('devsocket');
    return new Promise((resolve) => {
        try {
            if (sys.socket) {
                sys.socket.disconnect();
                sys.socket = undefined;
            }

            if (devsocket === "true") {
                sys.socket = io('wss://webdeskbeta.meower.xyz/');
                UI.notif('Using beta socket server', 'This is for testing purposes only and might not even be online.');
            } else {
                sys.socket = io("wss://webdesk.meower.xyz/");
            }

            const timeout = setTimeout(() => {
                console.log('<!> Connection timeout: No response in 6 seconds');
                sys.socket.disconnect();
                sys.socket = undefined;
                resolve(false);
            }, 6000);

            /* if (params.get('listen') === "yes") {
                sys.socket.onAny((event, ...args) => {
                    console.log(`Received event: ${event}`, args);
                });
            } */

            sys.socket.on('connect_error', (error) => {
                clearTimeout(timeout);
                console.log('<!> Connection error: ', error);
                sys.socket.disconnect();
                sys.socket = undefined;
                resolve(false);
                webid.priv = -1;
            });

            sys.socket.on("servmsg", (data) => {
                UI.snack(data);
            });

            sys.socket.on("error", (data) => {
                if (data == "No token provided" && sys.setupd === false) {
                    console.log(`<!> Quiet error: ` + data);
                } else {
                    UI.snack(data);
                }
            });

            sys.socket.on("force_update", (data) => {
                window.location.reload();
            });

            sys.socket.on("connect", async () => {
                clearTimeout(timeout);
                const token = await fs.read('/user/info/token');
                console.log('<i> Connected to WebDesk server');
                if (token) {
                    sys.socket.emit("login", token);
                } else {
                    console.log('<!> No token');
                }
                resolve(true);
            });

            sys.socket.on("checkback", async (thing) => {
                if (thing.error === true) {
                    await fs.del('/user/info/token');
                    window.location.reload();
                } else {
                    sys.name = thing.username;
                    sd = thing.username;
                    await set.write('name', thing.username);
                    webid.token = await fs.read('/user/info/token');
                    webid.priv = thing.priv;
                    webid.userid = thing.userid;
                    if (thing.priv === 0) {
                        UI.notif('Your account has been limited.', `You can still use WebDesk normally, but you can't use online services.`);
                    }
                    console.log(`<i> Logged in!
- Username: ${thing.username}
- Account permission level: ${thing.priv}
- UserID: ${thing.userid}
- Token: ${UI.truncate(webid.token, 8)}`);
                }
                resolve(true);
            });
        } catch (error) {
            console.log(error);
            if (sys.socket) {
                sys.socket.disconnect();
                sys.socket = undefined;
            }
            resolve(false);
        }
    });
}