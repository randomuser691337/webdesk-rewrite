(async function () {
    const bootcode = await fs.read("/system/init.js");
    const debugwin = UI.window('Debug Console');
    debugwin.win.style.width = "600px";
    debugwin.win.style.height = "600px";
    
    const p = UI.text(debugwin.content, 'Boot Code');
    const textbox = UI.create("textarea", debugwin.content);
    textbox.placeholder = "Write your boot code here...";
    textbox.style.width = "100%";
    textbox.style.height = "400px";
    
    const savebutton = UI.button(debugwin.content, "Save Boot Code");
    savebutton.onclick = async () => {
        const code = textbox.value;
        if (code) {
            await fs.write("/system/init.js", code, "text");
            p.textContent = 'Boot code saved! Reload to run it.';
            p.style.color = 'green';
        } else {
            p.textContent = 'Please write some boot code!';
            p.style.color = 'red';
        }
    };

    if (bootcode === null) {
        p.style.color = 'red';
    } else {
        textbox.value = bootcode;
    }
})();