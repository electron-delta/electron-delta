!include FileFunc.nsh
!include LogicLib.nsh


Name "${PRODUCT_NAME}-Delta-Updater"
OutFile "${INSTALLER_OUTPUT_PATH}"
RequestExecutionLevel user
ShowInstDetails show
Unicode true

Icon "${PRODUCT_ICON_PATH}"
SilentInstall normal

InstallDir "$LocalAppData\Programs\${PRODUCT_NAME}-delta-updater\"

Var /GLOBAL appPath
Var /GLOBAL norestart

# avoid exit code 2
!macro quitSuccess
  SetErrorLevel 0
  Quit
!macroend

Section "gen_package" SEC01

    ${GetParameters} $0
    ${GetOptions} '$0' "/appPath=" $appPath

    ${GetParameters} $0
    ${GetOptions} '$0' "/norestart" $norestart

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