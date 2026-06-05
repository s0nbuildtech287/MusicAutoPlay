Set objShell = CreateObject("WScript.Shell")
Set objFSO = CreateObject("Scripting.FileSystemObject")

' Get script directory
strScriptPath = objFSO.GetParentFolderName(WScript.ScriptFullName)

' Desktop path
strDesktop = objShell.SpecialFolders("Desktop")

' Create shortcut
Set objShortcut = objShell.CreateShortcut(strDesktop & "\Lotusquant Music.lnk")
objShortcut.TargetPath = strScriptPath & "\Lotusquant Music.vbs"
objShortcut.WorkingDirectory = strScriptPath
objShortcut.IconLocation = strScriptPath & "\public\favicon.ico"
objShortcut.Description = "Lotusquant Music Player"
objShortcut.Save

MsgBox "Shortcut created on Desktop!", vbInformation, "Success"
