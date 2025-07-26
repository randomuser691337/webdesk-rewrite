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
    const llmButton = UI.button(sidebarcontent, 'Manage Assistant', 'ui-med-btn wide');
    llmButton.addEventListener('click', () => {
        Assistant();
    });

    const container = UI.create('div', win.content, 'window-split-content');
    const title = UI.create('div', container, 'window-draggable');
    const content = UI.create('div', container);
    content.style.paddingTop = "4px";

    function General() {
        content.innerHTML = '';
        title.innerText = "General";
        const group1 = UI.create('div', content, 'box-group');
        const eraseBtn = UI.button(group1, 'Erase WebDesk', 'ui-main-btn wide');
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
            set.set('appearance', 'light');
        });
        const darkBtn = UI.button(appearbar.right, 'Dark', 'ui-main-btn wide');
        darkBtn.style.margin = "0px 0px 0px 4px";
        darkBtn.addEventListener('click', () => {
            UI.System.darkMode();
            set.set('appearance', 'dark');
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
                set.set('accent', color);
            });
        });
    }

    win.updateWindow();
    return {

    };
}