' DumpAssemblyBOM  -  Gearfinity
' --------------------------------------------------------------------------
' Traverses the ACTIVE SolidWorks assembly and writes a JSON file next to it
' (<assembly>.bom.json) listing every component instance with its referenced
' file, suppression state, and transform (3x3 rotation + translation, metres).
'
' Feeds scripts/ingest_assembly.py, which maps files -> part IDs and produces
' a real BOM with quantities (including pins) and component placements for the
' web viewer.
'
' HOW TO USE
'   1. Open the assembly (e.g. fan_module_2_stage.SLDASM).
'   2. Tools > Macro > New...  save as e.g. DumpAssemblyBOM.swp
'   3. Paste this code over the template, then Run (F5).
'   4. It writes <assembly path>.bom.json and pops a confirmation.
'
' Uses late binding (no reference setup needed). Transform layout from
' MathTransform.ArrayData: [0..8] = row-major 3x3 rotation, [9..11] = x,y,z
' translation (metres), [12] = scale.
' --------------------------------------------------------------------------
Option Explicit

Sub main()
    Dim swApp As Object, swModel As Object, swAssy As Object
    Set swApp = Application.SldWorks
    Set swModel = swApp.ActiveDoc

    If swModel Is Nothing Then MsgBox "Open an assembly first.": Exit Sub
    If swModel.GetType <> 2 Then MsgBox "Active document is not an assembly.": Exit Sub  ' 2 = swDocASSEMBLY
    Set swAssy = swModel

    Dim vComps As Variant
    vComps = swAssy.GetComponents(False)   ' False = all components, all levels

    Dim outPath As String
    outPath = swModel.GetPathName & ".bom.json"

    Dim fnum As Integer
    fnum = FreeFile
    Open outPath For Output As #fnum

    Print #fnum, "{"
    Print #fnum, "  ""assembly"": " & JStr(GetLeaf(swModel.GetPathName)) & ","
    Print #fnum, "  ""components"": ["

    Dim i As Long, first As Boolean
    first = True
    For i = 0 To UBound(vComps)
        Dim c As Object
        Set c = vComps(i)

        Dim p As String
        p = c.GetPathName
        If Len(p) > 0 Then
            Dim x As Object
            Set x = c.Transform2
            Dim t As Variant
            t = x.ArrayData

            If Not first Then Print #fnum, "    ,"
            first = False

            Print #fnum, "    {"
            Print #fnum, "      ""name"": " & JStr(c.Name2) & ","
            Print #fnum, "      ""file"": " & JStr(GetLeaf(p)) & ","
            Print #fnum, "      ""suppressed"": " & LCase(CStr(c.IsSuppressed)) & ","
            Print #fnum, "      ""transform"": [" & _
                Num(t(0)) & "," & Num(t(1)) & "," & Num(t(2)) & "," & _
                Num(t(3)) & "," & Num(t(4)) & "," & Num(t(5)) & "," & _
                Num(t(6)) & "," & Num(t(7)) & "," & Num(t(8)) & "," & _
                Num(t(9)) & "," & Num(t(10)) & "," & Num(t(11)) & "]"
            Print #fnum, "    }"
        End If
    Next i

    Print #fnum, "  ]"
    Print #fnum, "}"
    Close #fnum

    MsgBox "Wrote " & outPath
End Sub

' --- helpers ---------------------------------------------------------------
Function JStr(s As String) As String
    Dim r As String
    r = Replace(s, "\", "\\")
    r = Replace(r, """", "\""")
    JStr = """" & r & """"
End Function

Function Num(ByVal d As Double) As String
    Num = Format(d, "0.000000")
End Function

Function GetLeaf(p As String) As String
    Dim parts() As String
    parts = Split(p, "\")
    GetLeaf = parts(UBound(parts))
End Function
