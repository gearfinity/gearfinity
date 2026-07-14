' BatchExportParts  -  Gearfinity
' --------------------------------------------------------------------------
' Batch-exports STL (+ STEP) for every part in _all_parts whose .SLDPRT is
' NEWER than its .STL (i.e. re-exports only what changed since last export).
' Only touches parts that already have an .STL (skips profiles/mocks/blanks).
' Set FORCE_ALL = True to re-export every part that has an .STL, ignoring dates.
'
' PRINT ORIENTATION (CS_PRINT): the STL "Output coordinate system" is a
' PERSISTENT export setting, not a per-save API call. Set it ONCE in the STL
' export dialog (System Options > Export) to "CS_PRINT". IMPORTANT: use
' ModelDoc2.SaveAs3 (below), NOT ModelDocExtension.SaveAs - only SaveAs3 honors
' that persistent output-coordinate-system setting (Extension.SaveAs ignored it
' and exported from the default origin, which flipped the bevel gear). Each part
' then exports relative to its own CS_PRINT if it has one, else default. STEP
' ignores CS_PRINT (uses default) - that's fine, STEP isn't for slicing.
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
' STEP is a LOCAL-ONLY CAD artifact - it is NOT committed to git (.gitignore),
' because the embossed BREP is ~20-40x the STL size. It's generated here so you
' can build source.zip bundles and publish CAD via GitHub Releases. Set False for
' faster STL-only runs when you don't need to refresh the CAD files.
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

        ' Only re-export parts that ALREADY have an STL (skips profiles/mocks/blanks
        ' that have no export). VBA has no short-circuit, so guard FileDateTime.
        Dim doExport As Boolean
        doExport = False
        If Dir(stl) <> "" Then doExport = (FORCE_ALL Or FileDateTime(sldprt) > FileDateTime(stl))
        If doExport Then
            Dim swModel As SldWorks.ModelDoc2
            Set swModel = swApp.OpenDoc6(sldprt, swDocPART, swOpenDocOptions_Silent, "", errs, warns)
            If Not swModel Is Nothing Then
                ' Use SaveAs3 - the EXACT call the macro recorder produced for a
                ' manual export - so it honors the persistent STL "Output coordinate
                ' system" (CS_PRINT). swSaveAsOptions_Copy (=2) leaves the .SLDPRT
                ' untouched, just like a manual export does.
                swModel.SaveAs3 stl, 0, swSaveAsOptions_Silent + swSaveAsOptions_Copy
                If EXPORT_STEP Then swModel.SaveAs3 stp, 0, swSaveAsOptions_Silent + swSaveAsOptions_Copy

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
