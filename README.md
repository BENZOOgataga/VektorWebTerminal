![vektor (1)](https://github.com/user-attachments/assets/2332485c-1e6a-45f0-a456-cab4bba8e498)  
**Technical Specification: Web-Based Interactive Terminal Inspired by MobaXterm**

**Objective**: Develop a secure and functional web interface resembling MobaXterm, with a dynamic file explorer on the left, an interactive Debian-like terminal on the right, and optional contextual information panels.

---

**1. General Architecture**

* **Frontend**: React (or Svelte) with TailwindCSS for a fast and clean UI.
* **Backend**: Node.js with Docker or Python (FastAPI) to handle command execution.
* **Communication**: WebSocket for real-time terminal interaction.
* **Isolation**: Each user session runs in a separate Docker container.

---

**2. User Interface**

* **Layout**:

  * **Left Panel**: Dynamic file tree synced with the terminal's current directory.
  * **Right Panel**: Interactive Debian-style terminal (Bash-like behavior).
  * **Bottom or Right Panel (optional)**: Contextual info such as container stats, logs, permissions, etc.

* **Aesthetics**:

  * Dark theme by default.
  * Blinking cursor.
  * Monospace font.
  * Typing animations for realism.

---

**3. Terminal Features**

* Allowed commands: `ls`, `cd`, `cat`, `echo`, `pwd`, `head`, `tail`, `grep`, `tree`, simulated `man`, etc.
* Forbidden commands: `rm`, `sudo`, `apt install`, `reboot`, etc.
* Handles relative and absolute paths.
* Simulated interactive output (line-by-line rendering).

---

**4. File Explorer (Left Panel)**

* Mirrors current terminal location (updated after each `cd`).
* Displays files and directories with icons.
* Clicking a file offers `cat`, `download`, or `open in viewer` options.
* Clicking a folder triggers a `cd` into that directory.

---

**5. Backend / Docker Handling**

* Each session launches a non-root, optionally network-disabled Debian container.
* Containers auto-reset or terminate after X minutes of inactivity.
* A virtual shell parses and executes only allowed commands.
* File access is sandboxed in a limited directory inside the container.

---

**6. Contextual Information Panel (Optional)**

* Shown at the bottom or side:

  * Real-time resource usage (RAM, CPU).
  * Command history.
  * Internal logs (errors, warnings).
  * Current user permissions.
  * User profile (for future integrations).

---

**7. Security**

* All user inputs are validated server-side.
* No network access by default in containers.
* Working directory is mounted read-only, except `/home/user/tmp`.
* Logs all commands and stops container on suspicious activity.

---

**8. Medium-Term Goals**

* Optional session persistence.
* Multi-tab or multi-session support.
* Read-only session sharing (spectator mode).
* Command snippets and custom shortcut integration.

---

**Conclusion**

This terminal is designed as a truly usable tool—suitable for education, demonstrations, or even lightweight cloud-based development. It balances immersive "hacker" aesthetics with strict security and operational reliability.
