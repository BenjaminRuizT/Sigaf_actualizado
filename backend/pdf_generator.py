from fpdf import FPDF
import os, io
from datetime import datetime

# ── Brand Colors ──────────────────────────────────────────────
NAVY    = (30,  60, 120)
BLUE    = (52, 120, 210)
GREEN   = (22, 163,  74)
AMBER   = (217, 119,  6)
RED     = (220,  38,  38)
ORANGE  = (234, 88,  12)
GRAY    = (100, 100, 100)
LGRAY   = (240, 242, 247)
WHITE   = (255, 255, 255)
DARK    = ( 30,  30,  40)

def safe(text):
    text = str(text)
    replacements = {
        '\u2022':'-','\u2013':'-','\u2014':'-','\u2018':"'",'\u2019':"'",
        '\u201c':'"','\u201d':'"','\u2026':'...','\u00b7':'-',
        '\u00e1':'a','\u00e9':'e','\u00ed':'i','\u00f3':'o','\u00fa':'u',
        '\u00c1':'A','\u00c9':'E','\u00cd':'I','\u00d3':'O','\u00da':'U',
        '\u00f1':'n','\u00d1':'N','\u00fc':'u','\u00e0':'a',
        '\u00e2':'a','\u00ea':'e','\u00ee':'i','\u00f4':'o','\u00fb':'u',
    }
    for old, new in replacements.items():
        text = text.replace(old, new)
    try:
        text.encode('latin-1')
    except UnicodeEncodeError:
        cleaned = []
        for ch in text:
            try:
                ch.encode('latin-1')
                cleaned.append(ch)
            except UnicodeEncodeError:
                cleaned.append('?')
        text = ''.join(cleaned)
    return text


class SigafPDF(FPDF):
    def __init__(self, title="SIGAF"):
        super().__init__()
        self.doc_title = title
        self.set_auto_page_break(auto=True, margin=22)

    def header(self):
        self.set_fill_color(*NAVY)
        self.rect(0, 0, 210, 5, 'F')
        self.set_y(8)
        self.set_font("Helvetica", "B", 8.5)
        self.set_text_color(*NAVY)
        self.cell(120, 5, safe(self.doc_title), align="L")
        self.set_font("Helvetica", "", 8)
        self.set_text_color(*GRAY)
        self.cell(0, 5, datetime.now().strftime("%d/%m/%Y"), align="R", new_x="LMARGIN", new_y="NEXT")
        self.set_draw_color(200, 210, 230)
        self.set_line_width(0.3)
        self.line(10, self.get_y(), 200, self.get_y())
        self.ln(3)

    def footer(self):
        self.set_y(-13)
        self.set_draw_color(200, 210, 230)
        self.line(10, self.get_y(), 200, self.get_y())
        self.ln(1)
        self.set_font("Helvetica", "", 7.5)
        self.set_text_color(*GRAY)
        self.cell(0, 6, safe("SIGAF - Sistema Integral de Gestion de Activo Fijo  |  Pagina " + str(self.page_no()) + "/{nb}"), align="C")

    def cover(self, title, subtitle, doc_type=""):
        self.add_page()
        self.set_fill_color(*NAVY)
        self.rect(0, 0, 210, 75, 'F')
        self.set_y(20)
        self.set_font("Helvetica", "B", 38)
        self.set_text_color(*WHITE)
        self.cell(210, 16, "SIGAF", align="C", new_x="LMARGIN", new_y="NEXT")
        self.set_font("Helvetica", "", 11)
        self.set_text_color(180, 200, 240)
        self.cell(210, 7, safe("Sistema Integral de Gestion de Activo Fijo"), align="C", new_x="LMARGIN", new_y="NEXT")
        # Card
        self.set_fill_color(*WHITE)
        self.set_draw_color(*BLUE)
        self.set_line_width(0.5)
        self.rect(25, 82, 160, 55, 'FD')
        self.set_y(95)
        self.set_font("Helvetica", "B", 20)
        self.set_text_color(*NAVY)
        self.cell(210, 11, safe(title), align="C", new_x="LMARGIN", new_y="NEXT")
        self.set_font("Helvetica", "", 11)
        self.set_text_color(*GRAY)
        self.cell(210, 8, safe(subtitle), align="C", new_x="LMARGIN", new_y="NEXT")
        if doc_type:
            self.set_font("Helvetica", "B", 9.5)
            self.set_text_color(*BLUE)
            self.cell(210, 7, safe(doc_type), align="C", new_x="LMARGIN", new_y="NEXT")
        self.set_y(148)
        self.set_font("Helvetica", "", 9)
        self.set_text_color(*GRAY)
        self.cell(210, 6, safe(datetime.now().strftime("Generado: %d de %B de %Y")), align="C")
        self.set_fill_color(*LGRAY)
        self.rect(0, 274, 210, 23, 'F')
        self.set_y(279)
        self.set_font("Helvetica", "", 8)
        self.set_text_color(*GRAY)
        self.cell(210, 5, safe("OXXO - Direccion de Sistemas  |  Confidencial"), align="C")

    def section_title(self, title, num=""):
        if self.get_y() > 250:
            self.add_page()
        self.ln(4)
        self.set_fill_color(*NAVY)
        y = self.get_y()
        self.rect(10, y, 3, 10, 'F')
        self.set_xy(16, y)
        self.set_font("Helvetica", "B", 13)
        self.set_text_color(*NAVY)
        txt = safe(f"{num}. {title}" if num else title)
        self.cell(0, 10, txt, new_x="LMARGIN", new_y="NEXT")
        self.set_draw_color(*BLUE)
        self.set_line_width(0.25)
        self.line(10, self.get_y(), 200, self.get_y())
        self.ln(3)

    def subsection(self, title):
        if self.get_y() > 258:
            self.add_page()
        self.ln(2)
        self.set_font("Helvetica", "B", 10.5)
        self.set_text_color(*DARK)
        self.set_x(10)
        self.cell(0, 7, safe(title), new_x="LMARGIN", new_y="NEXT")
        self.ln(0.5)

    def body(self, text):
        self.set_font("Helvetica", "", 10)
        self.set_text_color(*DARK)
        self.set_x(10)
        self.multi_cell(0, 5.5, safe(text))
        self.ln(1.5)

    def bullet(self, text, indent=6, color=NAVY):
        if self.get_y() > 265:
            self.add_page()
        self.set_font("Helvetica", "", 10)
        lm = self.l_margin
        self.set_left_margin(lm + indent)
        self.set_x(lm + indent)
        self.set_font("Helvetica", "B", 10)
        self.set_text_color(*color)
        self.cell(5, 5.5, safe("->"))
        self.set_font("Helvetica", "", 10)
        self.set_text_color(*DARK)
        self.multi_cell(0, 5.5, safe(" " + text))
        self.set_left_margin(lm)
        self.ln(0.3)

    def note_box(self, title, text, color=BLUE, bg=(235, 242, 255)):
        self.ln(2)
        y = self.get_y()
        if y > 252:
            self.add_page()
            y = self.get_y()
        lines = max(1, len(text) // 80 + text.count('\n') + 1)
        total_h = 8 + lines * 5.5 + 6
        self.set_fill_color(*bg)
        self.set_draw_color(*color)
        self.set_line_width(0.4)
        self.rect(10, y, 190, total_h, 'FD')
        self.set_fill_color(*color)
        self.rect(10, y, 3.5, total_h, 'F')
        self.set_xy(17, y + 2)
        self.set_font("Helvetica", "B", 9)
        self.set_text_color(*color)
        self.cell(0, 6, safe(title), new_x="LMARGIN", new_y="NEXT")
        self.set_x(17)
        self.set_font("Helvetica", "", 9)
        self.set_text_color(*DARK)
        self.multi_cell(178, 5.5, safe(text))
        self.set_y(y + total_h + 3)

    def table(self, headers, rows, col_widths=None, alternating=True):
        n = len(headers)
        if not col_widths:
            col_widths = [190 / n] * n
        if self.get_y() > 250:
            self.add_page()
        self.set_font("Helvetica", "B", 8.5)
        self.set_fill_color(*NAVY)
        self.set_text_color(*WHITE)
        self.set_draw_color(200, 210, 230)
        self.set_line_width(0.2)
        for h, w in zip(headers, col_widths):
            self.cell(w, 8, safe(str(h)), border=1, fill=True, align="C")
        self.ln()
        self.set_font("Helvetica", "", 8.5)
        self.set_text_color(*DARK)
        for i, row in enumerate(rows):
            if self.get_y() > 262:
                self.add_page()
                self.set_font("Helvetica", "B", 8.5)
                self.set_fill_color(*NAVY)
                self.set_text_color(*WHITE)
                for h, w in zip(headers, col_widths):
                    self.cell(w, 8, safe(str(h)), border=1, fill=True, align="C")
                self.ln()
                self.set_font("Helvetica", "", 8.5)
                self.set_text_color(*DARK)
            fill = alternating and (i % 2 == 0)
            self.set_fill_color(*(LGRAY if fill else WHITE))
            for val, w in zip(row, col_widths):
                self.cell(w, 7, safe(str(val)), border=1, fill=fill, align="C")
            self.ln()
        self.ln(3)

    def kpi_row(self, items):
        n = len(items)
        w = 190 / n
        y = self.get_y()
        if y > 250:
            self.add_page()
            y = self.get_y()
        self.set_x(10)
        for label, value, color in items:
            x = self.get_x()
            self.set_fill_color(*LGRAY)
            self.set_draw_color(*color)
            self.set_line_width(0.4)
            self.rect(x, y, w - 3, 22, 'FD')
            self.set_fill_color(*color)
            self.rect(x, y, w - 3, 2.5, 'F')
            self.set_xy(x, y + 4)
            self.set_font("Helvetica", "B", 14)
            self.set_text_color(*color)
            self.cell(w - 3, 8, safe(str(value)), align="C", new_x="RIGHT", new_y="TOP")
            self.set_xy(x, y + 13)
            self.set_font("Helvetica", "", 7)
            self.set_text_color(*GRAY)
            self.cell(w - 3, 5, safe(label.upper()), align="C", new_x="RIGHT", new_y="TOP")
            self.set_x(x + w)
        self.set_y(y + 26)
        self.ln(2)

    def screen_mock(self, title, elements, width=190, height=None):
        if height is None:
            height = 10 + len(elements) * 7 + 8
        if self.get_y() + height > 268:
            self.add_page()
        y = self.get_y()
        x = 10
        # Browser chrome
        self.set_fill_color(*DARK)
        self.rect(x, y, width, 9, 'F')
        for dx, col in [(5,(255,90,80)),(11,(255,190,50)),(17,(50,200,80))]:
            self.set_fill_color(*col)
            self.ellipse(x+dx, y+3, 3, 3, 'F')
        self.set_fill_color(55, 60, 75)
        self.rect(x+25, y+2, 115, 5, 'F')
        self.set_font("Helvetica", "", 5.5)
        self.set_text_color(170, 180, 200)
        self.set_xy(x+27, y+3)
        self.cell(111, 3, safe("insightful-caring-production-2702.up.railway.app"), align="L")
        # App nav bar
        self.set_fill_color(*NAVY)
        self.rect(x, y+9, width, 10, 'F')
        self.set_font("Helvetica", "B", 7.5)
        self.set_text_color(*WHITE)
        self.set_xy(x+3, y+11)
        self.cell(60, 6, safe(title), align="L")
        # Content
        self.set_fill_color(*WHITE)
        self.rect(x, y+19, width, height-19, 'F')
        self.set_draw_color(200, 210, 230)
        self.set_line_width(0.3)
        self.rect(x, y, width, height, 'D')
        ey = y + 22
        for elem in elements:
            if ey > y + height - 4:
                break
            kind = elem.get("type","text")
            if kind == "text":
                self.set_font("Helvetica", elem.get("style",""), elem.get("size",8))
                self.set_text_color(*elem.get("color", DARK))
                self.set_xy(x + elem.get("x",4), ey)
                self.cell(width-8, 5, safe(elem.get("text","")), align=elem.get("align","L"))
                ey += elem.get("dy", 6)
            elif kind == "badge":
                bx = x + elem.get("x", 4)
                col = elem.get("color", GREEN)
                self.set_fill_color(*col)
                self.set_text_color(*WHITE)
                self.set_font("Helvetica", "B", 6.5)
                self.rect(bx, ey-0.5, elem.get("w",28), 5.5, 'F')
                self.set_xy(bx, ey-0.5)
                self.cell(elem.get("w",28), 5.5, safe(elem.get("text","")), align="C")
                ey += elem.get("dy", 7)
            elif kind == "divider":
                self.set_draw_color(220, 225, 235)
                self.set_line_width(0.2)
                self.line(x+3, ey, x+width-3, ey)
                ey += elem.get("dy", 4)
            elif kind == "bar":
                bw = elem.get("w", 140)
                bh = 4
                bx = x + elem.get("x", 4)
                self.set_fill_color(220, 225, 235)
                self.rect(bx, ey, bw, bh, 'F')
                self.set_fill_color(*elem.get("color", BLUE))
                self.rect(bx, ey, bw * elem.get("pct", 0.5), bh, 'F')
                ey += bh + elem.get("dy", 5)
            elif kind == "kpirow":
                vals = elem.get("values",[])
                kw = (width-10) / max(len(vals),1)
                for label, val, kcol in vals:
                    kidx = vals.index((label, val, kcol))
                    kx = x + 5 + kidx * kw
                    self.set_fill_color(*LGRAY)
                    self.rect(kx, ey, kw-2, 15, 'F')
                    self.set_fill_color(*kcol)
                    self.rect(kx, ey, kw-2, 1.5, 'F')
                    self.set_font("Helvetica","B",8.5)
                    self.set_text_color(*kcol)
                    self.set_xy(kx, ey+2)
                    self.cell(kw-2, 6, safe(str(val)), align="C")
                    self.set_font("Helvetica","",5.5)
                    self.set_text_color(*GRAY)
                    self.set_xy(kx, ey+9)
                    self.cell(kw-2, 4, safe(label.upper()), align="C")
                ey += 19
        self.set_y(y + height + 4)


# ═══════════════════════════════════════════════════════════════
#  MANUAL DE USUARIO
# ═══════════════════════════════════════════════════════════════

def generate_user_manual(stats, plazas_data):
    pdf = SigafPDF("SIGAF - Manual de Usuario")
    pdf.alias_nb_pages()

    pdf.cover("Manual de Usuario", "Guia completa del sistema SIGAF", "v2.0 - Marzo 2026")

    # Tabla de contenido
    pdf.add_page()
    pdf.section_title("Contenido")
    toc = [
        ("1","Introduccion al Sistema"),
        ("2","Acceso al Sistema"),
        ("3","Panel Principal (Dashboard)"),
        ("4","Gestion de Tiendas"),
        ("5","Modulo de Auditoria (Inventario)"),
        ("5.1","  Iniciar Auditoria"),
        ("5.2","  Escaneo de Codigos de Barras con Zebra TC52"),
        ("5.3","  Clasificacion Automatica de Equipos"),
        ("5.4","  Registro de Sobrante Desconocido (ALTA)"),
        ("5.5","  Transferencias entre Tiendas"),
        ("5.6","  Finalizar Auditoria y Foto de Formatos"),
        ("5.7","  Resumen de Auditoria Completada"),
        ("6","Bitacoras y Exportacion"),
        ("7","Panel de Administracion"),
        ("8","Configuracion del Sistema"),
        ("9","Preguntas Frecuentes"),
    ]
    for num, item in toc:
        pdf.set_font("Helvetica","",10)
        pdf.set_text_color(*DARK)
        pdf.set_x(14)
        pdf.cell(14,6,safe(num),align="L")
        pdf.cell(0,6,safe(item),new_x="LMARGIN",new_y="NEXT")

    # ── 1. Introducción ──
    pdf.add_page()
    pdf.section_title("Introduccion al Sistema","1")
    pdf.body("SIGAF (Sistema Integral de Gestion de Activo Fijo) es una plataforma web desarrollada para OXXO orientada a la realizacion de auditorias de inventario de equipo de computo en tiendas de conveniencia.")
    pdf.body("Permite gestionar el inventario de equipos, realizar auditorias mediante escaneo de codigos de barras con dispositivos Zebra TC52, clasificar equipos automaticamente y generar documentos Excel y PDF de respaldo.")
    pdf.note_box("PWA - Instalable en cualquier dispositivo","La aplicacion es una Progressive Web App. Se puede instalar en el Zebra TC52, tablets y PCs desde Chrome sin necesidad de descarga desde tienda de aplicaciones.", BLUE)

    pdf.subsection("Perfiles de usuario")
    pdf.table(
        ["Perfil","Nivel de Acceso","Funciones principales"],
        [
            ["Super Administrador","Total","Gestion de usuarios, equipos, reinicio de datos, todas las bitacoras y reportes"],
            ["Administrador","Avanzado","Dashboard, auditorias, bitacoras con exportacion Excel, reportes PDF"],
            ["Socio Tecnologico","Operativo","Dashboard y modulo de auditoria (inventario)"],
        ],[45,28,117]
    )

    pdf.subsection("Caracteristicas del sistema v2.0")
    features = [
        "Dashboard con 6 KPIs dinamicos filtrados por plaza en tiempo real",
        "Tarjetas de tienda con estado: Pendiente / En Progreso / Auditada",
        "Escaneo de codigos de barras con Zebra TC52 via DataWedge (teclado fisico)",
        "Clasificacion automatica: Localizado, Sobrante, Sobrante Desconocido, No Localizado",
        "Campo de Numero de Serie en registro de Sobrante Desconocido",
        "Indicador visual de carga al procesar la finalizacion de auditoria",
        "Foto obligatoria de formatos fisicos al finalizar (ALTA/BAJA y Transferencias)",
        "Resumen interactivo: clic en tarjetas para filtrar detalle por grupo",
        "Tabla de equipos con columnas Serie y Depreciado (con scroll horizontal en movil)",
        "Exportacion Excel con hoja adicional de imagenes de formatos de movimiento",
        "Bitacoras con columnas Serie y Depreciado",
        "Descarga individual de fotos de formatos desde el historial de auditorias",
        "Reporte PDF ejecutivo de una pagina por auditoria (con fotos incluidas)",
        "Temas: Claro/Oscuro | Paletas: Profesional (azul) / Corporativo OXXO (rojo/amarillo)",
        "Interfaz bilingue Espanol / Ingles",
    ]
    for f in features:
        pdf.bullet(f)

    # ── 2. Acceso ──
    pdf.add_page()
    pdf.section_title("Acceso al Sistema","2")
    pdf.body("Abra Chrome en el dispositivo e ingrese la URL:")
    pdf.note_box("URL del sistema","https://insightful-caring-production-2702.up.railway.app",NAVY,(230,238,255))

    pdf.screen_mock("SIGAF - Inicio de Sesion",[
        {"type":"text","text":"","dy":4},
        {"type":"text","text":"Correo electronico","size":7.5,"color":GRAY,"x":50,"dy":5},
        {"type":"text","text":"[ usuario@oxxo.com          ]","size":8,"color":DARK,"x":50,"dy":6},
        {"type":"text","text":"Contrasena","size":7.5,"color":GRAY,"x":50,"dy":5},
        {"type":"text","text":"[ ******************       ]","size":8,"color":DARK,"x":50,"dy":8},
        {"type":"badge","text":"        ACCEDER        ","color":NAVY,"x":60,"w":70,"dy":6},
    ], height=60)

    pdf.note_box("Sesion","La sesion permanece activa 24 horas. Si olvida su contrasena contacte al Super Administrador.", AMBER,(255,248,230))

    pdf.subsection("Instalacion como PWA en Zebra TC52")
    for i,s in enumerate([
        "Abra la URL en Chrome del Zebra TC52",
        "Toque el menu de Chrome (tres puntos, esquina superior derecha)",
        "Seleccione 'Agregar a pantalla de inicio'",
        "Confirme el nombre 'SIGAF' y toque 'Agregar'",
        "El icono aparecera en la pantalla principal del dispositivo",
    ],1):
        pdf.bullet(f"{i}. {s}")

    # ── 3. Panel Principal ──
    pdf.add_page()
    pdf.section_title("Panel Principal (Dashboard)","3")
    pdf.body("Es la pantalla de inicio. Muestra un saludo personalizado, 6 KPIs, graficas y el listado de tiendas.")

    if stats:
        pdf.kpi_row([
            ("Total Tiendas", str(stats.get("total_stores",0)), NAVY),
            ("Auditadas", str(stats.get("audited_stores",0)), GREEN),
            ("Total Equipos", f"{stats.get('total_equipment',0):,}", BLUE),
            ("Depreciados", str(stats.get("deprecated_equipment",0)), AMBER),
        ])

    pdf.screen_mock("Panel Principal - SIGAF",[
        {"type":"text","text":"Bienvenido, Benjamin Ruiz","size":7.5,"color":GRAY,"dy":5},
        {"type":"kpirow","values":[
            ("Tiendas","1,010",NAVY),
            ("Auditadas","124",GREEN),
            ("Equipos","28,430",BLUE),
            ("Deprec.","3,211",AMBER),
        ]},
        {"type":"text","text":"RESUMEN DE TIENDAS (1,010)","size":7.5,"style":"B","color":NAVY,"dy":5},
        {"type":"divider","dy":3},
        {"type":"text","text":"10TIJ Ensenada  CR:32UHH                              Pendiente","size":7,"color":DARK,"dy":5},
        {"type":"text","text":"ARIAS TIJ  CR:50REP                                    Auditada","size":7,"color":GREEN,"dy":5},
        {"type":"text","text":"Abelardo TIJ  CR:50SYP                               En Progreso","size":7,"color":BLUE,"dy":5},
    ], height=82)

    pdf.subsection("Estados de auditoria de tienda")
    pdf.table(
        ["Estado","Color","Significado"],
        [
            ["Pendiente","Gris","La tienda no ha sido auditada en el ciclo actual"],
            ["En Progreso","Azul","Hay una auditoria activa en este momento"],
            ["Auditada","Verde","La auditoria fue completada exitosamente"],
        ],[38,30,122]
    )

    pdf.subsection("Filtros disponibles")
    pdf.bullet("Plaza: filtra tarjetas de tiendas y todos los KPIs por plaza")
    pdf.bullet("Busqueda: filtra tiendas por CR o nombre en tiempo real")

    # ── 4. Gestión de tiendas ──
    pdf.add_page()
    pdf.section_title("Gestion de Tiendas","4")
    pdf.body("Al hacer clic en una tarjeta de tienda se abre un dialogo con informacion detallada:")

    pdf.screen_mock("Dialogo de Tienda - Equipos",[
        {"type":"text","text":"ABELARDO TIJ","size":9,"style":"B","color":NAVY,"dy":7},
        {"type":"text","text":"CR: 50SYP  |  Ensenada  |  35 equipos","size":7.5,"color":GRAY,"dy":7},
        {"type":"text","text":"[ Detalles de Tienda ]  [ Equipos ]  <-- pestanas","size":7.5,"color":BLUE,"dy":7},
        {"type":"divider","dy":3},
        {"type":"text","text":"Cod.Barras  Descripcion      Marca   Modelo   Serie       Valor     Dep.","size":6.5,"color":GRAY,"dy":5},
        {"type":"text","text":"84847618    ACCESS POINT     CISCO   WAP361   SN-34F21   $4,200    No","size":6.5,"color":DARK,"dy":5},
        {"type":"text","text":"63745231    ESCANER-LECTOR   DATALO  DS9308   SN-X8812   $1,800    Si","size":6.5,"color":DARK,"dy":5},
        {"type":"text","text":"84847784    HAND HELD        ZEBRA   TC52     SN-ZB001   $6,500    No","size":6.5,"color":DARK,"dy":6},
        {"type":"badge","text":" Iniciar Auditoria ","color":NAVY,"x":5,"w":65,"dy":5},
    ], height=82)

    pdf.note_box("Scroll horizontal","En dispositivos moviles la tabla de equipos incluye scroll horizontal para visualizar todas las columnas (Codigo, Descripcion, Marca, Modelo, Serie, Valor Real, Depreciado).",BLUE)

    # ── 5. Módulo de Auditoría ──
    pdf.add_page()
    pdf.section_title("Modulo de Auditoria (Inventario)","5")
    pdf.body("Nucleo del sistema. Permite realizar el inventario fisico completo de una tienda mediante escaneo de codigos de barras.")

    pdf.subsection("5.1  Iniciar Auditoria")
    pdf.body("En el dialogo de tienda presione 'Iniciar Auditoria'. El sistema abre el modulo de auditoria. La tarjeta de la tienda en el panel cambia inmediatamente a 'En Progreso' (azul).")
    pdf.bullet("Si ya existe una auditoria en progreso para esa tienda, el sistema la retoma automaticamente")
    pdf.bullet("Solo puede haber una auditoria activa por tienda a la vez")

    pdf.screen_mock("Modulo de Auditoria en Progreso",[
        {"type":"text","text":"ABELARDO TIJ  |  CR:50SYP  |  35 equipos en MAF","size":7.5,"style":"B","color":NAVY,"dy":6},
        {"type":"kpirow","values":[
            ("Localizado","28",GREEN),
            ("Sobrante","2",AMBER),
            ("No Local.","5",RED),
        ]},
        {"type":"text","text":"[ Escanear codigo de barras: __________________________ ]  [Escanear]","size":7.5,"color":DARK,"dy":7},
        {"type":"bar","pct":0.86,"color":GREEN,"w":160,"x":10,"dy":6},
        {"type":"text","text":"Progreso: 30 de 35 escaneados (86%)","size":7,"color":GRAY,"dy":6},
        {"type":"divider","dy":3},
        {"type":"text","text":"Ultimo: 84847784  HAND HELD ZEBRA TC52  -> LOCALIZADO","size":7,"color":GREEN,"dy":5},
        {"type":"text","text":"Antes:  63738745  ESCANER (de otra tienda) -> SOBRANTE","size":7,"color":AMBER,"dy":5},
    ], height=88)

    pdf.subsection("5.2  Escaneo de Codigos de Barras con Zebra TC52")
    pdf.body("El campo de escaneo es compatible con:")
    pdf.table(
        ["Metodo","Como usarlo","Velocidad"],
        [
            ["Zebra TC52 (DataWedge)","Enfoque el campo y presione el gatillo del lector fisico. El codigo se procesa automaticamente.","< 0.5 seg"],
            ["Entrada manual","Escriba el codigo en el campo y presione Enter o el boton 'Escanear'.","Manual"],
        ],[55,95,40]
    )
    pdf.note_box("Configuracion DataWedge","El Zebra TC52 viene preconfigurado con DataWedge para salida por teclado. No se requiere configuracion adicional en SIGAF. Asegurese de que el campo de escaneo tenga el foco antes de escanear.", NAVY)

    pdf.add_page()
    pdf.subsection("5.3  Clasificacion Automatica de Equipos")
    pdf.body("Al escanear un codigo, el sistema lo clasifica automaticamente en menos de 0.5 segundos:")
    pdf.table(
        ["Clasificacion","Condicion","Color","Accion del sistema"],
        [
            ["LOCALIZADO","El equipo pertenece a esta tienda","Verde","Se registra como encontrado. Avanza el contador."],
            ["SOBRANTE","El equipo pertenece a otra tienda","Amarillo","Aparece dialogo de confirmacion de transferencia."],
            ["SOBRANTE DESCONOCIDO","Codigo no existe en el MAF","Naranja","Se abre formulario para registrar como ALTA."],
            ["NO LOCALIZADO","No escaneado al finalizar","Rojo","BAJA automatica aplicada al finalizar la auditoria."],
        ],[40,50,25,75]
    )

    pdf.subsection("5.4  Registro de Sobrante Desconocido como ALTA")
    pdf.body("Al detectar un equipo no registrado en el MAF, aparece el formulario de registro:")

    pdf.screen_mock("Sobrante Desconocido - Registrar ALTA",[
        {"type":"text","text":"Sobrante Desconocido - Registrar ALTA","size":8,"style":"B","color":ORANGE,"dy":7},
        {"type":"text","text":"Codigo de barras detectado: NEW-00001-EQUIPO","size":7.5,"color":DARK,"dy":6},
        {"type":"text","text":"Descripcion del equipo: [ ACCESS POINT          v ]","size":7.5,"color":DARK,"dy":6},
        {"type":"text","text":"Marca:                  [ CISCO                 v ]","size":7.5,"color":DARK,"dy":6},
        {"type":"text","text":"Modelo:                 [ WAP361                  ]","size":7.5,"color":DARK,"dy":6},
        {"type":"text","text":"Numero de Serie:        [ SN-NEW001               ]  (opcional)","size":7.5,"color":DARK,"dy":7},
        {"type":"badge","text":" Registrar como ALTA ","color":NAVY,"x":50,"w":90,"dy":6},
    ], height=72)

    pdf.bullet("Al confirmar: el equipo se agrega al MAF de la tienda y se genera movimiento de ALTA")
    pdf.bullet("El numero de serie queda registrado para trazabilidad futura")

    pdf.subsection("5.5  Transferencias entre Tiendas")
    pdf.body("Al detectar un equipo SOBRANTE (perteneciente a otra tienda):")
    pdf.bullet("Se muestra dialogo con: datos del equipo, tienda origen y tienda destino actual")
    pdf.bullet("Al confirmar: se genera movimiento de TRANSFERENCIA y el equipo se reasigna")
    pdf.bullet("Al rechazar: el equipo queda como SOBRANTE sin procesar")

    pdf.add_page()
    pdf.subsection("5.6  Finalizar Auditoria y Foto de Formatos")
    pdf.body("Al presionar 'Finalizar Auditoria', el sistema muestra un resumen previo. Al confirmar:")
    pdf.bullet("Todos los equipos no escaneados se clasifican automaticamente como NO LOCALIZADO")
    pdf.bullet("Se aplica BAJA automatica a todos los no localizados")
    pdf.bullet("Aparece pantalla de espera 'Procesando auditoria...' (puede tardar unos segundos)")
    pdf.bullet("Si hay movimientos de ALTA/BAJA o TRANSFERENCIA, se solicita foto de formatos")

    pdf.note_box("Indicador de proceso","Mientras el sistema procesa la finalizacion aparece una pantalla de espera con animacion giratoria. NO cierre la ventana. Espere hasta que se abra el dialogo de captura de fotos.", AMBER,(255,248,230))

    pdf.screen_mock("Foto de Formatos - Obligatorio al Finalizar",[
        {"type":"text","text":"Foto de Formato de Movimiento de Activo","size":8,"style":"B","color":NAVY,"dy":7},
        {"type":"text","text":"Es obligatorio fotografiar el formato fisico firmado.","size":7.5,"color":GRAY,"dy":6},
        {"type":"divider","dy":3},
        {"type":"text","text":"[+] Formato ALTAS / BAJAS","size":8,"style":"B","color":DARK,"dy":5},
        {"type":"badge","text":" Abrir Camara ","color":BLUE,"x":5,"w":55,"dy":7},
        {"type":"text","text":"[+] Formato TRANSFERENCIAS","size":8,"style":"B","color":DARK,"dy":5},
        {"type":"badge","text":" Abrir Camara ","color":BLUE,"x":5,"w":55,"dy":7},
        {"type":"badge","text":" Guardar Fotos y Finalizar ","color":NAVY,"x":30,"w":130,"dy":6},
    ], height=78)

    pdf.subsection("5.7  Resumen de Auditoria Completada")
    pdf.body("Una vez finalizada, el sistema muestra el resumen con estadisticas e informacion detallada:")
    pdf.bullet("4 tarjetas KPI: Total Equipos, Localizados, Sobrantes, No Localizados")
    pdf.bullet("Haga clic en las tarjetas Localizado/Sobrante/No Localizado para ver el detalle de ese grupo")
    pdf.bullet("Tabla de detalle con: Codigo, Descripcion, Marca, Modelo, Serie, Valor, Depreciado")
    pdf.bullet("Fotos de formatos de movimiento (si se tomaron al finalizar)")

    pdf.screen_mock("Resumen Post-Auditoria",[
        {"type":"text","text":"ABELARDO TIJ  |  Completada  |  07/03/26","size":8,"style":"B","color":NAVY,"dy":6},
        {"type":"kpirow","values":[
            ("Equipos","35",NAVY),
            ("Localizado","30",GREEN),
            ("Sobrante","2",AMBER),
            ("No Local.","3",RED),
        ]},
        {"type":"text","text":"<-- Haga clic en Localizado/Sobrante/No Localizado para ver el detalle -->","size":7,"color":GRAY,"dy":5},
        {"type":"divider","dy":3},
        {"type":"text","text":"LOCALIZADO (30):","size":7.5,"style":"B","color":GREEN,"dy":5},
        {"type":"text","text":"Cod.Barras  Descripcion   Marca  Modelo  Serie    Valor    Dep.","size":6.5,"color":GRAY,"dy":5},
        {"type":"text","text":"84847618    ACCESS POINT  CISCO  WAP361  SN-F21  $4,200   No","size":6.5,"color":DARK,"dy":5},
    ], height=88)

    # ── 6. Bitácoras ──
    pdf.add_page()
    pdf.section_title("Bitacoras y Exportacion","6")
    pdf.body("Disponible para Administrador y Super Administrador. Acceso desde 'Bitacoras' en el menu lateral.")

    pdf.subsection("6.1  Clasificaciones de Equipos")
    pdf.body("Historial de todos los escaneos clasificados. Columnas disponibles:")
    pdf.table(
        ["Columna","Descripcion"],
        [
            ["Fecha","Fecha y hora del escaneo"],
            ["Codigo Barras","Codigo del equipo"],
            ["Clasificacion","LOCALIZADO / SOBRANTE / SOBRANTE DESCONOCIDO / NO LOCALIZADO"],
            ["Descripcion","Tipo de equipo (ACCESS POINT, ESCANER-LECTOR, etc.)"],
            ["Marca","Fabricante del equipo"],
            ["Modelo","Modelo especifico"],
            ["Serie","Numero de serie (si fue registrado)"],
            ["Depreciado","Si / No segun vida util calculada"],
            ["Tienda","Tienda donde se realizo el escaneo"],
        ],[35,155]
    )
    pdf.bullet("Filtro por clasificacion: Todos / Localizado / Sobrante / Sobrante Desconocido / No Localizado")
    pdf.bullet("Exportacion Excel incluye columnas Serie y Depreciado")

    pdf.subsection("6.2  Movimientos (ALTAS, BAJAS, TRANSFERENCIAS)")
    pdf.body("Historial de todos los movimientos generados por las auditorias.")
    pdf.table(
        ["Filtro","Que muestra"],
        [
            ["Todos","Todos los movimientos sin distincion"],
            ["No Localizado (BAJA)","Solo movimientos de baja por no localizacion"],
            ["Sobrante (ALTA)","Solo registros de nuevos equipos como alta"],
            ["Transferencias","Solo transferencias entre tiendas"],
        ],[50,140]
    )
    pdf.body("Botones de exportacion separados por tipo:")
    pdf.bullet("'Exportar ALTAS/BAJAS': genera SIGAF_AB_[FECHA].xlsx (incluye hoja 'Imagenes Formatos' con fotos)")
    pdf.bullet("'Exportar Transferencias': genera SIGAF_TRANSFERENCIAS_[FECHA].xlsx (incluye fotos)")

    pdf.subsection("6.3  Historial de Auditorias")
    pdf.body("Lista de todas las auditorias con filtros por estado. Al hacer clic en una auditoria:")

    pdf.screen_mock("Resumen de Auditoria en Bitacoras",[
        {"type":"text","text":"ACANTILADOS TIJ  |  CR:50SYP  |  Completada  |  07/03/26","size":7.5,"style":"B","color":NAVY,"dy":6},
        {"type":"kpirow","values":[
            ("Localizado","1",GREEN),
            ("Sobrante","2",AMBER),
            ("No Local.","21",RED),
        ]},
        {"type":"text","text":"<-- Haga clic en las tarjetas para filtrar el detalle de equipos -->","size":7,"color":GRAY,"dy":5},
        {"type":"divider","dy":3},
        {"type":"text","text":"NO LOCALIZADO (21):","size":7.5,"style":"B","color":RED,"dy":5},
        {"type":"text","text":"Cod.Barras  Descripcion  Marca  Modelo  Serie  Valor   Dep.","size":6.5,"color":GRAY,"dy":5},
        {"type":"text","text":"84847618    ACCESS POINT CISCO  WAP361  ----   $4,200  No","size":6.5,"color":DARK,"dy":5},
    ], height=78)

    pdf.body("Botones en el pie del resumen (solo auditorias completadas):")
    pdf.table(
        ["Boton","Funcion"],
        [
            ["Descargar AB","Descarga la foto del formato ALTAS/BAJAS como archivo JPG"],
            ["Descargar Transf.","Descarga la foto del formato TRANSFERENCIAS como archivo JPG"],
            ["Reporte PDF","Genera e imprime un reporte ejecutivo de una pagina con todos los datos"],
            ["Eliminar Auditoria","Solo Super Administrador: elimina la auditoria y sus datos asociados"],
        ],[40,150]
    )

    # ── 7. Administración ──
    pdf.add_page()
    pdf.section_title("Panel de Administracion","7")
    pdf.body("Disponible solo para Super Administrador. Se accede desde 'Administracion' en el menu lateral.")

    pdf.subsection("Gestion de Usuarios")
    pdf.bullet("Crear nuevos usuarios: nombre, email, contrasena y perfil (Super Admin / Admin / Socio Tec.)")
    pdf.bullet("Editar usuarios existentes: modificar cualquier campo")
    pdf.bullet("Eliminar usuarios (excepto el usuario administrador de respaldo)")

    pdf.subsection("Gestion de Equipos")
    pdf.bullet("Buscar equipos por codigo de barras, numero de activo, descripcion o serie")
    pdf.bullet("Filtrar por plaza")
    pdf.bullet("Editar campos: descripcion, marca, modelo, serie, costo, depreciacion")

    pdf.subsection("Reinicio de Datos")
    pdf.body("Permite actualizar el inventario cargando nuevos archivos Excel:")
    for i,s in enumerate([
        "Ir a Administracion > boton 'Reiniciar Datos'",
        "Adjuntar MAF.xlsx con el inventario actualizado de equipos",
        "Adjuntar USUARIOS.xlsx con los usuarios (opcional)",
        "Presionar 'Reiniciar Datos' para confirmar la operacion",
    ],1):
        pdf.bullet(f"{i}. {s}")
    pdf.note_box("ADVERTENCIA CRITICA","Esta accion elimina TODOS los datos del sistema: auditorias, movimientos, clasificaciones, escaneos y equipos. Esta accion NO SE PUEDE DESHACER. Asegurese de tener un respaldo antes de proceder.", RED,(255,235,235))

    # ── 8. Configuración ──
    pdf.section_title("Configuracion del Sistema","8")
    pdf.table(
        ["Opcion","Valores disponibles","Descripcion"],
        [
            ["Tema","Claro / Oscuro","Cambia el esquema de colores de toda la interfaz"],
            ["Idioma","Espanol / Ingles","Traduce todos los textos del sistema instantaneamente"],
            ["Paleta de colores","Profesional / OXXO","Azul marino (Profesional) o Rojo/Amarillo corporativo OXXO"],
        ],[28,40,122]
    )

    # ── 9. FAQ ──
    pdf.add_page()
    pdf.section_title("Preguntas Frecuentes","9")
    faq = [
        ("La tienda no muestra el estado 'En Progreso'",
         "Recargue la pagina (F5 o jalar hacia abajo en movil). El estado se asigna al crear la auditoria. Si persiste, cierre sesion y vuelva a ingresar."),
        ("Escanee un codigo incorrecto, como lo elimino?",
         "En el historial de escaneos (lista debajo del campo de entrada), presione el icono X junto al registro incorrecto para eliminarlo del conteo."),
        ("Puedo cancelar una auditoria en curso?",
         "Si. Presione el boton CANCELAR (rojo) en la parte superior del modulo. Es obligatorio escribir el motivo de cancelacion. La tienda queda disponible para nueva auditoria."),
        ("El dispositivo Zebra no escanea en SIGAF",
         "Verifique que DataWedge este activo y configurado como salida de teclado. Asegurese de tocar primero el campo de escaneo para que tenga el foco (borde destacado). Si persiste, reinicie la aplicacion DataWedge en el Zebra."),
        ("Que pasa con un equipo Sobrante Desconocido?",
         "Se abre el formulario para registrarlo manualmente con Descripcion, Marca, Modelo y Serie (opcional). Al confirmar queda registrado en el MAF de la tienda como ALTA."),
        ("Que significa estado INCOMPLETO en una auditoria?",
         "Que mas del 20% de los equipos de la tienda no fueron localizados durante la auditoria. El sistema lo marca automaticamente."),
        ("Donde estan las fotos de los formatos de movimiento?",
         "En Bitacoras > Historial de Auditorias. Abra el resumen de la auditoria y baje hasta el final. Use los botones 'Descargar AB' o 'Descargar Transf.' para guardar las fotos."),
        ("Como imprimo el reporte de una auditoria?",
         "En Bitacoras > Historial de Auditorias, abra el resumen y presione 'Reporte PDF'. Se abre una ventana con el reporte ejecutivo. Use Ctrl+P (o Cmd+P en Mac) para imprimir."),
        ("La exportacion Excel no incluye lo que espero",
         "Verifique el filtro activo en la tabla antes de exportar. La exportacion respeta exactamente el filtro seleccionado (tipo de movimiento y busqueda de texto)."),
        ("Puedo auditar una tienda mas de una vez en el mismo ciclo?",
         "Si. Al iniciar auditoria en una tienda ya auditada, se crea una nueva auditoria independiente. El historial de la anterior queda disponible en Bitacoras."),
    ]
    for q, a in faq:
        pdf.subsection(q)
        pdf.body(a)

    out = io.BytesIO()
    pdf.output(out)
    out.seek(0)
    return out


# ═══════════════════════════════════════════════════════════════
#  PRESENTACION DEL PROYECTO
# ═══════════════════════════════════════════════════════════════

def generate_presentation(stats, plazas_data):
    pdf = SigafPDF("SIGAF - Presentacion Ejecutiva")
    pdf.alias_nb_pages()

    pdf.cover("SIGAF", "Sistema Integral de Gestion de Activo Fijo", "Presentacion Ejecutiva - Marzo 2026")

    # ── 1. Problemática ──
    pdf.add_page()
    pdf.section_title("Problematica","1")
    pdf.body("La gestion de activos fijos de computo en cadenas de tiendas de conveniencia presenta desafios criticos que impactan el control financiero y operativo:")
    for p in [
        "Control manual de inventario propenso a errores, omisiones y duplicidades",
        "Imposibilidad de rastrear equipos desplazados entre tiendas y plazas",
        "Auditorias lentas, dependientes de formatos fisicos y personal especializado",
        "Ausencia de metricas en tiempo real para la toma de decisiones",
        "Inconsistencia entre el registro en sistemas (MAF) y la existencia fisica de equipos",
        "Tiempo elevado para consolidar y reportar resultados de cada ciclo de auditoria",
        "Sin evidencia fotografica ni trazabilidad de movimientos de activos",
    ]:
        pdf.bullet(p, color=RED)
    pdf.note_box("Impacto financiero","La falta de control preciso genera diferencias entre el valor contable y el valor real de los activos, dificultando decisiones de reemplazo, deprecacion y deteccion de mermas.", AMBER,(255,248,230))

    # ── 2. Solución ──
    pdf.add_page()
    pdf.section_title("Solucion: SIGAF","2")
    pdf.body("SIGAF es una plataforma web integral desarrollada para OXXO que digitaliza completamente el proceso de auditoria de activos fijos de computo.")

    pdf.subsection("Propuesta de valor")
    for v in [
        "Auditoria digital completa con lectores de codigo de barras Zebra TC52",
        "Clasificacion automatica en tiempo real: Localizado, Sobrante, No Localizado",
        "Trazabilidad completa: ALTAS, BAJAS y TRANSFERENCIAS con evidencia fotografica",
        "Dashboard con KPIs dinamicos por plaza para supervision gerencial",
        "Generacion automatica de documentos Excel con formato corporativo AF",
        "Control de acceso por roles (Super Admin / Administrador / Socio Tecnologico)",
        "Plataforma PWA: funciona en Zebra TC52, tablet y PC sin instalacion adicional",
        "Reporte PDF ejecutivo por auditoria listo para presentar o imprimir",
    ]:
        pdf.bullet(v, color=GREEN)

    pdf.screen_mock("Dashboard SIGAF - Vista Real",[
        {"type":"text","text":"Bienvenido, Benjamin Ruiz","size":7.5,"color":GRAY,"dy":5},
        {"type":"kpirow","values":[
            ("Tiendas","1,010",NAVY),
            ("Auditadas","124",GREEN),
            ("Equipos","28,430",BLUE),
            ("Depreciados","3,211",AMBER),
        ]},
        {"type":"text","text":"RESUMEN DE TIENDAS (1,010) - Plaza: Todas","size":7.5,"style":"B","color":NAVY,"dy":5},
        {"type":"divider","dy":3},
        {"type":"text","text":"10TIJ Ensenada  CR:32UHH  24 equipos    [ Pendiente ]","size":7,"color":DARK,"dy":5},
        {"type":"text","text":"ARIAS TIJ  CR:50REP  35 equipos          [ Auditada  ]","size":7,"color":GREEN,"dy":5},
        {"type":"text","text":"Abelardo TIJ  CR:50SYP  35 equipos       [ En Progreso ]","size":7,"color":BLUE,"dy":5},
    ], height=80)

    # ── 3. Arquitectura ──
    pdf.add_page()
    pdf.section_title("Arquitectura Tecnica","3")
    pdf.table(
        ["Componente","Tecnologia","Funcion","Despliegue"],
        [
            ["Frontend","React 19 + Tailwind CSS","Interfaz responsive y PWA","Railway"],
            ["Backend","FastAPI Python 3.12","API REST y logica de negocio","Railway (Docker)"],
            ["Base de datos","MongoDB Atlas","Almacenamiento NoSQL cloud","MongoDB Cloud"],
            ["Autenticacion","JWT + bcrypt","Control de acceso seguro","En API"],
            ["Exportacion Excel","OpenPyXL","Archivos con formato corporativo","En API"],
            ["Generacion PDF","FPDF2","Manual y presentacion dinamicos","En API"],
            ["Dispositivo campo","Zebra TC52 + DataWedge","Lectura de codigos de barras","On-site"],
        ],[32,42,60,30]
    )

    pdf.subsection("Flujo de operacion")
    pdf.body("Zebra TC52 (DataWedge keystroke) --> Campo de escaneo React --> API FastAPI --> MongoDB Atlas --> Clasificacion automatica --> Actualizacion en tiempo real de contadores y tabla")

    pdf.note_box("Rendimiento","El sistema maneja mas de 30,000 registros de equipos con tiempos de respuesta inferiores a 200ms. Preparado para uso simultaneo de multiples auditores en diferentes tiendas.", GREEN,(230,255,235))

    # ── 4. Módulo de Auditoría ──
    pdf.add_page()
    pdf.section_title("Modulo de Auditoria (Inventario) - Detalle","4")
    pdf.body("El modulo de auditoria es el nucleo de SIGAF. Permite realizar el inventario fisico completo de una tienda de manera rapida y precisa.")

    pdf.subsection("Flujo completo de auditoria")
    for i,(t,d) in enumerate([
        ("Seleccionar tienda","Hacer clic en la tienda en el panel principal"),
        ("Iniciar Auditoria","Presionar el boton. El estado cambia a 'En Progreso' (azul)"),
        ("Escanear equipos","Usar Zebra TC52: el codigo se clasifica en menos de 0.5 segundos"),
        ("Clasificacion automatica","Localizado / Sobrante / Sobrante Desconocido"),
        ("Registrar sobrantes","Formulario: descripcion, marca, modelo, serie opcional"),
        ("Confirmar transferencias","Equipos de otras tiendas: confirmar la transferencia"),
        ("Finalizar auditoria","Sistema procesa y aplica bajas automaticas"),
        ("Fotografiar formatos","Foto obligatoria del formato AF firmado (si hay movimientos)"),
        ("Ver resumen","Estadisticas con detalle filtrable por grupo de equipos"),
    ],1):
        pdf.set_font("Helvetica","B",10)
        pdf.set_text_color(*NAVY)
        pdf.set_x(10)
        pdf.cell(7,6,safe(f"{i}."),align="R")
        pdf.cell(40,6,safe(f" {t}"),align="L")
        pdf.set_font("Helvetica","",10)
        pdf.set_text_color(*DARK)
        pdf.multi_cell(0,6,safe(f": {d}"))

    pdf.screen_mock("Auditoria en Proceso con Zebra TC52",[
        {"type":"text","text":"ABELARDO TIJ  |  35 equipos en MAF  |  En Progreso","size":8,"style":"B","color":NAVY,"dy":6},
        {"type":"kpirow","values":[
            ("Localizado","28",GREEN),
            ("Sobrante","2",AMBER),
            ("No Local.","5",RED),
        ]},
        {"type":"text","text":"[_________________________________________]  [Escanear]  <- Zebra TC52","size":7.5,"color":DARK,"dy":7},
        {"type":"bar","pct":0.86,"color":GREEN,"w":165,"x":5,"dy":6},
        {"type":"text","text":"Progreso: 30 de 35 equipos (86%)","size":7,"color":GRAY,"dy":6},
        {"type":"divider","dy":3},
        {"type":"text","text":"84847784  HAND HELD ZEBRA TC52    -> LOCALIZADO","size":7,"color":GREEN,"dy":5},
        {"type":"text","text":"63738745  ESCANER (de 10TIJ Ensenada) -> SOBRANTE (transferir?)","size":7,"color":AMBER,"dy":5},
    ], height=90)

    # ── 5. Evidencia y Trazabilidad ──
    pdf.add_page()
    pdf.section_title("Evidencia y Trazabilidad","5")

    pdf.subsection("Foto de formatos de movimiento")
    pdf.body("Al finalizar la auditoria, si existen movimientos de ALTA/BAJA o TRANSFERENCIA, el sistema solicita la captura fotografica del formato fisico firmado:")
    pdf.table(
        ["Formato","Cuando aplica","Se incluye en..."],
        [
            ["Formato AF ALTAS/BAJAS","Existen movimientos de alta o baja","Resumen de auditoria, bitacora, Excel exportado"],
            ["Formato AF TRANSFERENCIAS","Existen movimientos de transferencia","Resumen de auditoria, bitacora, Excel exportado"],
        ],[40,65,85]
    )

    pdf.subsection("Registro de movimientos")
    pdf.table(
        ["Tipo","Origen","Resultado en el sistema"],
        [
            ["ALTA","Equipo sobrante desconocido registrado manualmente","Se integra al MAF de la tienda con todos sus datos"],
            ["BAJA","Equipo no localizado al finalizar auditoria","Se registra la baja, queda en historial de movimientos"],
            ["TRANSFERENCIA","Equipo sobrante de otra tienda confirmado","Se reasigna al MAF de la tienda destino"],
        ],[28,70,92]
    )

    pdf.subsection("Reporte PDF ejecutivo por auditoria")
    pdf.body("Desde el historial de auditorias se puede generar un reporte ejecutivo de UNA pagina con:")
    for item in [
        "Encabezado con datos de la tienda (nombre, CR, plaza, auditor, fecha)",
        "4 KPIs: Total equipos, Localizados, Sobrantes, No Localizados",
        "Valor total de equipos no localizados",
        "Tabla de equipos no localizados (hasta 20) con valor y depreciacion",
        "Fotos de formatos de movimiento (ALTAS/BAJAS y TRANSFERENCIAS)",
        "Pie de pagina con fecha de generacion",
    ]:
        pdf.bullet(item)

    # ── 6. Datos del sistema ──
    if stats:
        pdf.add_page()
        pdf.section_title("Datos Actuales del Sistema","6")
        pdf.kpi_row([
            ("Total Tiendas",   f"{stats.get('total_stores',0):,}", NAVY),
            ("Total Equipos",   f"{stats.get('total_equipment',0):,}", BLUE),
            ("Equipos Activos", f"{stats.get('active_equipment',0):,}", GREEN),
            ("Depreciados",     f"{stats.get('deprecated_equipment',0):,}", AMBER),
        ])
        pdf.kpi_row([
            ("Costo Registrado",  f"${stats.get('total_cost',0):,.0f}", NAVY),
            ("Valor Real Total",  f"${stats.get('total_real_value',0):,.0f}", BLUE),
            ("Auditorias Comp.",  str(stats.get("completed_audits",0)), GREEN),
            ("Tiendas Auditadas", str(stats.get("audited_stores",0)), AMBER),
        ])
        if stats.get("equipment_by_plaza"):
            pdf.subsection("Distribucion de equipos por plaza")
            total_eq = max(stats.get("total_equipment",1),1)
            plaza_rows = [[p,f"{c:,}",f"{c/total_eq*100:.1f}%"]
                          for p,c in sorted(stats["equipment_by_plaza"].items(),key=lambda x:-x[1])]
            pdf.table(["Plaza","Equipos","% del Total"],plaza_rows,[70,60,60])

    # ── 7. Estado del proyecto ──
    pdf.add_page()
    pdf.section_title("Estado del Proyecto","7")
    pdf.table(
        ["Funcionalidad","Estado","Ambiente"],
        [
            ["Dashboard con KPIs dinamicos por plaza","Completado","Produccion"],
            ["Modulo de Auditoria (Inventario)","Completado","Produccion"],
            ["Clasificacion automatica en tiempo real","Completado","Produccion"],
            ["Registro de Sobrante Desconocido con Serie","Completado","Produccion"],
            ["Evidencia fotografica de formatos AF","Completado","Produccion"],
            ["Exportacion Excel (AB + Transferencias + Fotos)","Completado","Produccion"],
            ["Bitacoras filtrables con Serie y Depreciado","Completado","Produccion"],
            ["Resumen interactivo de auditoria","Completado","Produccion"],
            ["Reporte PDF ejecutivo por auditoria","Completado","Produccion"],
            ["Manual de Usuario PDF dinamico","Completado","Produccion"],
            ["Badge 'En Progreso' en tarjetas de tienda","Completado","Produccion"],
            ["Dispositivos Zebra TC52 configurados","En proceso","Actualizacion OS pendiente"],
        ],[90,32,68]
    )

    # ── 8. Beneficios ──
    pdf.add_page()
    pdf.section_title("Beneficios","8")
    for title,desc in [
        ("Eficiencia operativa",
         "Reduccion de hasta 80% en tiempo de auditoria. Una tienda de 30 equipos puede auditarse en menos de 15 minutos con el Zebra TC52."),
        ("Visibilidad gerencial en tiempo real",
         "Dashboard con KPIs actualizados al instante. Supervisores pueden monitorear el avance desde cualquier dispositivo."),
        ("Trazabilidad y cumplimiento",
         "Cada movimiento registrado con fecha, hora, usuario, datos del equipo y foto del formato fisico firmado."),
        ("Control financiero preciso",
         "Calculo automatico de valor real, identificacion de depreciados y cuantificacion exacta del valor de faltantes por tienda y plaza."),
        ("Reduccion de errores",
         "La clasificacion automatica y el escaneo digital eliminan errores humanos de captura. Los formatos fisicos pasan a ser evidencia, no la fuente principal."),
        ("Escalabilidad cloud",
         "Arquitectura lista para +1,000 tiendas y +50,000 equipos. Tiempo de respuesta sub-segundo garantizado en MongoDB Atlas."),
    ]:
        pdf.subsection(title)
        pdf.body(desc)

    # ── 9. Siguientes pasos ──
    pdf.add_page()
    pdf.section_title("Siguientes Pasos","9")
    for s in [
        "Completar actualizacion de OS en dispositivos Zebra TC52 para uso operativo",
        "Capacitacion de auditores en el uso del sistema y DataWedge",
        "Piloto inicial en un grupo de tiendas por plaza para validacion",
        "Integracion con sistema ERP/SAP para sincronizacion automatica del MAF",
        "Modo offline robusto para tiendas con conectividad limitada",
        "Dashboard gerencial con comparativas historicas entre ciclos de auditoria",
        "Notificaciones automaticas por correo al completar auditorias",
        "App nativa Android optimizada para Zebra TC52",
    ]:
        pdf.bullet(s)

    # Cierre
    pdf.ln(12)
    if pdf.get_y() < 230:
        y = pdf.get_y()
        pdf.set_fill_color(*NAVY)
        pdf.rect(10, y, 190, 32, 'F')
        pdf.set_y(y+7)
        pdf.set_font("Helvetica","B",15)
        pdf.set_text_color(*WHITE)
        pdf.cell(210,8,safe("Gracias por su atencion"),align="C",new_x="LMARGIN",new_y="NEXT")
        pdf.set_font("Helvetica","",9.5)
        pdf.set_text_color(180,200,240)
        pdf.cell(210,7,safe("SIGAF - OXXO Direccion de Sistemas"),align="C",new_x="LMARGIN",new_y="NEXT")
        pdf.cell(210,7,safe("benjamin.ruiz@oxxo.com"),align="C")

    out = io.BytesIO()
    pdf.output(out)
    out.seek(0)
    return out
