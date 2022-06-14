!include FileFunc.nsh
!include LogicLib.nsh


Name "${PRODUCT_NAME}-Delta-Updater"
OutFile "${INSTALLER_OUTPUT_PATH}"
RequestExecutionLevel user
ShowInstDetails show
Unicode true

Icon "${PRODUCT_ICON_PATH}"
SilentInstall normal

InstallDir "$LocalAppData\Programs\${PRODUCT_NAME}-delta-updater"

Var /GLOBAL appPath
Var /GLOBAL norestart

# avoid exit code 2
!macro quitSuccess
  SetErrorLevel 0
  Quit
!macroend

Function StrStrip
Exch $R0 #string
Exch
Exch $R1 #in string
Push $R2
Push $R3
Push $R4
Push $R5
 StrLen $R5 $R0
 StrCpy $R2 -1
 IntOp $R2 $R2 + 1
 StrCpy $R3 $R1 $R5 $R2
 StrCmp $R3 "" +9
 StrCmp $R3 $R0 0 -3
  StrCpy $R3 $R1 $R2
  IntOp $R2 $R2 + $R5
  StrCpy $R4 $R1 "" $R2
  StrCpy $R1 $R3$R4
  IntOp $R2 $R2 - $R5
  IntOp $R2 $R2 - 1
  Goto -10
  StrCpy $R0 $R1
Pop $R5
Pop $R4
Pop $R3
Pop $R2
Pop $R1
Exch $R0
FunctionEnd
!macro StrStrip Str InStr OutVar
 Push '${InStr}'
 Push '${Str}'
  Call StrStrip
 Pop '${OutVar}'
!macroend
!define StrStrip '!insertmacro StrStrip'

Section "gen_package" SEC01

    ${GetParameters} $0
    ${GetOptions} '$0' "/appPath=" $appPath

    ${GetParameters} $0
    ${GetOptions} '$0' "/norestart=" $norestart

    DetailPrint "message: appPath: $appPath"
    DetailPrint "message: norestart: $norestart"
    DetailPrint "message: args: $0"

    SetDetailsPrint both
	  nsProcess::_KillProcess "${PROCESS_NAME}.exe" $R0
    Pop $R0
    nsProcess::_Unload

    SetOutPath $INSTDIR

    RMDir /r $INSTDIR

    File "hpatchz.exe"
    File "${DELTA_FILE_PATH}"

    nsExec::ExecToLog '"$INSTDIR\hpatchz.exe" -C-all "$appPath" "$INSTDIR\${DELTA_FILE_NAME}" "$INSTDIR\${PRODUCT_NAME}" -f'
    DetailPrint $0
    Pop $0

    ${StrStrip} "${PRODUCT_NAME}" $appPath $appPath ; remove the product name from the path

    CopyFiles /SILENT "$INSTDIR\${PRODUCT_NAME}" "$appPath" 264080

    ; WriteRegStr SHELL_CONTEXT "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\${APP_GUID}" DisplayName "${PRODUCT_NAME}"
    ; WriteRegDWORD SHELL_CONTEXT "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\${APP_GUID}" "EstimatedSize" "${NEW_APP_SIZE}"
    ; WriteRegStr SHELL_CONTEXT "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\${APP_GUID}" "DisplayVersion" "${NEW_APP_VERSION}"



    ${If} $norestart == "1"
      DetailPrint "/norestart switch found"
    ${Else}
      ShellExecAsUser::ShellExecAsUser "" "$appPath\${PROCESS_NAME}.exe" "--updated"
    ${EndIf}

    !insertmacro quitSuccess
SectionEnd