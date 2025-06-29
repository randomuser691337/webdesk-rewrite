var wd = {
    container: async function () {
        let win = UI.window('Test');
        UI.remove(win.content);
        win.content = UI.create('iframe', win.win, 'window-content');
        win.content.sandbox = "allow-scripts allow-same-origin allow-popups allow-forms";
        const doc = win.content.contentDocument || win.content.contentWindow.document;
        doc.open()
        const contents = await fs.read('/system/frame.html');
        doc.write(contents);
        doc.close();
        win.content.onload = () => {
            win.content.contentWindow.postMessage({ type: "ping", value: 42 }, "*");
        };
        return { container: win.content, window: win.win };
    }
}