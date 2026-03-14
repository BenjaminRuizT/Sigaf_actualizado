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

def generate_user_manual(stats, plazas_data, user_perfil="Super Administrador"):
    # Normalizar perfil
    perfil = user_perfil or "Administrador"
    is_super = perfil == "Super Administrador"
    is_admin = perfil in ("Super Administrador", "Administrador")
    is_socio = perfil == "Socio Tecnologico"

    pdf = SigafPDF(f"SIGAF - Manual de Usuario ({perfil})")
    pdf.alias_nb_pages()

    cover_subtitle = "Guia completa del sistema SIGAF"
    if is_socio:
        cover_subtitle = "Guia para Socio Tecnologico"
    elif perfil == "Administrador":
        cover_subtitle = "Guia para Administrador"

    pdf.cover("Manual de Usuario", cover_subtitle, f"Perfil: {perfil}  |  v2.0 - Marzo 2026")

    # Tabla de contenido adaptada al perfil
    pdf.add_page()
    pdf.section_title("Contenido")
    toc_all = [
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
    ]
    if is_admin:
        toc_all += [
            ("6","Bitacoras y Exportacion"),
            ("6.1","  Clasificaciones de Equipos"),
            ("6.2","  Movimientos (ALTAS, BAJAS, TRANSFERENCIAS)"),
            ("6.3","  Historial de Auditorias"),
        ]
    if is_super:
        toc_all += [
            ("7","Panel de Administracion"),
            ("7.1","  Gestion de Usuarios"),
            ("7.2","  Gestion de Equipos"),
            ("7.3","  Reinicio de Datos"),
        ]
    toc_all += [
        ("8" if is_super else ("7" if is_admin else "6"),"Configuracion del Sistema"),
        ("9" if is_super else ("8" if is_admin else "7"),"Preguntas Frecuentes"),
    ]
    for num, item in toc_all:
        pdf.set_font("Helvetica","",10)
        pdf.set_text_color(*DARK)
        pdf.set_x(14)
        pdf.cell(14,6,safe(num),align="L")
        pdf.cell(0,6,safe(item),new_x="LMARGIN",new_y="NEXT")

    # ── 1. Introducción ──
    pdf.add_page()
    pdf.section_title("Introduccion al Sistema","1")
    pdf.body("SIGAF (Sistema Integral de Gestion de Activo Fijo) es una plataforma web desarrollada para OXXO orientada a la realizacion de auditorias de inventario de equipo de computo en tiendas de conveniencia.")

    if is_socio:
        pdf.body("Como Socio Tecnologico, su rol principal es realizar auditorias de inventario en las tiendas asignadas usando el dispositivo Zebra TC52. Este manual cubre unicamente las funciones disponibles para su perfil.")
        pdf.note_box("Funciones disponibles para Socio Tecnologico",
            "Panel Principal (Dashboard), Gestion de Tiendas (consulta), Modulo de Auditoria completo, Configuracion del sistema.",
            GREEN, (230, 255, 235))
    elif perfil == "Administrador":
        pdf.body("Como Administrador, tiene acceso al modulo de auditoria, bitacoras y exportacion de reportes Excel. Este manual cubre todas las funciones disponibles para su perfil.")
        pdf.note_box("Funciones disponibles para Administrador",
            "Panel Principal, Gestion de Tiendas, Modulo de Auditoria completo, Bitacoras (Clasificaciones, Movimientos, Historial de Auditorias), Exportacion Excel, Configuracion.",
            BLUE, (230, 238, 255))
    else:
        pdf.body("Como Super Administrador, tiene acceso total al sistema incluyendo gestion de usuarios, equipos y reinicio de datos.")
        pdf.note_box("Acceso total - Super Administrador",
            "Todas las funciones del sistema: Panel, Auditoria, Bitacoras, Administracion de usuarios y equipos, Reinicio de datos, Configuracion.",
            NAVY, (230, 235, 255))

    pdf.subsection("Perfiles de usuario del sistema")
    pdf.table(
        ["Perfil","Acceso a..."],
        [
            ["Super Administrador","Todo el sistema: Dashboard, Auditoria, Bitacoras, Administracion, Configuracion"],
            ["Administrador","Dashboard, Auditoria, Bitacoras con exportacion Excel, Configuracion"],
            ["Socio Tecnologico","Dashboard (consulta) y Modulo de Auditoria, Configuracion"],
        ],[48,142]
    )

    pdf.subsection("Caracteristicas del sistema v2.0")
    features_all = [
        ("all","Dashboard con 6 KPIs dinamicos filtrados por plaza en tiempo real"),
        ("all","Tarjetas de tienda con estado: Pendiente / En Progreso / Auditada"),
        ("all","Escaneo de codigos de barras con Zebra TC52 via DataWedge"),
        ("all","Clasificacion automatica: Localizado, Sobrante, Sobrante Desconocido, No Localizado"),
        ("all","Campo de Numero de Serie en registro de Sobrante Desconocido"),
        ("all","Foto obligatoria de formatos fisicos al finalizar (ALTA/BAJA y Transferencias)"),
        ("all","Resumen interactivo: clic en tarjetas para filtrar detalle por grupo"),
        ("all","Tabla de equipos con columnas Serie y Depreciado"),
        ("admin","Exportacion Excel con hoja adicional de imagenes de formatos"),
        ("admin","Bitacoras con columnas Serie y Depreciado"),
        ("admin","Descarga individual de fotos de formatos desde historial de auditorias"),
        ("admin","Reporte PDF ejecutivo de una pagina por auditoria"),
        ("super","Gestion de usuarios (crear, editar, eliminar)"),
        ("super","Gestion y edicion de equipos"),
        ("super","Reinicio de datos del sistema (carga de nuevos MAF)"),
        ("all","Temas: Claro/Oscuro | Paletas: Profesional / Corporativo OXXO"),
        ("all","Interfaz bilingue Espanol / Ingles"),
    ]
    for scope, f in features_all:
        if scope == "all" or (scope == "admin" and is_admin) or (scope == "super" and is_super):
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
        {"type":"badge","text":" Iniciar Auditoria ","color":NAVY,"x":5,"w":65,"dy":5},
    ], height=76)
    pdf.note_box("Scroll horizontal","En moviles la tabla incluye scroll horizontal para ver todas las columnas: Codigo, Descripcion, Marca, Modelo, Serie, Valor Real, Depreciado.",BLUE)

    # ── 5. Módulo de Auditoría ──
    pdf.add_page()
    pdf.section_title("Modulo de Auditoria (Inventario)","5")
    pdf.body("Nucleo del sistema. Permite realizar el inventario fisico completo de una tienda.")

    pdf.subsection("5.1  Iniciar Auditoria")
    pdf.body("En el dialogo de tienda presione 'Iniciar Auditoria'. La tarjeta de la tienda cambia a 'En Progreso' (azul).")
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
    ], height=82)

    pdf.subsection("5.2  Escaneo de Codigos de Barras con Zebra TC52")
    pdf.table(
        ["Metodo","Como usarlo","Velocidad"],
        [
            ["Zebra TC52 (DataWedge)","Enfoque el campo y presione el gatillo del lector fisico.","< 0.5 seg"],
            ["Entrada manual","Escriba el codigo en el campo y presione Enter.","Manual"],
        ],[52,98,40]
    )
    pdf.note_box("DataWedge","El Zebra TC52 viene preconfigurado para salida por teclado. Solo asegurese de que el campo de escaneo tenga el foco antes de escanear.", NAVY)

    pdf.add_page()
    pdf.subsection("5.3  Clasificacion Automatica de Equipos")
    pdf.table(
        ["Clasificacion","Condicion","Color","Accion"],
        [
            ["LOCALIZADO","El equipo pertenece a esta tienda","Verde","Se registra como encontrado"],
            ["SOBRANTE","El equipo pertenece a otra tienda","Amarillo","Dialogo de confirmacion de transferencia"],
            ["SOBRANTE DESCONOCIDO","Codigo no existe en el MAF","Naranja","Formulario de registro como ALTA"],
            ["NO LOCALIZADO","No escaneado al finalizar","Rojo","BAJA automatica al finalizar"],
        ],[40,52,25,73]
    )

    pdf.subsection("5.4  Registro de Sobrante Desconocido como ALTA")
    pdf.screen_mock("Sobrante Desconocido - Registrar ALTA",[
        {"type":"text","text":"Sobrante Desconocido - Registrar ALTA","size":8,"style":"B","color":ORANGE,"dy":7},
        {"type":"text","text":"Codigo detectado: NEW-00001","size":7.5,"color":DARK,"dy":6},
        {"type":"text","text":"Descripcion: [ ACCESS POINT          v ]   Marca: [ CISCO  v ]","size":7.5,"color":DARK,"dy":6},
        {"type":"text","text":"Modelo:      [ WAP361                  ]   Serie: [ SN-001  ] (opcional)","size":7.5,"color":DARK,"dy":7},
        {"type":"badge","text":" Registrar como ALTA ","color":NAVY,"x":50,"w":90,"dy":6},
    ], height=62)
    pdf.bullet("Al confirmar: el equipo se agrega al MAF y se genera movimiento de ALTA")
    pdf.bullet("El numero de serie queda registrado para trazabilidad")

    pdf.subsection("5.5  Transferencias entre Tiendas")
    pdf.body("Al detectar un equipo SOBRANTE (de otra tienda): se muestra dialogo con datos del equipo, tienda origen y tienda destino. Al confirmar se genera movimiento de TRANSFERENCIA.")

    pdf.subsection("5.6  Finalizar Auditoria y Foto de Formatos")
    pdf.body("Al presionar 'Finalizar Auditoria':")
    pdf.bullet("Equipos no escaneados se clasifican como NO LOCALIZADO automaticamente")
    pdf.bullet("Se aplica BAJA automatica a todos los no localizados")
    pdf.bullet("Aparece pantalla de espera 'Procesando auditoria...' — NO cierre la ventana")
    pdf.bullet("Si hay movimientos, se solicita foto del formato fisico firmado")
    pdf.screen_mock("Foto de Formatos - Al Finalizar",[
        {"type":"text","text":"Foto de Formato de Movimiento de Activo","size":8,"style":"B","color":NAVY,"dy":7},
        {"type":"text","text":"[ Formato ALTAS / BAJAS ]   [ Abrir Camara ]  [ Capturado OK ]","size":7.5,"color":DARK,"dy":7},
        {"type":"text","text":"[ Formato TRANSFERENCIAS ]  [ Abrir Camara ]  [ Sin captura ]","size":7.5,"color":DARK,"dy":7},
        {"type":"badge","text":" Guardar Fotos y Finalizar ","color":NAVY,"x":30,"w":130,"dy":6},
    ], height=54)

    pdf.add_page()
    pdf.subsection("5.7  Resumen de Auditoria Completada")
    pdf.screen_mock("Resumen Post-Auditoria",[
        {"type":"text","text":"ABELARDO TIJ  |  Completada  |  08/03/26","size":8,"style":"B","color":NAVY,"dy":6},
        {"type":"kpirow","values":[
            ("Equipos","35",NAVY),
            ("Localizado","30",GREEN),
            ("Sobrante","2",AMBER),
            ("No Local.","3",RED),
        ]},
        {"type":"text","text":"<-- Haga clic en las tarjetas para filtrar el detalle -->","size":7,"color":GRAY,"dy":5},
        {"type":"divider","dy":3},
        {"type":"text","text":"NO LOCALIZADO (3):","size":7.5,"style":"B","color":RED,"dy":5},
        {"type":"text","text":"Cod.Barras  Descripcion   Marca  Modelo  Serie    Valor    Dep.","size":6.5,"color":GRAY,"dy":4},
        {"type":"text","text":"84847618    ACCESS POINT  CISCO  WAP361  SN-F21  $4,200   No","size":6.5,"color":DARK,"dy":5},
    ], height=84)
    pdf.bullet("Haga clic en Localizado/Sobrante/No Localizado para ver el detalle de cada grupo")
    pdf.bullet("Tabla con: Codigo, Descripcion, Marca, Modelo, Serie, Valor, Depreciado")

    # ── 6. Bitácoras — solo admin/super ──
    if is_admin:
        pdf.add_page()
        pdf.section_title("Bitacoras y Exportacion","6")
        pdf.body("Acceso desde 'Bitacoras' en el menu lateral.")

        pdf.subsection("6.1  Clasificaciones de Equipos")
        pdf.body("Historial de todos los escaneos clasificados. Columnas:")
        pdf.table(
            ["Columna","Descripcion"],
            [
                ["Fecha","Fecha y hora del escaneo"],
                ["Codigo Barras","Codigo del equipo"],
                ["Clasificacion","LOCALIZADO / SOBRANTE / SOBRANTE DESCONOCIDO / NO LOCALIZADO"],
                ["Descripcion","Tipo de equipo"],
                ["Marca","Fabricante"],
                ["Serie","Numero de serie del equipo"],
                ["Valor Real","Valor calculado del activo"],
                ["Depreciado","Si / No segun vida util"],
                ["Tienda","Tienda donde se escaneo"],
            ],[35,155]
        )
        pdf.bullet("Filtro por tipo de clasificacion")
        pdf.bullet("Exportacion Excel incluye columnas Serie y Depreciado")

        pdf.subsection("6.2  Movimientos (ALTAS, BAJAS, TRANSFERENCIAS)")
        pdf.table(
            ["Filtro","Que muestra"],
            [
                ["Todos","Todos los movimientos"],
                ["No Localizado (BAJA)","Solo movimientos de baja"],
                ["Sobrante (ALTA)","Solo registros de alta"],
                ["Transferencias","Solo transferencias entre tiendas"],
            ],[50,140]
        )
        pdf.body("Botones de exportacion:")
        pdf.bullet("'Exportar ALTAS/BAJAS': SIGAF_AB_[FECHA].xlsx (incluye hoja con fotos de formatos)")
        pdf.bullet("'Exportar Transferencias': SIGAF_TRANSFERENCIAS_[FECHA].xlsx (incluye fotos)")

        pdf.subsection("6.3  Historial de Auditorias")
        pdf.screen_mock("Resumen de Auditoria en Bitacoras",[
            {"type":"text","text":"ARIAS TIJ  |  Completada  |  08/03/26","size":8,"style":"B","color":NAVY,"dy":6},
            {"type":"kpirow","values":[
                ("Localizado","1",GREEN),
                ("Sobrante","2",AMBER),
                ("No Local.","33",RED),
            ]},
            {"type":"text","text":"<-- Clic en tarjetas para filtrar equipos -->","size":7,"color":GRAY,"dy":5},
            {"type":"divider","dy":3},
            {"type":"text","text":"NO LOCALIZADO (33): MONITOR - VIEWSONIC  Serie: TEY152060895","size":7,"color":DARK,"dy":5},
        ], height=66)
        pdf.body("Botones en el pie del resumen:")
        pdf.table(
            ["Boton","Funcion"],
            [
                ["Descargar AB","Descarga la foto del formato ALTAS/BAJAS como JPG"],
                ["Descargar Transf.","Descarga la foto del formato TRANSFERENCIAS como JPG"],
                ["Reporte PDF","Genera reporte ejecutivo de una pagina listo para imprimir"],
            ],[40,150] if not is_super else [40,148]
        )
        if is_super:
            pdf.bullet("Eliminar Auditoria: solo disponible para Super Administrador")

    # ── 7. Administración — solo super ──
    if is_super:
        pdf.add_page()
        pdf.section_title("Panel de Administracion","7")
        pdf.body("Disponible solo para Super Administrador. Se accede desde 'Administracion' en el menu lateral.")
        pdf.subsection("7.1  Gestion de Usuarios")
        pdf.bullet("Crear nuevos usuarios: nombre, email, contrasena y perfil")
        pdf.bullet("Editar usuarios existentes")
        pdf.bullet("Eliminar usuarios")
        pdf.subsection("7.2  Gestion de Equipos")
        pdf.bullet("Buscar equipos por codigo, descripcion o serie; filtrar por plaza")
        pdf.bullet("Editar campos: descripcion, marca, modelo, serie, costo, depreciacion")
        pdf.subsection("7.3  Reinicio de Datos")
        for i,s in enumerate([
            "Ir a Administracion > 'Reiniciar Datos'",
            "Adjuntar MAF.xlsx con el inventario actualizado",
            "Adjuntar USUARIOS.xlsx (opcional)",
            "Confirmar la operacion",
        ],1):
            pdf.bullet(f"{i}. {s}")
        pdf.note_box("ADVERTENCIA CRITICA","Esta accion elimina TODOS los datos: auditorias, movimientos, escaneos, equipos. NO SE PUEDE DESHACER.", RED,(255,235,235))

    # ── Configuración ──
    sec_num = "8" if is_super else ("7" if is_admin else "6")
    pdf.add_page()
    pdf.section_title("Configuracion del Sistema", sec_num)
    pdf.table(
        ["Opcion","Valores","Descripcion"],
        [
            ["Tema","Claro / Oscuro","Cambia el esquema de colores"],
            ["Idioma","Espanol / Ingles / Portugues","Traduce todos los textos del sistema (3 idiomas)"],
            ["Paleta","Profesional / OXXO","Azul marino (Profesional) o Rojo/Amarillo corporativo"],
        ],[28,50,112]
    )

    if is_super:
        pdf.subsection("Configuracion avanzada (Solo Super Administrador)")
        pdf.table(
            ["Parametro","Rango","Descripcion"],
            [
                ["Foto formato ALTAS","Si / No","Solicitar foto del formato AF al registrar altas"],
                ["Foto formato BAJAS","Si / No","Solicitar foto del formato AF al registrar bajas"],
                ["Foto TRANSFERENCIAS","Si / No","Solicitar foto del formato AF en transferencias"],
                ["TTL fotos pendientes","1 - 168 horas","Tiempo para subir fotos antes de eliminar auditoria"],
                ["Timeout inactividad","5 - 480 minutos","Minutos sin actividad para cierre automatico de sesion"],
                ["Multiples sesiones","Si / No","Permitir que un usuario inicie sesion en varios dispositivos"],
            ],[45,28,117]
        )
        pdf.note_box("Cierre automatico por inactividad",
            "Cuando un usuario no registra actividad (teclado, mouse, touch) durante el tiempo configurado, aparece un banner de aviso con cuenta regresiva de 5 minutos. Si no confirma, la sesion se cierra automaticamente.",
            AMBER, (255, 248, 230))

    if is_super or is_admin:
        pdf.subsection("Historial y administracion (Panel de Administracion)")
        pdf.table(
            ["Seccion","Descripcion"],
            [
                ["Sesiones activas","Ver y cerrar forzosamente sesiones activas de cualquier usuario"],
                ["Auditorias vencidas","Ver auditorias pendientes de foto que vencieron; restaurar plazo (+24h) o eliminar"],
                ["Historial de acciones","Registro de cambios con opcion de reversion (rollback)"],
            ],[45,145]
        )

    # ── FAQ adaptado al perfil ──
    faq_num = "9" if is_super else ("8" if is_admin else "7")
    pdf.add_page()
    pdf.section_title("Preguntas Frecuentes", faq_num)

    faq_common = [
        ("La tienda no muestra el estado 'En Progreso'",
         "Recargue la pagina. Si persiste, cierre sesion y vuelva a ingresar."),
        ("Escanee un codigo incorrecto, como lo elimino?",
         "En el historial de escaneos, presione el icono X junto al registro incorrecto."),
        ("Puedo cancelar una auditoria en curso?",
         "Si. Presione CANCELAR (rojo) en el modulo. Debe escribir el motivo. La tienda queda disponible para nueva auditoria."),
        ("El Zebra no escanea en SIGAF",
         "Verifique que DataWedge este activo. Toque primero el campo de escaneo para darle el foco. Si persiste, reinicie DataWedge."),
        ("Que pasa con un equipo Sobrante Desconocido?",
         "Se abre el formulario para registrarlo: Descripcion, Marca, Modelo y Serie (opcional). Al confirmar queda registrado como ALTA."),
        ("Que significa estado INCOMPLETO?",
         "Mas del 20% de los equipos no fueron localizados. El sistema lo marca automaticamente."),
        ("Como fotografio los formatos al finalizar?",
         "Al finalizar si hay movimientos, aparece el dialogo de fotos. Use el boton 'Abrir Camara' para cada formato. Puede omitirlas si no aplica."),
    ]
    faq_admin = [
        ("Donde estan las fotos de los formatos de movimiento?",
         "En Bitacoras > Historial de Auditorias. Abra el resumen y use los botones 'Descargar AB' o 'Descargar Transf.'"),
        ("Como imprimo el reporte de una auditoria?",
         "En el resumen de auditoria presione 'Reporte PDF'. Use Ctrl+P para imprimir."),
        ("La exportacion Excel no incluye lo que espero",
         "Verifique el filtro activo antes de exportar. La exportacion respeta el filtro seleccionado."),
    ]
    faq_super = [
        ("Como reinicio los datos del sistema?",
         "Administracion > 'Reiniciar Datos'. Adjunte MAF.xlsx y USUARIOS.xlsx. ADVERTENCIA: esta accion es irreversible."),
        ("Como creo un nuevo usuario?",
         "Administracion > Usuarios > 'Nuevo Usuario'. Complete nombre, email, contrasena y seleccione el perfil."),
    ]
    faq_list = faq_common + (faq_admin if is_admin else []) + (faq_super if is_super else [])
    for q, a in faq_list:
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
            ["Bitacoras con filtro por plaza y ordenamiento","Completado","Produccion"],
            ["Analisis cruzado global No Localizado vs Sobrante","Completado","Produccion"],
            ["Reporte PDF ejecutivo por auditoria con firma","Completado","Produccion"],
            ["Logs de seguridad + firmas digitales HMAC-SHA256","Completado","Produccion"],
            ["Sesion unica + control de sesiones activas","Completado","Produccion"],
            ["Cierre de sesion por inactividad configurable","Completado","Produccion"],
            ["Restriccion: auditoria solo por auditor dueno","Completado","Produccion"],
            ["Multisesion configurable por Super Admin","Completado","Produccion"],
            ["Importacion masiva de usuarios desde Excel","Completado","Produccion"],
            ["Banner de actualizacion de PWA automatico","Completado","Produccion"],
            ["Manual de Usuario PDF dinamico por perfil","Completado","Produccion"],
            ["Historial de fixes en Logs del Sistema","Completado","Produccion"],
            ["Dispositivos Zebra TC52 configurados","En proceso","Actualizacion OS pendiente"],
            ["Integracion ERP/SAP para sincronizacion MAF","Pendiente","Backlog"],
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
        "Modulo de reportes avanzados con graficas por plaza y periodo",
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

# ═══════════════════════════════════════════════════════════════
#  DOCUMENTACION TECNICA COMPLETA
# ═══════════════════════════════════════════════════════════════

def generate_tech_documentation(stats=None):
    """Generate complete professional technical documentation for SIGAF."""
    pdf = SigafPDF("SIGAF - Documentacion Tecnica")
    pdf.alias_nb_pages()

    pdf.cover(
        "Documentacion Tecnica",
        "SIGAF v1.0 — Sistema Integral de Gestion de Activo Fijo",
        "Marzo 2026  |  OXXO - Direccion de Sistemas  |  Confidencial"
    )

    # ─────────────────────────────────────────────────────────────
    # TABLA DE CONTENIDO
    # ─────────────────────────────────────────────────────────────
    pdf.add_page()
    pdf.section_title("Tabla de Contenido")
    toc = [
        ("1", "Documento de Requisitos"),
        ("1.1", "  Requisitos Funcionales"),
        ("1.2", "  Requisitos No Funcionales"),
        ("1.3", "  Restricciones del Sistema"),
        ("2", "Casos de Uso"),
        ("2.1", "  Actores del Sistema"),
        ("2.2", "  Casos de Uso Principales"),
        ("3", "Arquitectura del Sistema"),
        ("3.1", "  Componentes y Tecnologias"),
        ("3.2", "  Flujo de Datos"),
        ("3.3", "  Seguridad y Autenticacion"),
        ("4", "Diagrama de Base de Datos"),
        ("4.1", "  Colecciones MongoDB"),
        ("4.2", "  Indices y Relaciones"),
        ("5", "Documentacion de API REST"),
        ("5.1", "  Autenticacion"),
        ("5.2", "  Auditorias"),
        ("5.3", "  Equipos"),
        ("5.4", "  Movimientos y Exportaciones"),
        ("5.5", "  Administracion"),
        ("6", "Wireframes y Flujos de UI"),
        ("6.1", "  Pantalla Principal (Dashboard)"),
        ("6.2", "  Modulo de Auditoria"),
        ("6.3", "  Bitacoras y Reportes"),
        ("6.4", "  Panel de Administracion"),
        ("7", "Plan de Pruebas"),
        ("7.1", "  Estrategia de Pruebas"),
        ("7.2", "  Casos de Prueba Funcionales"),
        ("7.3", "  Pruebas de Seguridad"),
        ("8", "Documentacion de Despliegue"),
        ("8.1", "  Infraestructura en Produccion"),
        ("8.2", "  Variables de Entorno"),
        ("8.3", "  Proceso de Deploy"),
        ("8.4", "  Service Worker y PWA"),
        ("9", "Manual de Usuario Resumido"),
        ("9.1", "  Perfiles y Accesos"),
        ("9.2", "  Flujo de Auditoria"),
        ("9.3", "  Preguntas Frecuentes"),
        ("10", "Registro de Cambios (Changelog)"),
    ]
    for num, item in toc:
        pdf.set_font("Helvetica", "", 9.5)
        pdf.set_text_color(*DARK)
        pdf.set_x(14)
        pdf.cell(14, 5.5, safe(num), align="L")
        pdf.cell(0, 5.5, safe(item), new_x="LMARGIN", new_y="NEXT")

    # ─────────────────────────────────────────────────────────────
    # 1. DOCUMENTO DE REQUISITOS
    # ─────────────────────────────────────────────────────────────
    pdf.add_page()
    pdf.section_title("Documento de Requisitos", "1")
    pdf.body("SIGAF digitaliza el proceso de auditoria de activos fijos de computo (MAF) en tiendas OXXO. El sistema permite registrar, clasificar y generar evidencia de los equipos presentes, faltantes y sobrantes en cada tienda.")

    pdf.subsection("1.1 Requisitos Funcionales")
    rf = [
        ("RF-01", "Autenticacion", "El sistema debe autenticar usuarios por email y contrasena con JWT. Soporte de 3 perfiles: Super Administrador, Administrador, Socio Tecnologico."),
        ("RF-02", "Gestion de sesiones", "Sesion unica por usuario por defecto (configurable a multisesion). Cierre automatico por inactividad con aviso previo de 5 minutos."),
        ("RF-03", "Dashboard de tiendas", "Visualizar todas las tiendas con estado (pendiente/en progreso/auditada/pend. fotos) y estadisticas por plaza."),
        ("RF-04", "Auditoria de inventario", "Iniciar, pausar y finalizar auditorias de inventario en tiendas. Escaneo por codigo de barras (Zebra TC52) con clasificacion automatica."),
        ("RF-05", "Clasificacion automatica", "Clasificar cada equipo escaneado como: Localizado, Sobrante (de otra tienda) o Sobrante Desconocido. Los no escaneados se marcan No Localizado al finalizar."),
        ("RF-06", "Movimientos AF", "Registrar movimientos de Alta (sobrante desconocido), Baja (no localizado), Disposal (baja manual) y Transferencia (sobrante de otra tienda)."),
        ("RF-07", "Foto de formatos AF", "Solicitar captura fotografica del formato fisico AF firmado al finalizar si hay movimientos. Configurable por tipo (altas/bajas/transferencias)."),
        ("RF-08", "Auditorias pendientes de foto", "Si el auditor no puede tomar la foto al momento, la auditoria queda en estado 'pendiente de fotos' con un plazo configurable (TTL)."),
        ("RF-09", "Exportacion Excel", "Generar reportes Excel con formato corporativo: ALTAS/BAJAS, Transferencias, Clasificaciones, Historial de Auditorias. Incluye fotos."),
        ("RF-10", "Reporte PDF", "Generar reporte PDF ejecutivo por auditoria con firma digital HMAC-SHA256 verificable."),
        ("RF-11", "Gestion de usuarios", "CRUD de usuarios, importacion masiva desde Excel/CSV, bloqueo/desbloqueo de cuentas, historial de cambios con rollback."),
        ("RF-12", "Bitacoras", "Registro de clasificaciones de equipos, movimientos AF y historial de auditorias con filtros, busqueda y ordenamiento server-side."),
        ("RF-13", "Analisis cruzado", "Comparar equipos no localizados vs sobrantes para detectar equipos desplazados entre tiendas. Analisis global entre todas las auditorias."),
        ("RF-14", "Configuracion del sistema", "Parametros configurables: fotos por tipo, TTL de fotos, timeout de inactividad, multisesion."),
        ("RF-15", "Logs de seguridad", "Registro de eventos de seguridad: logins, cambios de contrasena, accesos no autorizados, cambios de configuracion."),
    ]
    pdf.table(["ID", "Nombre", "Descripcion"], rf, [15, 40, 135])

    pdf.add_page()
    pdf.subsection("1.2 Requisitos No Funcionales")
    rnf = [
        ("RNF-01", "Rendimiento", "Tiempo de respuesta < 300ms para consultas de inventario con +30,000 equipos. Soporte de auditorias simultaneas en multiples tiendas."),
        ("RNF-02", "Disponibilidad", "99.5% uptime en produccion. Railway garantiza alta disponibilidad con auto-restart en fallo."),
        ("RNF-03", "Seguridad", "JWT con session_id validado en cada request. Cifrado Fernet para campos sensibles. Firmas HMAC-SHA256 por auditoria."),
        ("RNF-04", "Usabilidad", "Interface responsive para Zebra TC52 (Android), tablet y PC. PWA instalable sin App Store. 3 idiomas: ES/EN/PT."),
        ("RNF-05", "Escalabilidad", "Disenado para +1,000 tiendas y +50,000 equipos en MongoDB Atlas. Indices optimizados para consultas frecuentes."),
        ("RNF-06", "Mantenibilidad", "Codigo modular. Backend FastAPI con separation of concerns. Frontend React con contextos y hooks reutilizables."),
        ("RNF-07", "Compatibilidad", "Chrome 90+, Firefox 88+, Edge 90+. Android 11+ en Zebra TC52. Node.js 18+, Python 3.11+."),
    ]
    pdf.table(["ID", "Requisito", "Descripcion"], rnf, [15, 32, 143])

    pdf.subsection("1.3 Restricciones del Sistema")
    for r in [
        "Las fotos de formatos AF se almacenan como base64 en MongoDB (limite 16MB por documento BSON).",
        "El escaneo requiere conectividad a internet para clasificacion en tiempo real (modo offline limitado a cache del SW).",
        "La exportacion Excel para mas de 5,000 movimientos puede tomar hasta 30 segundos.",
        "Los registros de no-localizados se generan al FINALIZAR la auditoria, no durante el escaneo.",
        "El analisis cruzado global esta disponible solo para el perfil Super Administrador.",
    ]:
        pdf.bullet(r)

    # ─────────────────────────────────────────────────────────────
    # 2. CASOS DE USO
    # ─────────────────────────────────────────────────────────────
    pdf.add_page()
    pdf.section_title("Casos de Uso", "2")

    pdf.subsection("2.1 Actores del Sistema")
    actors = [
        ["Super Administrador", "benjamin.ruiz@oxxo.com", "Acceso total. Gestiona usuarios, configuracion global, logs de seguridad, analisis cruzado global, sesiones activas."],
        ["Administrador", "admin@oxxo.com", "Gestiona bitacoras, exporta reportes, visualiza historial de auditorias, accede al panel de administracion basico."],
        ["Socio Tecnologico", "auditor@proveedor.com", "Realiza auditorias de inventario en tiendas asignadas. Accede solo a Dashboard, Auditoria y Configuracion personal."],
        ["Sistema (automatico)", "system", "Genera movimientos de baja para no-localizados, limpia auditorias vencidas, verifica firmas digitales."],
    ]
    pdf.table(["Rol", "Email tipo", "Responsabilidades"], actors, [38, 42, 110])

    pdf.subsection("2.2 Casos de Uso Principales")
    use_cases = [
        ("CU-01", "Iniciar sesion", "Socio / Admin / Super", "Usuario ingresa email + contrasena. Sistema valida credenciales, verifica sesiones activas (conflicto si multisesion=false), emite JWT con session_id. Si cuenta bloqueada: flujo de desbloqueo."),
        ("CU-02", "Realizar auditoria", "Socio Tecnologico", "Seleccionar tienda -> Iniciar auditoria -> Escanear codigos de barras con Zebra TC52 -> Sistema clasifica en tiempo real -> Finalizar -> Sistema genera no-localizados -> [Foto de formatos si aplica] -> Auditoria completada."),
        ("CU-03", "Registrar sobrante desconocido", "Socio Tecnologico", "Al escanear barcode no encontrado en ningun MAF -> Formulario: descripcion, marca, modelo, serie -> Confirmar -> Se registra como ALTA en el MAF de la tienda actual."),
        ("CU-04", "Confirmar transferencia", "Socio Tecnologico", "Al escanear equipo de otra tienda -> Sistema muestra dialogo de transferencia con tienda origen -> Confirmar -> Se registra movimiento de TRANSFERENCIA."),
        ("CU-05", "Exportar reporte", "Admin / Super", "Seleccionar tipo (AB / Transferencias / Clasificaciones / Auditorias) -> Aplicar filtros (plaza, fecha, tipo) -> Descargar Excel con formato corporativo AF."),
        ("CU-06", "Analisis cruzado", "Super Admin", "Acceder a Bitacoras -> Analisis Cruzado Global -> Sistema compara no-localizados vs sobrantes de todas las auditorias -> Resultados ordenados por confianza (Alta/Media/Baja)."),
        ("CU-07", "Gestionar usuarios", "Super Admin", "CRUD de usuarios / Importar desde Excel-CSV / Bloquear-Desbloquear / Ver historial de acciones con rollback."),
        ("CU-08", "Configurar sistema", "Super Admin", "Ajustar: foto por tipo de movimiento, TTL de fotos pendientes, timeout de inactividad (5-480 min), permitir multisesion."),
        ("CU-09", "Ver logs de seguridad", "Super Admin", "Acceder a Logs del Sistema -> Tab Seguridad -> Filtrar por tipo de evento / fecha / nivel de severidad."),
        ("CU-10", "Cerrar sesion forzosa", "Super Admin", "Panel Admin -> Historial -> Sesiones Activas -> Ver sesiones en tiempo real -> Cerrar sesion especifica de cualquier usuario."),
    ]
    for uc_id, name, actor, desc in use_cases:
        if pdf.get_y() > 230:
            pdf.add_page()
        pdf.ln(2)
        y = pdf.get_y()
        pdf.set_fill_color(*LGRAY)
        pdf.rect(10, y, 190, 6, 'F')
        pdf.set_xy(12, y + 0.5)
        pdf.set_font("Helvetica", "B", 9)
        pdf.set_text_color(*NAVY)
        pdf.cell(20, 5, safe(uc_id))
        pdf.set_font("Helvetica", "B", 9)
        pdf.set_text_color(*DARK)
        pdf.cell(70, 5, safe(name))
        pdf.set_font("Helvetica", "", 8.5)
        pdf.set_text_color(*BLUE)
        pdf.cell(0, 5, safe(f"Actor: {actor}"), new_x="LMARGIN", new_y="NEXT")
        pdf.set_x(14)
        pdf.set_font("Helvetica", "", 9)
        pdf.set_text_color(*DARK)
        pdf.multi_cell(185, 5, safe(desc))

    # ─────────────────────────────────────────────────────────────
    # 3. ARQUITECTURA DEL SISTEMA
    # ─────────────────────────────────────────────────────────────
    pdf.add_page()
    pdf.section_title("Arquitectura del Sistema", "3")

    pdf.subsection("3.1 Componentes y Tecnologias")
    pdf.table(
        ["Capa", "Tecnologia", "Version", "Funcion", "Despliegue"],
        [
            ["Frontend", "React", "19.x", "SPA / PWA con Tailwind CSS + shadcn/ui", "Railway (static)"],
            ["Backend", "FastAPI", "0.115+", "API REST + logica de negocio + JWT", "Railway (Docker)"],
            ["Base de datos", "MongoDB Atlas", "7.x", "NoSQL cloud con indices compuestos", "MongoDB Cloud"],
            ["Autenticacion", "JWT + bcrypt", "—", "Tokens firmados con session_id embebido", "En API"],
            ["Cifrado", "Fernet (cryptography)", "—", "Cifrado de serie y factura en DB", "En API"],
            ["Firmas", "HMAC-SHA256", "—", "Integridad de auditorias completadas", "En API"],
            ["Excel", "openpyxl", "3.1+", "Generacion de reportes con formato AF", "En API"],
            ["PDF", "FPDF2", "2.7+", "Manual de usuario, presentacion, docs tecnica", "En API"],
            ["Service Worker", "sw.js (custom)", "v6+", "Cache offline + banner de actualizacion PWA", "Frontend"],
            ["Dispositivo", "Zebra TC52", "Android 11", "Lectura de barcodes via DataWedge keystroke", "On-site"],
        ],
        [22, 24, 14, 80, 36]
    )

    pdf.subsection("3.2 Flujo de Datos — Escaneo en Auditoria")
    pdf.body("El siguiente diagrama representa el flujo de datos para la operacion principal del sistema:")
    steps = [
        ("1", "Zebra TC52", "DataWedge envia barcode como keystroke al campo de texto activo en el navegador"),
        ("2", "React Frontend", "onKeyDown detecta Enter -> llama POST /audits/{id}/scan con el barcode"),
        ("3", "FastAPI Backend", "Valida JWT + session_id -> busca equipo en db.equipment por cr_tienda"),
        ("4", "MongoDB Atlas", "Consulta indexada por codigo_barras + cr_tienda (< 20ms)"),
        ("5", "Clasificacion", "Localizado / Sobrante (otra tienda) / Sobrante Desconocido -> insert en audit_scans"),
        ("6", "Respuesta API", "JSON con clasificacion, datos del equipo y estado de baja revertida"),
        ("7", "React UI", "Actualiza contadores, agrega card al historial con animacion, reproduce feedback visual"),
    ]
    pdf.ln(2)
    for step_num, actor, desc in steps:
        if pdf.get_y() > 255:
            pdf.add_page()
        y = pdf.get_y()
        pdf.set_fill_color(*BLUE)
        pdf.rect(10, y + 1, 7, 7, 'F')
        pdf.set_xy(12, y + 1.5)
        pdf.set_font("Helvetica", "B", 8)
        pdf.set_text_color(*WHITE)
        pdf.cell(7, 5.5, safe(step_num), align="C")
        pdf.set_xy(20, y + 1)
        pdf.set_font("Helvetica", "B", 9)
        pdf.set_text_color(*NAVY)
        pdf.cell(38, 6, safe(actor))
        pdf.set_font("Helvetica", "", 9)
        pdf.set_text_color(*DARK)
        pdf.multi_cell(141, 5.5, safe(desc))
        pdf.set_draw_color(210, 220, 240)
        pdf.line(10, pdf.get_y(), 200, pdf.get_y())

    pdf.add_page()
    pdf.subsection("3.3 Seguridad y Autenticacion")
    pdf.table(
        ["Mecanismo", "Implementacion", "Cobertura"],
        [
            ["JWT + session_id", "PyJWT con secret configurable. Cada token incluye session_id unico validado en DB en cada request.", "Todos los endpoints autenticados"],
            ["bcrypt hash", "Contrasenas hasheadas con salt. Factor de costo 12. Nunca se almacena la contrasena en texto plano.", "Almacenamiento de contrasenas"],
            ["Fernet cifrado", "Campos serie y factura cifrados con clave derivada. Prefijo 'enc:' identifica valores cifrados.", "Datos sensibles en MongoDB"],
            ["HMAC-SHA256", "Firma digital calculada sobre datos de la auditoria al completarse. Verificable en cualquier momento.", "Integridad de auditorias"],
            ["Session unica", "Login detecta sesiones activas y retorna 409 Conflict con detalle del dispositivo activo.", "Control de acceso concurrente"],
            ["Inactividad", "Timer en AuthContext detecta inactividad. Banner de aviso 5min antes. Logout automatico al vencer.", "Seguridad de sesion cliente"],
            ["Rate limiting", "FastAPI limita intentos de login. Bloqueo de cuenta tras 5 intentos fallidos consecutivos.", "Proteccion contra brute force"],
            ["CORS", "Origins configurados por variable de entorno. En produccion: solo el dominio del frontend.", "Proteccion de API"],
        ],
        [36, 100, 54]
    )

    # ─────────────────────────────────────────────────────────────
    # 4. DIAGRAMA DE BASE DE DATOS
    # ─────────────────────────────────────────────────────────────
    pdf.add_page()
    pdf.section_title("Diagrama de Base de Datos", "4")
    pdf.body("SIGAF utiliza MongoDB Atlas (NoSQL). Las siguientes colecciones forman el modelo de datos:")

    pdf.subsection("4.1 Colecciones MongoDB")

    collections = [
        ("db.users", [
            "id: UUID (PK)", "email: String (unique)", "nombre: String",
            "password_hash: String (bcrypt)", "perfil: Enum[SuperAdmin|Admin|Socio]",
            "is_active: Bool", "failed_login_attempts: Int", "locked_at: ISODate|null",
            "unlock_requested: Bool", "last_login: ISODate", "created_at: ISODate"
        ]),
        ("db.active_sessions", [
            "id: UUID (PK = session_id)", "user_id: UUID (FK->users)",
            "email: String", "perfil: String", "created_at: ISODate",
            "last_seen: ISODate", "ip: String", "user_agent: String"
        ]),
        ("db.stores", [
            "cr_tienda: String (PK)", "tienda: String", "plaza: String",
            "cr_plaza: String", "total_equipment: Int",
            "audited: Bool", "audit_status: String|null",
            "last_audit_id: UUID|null"
        ]),
        ("db.equipment", [
            "id: UUID (PK)", "cr_tienda: String (FK->stores)",
            "codigo_barras: String (indexed)", "no_activo: String",
            "descripcion: String", "marca: String", "modelo: String",
            "serie: String (enc: prefix if encrypted)", "costo: Float",
            "valor_real: Float", "depreciado: Bool", "tienda: String", "plaza: String"
        ]),
        ("db.audits", [
            "id: UUID (PK)", "cr_tienda: String (FK->stores)",
            "tienda/plaza/cr_plaza: String", "auditor_id: UUID (FK->users)",
            "auditor_name: String", "started_at/finished_at: ISODate",
            "status: Enum[in_progress|completed|incompleto|pending_photos|cancelada]",
            "located_count/surplus_count/not_found_count: Int",
            "not_found_value: Float", "total_equipment: Int",
            "photo_ab: String (base64 jpg)|null", "photo_transf: String|null",
            "needs_photo_ab/needs_photo_transf: Bool",
            "photos_deadline: ISODate|null", "hmac_signature: String",
            "notes: String"
        ]),
        ("db.audit_scans", [
            "id: UUID (PK)", "audit_id: UUID (FK->audits)",
            "codigo_barras: String", "equipment_id: UUID|null",
            "classification: Enum[localizado|sobrante|sobrante_desconocido|no_localizado]",
            "equipment_data: Object (snapshot)", "origin_store: Object|null",
            "scanned_at: ISODate", "scanned_by: String",
            "registered_manually: Bool", "baja_revertida: Bool"
        ]),
        ("db.movements", [
            "id: UUID (PK)", "audit_id: UUID (FK->audits)",
            "equipment_id: UUID (FK->equipment)",
            "type: Enum[alta|baja|disposal|transfer]",
            "from_cr_tienda/to_cr_tienda: String", "status: String",
            "created_at: ISODate", "created_by/created_by_id: String",
            "equipment_data: Object (snapshot)", "plaza: String",
            "auto_generated: Bool (true=no_localizado system baja)"
        ]),
        ("db.system_settings", [
            "_id: 'global' (singleton)", "photo_required_alta/baja/transf: Bool",
            "pending_photos_ttl_hours: Int (1-168)",
            "session_timeout_minutes: Int (5-480)",
            "allow_multi_session: Bool"
        ]),
        ("db.security_logs", [
            "id: UUID", "event: Enum[LOGIN_SUCCESS|LOGIN_FAILED|...]",
            "level: Enum[INFO|WARNING|CRITICAL]",
            "actor_email/actor_id: String", "target: String|null",
            "detail: Object", "timestamp: ISODate"
        ]),
        ("db.admin_history", [
            "id: UUID", "action: Enum[CREATE_USER|UPDATE_USER|DELETE_USER|...]",
            "actor_email: String", "target: String|null",
            "target_label: String", "before/after: Object (snapshot para rollback)",
            "timestamp: ISODate"
        ]),
        ("db.app_logs", [
            "id: UUID", "level: String", "message: String",
            "endpoint: String", "method: String",
            "status_code: Int", "duration_ms: Float",
            "timestamp: ISODate"
        ]),
        ("db.unlock_requests", [
            "id: UUID", "user_id: UUID", "email: String",
            "reason: String", "requested_at: ISODate",
            "resolved: Bool", "resolved_at: ISODate|null"
        ]),
    ]

    for coll_name, fields in collections:
        if pdf.get_y() > 235:
            pdf.add_page()
        pdf.ln(2)
        pdf.set_fill_color(*NAVY)
        y = pdf.get_y()
        pdf.rect(10, y, 190, 7, 'F')
        pdf.set_xy(13, y + 1)
        pdf.set_font("Helvetica", "B", 9.5)
        pdf.set_text_color(*WHITE)
        pdf.cell(0, 5, safe(coll_name), new_x="LMARGIN", new_y="NEXT")
        pdf.set_fill_color(248, 250, 255)
        pdf.set_draw_color(200, 210, 230)
        col_w = 93
        items = fields
        for k in range(0, len(items), 2):
            row_y = pdf.get_y()
            pdf.set_fill_color(252, 253, 255) if (k//2)%2==0 else pdf.set_fill_color(244, 247, 255)
            pdf.rect(10, row_y, 190, 5.5, 'F')
            pdf.set_xy(13, row_y + 0.5)
            pdf.set_font("Helvetica", "", 8)
            pdf.set_text_color(*DARK)
            pdf.cell(col_w, 5, safe(items[k]), border=0)
            if k+1 < len(items):
                pdf.cell(col_w, 5, safe(items[k+1]), border=0)
            pdf.ln(5.5)

    pdf.add_page()
    pdf.subsection("4.2 Indices y Relaciones Principales")
    indices = [
        ["db.equipment", "codigo_barras + cr_tienda", "Clasificacion en tiempo real durante escaneo"],
        ["db.equipment", "cr_tienda", "Carga de inventario de la tienda al iniciar auditoria"],
        ["db.audit_scans", "audit_id + classification", "Consulta de escaneos por auditoria y tipo"],
        ["db.movements", "audit_id + type + equipment_id", "Validacion de fotos necesarias al finalizar"],
        ["db.movements", "plaza + type + created_at", "Exportacion filtrada de movimientos por plaza"],
        ["db.audits", "cr_tienda + status", "Dashboard: estado de auditoria por tienda"],
        ["db.audits", "plaza + status", "Estadisticas y filtros por plaza en bitacoras"],
        ["db.active_sessions", "user_id", "Validacion rapida de sesion activa por usuario"],
        ["db.security_logs", "timestamp + level", "Consulta de logs por severidad y fecha"],
    ]
    pdf.table(["Coleccion", "Indice", "Uso"], indices, [42, 60, 88])

    # ─────────────────────────────────────────────────────────────
    # 5. DOCUMENTACION DE API REST
    # ─────────────────────────────────────────────────────────────
    pdf.add_page()
    pdf.section_title("Documentacion de API REST", "5")
    pdf.note_box("Base URL", "https://sigafactualizado-production.up.railway.app/api\nTodos los endpoints (excepto login y desbloqueo) requieren: Authorization: Bearer {JWT}", NAVY, (230, 235, 255))
    pdf.body("Los endpoints estan agrupados por dominio funcional. Todos devuelven JSON. Los errores siguen el formato {\"detail\": \"mensaje\"} con codigo HTTP apropiado.")

    def api_group(title, endpoints):
        if pdf.get_y() > 240:
            pdf.add_page()
        pdf.subsection(title)
        for method, path, auth, desc in endpoints:
            y = pdf.get_y()
            if y > 260:
                pdf.add_page()
                y = pdf.get_y()
            # Method badge
            colors = {"GET": (22,163,74), "POST": (52,120,210), "PUT": (217,119,6), "DELETE": (220,38,38)}
            bg = colors.get(method, GRAY)
            pdf.set_fill_color(*bg)
            pdf.rect(10, y, 12, 6, 'F')
            pdf.set_xy(10.5, y + 0.5)
            pdf.set_font("Helvetica", "B", 7)
            pdf.set_text_color(*WHITE)
            pdf.cell(11, 5, safe(method), align="C")
            pdf.set_xy(24, y + 0.5)
            pdf.set_font("Helvetica", "B", 8.5)
            pdf.set_text_color(*NAVY)
            pdf.cell(100, 5, safe(path))
            pdf.set_font("Helvetica", "", 7.5)
            pdf.set_text_color(*GRAY)
            pdf.cell(0, 5, safe(auth), new_x="LMARGIN", new_y="NEXT")
            pdf.set_x(24)
            pdf.set_font("Helvetica", "", 8.5)
            pdf.set_text_color(*DARK)
            pdf.multi_cell(175, 5, safe(desc))
            pdf.ln(0.5)

    api_group("5.1 Autenticacion", [
        ("POST", "/auth/login", "Publico", "Login con email+password. Devuelve JWT si no hay conflicto de sesion, 409 si hay sesion activa."),
        ("POST", "/auth/login/force", "Publico", "Login forzado: cierra sesion existente y emite nuevo JWT."),
        ("POST", "/auth/logout", "JWT requerido", "Invalida la sesion actual del usuario."),
        ("GET",  "/auth/me", "JWT requerido", "Devuelve datos del usuario autenticado."),
        ("PUT",  "/auth/profile", "JWT requerido", "Actualiza nombre o contrasena del usuario."),
        ("POST", "/auth/validate-password", "JWT requerido", "Valida la contrasena actual del usuario (usado antes de cambiarla)."),
        ("GET",  "/auth/sessions", "JWT requerido", "Lista sesiones activas del usuario actual."),
        ("POST", "/auth/sessions/close-others", "JWT requerido", "Cierra todas las sesiones excepto la actual."),
    ])

    api_group("5.2 Auditorias", [
        ("POST", "/audits", "JWT", "Crea o devuelve auditoria activa para una tienda. 403 si hay auditoria de otro usuario."),
        ("GET",  "/audits/{id}", "JWT", "Datos de la auditoria. Incluye estado, contadores y fotos."),
        ("POST", "/audits/{id}/scan", "JWT", "Escanea un barcode. Clasifica y devuelve: localizado|sobrante|sobrante_desconocido."),
        ("POST", "/audits/{id}/finalize", "JWT", "Finaliza auditoria: genera no-localizados, evalua fotos necesarias, firma digitalmente."),
        ("POST", "/audits/{id}/cancel", "JWT", "Cancela auditoria en progreso con motivo."),
        ("GET",  "/audits/{id}/summary", "JWT", "Resumen con stats detalladas, movimientos y grupos de equipos."),
        ("GET",  "/audits/{id}/scans", "JWT", "Lista todos los escaneos de la auditoria."),
        ("GET",  "/audits/{id}/verify-signature", "JWT", "Verifica la firma HMAC-SHA256 de la auditoria."),
        ("POST", "/audits/{id}/upload-photos", "JWT", "Sube fotos de formatos AF. Completa la auditoria si ambas fotos estan listas."),
        ("GET",  "/audits/stats/summary", "JWT", "Estadisticas globales o por plaza: total auditorias, tiendas, cobertura."),
    ])

    api_group("5.3 Equipos y Tiendas", [
        ("GET",  "/stores", "JWT", "Lista todas las tiendas con estado de auditoria."),
        ("GET",  "/stores/plazas", "JWT", "Lista plazas distintas con conteo de tiendas."),
        ("GET",  "/stores/{cr}", "JWT", "Datos de una tienda especifica."),
        ("GET",  "/equipment/search", "JWT", "Busqueda full-text en inventario. Devuelve hasta 2000 resultados. limit=0 para maximo."),
        ("GET",  "/catalog/equipment-types", "JWT", "Catalogo de tipos y marcas de equipos para sobrante desconocido."),
        ("GET",  "/cross-analysis/global", "Super Admin", "Analisis cruzado global: no-localizados vs sobrantes en todas las auditorias."),
    ])

    api_group("5.4 Movimientos, Logs y Exportacion", [
        ("GET",  "/logs/classifications", "Admin+", "Clasificaciones paginadas con filtros."),
        ("GET",  "/logs/movements", "Admin+", "Movimientos AF paginados: altas, bajas, transferencias."),
        ("GET",  "/logs/audits", "Admin+", "Historial de auditorias paginado. sort_by + sort_dir para ordenamiento server-side."),
        ("GET",  "/export/{type}", "Admin+", "Exporta Excel. Types: classifications|movements-ab|movements-transferencias|audits."),
        ("GET",  "/download/manual", "JWT", "Descarga PDF del Manual de Usuario (contenido segun perfil)."),
        ("GET",  "/download/presentation", "JWT", "Descarga PDF de Presentacion Ejecutiva / Documentacion Tecnica."),
        ("GET",  "/download/audit-report/{id}", "Admin+", "Descarga reporte PDF de una auditoria especifica."),
        ("GET",  "/system-settings/public", "JWT", "Configuracion del sistema: fotos, TTL, timeout, multisesion."),
    ])

    api_group("5.5 Administracion (Super Admin)", [
        ("GET",    "/admin/users", "Super Admin", "Lista todos los usuarios del sistema."),
        ("POST",   "/admin/users", "Super Admin", "Crea nuevo usuario."),
        ("PUT",    "/admin/users/{id}", "Super Admin", "Actualiza datos de usuario."),
        ("DELETE", "/admin/users/{id}", "Super Admin", "Elimina usuario permanentemente."),
        ("POST",   "/admin/import-users", "Super Admin", "Importacion masiva desde Excel (.xlsx) o CSV. Headers: nombre, email, password, perfil."),
        ("GET",    "/admin/system-settings", "Super Admin", "Lee configuracion global del sistema."),
        ("PUT",    "/admin/system-settings", "Super Admin", "Actualiza configuracion global."),
        ("GET",    "/admin/active-sessions", "Super Admin", "Lista todas las sesiones activas de todos los usuarios."),
        ("DELETE", "/admin/active-sessions/{id}", "Super Admin", "Cierra forzosamente una sesion especifica."),
        ("GET",    "/admin/expired-audits", "Super Admin", "Lista auditorias en pending_photos que ya vencieron."),
        ("POST",   "/admin/expired-audits/{id}/restore", "Super Admin", "Restaura auditoria vencida extendiendo plazo 24 horas."),
        ("POST",   "/admin/cleanup-expired-audits", "Super Admin", "Elimina todas las auditorias pending_photos vencidas."),
        ("POST",   "/admin/fix-pending-photos", "Super Admin", "Completa auditorias pending_photos que ya no requieren foto segun config actual."),
        ("POST",   "/admin/reset-data", "Super Admin", "Reinicia datos del sistema desde archivos MAF.xlsx y USUARIOS.xlsx."),
    ])

    # ─────────────────────────────────────────────────────────────
    # 6. WIREFRAMES Y FLUJOS DE UI
    # ─────────────────────────────────────────────────────────────
    pdf.add_page()
    pdf.section_title("Wireframes y Flujos de UI", "6")
    pdf.body("Los siguientes wireframes muestran los elementos clave de la interfaz y su comportamiento esperado.")

    def wireframe_box(title, elements, height=70):
        if pdf.get_y() + height > 270:
            pdf.add_page()
        pdf.ln(3)
        y = pdf.get_y()
        pdf.set_fill_color(248, 250, 255)
        pdf.set_draw_color(*BLUE)
        pdf.set_line_width(0.4)
        pdf.rect(10, y, 190, height, 'FD')
        pdf.set_fill_color(*NAVY)
        pdf.rect(10, y, 190, 8, 'F')
        pdf.set_xy(14, y + 1.5)
        pdf.set_font("Helvetica", "B", 9)
        pdf.set_text_color(*WHITE)
        pdf.cell(0, 5, safe(title))
        pdf.set_y(y + 10)
        for elem in elements:
            pdf.set_x(14)
            pdf.set_font("Helvetica", "", 8.5)
            pdf.set_text_color(*DARK)
            pdf.multi_cell(183, 5, safe(elem))

    wireframe_box("6.1 Dashboard Principal — Vista de Tiendas", [
        "[ SIGAF ]  [☀/🌙]  [ES/EN/PT]  [usuario@oxxo.com - Perfil]  [Cerrar Sesion]",
        "─────────────────────────────────────────────────────────────────────────────",
        "[ PANEL ] [REPORTES] [BITACORAS] [ADMIN] [LOGS] [CONFIG] [CONSULTAR EQUIPO]",
        "─────────────────────────────────────────────────────────────────────────────",
        "[ Plaza: Todas ▼ ]  [ Buscar tienda... ]   KPIs: [1010 Tiendas][75 Auditadas][28k Equipos]",
        "┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐",
        "│ AXOLOTL TIJ  │  │ ABELARDO TIJ │  │ ARIAS TIJ    │  │ BENY TIJ     │",
        "│ CR: 56YK4    │  │ CR: 50SYP    │  │ CR: 50REP    │  │ CR: 5GVVD    │",
        "│ 23 equipos   │  │ 35 equipos   │  │ 35 equipos   │  │ 27 equipos   │",
        "│ [Completada] │  │[En Progreso] │  │  [Auditada]  │  │  [Pendiente] │",
        "└──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘",
    ], height=82)

    wireframe_box("6.2 Modulo de Auditoria — Escaneo en Curso", [
        "← VOLVER  |  ACAPULCO TIJ  CR: 5OO7D · Ensenada  |  [☐ Notas]  [⊘ Cancelar]  [En Progreso]",
        "─────────────────────────────────────────────────────────────────────────────────────────",
        "[ 🔲 Ingrese o escanee codigo de barras...            ]  [📷 Escanear]",
        "  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────────────┐",
        "  │  ✅ LOCALIZADO   │  │  ⚠ SOBRANTE     │  │  ⊗ NO LOCALIZADO             │",
        "  │      18          │  │      1           │  │          3                   │",
        "  └──────────────────┘  └──────────────────┘  └──────────────────────────────┘",
        "  Progreso: ████████████░░░░  18 / 22 (82%)   | 3 equipos aun sin localizar",
        "  [ Historial de Escaneos (19) ]  [ Equipos de la Tienda (22) ]  [▶ Finalizar Auditoria]",
        "  ✅ 04786867  REGULADOR/UPS  APC · Mod:SMX3000LV · S/N:XYZ123  [Localizado]",
        "  ⚠  7768383   AP-451       DATALOGIC · Mod:prueba              [Sobrante Desc.] [+]",
    ], height=82)

    wireframe_box("6.3 Bitacoras — Historial de Auditorias", [
        "BITACORAS  |  [ Buscar... ]",
        "[ Clasificacion de Equipos ] [ Movimientos (Transf/Bajas) ] [⏱ Historial de Auditorias ←]",
        "KPIs: [75 Auditorias] [75 Tiendas auditadas] [7% Cobertura (75/1010)]",
        "[ Todos ▼ ] [ Todas las plazas ▼ ]       [🔀 Analisis Cruzado Global]  [⬇ Exportar Excel]",
        "Fecha Inicio↑ | Fecha Fin↑ | CR↑ | Tienda↑ | Plaza↑ | Auditor↑ | Estado | Localiz | No-Loc | Firma | Acc",
        "10/03 10:40  | 10/03 11:17 | 56YK4 | Axolotl TIJ | Centro | C.Flores | [Completada] | 23 | 4 | ✔ | 👁 🗑",
        "09/03 12:51  | 09/03 13:30 | 5GBAT | Bellas Artes | Centro | J.Hernandez | [Completada] | 23 | 1 | ✔ | 👁 🗑",
        "  (Ordenamiento server-side: clic en encabezado ordena TODOS los registros, no solo la pagina)",
        "  ← Anterior   Pagina 1 de 3   Siguiente →",
    ], height=75)

    wireframe_box("6.4 Panel de Administracion — Configuracion", [
        "PANEL DE ADMINISTRACION  |  [🔄 Reiniciar Datos]",
        "[ 👥 Usuarios ] [ ⚙ Configuracion ← ] [ 🕐 Historial ]",
        "┌─ SOLICITUD DE FOTO EN MOVIMIENTOS ─────────────────────────────────────────────────┐",
        "│  Foto ALTAS:  [Toggle ON]    Foto BAJAS:  [Toggle ON]    Foto TRANSF:  [Toggle OFF] │",
        "└────────────────────────────────────────────────────────────────────────────────────┘",
        "┌─ TIEMPO DE ESPERA PARA COMPLETAR FOTOS ────────────────────────────────────────────┐",
        "│  Horas disponibles: [ 24 ] horas  [Guardar]  |  [🗑 Limpiar vencidas] [✔ Corregir] │",
        "└────────────────────────────────────────────────────────────────────────────────────┘",
        "┌─ CIERRE DE SESION POR INACTIVIDAD ─────────────────────────────────────────────────┐",
        "│  Timeout: [ 15 ] minutos  [Guardar]    SESIONES SIMULTANEAS: [Toggle OFF]           │",
        "└────────────────────────────────────────────────────────────────────────────────────┘",
    ], height=82)

    # ─────────────────────────────────────────────────────────────
    # 7. PLAN DE PRUEBAS
    # ─────────────────────────────────────────────────────────────
    pdf.add_page()
    pdf.section_title("Plan de Pruebas", "7")

    pdf.subsection("7.1 Estrategia de Pruebas")
    pdf.table(
        ["Tipo", "Herramienta", "Alcance", "Prioridad"],
        [
            ["Pruebas unitarias (Backend)", "pytest + pytest-asyncio", "Funciones de clasificacion, calculo de firmas, validacion de TTL", "Alta"],
            ["Pruebas de integracion", "httpx + FastAPI TestClient", "Endpoints principales: login, scan, finalize, export", "Alta"],
            ["Pruebas E2E (Frontend)", "Playwright o Cypress", "Flujo completo de auditoria desde navegador", "Media"],
            ["Pruebas de rendimiento", "Locust", "Escaneo concurrente en 10 auditorias simultaneas", "Media"],
            ["Pruebas de seguridad", "Manual + OWASP ZAP", "JWT manipulation, SQL/NoSQL injection, CORS, brute force", "Alta"],
            ["Pruebas de dispositivo", "Zebra TC52 fisico", "DataWedge keystroke, pantalla 4.3 pulgadas, Android 11", "Alta"],
            ["Pruebas de regresion", "CI/CD con Railway", "Suite completa en cada merge a main", "Alta"],
        ],
        [42, 40, 75, 22]
    )

    pdf.add_page()
    pdf.subsection("7.2 Casos de Prueba Funcionales")
    test_cases = [
        ("TC-001", "Login exitoso", "Email y contrasena validos", "Token JWT emitido, redireccion a Dashboard", "PASS"),
        ("TC-002", "Login fallido (3x)", "Contrasena incorrecta 3 veces consecutivas", "Cuenta bloqueada, email de notificacion", "PASS"),
        ("TC-003", "Conflicto de sesion", "Login desde 2 dispositivos (multisesion=false)", "409 con datos del dispositivo activo", "PASS"),
        ("TC-004", "Escaneo localizado", "Barcode de equipo asignado a la tienda", "Clasificacion LOCALIZADO, contador +1", "PASS"),
        ("TC-005", "Escaneo sobrante", "Barcode de equipo de otra tienda", "Clasificacion SOBRANTE, boton transferir visible", "PASS"),
        ("TC-006", "Escaneo desconocido", "Barcode no encontrado en ninguna tienda", "Clasificacion SOBRANTE_DESCONOCIDO, formulario de alta", "PASS"),
        ("TC-007", "Finalizar con no-localizados", "Auditoria con 5 equipos no escaneados", "5 registros no_localizado + 5 movimientos baja auto_generated", "PASS"),
        ("TC-008", "Foto obligatoria (altas)", "Config: photo_required_alta=true, hay movimiento de alta", "Dialog de foto antes de completar", "PASS"),
        ("TC-009", "Sin foto (sin movimientos)", "Auditoria sin movimientos manuales", "Completada sin solicitar foto", "PASS"),
        ("TC-010", "Analisis cruzado", "3 no-localizados y 3 sobrantes con descripcion igual", "3 sugerencias de alta confianza, sin duplicados", "PASS"),
        ("TC-011", "Export Excel AB", "10 movimientos de alta + 5 bajas", "Archivo .xlsx con 15 filas, sin duplicados", "PASS"),
        ("TC-012", "Import usuarios CSV", "CSV con headers nombre,email,password,perfil", "Usuarios creados, emails duplicados omitidos", "PASS"),
        ("TC-013", "TTL foto vencida", "Auditoria pending_photos con deadline pasado", "Background task la elimina, tienda vuelve a pendiente", "PASS"),
        ("TC-014", "Timeout inactividad", "Sin actividad por N minutos configurados", "Banner de aviso 5 min antes, logout automatico al vencer", "PASS"),
        ("TC-015", "Ordenamiento Bitacoras", "Clic en columna Tienda con 3 paginas de datos", "Datos ordenados alphabeticamente en todos los registros", "PASS"),
        ("TC-016", "Auditoria otro usuario", "Socio B intenta entrar a tienda auditada por Socio A", "HTTP 403 con nombre del auditor activo", "PASS"),
        ("TC-017", "Firma digital", "Verificar auditoria completada", "HMAC valido, datos integros", "PASS"),
        ("TC-018", "Rollback historial", "Revertir UPDATE_USER desde AdminPage", "Datos del usuario restaurados al estado anterior", "PASS"),
    ]
    pdf.table(
        ["ID", "Caso", "Entrada", "Resultado Esperado", "Estado"],
        test_cases,
        [16, 35, 48, 68, 18]
    )

    pdf.subsection("7.3 Pruebas de Seguridad")
    sec_tests = [
        ["JWT sin session_id valido", "Request con JWT alterado o session cerrada", "401 Unauthorized"],
        ["Token de otro usuario", "Usar JWT de usuario A en endpoints de usuario B", "403 Forbidden (session_id no coincide)"],
        ["Brute force login", "1000 intentos de login en 60 segundos", "Cuenta bloqueada tras 5 intentos, rate limit activo"],
        ["NoSQL injection", "Email: {$gt: ''} en login", "422 Unprocessable / sin acceso"],
        ["CORS cross-origin", "Request desde dominio no autorizado", "CORS error, sin datos en respuesta"],
        ["Acceso sin perfil", "Socio Tecn. accede a /admin/users", "403 Forbidden"],
        ["XSS en campos", "Script en campo 'nombre' de usuario", "Datos escapados en DB y en frontend (React escapa por defecto)"],
        ["IDOR (Insecure Direct Object)", "Auditor A accede a auditoria de tienda de Auditor B", "Datos devueltos SOLO si es el dueno o Super Admin"],
    ]
    pdf.table(["Vector", "Prueba", "Resultado Esperado"], sec_tests, [42, 80, 68])

    # ─────────────────────────────────────────────────────────────
    # 8. DOCUMENTACION DE DESPLIEGUE
    # ─────────────────────────────────────────────────────────────
    pdf.add_page()
    pdf.section_title("Documentacion de Despliegue", "8")

    pdf.subsection("8.1 Infraestructura en Produccion")
    pdf.table(
        ["Servicio", "URL", "Region", "Plan"],
        [
            ["Frontend (React PWA)", "insightful-caring-production-2702.up.railway.app", "europe-west4", "Railway Hobby"],
            ["Backend (FastAPI)", "sigafactualizado-production.up.railway.app/api", "europe-west4", "Railway Hobby"],
            ["MongoDB Atlas", "cluster0.sn33tur.mongodb.net/sigaf", "GCP us-east-1", "Atlas M0 Free"],
        ],
        [30, 100, 28, 26]
    )
    pdf.note_box("Nota de latencia",
        "El backend y frontend estan en Europe-west4 (Frankfurt). MongoDB Atlas esta en US East. La latencia de red MongoDB anade ~80-120ms por consulta. Para reducirla se recomienda migrar MongoDB a Europe-west4 en produccion escalonada.",
        AMBER, (255, 248, 230))

    pdf.subsection("8.2 Variables de Entorno")
    env_vars = [
        ["MONGO_URL", "Backend", "mongodb+srv://user:pass@cluster/sigaf", "URI de conexion MongoDB Atlas"],
        ["DB_NAME", "Backend", "sigaf", "Nombre de la base de datos"],
        ["JWT_SECRET", "Backend", "<32+ chars aleatorios>", "Clave secreta para firmar JWT. CAMBIAR en prod."],
        ["CORS_ORIGINS", "Backend", "https://frontend.railway.app", "URL exacta del frontend. No usar '*' en prod."],
        ["PORT", "Backend", "8000 (Railway auto-asigna)", "Puerto del servidor uvicorn"],
        ["REACT_APP_BACKEND_URL", "Frontend", "https://backend.railway.app", "URL base del API sin /api al final"],
    ]
    pdf.table(["Variable", "Servicio", "Valor ejemplo", "Descripcion"], env_vars, [42, 20, 55, 73])

    pdf.subsection("8.3 Proceso de Deploy en Railway")
    for step in [
        "1. Backend: subir server.py y pdf_generator.py al repo Git conectado. Railway detecta cambios y ejecuta: pip install -r requirements.txt -> uvicorn server:app (via Procfile).",
        "2. Frontend: subir archivos modificados al repo. Railway ejecuta: node scripts/stamp-sw.js (prebuild que inyecta timestamp en sw.js) -> craco build.",
        "3. El prebuild stamp-sw.js modifica sw.js con el timestamp del build. Esto garantiza que el browser detecte el nuevo Service Worker y muestre el banner de actualizacion.",
        "4. Railway asigna automaticamente un dominio HTTPS. Los certificados SSL son gestionados por Railway/Let's Encrypt.",
        "5. Verificar deploy: Railway Dashboard -> Servicio -> Deployments -> ver logs en tiempo real.",
        "6. En caso de error: Railway mantiene el deploy anterior activo. Usar 'Rollback' desde el dashboard.",
    ]:
        pdf.bullet(step)

    pdf.subsection("8.4 Service Worker y PWA")
    pdf.body("SIGAF implementa un Service Worker personalizado (sw.js) generado en cada build para garantizar que los usuarios reciban actualizaciones automaticas:")
    pdf.table(
        ["Evento SW", "Comportamiento", "Razon"],
        [
            ["install", "Pre-cachea /, /index.html, /manifest.json. NO llama skipWaiting().", "Permite entrar al estado 'waiting' para que el usuario confirme la actualizacion."],
            ["activate", "Elimina caches anteriores (CACHE_NAME anterior). Llama clients.claim().", "Limpieza de caches obsoletos sin interrumpir sesion activa."],
            ["message: SKIP_WAITING", "Llama self.skipWaiting().", "Activacion controlada: solo cuando el usuario hace clic en 'Recargar' en el banner."],
            ["controllerchange", "index.js detecta el cambio y ejecuta window.location.reload().", "Recarga automatica despues de que el nuevo SW toma control."],
            ["fetch (API)", "Network first con fallback a cache para rutas de lectura. Network only para escritura.", "Datos frescos cuando hay conexion, datos cacheados en offline."],
        ],
        [38, 72, 80]
    )

    # ─────────────────────────────────────────────────────────────
    # 9. MANUAL DE USUARIO RESUMIDO
    # ─────────────────────────────────────────────────────────────
    pdf.add_page()
    pdf.section_title("Manual de Usuario Resumido", "9")

    pdf.subsection("9.1 Perfiles y Accesos")
    pdf.table(
        ["Perfil", "Modulos disponibles", "Acciones clave"],
        [
            ["Socio Tecnologico", "Dashboard, Auditoria, Consultar Equipo, Configuracion", "Realizar auditorias, escanear equipos, registrar sobrantes, transferencias"],
            ["Administrador", "Todo lo anterior + Bitacoras, Reportes", "Exportar Excel/PDF, ver historial de auditorias, bitacoras de movimientos"],
            ["Super Administrador", "Acceso total", "Gestion de usuarios, configuracion global, logs de seguridad, sesiones activas, analisis cruzado"],
        ],
        [40, 72, 78]
    )
    pdf.note_box("Credenciales por defecto",
        "Super Admin: admin@oxxo.com / Comercio*1\nIMPORTANTE: Cambiar la contrasena al primer inicio de sesion en produccion.",
        RED, (255, 235, 235))

    pdf.subsection("9.2 Flujo de Auditoria Paso a Paso")
    for i, step in enumerate([
        ("Acceder al Dashboard", "Iniciar sesion -> Panel Principal muestra todas las tiendas de la plaza con su estado actual."),
        ("Seleccionar tienda", "Hacer clic en la tarjeta de la tienda deseada -> Se abre el dialogo con datos y equipos del MAF."),
        ("Iniciar auditoria", "Presionar 'Iniciar Auditoria' -> Estado cambia a 'En Progreso' (azul). Si otro auditor la tiene activa: mensaje de bloqueo."),
        ("Escanear equipos", "Apuntar el Zebra TC52 al codigo de barras del equipo -> El resultado aparece instantaneamente en el historial."),
        ("Manejar sobrantes", "Sobrante de otra tienda: boton 'Transferir'. Sobrante desconocido: formulario con Descripcion, Marca, Modelo, Serie."),
        ("Finalizar auditoria", "Presionar 'Finalizar Auditoria' -> Sistema marca como No Localizado los equipos no escaneados."),
        ("Fotografiar formatos AF", "Si hay movimientos y la config lo requiere: dialog de camara para foto del formato fisico firmado."),
        ("Ver resumen", "Auditoria completada muestra: KPIs, lista de no-localizados con valor, sobrantes, movimientos y firma digital."),
    ], 1):
        title, desc = step
        if pdf.get_y() > 255:
            pdf.add_page()
        pdf.set_font("Helvetica", "B", 9.5)
        pdf.set_text_color(*NAVY)
        pdf.set_x(10)
        pdf.cell(0, 6, safe(f"{i}. {title}"), new_x="LMARGIN", new_y="NEXT")
        pdf.set_x(18)
        pdf.set_font("Helvetica", "", 9.5)
        pdf.set_text_color(*DARK)
        pdf.multi_cell(181, 5.5, safe(desc))

    pdf.subsection("9.3 Preguntas Frecuentes")
    faqs = [
        ("El Zebra no registra escaneos en SIGAF",
         "Verificar que DataWedge este activo y configurado como 'Keystroke Output'. Tocar el campo de escaneo antes de escanear para darle el foco. Si persiste: reiniciar DataWedge desde Ajustes."),
        ("La auditoria de una tienda dice 'otro auditor'",
         "Otro Socio Tecnologico inicio la auditoria. Solo el puede continuarla. Un Super Administrador puede forzar el acceso. Contactar al Administrador si el auditor original ya no esta disponible."),
        ("Las fotos no se pueden tomar",
         "Verificar que el navegador tenga permiso de camara. En Zebra TC52: Ajustes -> Apps -> Chrome -> Permisos -> Camara: Permitir. Alternativamente cerrar y reabrir la pagina."),
        ("El banner de actualizacion no aparece",
         "El banner aparece automaticamente cuando hay un nuevo deploy. Si no aparece en 24h: limpiar cache del navegador (F5 + Ctrl en PC, o borrar datos del sitio en Android) y recargar."),
        ("Error al importar usuarios CSV",
         "Verificar que el archivo tenga las columnas: nombre, email, password, perfil (en esa primera fila). El archivo generado por 'Descargar plantilla' ya tiene el formato correcto. No modificar los encabezados."),
        ("Auditoria quedó en 'Pendiente de fotos' y ya no se puede completar",
         "Si el plazo no ha vencido: acceder a la tienda -> el sistema reabre el dialog de fotos. Si ya vencio: Super Admin puede restaurarla desde Admin -> Historial -> Auditorias Vencidas -> Restaurar."),
    ]
    for q, a in faqs:
        if pdf.get_y() > 250:
            pdf.add_page()
        pdf.ln(1)
        pdf.set_font("Helvetica", "B", 9.5)
        pdf.set_text_color(*NAVY)
        pdf.set_x(10)
        pdf.cell(0, 6, safe("P: " + q), new_x="LMARGIN", new_y="NEXT")
        pdf.set_x(14)
        pdf.set_font("Helvetica", "", 9.5)
        pdf.set_text_color(*DARK)
        pdf.multi_cell(183, 5.5, safe("R: " + a))

    # ─────────────────────────────────────────────────────────────
    # 10. REGISTRO DE CAMBIOS (CHANGELOG)
    # ─────────────────────────────────────────────────────────────
    pdf.add_page()
    pdf.section_title("Registro de Cambios (Changelog)", "10")
    pdf.body("Historial de versiones y cambios significativos del sistema SIGAF desde su inicio.")

    changelog = [
        ("v1.0.0", "2026-03-06", "Release inicial", "Deploy en Railway. Auditoria basica, escaneo con Zebra TC52, exportacion Excel, Dashboard con KPIs."),
        ("v1.1.0", "2026-03-09", "Seguridad y PDFs", "Firmas digitales HMAC-SHA256, cifrado Fernet, PDF del manual de usuario, PDF de presentacion ejecutiva."),
        ("v1.2.0", "2026-03-10", "Sesiones y logs", "Sesion unica por usuario, conflicto de sesion con IP/UA, logs de seguridad con niveles, flujo de desbloqueo."),
        ("v1.3.0", "2026-03-11", "Fotos y auditoria", "Fotos condicionales por tipo, lightbox, historial admin con rollback, busqueda avanzada de equipos."),
        ("v1.4.0", "2026-03-12", "Multi-idioma y config", "3 idiomas ES/EN/PT, toggles separados ALTAS/BAJAS, serie obligatoria, analisis cruzado, pending_photos TTL."),
        ("v1.5.0", "2026-03-12", "Optimizacion", "Analisis cruzado global, exportacion AB/Transferencias mejorada, importacion masiva usuarios Excel."),
        ("v1.6.0", "2026-03-13", "PWA y correcciones", "SW v6 con waiting state correcto, banner de actualizacion, fix de lógica de fotos (auto_generated), fix TTL como int."),
        ("v1.7.0", "2026-03-13", "Inactividad y sesiones", "Timeout de inactividad configurable 5-480 min, banner de aviso, sesiones activas en AdminPage, cierre forzoso."),
        ("v1.8.0", "2026-03-13", "Admin y restricciones", "Restriccion auditoria por auditor, multisesion configurable, auditorias vencidas con restauracion, tab Fixes."),
        ("v1.9.0", "2026-03-14", "Ordenamiento y CSV", "Sort server-side en bitacoras, importacion CSV con normalizacion de headers, dedup en exportacion, dedup analisis cruzado."),
        ("v1.10.0", "2026-03-14", "Documentacion", "Documentacion tecnica completa PDF, DeployPage actualizada, limpieza de imports en todos los archivos."),
    ]
    pdf.table(
        ["Version", "Fecha", "Titulo", "Cambios principales"],
        changelog,
        [18, 24, 38, 110]
    )

    # ── Cierre ────────────────────────────────────────────────────
    pdf.ln(12)
    if pdf.get_y() < 230:
        y = pdf.get_y()
        pdf.set_fill_color(*NAVY)
        pdf.rect(10, y, 190, 36, 'F')
        pdf.set_y(y + 7)
        pdf.set_font("Helvetica", "B", 14)
        pdf.set_text_color(*WHITE)
        pdf.cell(210, 8, safe("SIGAF — Documentacion Tecnica v1.10"), align="C", new_x="LMARGIN", new_y="NEXT")
        pdf.set_font("Helvetica", "", 9.5)
        pdf.set_text_color(180, 200, 240)
        pdf.cell(210, 7, safe("OXXO - Direccion de Sistemas  |  Confidencial"), align="C", new_x="LMARGIN", new_y="NEXT")
        pdf.cell(210, 7, safe("benjamin.ruiz@oxxo.com  |  Marzo 2026"), align="C")

    out = io.BytesIO()
    pdf.output(out)
    out.seek(0)
    return out
