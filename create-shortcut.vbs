Set objShell = CreateObject("WScript.Shell")
Set objFSO = CreateObject("Scripting.FileSystemObject")

' Get script directory
strScriptPath = objFSO.GetParentFolderName(WScript.ScriptFullName)

' Desktop path
strDesktop = objShell.SpecialFolders("Desktop")

' Create shortcut
Set objShortcut = objShell.CreateShortcut(strDesktop & "\MyMusic Player.lnk")
objShortcut.TargetPath = strScriptPath & "\MyMusic Player.vbs"
objShortcut.WorkingDirectory = strScriptPath
objShortcut.IconLocation = strScriptPath & "\public\favicon.ico"
objShortcut.Description = "MyMusic Player"
objShortcut.Save

MsgBox "Shortcut created on Desktop!", vbInformation, "Success"
