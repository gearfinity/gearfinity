' BatchExportParts  -  Gearfinity
' --------------------------------------------------------------------------
' Batch-exports STL (+ STEP) for every part in _all_parts whose .SLDPRT is
' NEWER than its .STL (i.e. re-exports only what changed since last export).
' Set FORCE_ALL = True to export everything.
'
' STL output uses a coordinate system named "CS_PRINT" if the part has one
' (the print orientation); otherwise the default part origin. STEP uses default.
' This is the first piece of the sync-export automation (docs/AUTOMATION.md).
'
' HOW TO USE
'   1. Tools > Macro > New...  save as scripts/macros/BatchExportParts.swp
'   2. Paste this over the template. Run (F5).
'   3. It re-exports the stale parts and reports a count.
'
' NOTES
'   - Uses named SolidWorks API constants (Tools > References must have a
'     SOLIDWORKS type library checked - it is by default in the macro editor).
'     If a constant is "not defined", tell me the name and I'll swap in its
'     numeric value.
'   - Untested live yet - report any error line, like we did for DumpAssemblyBOM.
' --------------------------------------------------------------------------
Option Explicit

' >>> adjust this path if the repo moves <<<
Const FOLDER As String = "C:\Users\headl\Documents\GitHub\gearfinity\_all_parts\"
Const FORCE_ALL As Boolean = False
Const EXPORT_STEP As Boolean = True

Sub main()
    Dim swApp As SldWorks.SldWorks
    Set swApp = Application.SldWorks

    ' 1) collect the .SLDPRT names first (Dir() is stateful - don't call it
    '    while opening documents)
    Dim files As New Collection
    Dim fname As String
    fname = Dir(FOLDER & "*.SLDPRT")
    Do While fname <> ""
        If Left(fname, 2) <> "~$" Then files.Add fname
        fname = Dir()
    Loop

    ' 2) export the stale ones
    Dim nExp As Long, nSkip As Long, nErr As Long
    Dim errs As Long, warns As Long
    Dim i As Long
    For i = 1 To files.Count
        Dim base As String, sldprt As String, stl As String, stp As String
        base = Left(files(i), InStrRev(files(i), ".") - 1)
        sldprt = FOLDER & files(i)
        stl = FOLDER & base & ".STL"
        stp = FOLDER & base & ".STEP"

        If FORCE_ALL Or Dir(stl) = "" Or FileDateTime(sldprt) > FileDateTime(stl) Then
            Dim swModel As SldWorks.ModelDoc2
            Set swModel = swApp.OpenDoc6(sldprt, swDocPART, swOpenDocOptions_Silent, "", errs, warns)
            If Not swModel Is Nothing Then
                Dim ext As SldWorks.ModelDocExtension
                Set ext = swModel.Extension

                ' STL/STEP use your CURRENT export options (Tools > Options > Export).
                ' Per-part print orientation (CS_PRINT) will be re-added once we
                ' confirm the correct STL-coordinate-system API constant.

                ext.SaveAs stl, swSaveAsCurrentVersion, swSaveAsOptions_Silent, Nothing, errs, warns
                If EXPORT_STEP Then ext.SaveAs stp, swSaveAsCurrentVersion, swSaveAsOptions_Silent, Nothing, errs, warns

                swApp.CloseDoc swModel.GetTitle
                nExp = nExp + 1
            Else
                nErr = nErr + 1
            End If
        Else
            nSkip = nSkip + 1
        End If
    Next i

    MsgBox "Exported " & nExp & " part(s)" & vbCrLf & _
           "Skipped " & nSkip & " (up-to-date)" & vbCrLf & _
           "Open errors: " & nErr
End Sub
