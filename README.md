# Custom Input Box Firefox Extension 🎉
*Bring your input box where you want it—smart, synced, and seamless.*

## Overview
**Custom Input Box Everywhere** is a Firefox browser extension designed to revolutionize how you interact with text input fields on the web. Tired of scrolling to find input boxes stuck at the bottom of a page? This extension brings the input box to you—either as a header bar or a central popup—ensuring a focus-friendly typing experience. Built for the **GDSC Summer '25** project, this extension combines innovative UX design with powerful functionality, including two modes: **Habit Mode** for seamless input syncing and **Advanced Mode** for AI-powered CSS customization.
This browser extension enhances typing UX by introducing a smart floating input box that syncs seamlessly with any focused field. It features two modes: Habit Mode for real-time synced typing, and Advanced Mode for applying AI-powered CSS customization or input summarization using an LLM API. The extension is fully controllable via keyboard shortcuts, making it fast, accessible, and distraction-free. Designed especially for platforms like Gmail where native input positions often disrupt user flow.

---
## Features
- **Habit Mode**: When focusing on any input box, a header bar or popup appears at your preferred position (top or center). Your typing syncs in real-time with the original input field, maintaining the website's UI integrity.
- **Advanced Mode**: Integrates with an LLM API to dynamically modify website CSS, tailoring the input experience to your preferences. It also summarizes long input fields to reduce scrolling.
- **Keyboard Shortcuts**: Toggle the extension or switch between modes effortlessly with customizable keyboard shortcuts.
- **Seamless UX**: Designed to enhance productivity without disrupting the website's layout.
- **Lightweight & Fast**: Built for performance, ensuring minimal impact on browser speed.

---

## Tech Stack

### Core Technologies
- **JavaScript**: Powers the extension's logic, including input syncing and mode toggling.
- **HTML/CSS**: Renders the header bar and popup UI with a clean, modern design.
- **WebExtensions API**: Enables interaction with browser DOM and input fields.
- **LLM API (Advanced Mode)**: Integrates with a user-provided API key (e.g., OpenAI or similar) for CSS modification and input summarization.

### Dependencies
- **Firefox WebExtensions Polyfill**: Ensures compatibility across modern browsers (though primarily built for Firefox).
- **Axios**: For making API calls to the LLM in Advanced Mode.
- **Tailwind CSS** (optional): Used for rapid, responsive styling of the popup and header bar.
- **ESLint**: Ensures clean, consistent code quality.
- **Webpack**: Bundles the extension's assets for optimal performance.

### Development Tools
- **Node.js**: For local development and dependency management.
- **Git**: Version control for collaborative development.
- **VS Code**: Recommended IDE for coding and debugging.

---

## Installation

1. **Clone the Repository**:
   ```bash
   git clone 
   ```

2. **Install Dependencies**:
   Navigate to the project directory and run:
   ```bash
   npm install
   ```

3. **Build the Extension**:
   Bundle the extension files using Webpack:
   ```bash
   npm run build
   ```

4. **Load in Firefox**:
   - Open Firefox and navigate to `about:debugging#/runtime/this-firefox`.
   - Click **Load Temporary Add-on** and select the `manifest.json` file from the `dist` folder.
   - The extension will be loaded and ready to use!

---

## Usage

1. **Activate the Extension**:
   - Use the default keyboard shortcut (`Ctrl+Shift+I` or customizable) to toggle the extension on/off.
   - The extension icon in the Firefox toolbar also toggles the extension.

2. **Habit Mode**:
   - Focus on any input field, and a header bar or central popup will appear.
   - Type in the popup, and your input will sync instantly with the original field.
   - Auto-float input box appears on field focus.
   - Instantly syncs typed text with focused field (textarea, input, or contenteditable).
   - Custom placement: top bar or center modal.


3. **Advanced Mode**:
   - Configure your LLM API key in the extension settings.
   - Enable Advanced Mode via the shortcut (`Ctrl+Shift+A` or customizable).
   - The extension will analyze the website's CSS and suggest modifications for a better input experience.
   - Use the summarization feature to condense long input fields.
   - Accepts LLM prompt commands (like css: or text).
   - Dynamically modifies webpage CSS or summarizes content using Gemini API.
   - Fully async with support for enter-based execution

4. **Customization**:
   - Adjust popup position (top/center) and styling in the settings.
   - Customize keyboard shortcuts via the extension’s options page.

---

## Project Structure

<pre> ```bash
Firefox_Extension/ 
├── manifest.json # Extension configuration (permissions(Also permission realted to API must be added.), scripts, icons) 
├── popup/ 
   │── popup.html # Settings popup UI (toggle modes, enable/disable) 
   └── popup.js # Popup logic (mode switching, shortcut handling)
├── content/
   ├── handlerAll.js # Handles both advance and habit mode (For better function of extension include both mock LLM summarization, CSS manipulation and habit features.) 
   ├── content.css # Styles for custom input box and overlay (styling for both advance and Habit mode).
   └── config.js # Api key End point.
├── background/
   └── background.js # Background script for keyboard shortcuts Ctrl+Shift+N 
├── assets/ 
   ├── icon16.png # 16x16 icon for manifest 
   ├── icon48.png # 48x48 icon for manifest 
   └── icon128.png # 128x128 icon for store 
   
└── README.md # Project documentation 
   ``` </pre>
---

## Development Setup

1. **Prerequisites**:
   - Node.js (v16 or higher)
   - Firefox (latest version recommended)
   - An LLM API key for Advanced Mode (e.g., OpenAI, Grok, etc.)

2. **Run Development Mode**:
   ```bash
   npm run dev
   ```
   This starts Webpack in watch mode for live reloading.

3. **Linting**:
   Ensure code quality with:
   ```bash
   npm run lint
   ```

4. **Testing**:
   - Test the extension in Firefox’s debugging mode (`about:debugging`).
   - Verify syncing in Habit Mode and CSS modifications in Advanced Mode.

---

## Contributing

Contributions are welcome! To contribute:
1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/your-feature`).
3. Commit your changes (`git commit -m "Add your feature"`).
4. Push to the branch (`git push origin feature/your-feature`).
5. Open a Pull Request.
---

## Acknowledgments

- Built as part of **GDSC Summer '25** Project.
- Inspired by the need for better UX in web input fields.
- Thanks to the open-source community for tools like WebExtensions API and Tailwind CSS.

---

## Contact
For questions or feedback, reach out via:
- Email:nikhilsinghhh11@gmail.com
- Email:surbhi_t@es.iitr.ac.in
