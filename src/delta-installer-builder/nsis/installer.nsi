!include FileFunc.nsh
!include LogicLib.nsh

Name "${PRODUCT_NAME}-Delta-Updater"
OutFile "${INSTALLER_OUTPUT_PATH}"
RequestExecutionLevel user
ShowInstDetails nevershow
Unicode true

Icon "${PRODUCT_ICON_PATH}"
SilentInstall silent

InstallDir "$LocalAppData\Programs\${PRODUCT_NAME}-delta-updater"

Var /GLOBAL apppath
Var /GLOBAL restart

# avoid exit code 2
!macro quitSuccess
  SetErrorLevel 0
  Quit
!macroend


Section "gen_package" SEC01

    ${GetParameters} $0
    ${GetOptions} $0 "/APPPATH=" $apppath
    ${GetParameters} $0
    ${GetOptions} $0 "/RESTART=" $restart

    DetailPrint "message: args: $0"
    DetailPrint "message: APPPATH: $apppath"
    DetailPrint "message: RESTART: $restart"


    SetDetailsPrint both
	  nsProcess::_KillProcess "${PROCESS_NAME}.exe" $R0
    Pop $R0
    nsProcess::_Unload

    SetOutPath $INSTDIR

    RMDir /r $INSTDIR

    File "hpatchz.exe"
    File "${DELTA_FILE_PATH}"

    nsExec::ExecToLog '"$INSTDIR\hpatchz.exe" -C-all "$apppath" "$INSTDIR\${DELTA_FILE_NAME}" "$apppath" -f'
    DetailPrint $0
    Pop $0



    ; WriteRegStr SHELL_CONTEXT "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\${APP_GUID}" DisplayName "${PRODUCT_NAME}"
    ; WriteRegDWORD SHELL_CONTEXT "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\${APP_GUID}" "EstimatedSize" "${NEW_APP_SIZE}"
    ; WriteRegStr SHELL_CONTEXT "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\${APP_GUID}" "DisplayVersion" "${NEW_APP_VERSION}"

    DetailPrint $apppath
    DetailPrint  "$apppath\${PROCESS_NAME}.exe"
    DetailPrint $restart

    ${If} $restart == "1"
       ShellExecAsUser::ShellExecAsUser "" "$apppath\${PROCESS_NAME}.exe" "--updated"
    ${Else}
       DetailPrint "$RESTART IS 0 switch found"
    ${EndIf}

    !insertmacro quitSuccess
SectionEnd