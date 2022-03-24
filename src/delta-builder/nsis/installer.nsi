!include FileFunc.nsh
!include LogicLib.nsh

Name "${PRODUCT_NAME}DeltaUpdater"
OutFile "${INSTALLER_OUTPUT_PATH}"
RequestExecutionLevel user
ShowInstDetails nevershow
Unicode true

; Icon ".\icon.ico"

SilentInstall normal

InstallDir "$LocalAppData\Programs\electron-delta-updater"

# avoid exit code 2
!macro quitSuccess
  SetErrorLevel 0
  Quit
!macroend

Section "gen_package" SEC01

    SetDetailsPrint none

	  nsProcess::_KillProcess "${PRODUCT_NAME}.exe" $R0
    Pop $R0
    nsProcess::_Unload

    SetOutPath $INSTDIR

    RMDir /r $INSTDIR

    File "hpatchz.exe"
    File "${DELTA_FILE_PATH}"

    nsExec::ExecToLog '"$INSTDIR\hpatchz.exe" -C-all "$LocalAppData\Programs\${PRODUCT_NAME}" "$INSTDIR\${DELTA_FILE_NAME}" "$INSTDIR\${PRODUCT_NAME}" -f'
    Pop $0

    CopyFiles /SILENT "$INSTDIR\${PRODUCT_NAME}" "$LocalAppData\Programs" 264080

    ; WriteRegStr SHELL_CONTEXT "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\${APP_GUID}" DisplayName "${PRODUCT_NAME}"
    ; WriteRegDWORD SHELL_CONTEXT "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\${APP_GUID}" "EstimatedSize" "${NEW_APP_SIZE}"
    ; WriteRegStr SHELL_CONTEXT "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\${APP_GUID}" "DisplayVersion" "${NEW_APP_VERSION}"

    ${GetParameters} $R1
    ${GetOptions} $R1 "-norestart" $R2
    ${IfNot} ${Errors}
      DetailPrint "-norestart switch found"
    ${Else}
      ShellExecAsUser::ShellExecAsUser "" "$LocalAppData\Programs\${PRODUCT_NAME}\${PRODUCT_NAME}.exe" "--updated"
    ${EndIf}

    !insertmacro quitSuccess
SectionEnd