' ExportAssemblyGLBs  -  Gearfinity
' --------------------------------------------------------------------------
' Exports every UNIQUE component part of the ACTIVE assembly to GLB
' ("Extended Reality Binary") in web\parts\ - the per-part display assets the
' web configurator loads. Instances share one file (3 planets -> 1 GLB), so a
' 27-component display assembly needs only ~9 exports - all done in one run.
'
' Pairs with DumpAssemblyBOM: run BOTH on a display assembly, then regenerate
' the scene (scripts/gen_kinematic_scene.py). GLB exports in the part's
' DESIGN frame + metres, which is exactly what the .bom.json transforms
' expect (see docs/WEB_VIEWER.md "print frame vs design frame").
'
' Skips components whose GLB is already newer than the part file.
' Set FORCE_ALL = True to re-export everything.
'
' HOW TO USE
'   1. Open the display assembly (e.g. planetary_stage_core_mock_display.SLDASM).
'   2. Tools > Macro > New...  save as scripts/macros/ExportAssemblyGLBs.swp
'   3. Paste this over the template. Run (F5).
'
' NOTE: if the GLB save errors on your SolidWorks version (XR export was
' UI-only in very old builds), record ONE manual GLB Save As and send the
' snippet - same playbook we used to fix CS_PRINT.
' --------------------------------------------------------------------------
Option Explicit

' >>> adjust if the repo moves <<<
Const OUTDIR As String = "C:\Users\headl\Documents\GitHub\gearfinity\web\parts\"
Const FORCE_ALL As Boolean = False

Sub main()
    Dim swApp As SldWorks.SldWorks
    Set swApp = Application.SldWorks

    Dim swModel As SldWorks.ModelDoc2
    Set swModel = swApp.ActiveDoc
    If swModel Is Nothing Then MsgBox "Open an assembly first.": Exit Sub
    If swModel.GetType <> swDocASSEMBLY Then MsgBox "Active document is not an assembly.": Exit Sub

    If Dir(OUTDIR, vbDirectory) = "" Then MkDir OUTDIR

    Dim swAssy As SldWorks.AssemblyDoc
    Set swAssy = swModel

    ' 1) unique, unsuppressed component part files
    Dim vComps As Variant
    vComps = swAssy.GetComponents(False)   ' all levels, leaf parts
    Dim seen As New Collection, paths As New Collection
    Dim i As Long
    For i = 0 To UBound(vComps)
        Dim c As SldWorks.Component2
        Set c = vComps(i)
        If Not c.IsSuppressed Then
            Dim p As String
            p = c.GetPathName
            If Len(p) > 0 Then
                If LCase(Right(p, 7)) = ".sldprt" And Not Contains(seen, LCase(p)) Then
                    seen.Add LCase(p), LCase(p)
                    paths.Add p
                End If
            End If
        End If
    Next i

    ' 2) export each to GLB (date-checked)
    Dim tStart As Date
    tStart = Now
    Dim nExp As Long, nSkip As Long, nErr As Long
    Dim failed As String
    Dim errs As Long, warns As Long
    For i = 1 To paths.Count
        Dim src As String, stem As String, glb As String
        src = paths(i)
        stem = Mid(src, InStrRev(src, "\") + 1)
        stem = Left(stem, InStrRev(stem, ".") - 1)
        glb = OUTDIR & stem & ".glb"

        Dim doExport As Boolean
        doExport = True
        If Not FORCE_ALL Then
            If Dir(glb) <> "" Then doExport = (FileDateTime(src) > FileDateTime(glb))
        End If

        If doExport Then
            Dim swPart As SldWorks.ModelDoc2
            Set swPart = swApp.OpenDoc6(src, swDocPART, swOpenDocOptions_Silent, "", errs, warns)
            If Not swPart Is Nothing Then
                ' SaveAs3 = the manual-dialog path (honors persistent export
                ' options), swSaveAsOptions_Copy leaves the part untouched.
                swPart.SaveAs3 glb, 0, swSaveAsOptions_Silent + swSaveAsOptions_Copy
                ' verify on disk rather than trusting the return value
                Dim ok As Boolean
                ok = False
                If Dir(glb) <> "" Then ok = (FileDateTime(glb) >= tStart)
                If ok Then
                    nExp = nExp + 1
                Else
                    nErr = nErr + 1
                    failed = failed & vbCrLf & "  " & stem
                End If
                swApp.CloseDoc swPart.GetTitle
            Else
                nErr = nErr + 1
                failed = failed & vbCrLf & "  " & stem & " (open failed)"
            End If
        Else
            nSkip = nSkip + 1
        End If
    Next i

    MsgBox "GLB export -> web\parts\" & vbCrLf & _
           "Exported " & nExp & vbCrLf & _
           "Skipped (up-to-date) " & nSkip & vbCrLf & _
           "Errors " & nErr & failed
End Sub

Function Contains(col As Collection, key As String) As Boolean
    On Error Resume Next
    col.Item key
    Contains = (Err.Number = 0)
    On Error GoTo 0
End Function
