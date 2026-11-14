; WibeMusic desktop installer. Built by build-installer.ps1 (passes /DStageDir and /DRoot).
#define AppName "WibeMusic"
#define AppVersion "0.1.0"

[Setup]
AppId={{6F1B8D2A-3C4E-4A9B-8E7D-2B5C9A0F1E34}
AppName={#AppName}
AppVersion={#AppVersion}
AppPublisher=WibeMusic
DefaultDirName={autopf}\{#AppName}
DefaultGroupName={#AppName}
DisableProgramGroupPage=yes
OutputBaseFilename=WibeMusic-Setup
Compression=lzma2
SolidCompression=yes
ArchitecturesInstallIn64BitMode=x64compatible
PrivilegesRequired=admin
UninstallDisplayIcon={app}\python\python.exe
SetupIconFile=wibemusic.ico

[Languages]
Name: "russian"; MessagesFile: "compiler:Languages\Russian.isl"

[Tasks]
Name: "desktopicon"; Description: "Создать значок на рабочем столе"; GroupDescription: "Дополнительно:"
Name: "autostart"; Description: "Запускать WibeMusic при входе в Windows"; GroupDescription: "Дополнительно:"

[Files]
Source: "{#StageDir}\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{group}\{#AppName}"; Filename: "{app}\python\python.exe"; Parameters: """{app}\launcher.py"""; WorkingDir: "{app}"
Name: "{group}\Остановить {#AppName}"; Filename: "{app}\python\python.exe"; Parameters: """{app}\launcher.py"" --stop"; WorkingDir: "{app}"
Name: "{autodesktop}\{#AppName}"; Filename: "{app}\python\python.exe"; Parameters: """{app}\launcher.py"""; WorkingDir: "{app}"; Tasks: desktopicon

[Registry]
Root: HKCU; Subkey: "Software\Microsoft\Windows\CurrentVersion\Run"; ValueType: string; ValueName: "WibeMusic"; ValueData: """{app}\python\pythonw.exe"" ""{app}\launcher.py"""; Flags: uninsdeletevalue; Tasks: autostart

[Run]
Filename: "{app}\python\python.exe"; Parameters: """{app}\launcher.py"""; Description: "Запустить {#AppName}"; Flags: nowait postinstall skipifsilent

[UninstallRun]
Filename: "{app}\python\python.exe"; Parameters: """{app}\launcher.py"" --stop"; Flags: runhidden; RunOnceId: "StopWibeMusic"

[UninstallDelete]
Type: filesandordirs; Name: "{app}\hub\.venv"
