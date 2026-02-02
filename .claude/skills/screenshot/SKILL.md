---
name: screenshot
description: View the most recent screenshot from the Screenshots folder. Use when the user invokes /screenshot to look at their latest screenshot.
user_invocable: true
---

Find and view the most recent screenshot from the user's Screenshots folder.

## Steps

1. Use the Bash tool to list files in `C:\Users\yamin\Pictures\Screenshots` sorted by modification time (most recent first), and get the filename of the newest file:
   ```
   powershell -Command "Get-ChildItem 'C:\Users\yamin\Pictures\Screenshots' -File | Sort-Object LastWriteTime -Descending | Select-Object -First 1 -ExpandProperty FullName"
   ```

2. Use the Read tool to open and view that file (the Read tool supports viewing images).

3. Describe what you see in the screenshot and ask the user what they'd like to do with it.
