' DumpAssemblyBOM  -  Gearfinity
' --------------------------------------------------------------------------
' Traverses the ACTIVE SolidWorks assembly and writes a JSON file next to it
' (<assembly>.<config>.bom.json) listing every component instance with its
' referenced file, suppression state, and transform (3x3 rotation +
' translation, metres). The ACTIVE CONFIGURATION name is part of the filename
' so variant masters (e.g. fan_module with 1/2/3-stage configs) can be dumped
' once per configuration without overwriting each other.
'
' Feeds scripts/gen_kinematic_scene.py (web scenes) and
' scripts/ingest_assembly.py (BOM quantities).
'
' HOW TO USE
'   1. Open the assembly (e.g. fan_module_2_stage.SLDASM).
'   2. ACTIVATE the configuration you want to capture.
'   3. Tools > Macro > New...  save as e.g. DumpAssemblyBOM.swp
'   4. Paste this code over the template, then Run (F5).
'   5. Repeat per configuration for variant masters.
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

    ' active configuration -> part of the filename (sanitized) + JSON metadata
    Dim cfgName As String
    cfgName = swModel.ConfigurationManager.ActiveConfiguration.Name

    Dim outPath As String
    outPath = swModel.GetPathName & "." & SafeName(cfgName) & ".bom.json"

    Dim fnum As Integer
    fnum = FreeFile
    Open outPath For Output As #fnum

    Print #fnum, "{"
    Print #fnum, "  ""assembly"": " & JStr(GetLeaf(swModel.GetPathName)) & ","
    Print #fnum, "  ""configuration"": " & JStr(cfgName) & ","
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

' config names can contain characters that are illegal in filenames
Function SafeName(s As String) As String
    Dim i As Integer, c As String, r As String
    For i = 1 To Len(s)
        c = Mid(s, i, 1)
        If c Like "[A-Za-z0-9_-]" Then
            r = r & c
        Else
            r = r & "_"
        End If
    Next i
    If r = "" Then r = "Default"
    SafeName = r
End Function
