Set objShell = CreateObject("WScript.Shell")
Set objFSO = CreateObject("Scripting.FileSystemObject")

' Get script directory
strScriptPath = objFSO.GetParentFolderName(WScript.ScriptFullName)

' Change to script directory
objShell.CurrentDirectory = strScriptPath

' Run npm start in hidden window
objShell.Run "cmd /c npm start", 0, False
